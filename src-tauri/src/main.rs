// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use data_usage_counter::telemetry::{NetworkSampler, TelemetryData};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use sysinfo::{Pid, System};
use tauri::{
    CustomMenuItem, LogicalSize, Manager, State, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem, WindowEvent,
};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProcessActivityInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_percent: f32,
    pub memory_bytes: u64,
}

struct AppState {
    network_sampler: Arc<Mutex<NetworkSampler>>,
    sys: Arc<Mutex<System>>,
}

#[tauri::command]
fn get_network_interfaces(state: State<AppState>) -> Vec<String> {
    state.network_sampler.lock().unwrap().interface_names()
}

#[tauri::command]
fn kill_process(target_pid: u32, state: State<AppState>) -> bool {
    if target_pid == std::process::id() {
        return false;
    }
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_processes();

    let pid = Pid::from(target_pid as usize);
    if let Some(process) = sys.process(pid) {
        println!(
            "[KillProcess] Terminating process {} (PID: {})",
            process.name(),
            target_pid
        );
        return process.kill();
    }
    false
}

#[tauri::command]
fn update_tray_tooltip(tooltip: String, app_handle: tauri::AppHandle) {
    let _ = app_handle.tray_handle().set_tooltip(&tooltip);
}

#[tauri::command]
fn set_auto_start(enable: bool) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        if let Ok(exe_path) = std::env::current_exe() {
            let exe_str = exe_path.to_string_lossy().to_string();
            if enable {
                let output = std::process::Command::new("reg")
                    .args(&[
                        "add",
                        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                        "/v",
                        "DolphinData",
                        "/t",
                        "REG_SZ",
                        "/d",
                        &format!("\"{}\"", exe_str),
                        "/f",
                    ])
                    .creation_flags(CREATE_NO_WINDOW)
                    .output()
                    .map_err(|error| error.to_string())?;
                if !output.status.success() {
                    return Err(String::from_utf8_lossy(&output.stderr).to_string());
                }
                return Ok(true);
            } else {
                let output = std::process::Command::new("reg")
                    .args(&[
                        "delete",
                        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                        "/v",
                        "DolphinData",
                        "/f",
                    ])
                    .creation_flags(CREATE_NO_WINDOW)
                    .output()
                    .map_err(|error| error.to_string())?;
                if !output.status.success() && get_auto_start() {
                    return Err(String::from_utf8_lossy(&output.stderr).to_string());
                }
                return Ok(false);
            }
        }
    }
    Err("자동 시작 설정은 Windows에서만 지원됩니다.".to_string())
}

#[tauri::command]
fn get_auto_start() -> bool {
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = std::process::Command::new("reg")
            .args(&[
                "query",
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                "/v",
                "DolphinData",
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            return output.status.success();
        }
    }
    false
}

#[tauri::command]
fn set_mini_mode(mini: bool, window: tauri::Window) {
    if mini {
        let _ = window.set_resizable(true);
        let _ = window.set_min_size(Some(LogicalSize::new(260.0, 120.0)));
        let _ = window.set_size(LogicalSize::new(320.0, 150.0));
        let _ = window.set_always_on_top(true);
    } else {
        let _ = window.set_min_size(Some(LogicalSize::new(600.0, 450.0)));
        let _ = window.set_size(LogicalSize::new(1120.0, 760.0));
        let _ = window.set_always_on_top(false);
        let _ = window.center();
    }
}

#[tauri::command]
fn get_top_processes(state: State<AppState>) -> Vec<ProcessActivityInfo> {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_processes();

    let mut list: Vec<ProcessActivityInfo> = Vec::new();

    for (pid, process) in sys.processes() {
        let cpu = process.cpu_usage();
        let mem = process.memory();

        if cpu > 0.05 || mem > 30 * 1024 * 1024 {
            list.push(ProcessActivityInfo {
                pid: pid.as_u32(),
                name: process.name().to_string(),
                cpu_percent: cpu,
                memory_bytes: mem,
            });
        }
    }

    list.sort_by(|a, b| {
        b.cpu_percent
            .partial_cmp(&a.cpu_percent)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| b.memory_bytes.cmp(&a.memory_bytes))
    });
    list.truncate(12);
    list
}

#[tauri::command]
fn run_ping_test(host: String) -> Result<u64, String> {
    if host.is_empty()
        || !host
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '.' | ':' | '-'))
    {
        return Err("유효하지 않은 Ping 대상입니다.".to_string());
    }

    let mut command = std::process::Command::new("ping");
    #[cfg(target_os = "windows")]
    {
        command.args(["-n", "1", "-w", "2000", &host]);
        command.creation_flags(CREATE_NO_WINDOW);
    }
    #[cfg(not(target_os = "windows"))]
    {
        command.args(["-c", "1", "-W", "2", &host]);
    }

    let started = Instant::now();
    let output = command.output().map_err(|error| error.to_string())?;
    if !output.status.success() {
        return Err("Ping 대상에서 응답을 받지 못했습니다.".to_string());
    }
    Ok(started.elapsed().as_millis().max(1) as u64)
}

#[tauri::command]
fn get_realtime_stats(target_interface: String, state: State<AppState>) -> TelemetryData {
    state
        .network_sampler
        .lock()
        .unwrap()
        .sample(&target_interface)
}

fn main() {
    let mut sys = System::new_all();
    sys.refresh_processes();

    let state = AppState {
        network_sampler: Arc::new(Mutex::new(NetworkSampler::new())),
        sys: Arc::new(Mutex::new(sys)),
    };

    // System Tray Menu Items
    let show = CustomMenuItem::new("show".to_string(), "대시보드 열기 (Open)");
    let mini = CustomMenuItem::new("mini".to_string(), "미니 가젯 모드 (Mini Gadget)");
    let quit = CustomMenuItem::new("quit".to_string(), "종료 (Exit)");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(mini)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new()
        .with_menu(tray_menu)
        .with_tooltip("돌핀 데이터 (Dolphin Data) - 실시간 데이터 모니터");

    tauri::Builder::default()
        .manage(state)
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                        let _ = window.set_min_size(Some(LogicalSize::new(600.0, 450.0)));
                        let _ = window.set_size(LogicalSize::new(1120.0, 760.0));
                        let _ = window.set_always_on_top(false);
                        let _ = window.center();
                        let _ = window.emit("toggle-mini", false);
                    }
                }
                "mini" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                        let _ = window.set_min_size(Some(LogicalSize::new(260.0, 120.0)));
                        let _ = window.set_size(LogicalSize::new(320.0, 150.0));
                        let _ = window.set_always_on_top(true);
                        let _ = window.emit("toggle-mini", true);
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            WindowEvent::CloseRequested { api, .. } => {
                // Intercept close button to hide window to system tray
                api.prevent_close();
                let _ = event.window().hide();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            get_network_interfaces,
            get_realtime_stats,
            get_top_processes,
            kill_process,
            run_ping_test,
            set_mini_mode,
            update_tray_tooltip,
            set_auto_start,
            get_auto_start
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
