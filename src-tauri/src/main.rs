// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use sysinfo::Networks;
use serde::{Serialize, Deserialize};
use tauri::State;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NetworkInterfaceInfo {
    pub name: String,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TelemetryData {
    pub download_bytes_sec: u64,
    pub upload_bytes_sec: u64,
    pub total_rx_bytes: u64,
    pub total_tx_bytes: u64,
    pub interfaces: Vec<NetworkInterfaceInfo>,
}

struct AppState {
    networks: Arc<Mutex<Networks>>,
    last_rx: Arc<Mutex<u64>>,
    last_tx: Arc<Mutex<u64>>,
}

#[tauri::command]
fn get_network_interfaces(state: State<AppState>) -> Vec<String> {
    let mut nets = state.networks.lock().unwrap();
    nets.refresh_list();
    let mut names: Vec<String> = nets.iter().map(|(name, _)| name.clone()).collect();
    names.insert(0, "ALL (전체 인터페이스)".to_string());
    names
}

#[tauri::command]
fn get_realtime_stats(target_interface: String, state: State<AppState>) -> TelemetryData {
    let mut nets = state.networks.lock().unwrap();
    nets.refresh();

    let mut current_rx: u64 = 0;
    let mut current_tx: u64 = 0;
    let mut interfaces_info = Vec::new();

    for (name, network) in nets.iter() {
        let rx = network.received();
        let tx = network.transmitted();

        interfaces_info.push(NetworkInterfaceInfo {
            name: name.clone(),
            rx_bytes: rx,
            tx_bytes: tx,
        });

        if target_interface == "ALL (전체 인터페이스)" || target_interface.is_empty() || *name == target_interface {
            current_rx += rx;
            current_tx += tx;
        }
    }

    let mut last_rx_guard = state.last_rx.lock().unwrap();
    let mut last_tx_guard = state.last_tx.lock().unwrap();

    let download_speed = if current_rx >= *last_rx_guard && *last_rx_guard > 0 {
        current_rx - *last_rx_guard
    } else {
        0
    };

    let upload_speed = if current_tx >= *last_tx_guard && *last_tx_guard > 0 {
        current_tx - *last_tx_guard
    } else {
        0
    };

    *last_rx_guard = current_rx;
    *last_tx_guard = current_tx;

    TelemetryData {
        download_bytes_sec: download_speed,
        upload_bytes_sec: upload_speed,
        total_rx_bytes: current_rx,
        total_tx_bytes: current_tx,
        interfaces: interfaces_info,
    }
}

fn main() {
    let mut networks = Networks::new_with_refreshed_list();
    networks.refresh();

    let state = AppState {
        networks: Arc::new(Mutex::new(networks)),
        last_rx: Arc::new(Mutex::new(0)),
        last_tx: Arc::new(Mutex::new(0)),
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            get_network_interfaces,
            get_realtime_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
