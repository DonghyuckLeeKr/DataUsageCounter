use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct ProcessNetworkUsage {
    pub download_bytes_per_sec: u64,
    pub upload_bytes_per_sec: u64,
    pub session_download_bytes: u64,
    pub session_upload_bytes: u64,
}

#[derive(Clone, Debug)]
pub struct ProcessNetworkSnapshot {
    pub source: String,
    pub error: Option<String>,
    pub usage_by_pid: HashMap<u32, ProcessNetworkUsage>,
}

#[derive(Clone, Copy, Debug, Default)]
struct ByteTotals {
    downloaded: u64,
    uploaded: u64,
}

#[derive(Debug)]
struct CollectorState {
    source: String,
    error: Option<String>,
    totals: HashMap<u32, ByteTotals>,
}

impl CollectorState {
    fn unavailable(error: impl Into<String>) -> Self {
        Self {
            source: "unavailable".to_string(),
            error: Some(error.into()),
            totals: HashMap::new(),
        }
    }
}

#[derive(Debug)]
struct SamplingState {
    initialized: bool,
    sampled_at: Instant,
    previous: HashMap<u32, ByteTotals>,
}

pub struct ProcessNetworkMonitor {
    collector: Arc<Mutex<CollectorState>>,
    sampling: Mutex<SamplingState>,
    #[cfg(target_os = "windows")]
    _runtime: Option<windows::EtwRuntime>,
}

impl ProcessNetworkMonitor {
    pub fn start() -> Self {
        let collector = Arc::new(Mutex::new(CollectorState::unavailable(
            "이 운영체제에서는 프로세스별 네트워크 수집을 지원하지 않습니다.",
        )));

        #[cfg(target_os = "windows")]
        let runtime = match windows::EtwRuntime::start(Arc::clone(&collector)) {
            Ok(runtime) => Some(runtime),
            Err(error) => {
                let mut state = lock(&collector);
                *state = CollectorState::unavailable(error);
                None
            }
        };

        Self {
            collector,
            sampling: Mutex::new(SamplingState {
                initialized: false,
                sampled_at: Instant::now(),
                previous: HashMap::new(),
            }),
            #[cfg(target_os = "windows")]
            _runtime: runtime,
        }
    }

    pub fn sample(&self, active_pids: &HashSet<u32>) -> ProcessNetworkSnapshot {
        let now = Instant::now();
        let (source, error, current) = {
            let mut collector = lock(&self.collector);
            collector.totals.retain(|pid, _| active_pids.contains(pid));
            (
                collector.source.clone(),
                collector.error.clone(),
                collector.totals.clone(),
            )
        };

        let mut sampling = lock(&self.sampling);
        let elapsed = now
            .saturating_duration_since(sampling.sampled_at)
            .as_secs_f64()
            .max(0.001);
        let mut usage_by_pid = HashMap::with_capacity(current.len());

        for (pid, totals) in &current {
            let previous = sampling.previous.get(pid).copied().unwrap_or_default();
            let (downloaded_delta, uploaded_delta) = if sampling.initialized {
                (
                    totals.downloaded.saturating_sub(previous.downloaded),
                    totals.uploaded.saturating_sub(previous.uploaded),
                )
            } else {
                (0, 0)
            };
            usage_by_pid.insert(
                *pid,
                ProcessNetworkUsage {
                    download_bytes_per_sec: bytes_per_second(downloaded_delta, elapsed),
                    upload_bytes_per_sec: bytes_per_second(uploaded_delta, elapsed),
                    session_download_bytes: totals.downloaded,
                    session_upload_bytes: totals.uploaded,
                },
            );
        }

        sampling.initialized = true;
        sampling.sampled_at = now;
        sampling.previous = current;

        ProcessNetworkSnapshot {
            source,
            error,
            usage_by_pid,
        }
    }
}

impl Default for ProcessNetworkMonitor {
    fn default() -> Self {
        Self::start()
    }
}

fn bytes_per_second(bytes: u64, elapsed_seconds: f64) -> u64 {
    (bytes as f64 / elapsed_seconds).round().max(0.0) as u64
}

fn lock<T>(mutex: &Mutex<T>) -> std::sync::MutexGuard<'_, T> {
    mutex
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

#[cfg(target_os = "windows")]
mod windows {
    use super::{lock, CollectorState};
    use std::ffi::c_void;
    use std::mem::{size_of, zeroed};
    use std::ptr::{copy_nonoverlapping, null, read_unaligned};
    use std::sync::{Arc, Mutex};
    use windows_sys::core::GUID;
    use windows_sys::Win32::Foundation::{ERROR_ACCESS_DENIED, ERROR_ALREADY_EXISTS};
    use windows_sys::Win32::System::Diagnostics::Etw::{
        CloseTrace, ControlTraceW, OpenTraceW, ProcessTrace, StartTraceW, EVENT_RECORD,
        EVENT_TRACE_CONTROL_STOP, EVENT_TRACE_FLAG_NETWORK_TCPIP, EVENT_TRACE_LOGFILEW,
        EVENT_TRACE_PROPERTIES, EVENT_TRACE_REAL_TIME_MODE, EVENT_TRACE_SYSTEM_LOGGER_MODE,
        PROCESS_TRACE_MODE_EVENT_RECORD, PROCESS_TRACE_MODE_REAL_TIME, WNODE_FLAG_TRACED_GUID,
    };

    const SESSION_NAME: &str = "DolphinData Process Network";
    const INVALID_PROCESSTRACE_HANDLE: u64 = u64::MAX;
    const DOLPHIN_DATA_SESSION_GUID: GUID = GUID::from_u128(0x8c8ed086_26cc_4f3e_8c79_47ad1048092f);
    const TCP_IP_PROVIDER: GUID = GUID::from_u128(0x9a280ac0_c8e0_11d1_84e2_00c04fb998a2);
    const UDP_IP_PROVIDER: GUID = GUID::from_u128(0xbf3a50c5_a9c9_4988_a005_2df0b7c80f80);
    const SEND_IPV4: u8 = 10;
    const RECEIVE_IPV4: u8 = 11;
    const SEND_IPV6: u8 = 26;
    const RECEIVE_IPV6: u8 = 27;

    pub struct EtwRuntime {
        trace_handle: u64,
        session_name: Vec<u16>,
    }

    impl EtwRuntime {
        pub fn start(collector: Arc<Mutex<CollectorState>>) -> Result<Self, String> {
            let session_name = wide_null(SESSION_NAME);
            let mut properties = properties_buffer(&session_name);
            let properties_ptr = properties.as_mut_ptr().cast::<EVENT_TRACE_PROPERTIES>();
            let mut trace_handle = 0u64;

            let mut status =
                unsafe { StartTraceW(&mut trace_handle, session_name.as_ptr(), properties_ptr) };

            if status == ERROR_ALREADY_EXISTS {
                // A crashed DolphinData process can leave only our named session behind.
                unsafe {
                    ControlTraceW(
                        0,
                        session_name.as_ptr(),
                        properties_ptr,
                        EVENT_TRACE_CONTROL_STOP,
                    );
                }
                properties = properties_buffer(&session_name);
                status = unsafe {
                    StartTraceW(
                        &mut trace_handle,
                        session_name.as_ptr(),
                        properties.as_mut_ptr().cast::<EVENT_TRACE_PROPERTIES>(),
                    )
                };
            }

            if status != 0 {
                return Err(start_error(status));
            }

            {
                let mut state = lock(&collector);
                state.source = "etw".to_string();
                state.error = None;
                state.totals.clear();
            }

            let consumer_name = session_name.clone();
            std::thread::Builder::new()
                .name("dolphin-process-network-etw".to_string())
                .spawn(move || consume_trace(consumer_name, collector))
                .map_err(|error| {
                    let mut stop_properties = properties_buffer(&session_name);
                    unsafe {
                        ControlTraceW(
                            trace_handle,
                            session_name.as_ptr(),
                            stop_properties
                                .as_mut_ptr()
                                .cast::<EVENT_TRACE_PROPERTIES>(),
                            EVENT_TRACE_CONTROL_STOP,
                        );
                    }
                    format!("프로세스 네트워크 수집 스레드를 시작하지 못했습니다: {error}")
                })?;

            Ok(Self {
                trace_handle,
                session_name,
            })
        }
    }

    impl Drop for EtwRuntime {
        fn drop(&mut self) {
            let mut properties = properties_buffer(&self.session_name);
            unsafe {
                ControlTraceW(
                    self.trace_handle,
                    self.session_name.as_ptr(),
                    properties.as_mut_ptr().cast::<EVENT_TRACE_PROPERTIES>(),
                    EVENT_TRACE_CONTROL_STOP,
                );
            }
        }
    }

    fn consume_trace(session_name: Vec<u16>, collector: Arc<Mutex<CollectorState>>) {
        let mut logfile: EVENT_TRACE_LOGFILEW = unsafe { zeroed() };
        logfile.LoggerName = session_name.as_ptr() as *mut u16;
        logfile.Anonymous1.ProcessTraceMode =
            PROCESS_TRACE_MODE_REAL_TIME | PROCESS_TRACE_MODE_EVENT_RECORD;
        logfile.Anonymous2.EventRecordCallback = Some(event_record_callback);
        logfile.Context = Arc::as_ptr(&collector) as *mut c_void;

        let consumer_handle = unsafe { OpenTraceW(&mut logfile) };
        if consumer_handle == INVALID_PROCESSTRACE_HANDLE {
            set_runtime_error(
                &collector,
                "프로세스 네트워크 ETW 스트림을 열지 못했습니다.".to_string(),
            );
            return;
        }

        let status = unsafe { ProcessTrace(&consumer_handle, 1, null(), null()) };
        unsafe {
            CloseTrace(consumer_handle);
        }

        if status != 0 {
            set_runtime_error(
                &collector,
                format!("프로세스 네트워크 ETW 스트림이 종료되었습니다. (Windows 오류 {status})"),
            );
        }
    }

    unsafe extern "system" fn event_record_callback(record: *mut EVENT_RECORD) {
        let Some(record) = record.as_ref() else {
            return;
        };
        let Some((pid, size, is_upload)) = parse_network_event(
            record.EventHeader.ProviderId,
            record.EventHeader.EventDescriptor.Version,
            record.EventHeader.EventDescriptor.Opcode,
            record.UserData.cast::<u8>(),
            usize::from(record.UserDataLength),
        ) else {
            return;
        };
        let Some(collector) = (record.UserContext as *const Mutex<CollectorState>).as_ref() else {
            return;
        };
        let mut state = lock(collector);
        let totals = state.totals.entry(pid).or_default();
        if is_upload {
            totals.uploaded = totals.uploaded.saturating_add(u64::from(size));
        } else {
            totals.downloaded = totals.downloaded.saturating_add(u64::from(size));
        }
    }

    unsafe fn parse_network_event(
        provider: GUID,
        version: u8,
        opcode: u8,
        data: *const u8,
        data_len: usize,
    ) -> Option<(u32, u32, bool)> {
        if (!guid_eq(provider, TCP_IP_PROVIDER) && !guid_eq(provider, UDP_IP_PROVIDER))
            || version == 0
            || data.is_null()
            || data_len < 8
        {
            return None;
        }
        let is_upload = match opcode {
            SEND_IPV4 | SEND_IPV6 => true,
            RECEIVE_IPV4 | RECEIVE_IPV6 => false,
            _ => return None,
        };
        // MOF TCP/UDP events v1+ store ProcessId and transfer Size first.
        let pid = read_unaligned(data.cast::<u32>());
        let size = read_unaligned(data.add(4).cast::<u32>());
        (pid != 0 && size != 0).then_some((pid, size, is_upload))
    }

    fn guid_eq(left: GUID, right: GUID) -> bool {
        left.data1 == right.data1
            && left.data2 == right.data2
            && left.data3 == right.data3
            && left.data4 == right.data4
    }

    fn set_runtime_error(collector: &Mutex<CollectorState>, error: String) {
        let mut state = lock(collector);
        state.source = "unavailable".to_string();
        state.error = Some(error);
    }

    fn start_error(status: u32) -> String {
        if status == ERROR_ACCESS_DENIED {
            return "Windows 권한 때문에 프로세스별 네트워크 수집을 시작하지 못했습니다. 관리자 권한으로 실행하면 실제 앱별 사용량을 확인할 수 있습니다.".to_string();
        }
        format!("프로세스별 네트워크 수집을 시작하지 못했습니다. (Windows 오류 {status})")
    }

    fn properties_buffer(session_name: &[u16]) -> Vec<u8> {
        let properties_size = size_of::<EVENT_TRACE_PROPERTIES>();
        let total_size = properties_size + std::mem::size_of_val(session_name);
        let mut buffer = vec![0u8; total_size];
        let properties = buffer.as_mut_ptr().cast::<EVENT_TRACE_PROPERTIES>();
        unsafe {
            (*properties).Wnode.BufferSize = total_size as u32;
            (*properties).Wnode.Guid = DOLPHIN_DATA_SESSION_GUID;
            (*properties).Wnode.ClientContext = 1;
            (*properties).Wnode.Flags = WNODE_FLAG_TRACED_GUID;
            (*properties).BufferSize = 64;
            (*properties).MinimumBuffers = 5;
            (*properties).MaximumBuffers = 64;
            (*properties).FlushTimer = 1;
            (*properties).LogFileMode = EVENT_TRACE_REAL_TIME_MODE | EVENT_TRACE_SYSTEM_LOGGER_MODE;
            (*properties).EnableFlags = EVENT_TRACE_FLAG_NETWORK_TCPIP;
            (*properties).LoggerNameOffset = properties_size as u32;
            copy_nonoverlapping(
                session_name.as_ptr().cast::<u8>(),
                buffer.as_mut_ptr().add(properties_size),
                std::mem::size_of_val(session_name),
            );
        }
        buffer
    }

    fn wide_null(value: &str) -> Vec<u16> {
        value.encode_utf16().chain(std::iter::once(0)).collect()
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        fn parses_tcp_send_v2_payload() {
            let mut payload = Vec::new();
            payload.extend_from_slice(&1234u32.to_ne_bytes());
            payload.extend_from_slice(&8192u32.to_ne_bytes());
            let parsed = unsafe {
                parse_network_event(
                    TCP_IP_PROVIDER,
                    2,
                    SEND_IPV4,
                    payload.as_ptr(),
                    payload.len(),
                )
            };
            assert_eq!(parsed, Some((1234, 8192, true)));
        }

        #[test]
        fn rejects_legacy_or_unrelated_events() {
            let payload = [0u8; 8];
            assert!(unsafe {
                parse_network_event(
                    TCP_IP_PROVIDER,
                    0,
                    RECEIVE_IPV4,
                    payload.as_ptr(),
                    payload.len(),
                )
            }
            .is_none());
            assert!(unsafe {
                parse_network_event(
                    GUID::from_u128(1),
                    2,
                    RECEIVE_IPV4,
                    payload.as_ptr(),
                    payload.len(),
                )
            }
            .is_none());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn calculates_rate_from_byte_delta() {
        assert_eq!(bytes_per_second(4096, 2.0), 2048);
        assert_eq!(bytes_per_second(1500, 0.5), 3000);
    }

    #[test]
    fn first_sample_is_a_baseline_and_next_sample_uses_delta() {
        let collector = Arc::new(Mutex::new(CollectorState {
            source: "etw".to_string(),
            error: None,
            totals: HashMap::from([(
                42,
                ByteTotals {
                    downloaded: 100,
                    uploaded: 200,
                },
            )]),
        }));
        let monitor = ProcessNetworkMonitor {
            collector: Arc::clone(&collector),
            sampling: Mutex::new(SamplingState {
                initialized: false,
                sampled_at: Instant::now(),
                previous: HashMap::new(),
            }),
            #[cfg(target_os = "windows")]
            _runtime: None,
        };
        let active = HashSet::from([42]);

        let baseline = monitor.sample(&active);
        assert_eq!(baseline.usage_by_pid[&42].download_bytes_per_sec, 0);
        assert_eq!(baseline.usage_by_pid[&42].session_upload_bytes, 200);

        {
            let mut state = lock(&collector);
            state.totals.get_mut(&42).unwrap().downloaded += 100;
            state.totals.get_mut(&42).unwrap().uploaded += 200;
        }
        lock(&monitor.sampling).sampled_at = Instant::now() - Duration::from_secs(2);

        let next = monitor.sample(&active);
        assert_eq!(next.usage_by_pid[&42].download_bytes_per_sec, 50);
        assert_eq!(next.usage_by_pid[&42].upload_bytes_per_sec, 100);
    }
}
