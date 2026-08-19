use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant};
use sysinfo::Networks;

pub const ALL_INTERFACES: &str = "ALL (전체 인터페이스)";
const INTERFACE_LIST_REFRESH_SAMPLES: u64 = 60;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct NetworkInterfaceInfo {
    pub name: String,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
    pub rx_delta_bytes: u64,
    pub tx_delta_bytes: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct TelemetryData {
    pub download_bytes_sec: u64,
    pub upload_bytes_sec: u64,
    pub rx_delta_bytes: u64,
    pub tx_delta_bytes: u64,
    pub total_rx_bytes: u64,
    pub total_tx_bytes: u64,
    pub sample_interval_ms: u64,
    pub interfaces: Vec<NetworkInterfaceInfo>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct InterfaceSample {
    name: String,
    rx_bytes: u64,
    tx_bytes: u64,
    rx_delta_bytes: u64,
    tx_delta_bytes: u64,
}

pub struct NetworkSampler {
    networks: Networks,
    previous_totals: HashMap<String, (u64, u64)>,
    last_sampled_at: Instant,
    samples_since_list_refresh: u64,
}

impl NetworkSampler {
    pub fn new() -> Self {
        let mut networks = Networks::new_with_refreshed_list();
        networks.refresh();
        let previous_totals = networks
            .iter()
            .map(|(name, network)| {
                (
                    name.clone(),
                    (network.total_received(), network.total_transmitted()),
                )
            })
            .collect();

        Self {
            networks,
            previous_totals,
            last_sampled_at: Instant::now(),
            samples_since_list_refresh: 0,
        }
    }

    pub fn interface_names(&self) -> Vec<String> {
        let mut names: Vec<String> = self.networks.keys().cloned().collect();
        names.sort_by_key(|name| name.to_lowercase());
        names.insert(0, ALL_INTERFACES.to_string());
        names
    }

    pub fn sample(&mut self, target_interface: &str) -> TelemetryData {
        if self.samples_since_list_refresh >= INTERFACE_LIST_REFRESH_SAMPLES {
            self.networks.refresh_list();
            self.samples_since_list_refresh = 0;
        } else {
            self.networks.refresh();
            self.samples_since_list_refresh += 1;
        }

        let sampled_at = Instant::now();
        let elapsed = sampled_at.saturating_duration_since(self.last_sampled_at);
        self.last_sampled_at = sampled_at;

        let current_names: HashSet<String> = self.networks.keys().cloned().collect();
        let mut samples = Vec::with_capacity(self.networks.len());

        for (name, network) in self.networks.iter() {
            let rx_bytes = network.total_received();
            let tx_bytes = network.total_transmitted();
            let previous = self.previous_totals.get(name).copied();
            let (rx_delta_bytes, tx_delta_bytes) = match previous {
                Some((previous_rx, previous_tx)) => (
                    counter_delta(previous_rx, rx_bytes),
                    counter_delta(previous_tx, tx_bytes),
                ),
                None => (0, 0),
            };

            self.previous_totals
                .insert(name.clone(), (rx_bytes, tx_bytes));
            samples.push(InterfaceSample {
                name: name.clone(),
                rx_bytes,
                tx_bytes,
                rx_delta_bytes,
                tx_delta_bytes,
            });
        }

        self.previous_totals
            .retain(|name, _| current_names.contains(name));
        aggregate_samples(&samples, target_interface, elapsed)
    }
}

impl Default for NetworkSampler {
    fn default() -> Self {
        Self::new()
    }
}

fn counter_delta(previous: u64, current: u64) -> u64 {
    current.saturating_sub(previous)
}

fn bytes_per_second(bytes: u64, elapsed: Duration) -> u64 {
    let nanos = elapsed.as_nanos().max(1);
    let rate = (bytes as u128)
        .saturating_mul(1_000_000_000)
        .saturating_add(nanos / 2)
        / nanos;
    rate.min(u64::MAX as u128) as u64
}

fn aggregate_samples(
    samples: &[InterfaceSample],
    target_interface: &str,
    elapsed: Duration,
) -> TelemetryData {
    let include_all = target_interface.is_empty() || target_interface == ALL_INTERFACES;
    let mut rx_delta_bytes = 0_u64;
    let mut tx_delta_bytes = 0_u64;
    let mut total_rx_bytes = 0_u64;
    let mut total_tx_bytes = 0_u64;

    let mut interfaces: Vec<NetworkInterfaceInfo> = samples
        .iter()
        .map(|sample| {
            if include_all || sample.name == target_interface {
                rx_delta_bytes = rx_delta_bytes.saturating_add(sample.rx_delta_bytes);
                tx_delta_bytes = tx_delta_bytes.saturating_add(sample.tx_delta_bytes);
                total_rx_bytes = total_rx_bytes.saturating_add(sample.rx_bytes);
                total_tx_bytes = total_tx_bytes.saturating_add(sample.tx_bytes);
            }
            NetworkInterfaceInfo {
                name: sample.name.clone(),
                rx_bytes: sample.rx_bytes,
                tx_bytes: sample.tx_bytes,
                rx_delta_bytes: sample.rx_delta_bytes,
                tx_delta_bytes: sample.tx_delta_bytes,
            }
        })
        .collect();
    interfaces.sort_by_key(|interface| interface.name.to_lowercase());

    TelemetryData {
        download_bytes_sec: bytes_per_second(rx_delta_bytes, elapsed),
        upload_bytes_sec: bytes_per_second(tx_delta_bytes, elapsed),
        rx_delta_bytes,
        tx_delta_bytes,
        total_rx_bytes,
        total_tx_bytes,
        sample_interval_ms: elapsed.as_millis().min(u64::MAX as u128) as u64,
        interfaces,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample(name: &str, rx: u64, tx: u64, rx_delta: u64, tx_delta: u64) -> InterfaceSample {
        InterfaceSample {
            name: name.to_string(),
            rx_bytes: rx,
            tx_bytes: tx,
            rx_delta_bytes: rx_delta,
            tx_delta_bytes: tx_delta,
        }
    }

    #[test]
    fn normalizes_rate_using_actual_sample_interval() {
        let data = aggregate_samples(
            &[sample("Wi-Fi", 10_000, 5_000, 2_000, 1_000)],
            "Wi-Fi",
            Duration::from_secs(2),
        );

        assert_eq!(data.rx_delta_bytes, 2_000);
        assert_eq!(data.tx_delta_bytes, 1_000);
        assert_eq!(data.download_bytes_sec, 1_000);
        assert_eq!(data.upload_bytes_sec, 500);
        assert_eq!(data.sample_interval_ms, 2_000);
    }

    #[test]
    fn exact_interface_selection_avoids_cross_adapter_double_counting() {
        let samples = [
            sample("Wi-Fi", 10_000, 4_000, 800, 200),
            sample("vEthernet", 8_000, 3_000, 700, 100),
        ];

        let selected = aggregate_samples(&samples, "Wi-Fi", Duration::from_secs(1));
        let all = aggregate_samples(&samples, ALL_INTERFACES, Duration::from_secs(1));

        assert_eq!(selected.rx_delta_bytes + selected.tx_delta_bytes, 1_000);
        assert_eq!(all.rx_delta_bytes + all.tx_delta_bytes, 1_800);
    }

    #[test]
    fn counter_reset_never_creates_a_huge_false_delta() {
        assert_eq!(counter_delta(5_000, 7_500), 2_500);
        assert_eq!(counter_delta(5_000, 100), 0);
    }
}
