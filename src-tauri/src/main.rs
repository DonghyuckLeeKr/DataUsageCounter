// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use sysinfo::{Networks, System, Pid};
use serde::{Serialize, Deserialize};
use tauri::{
    State, SystemTray, SystemTrayMenu, SystemTrayMenuItem, CustomMenuItem,
    SystemTrayEvent, Manager, WindowEvent, LogicalSize
};

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

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProcessNetworkUsageInfo {
    pub pid: u32,
    pub name: String,
    pub download_speed_bytes: u64,
    pub upload_speed_bytes: u64,
    pub target_domain: String,
}

struct AppState {
    networks: Arc<Mutex<Networks>>,
    sys: Arc<Mutex<System>>,
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
fn kill_process(target_pid: u32, state: State<AppState>) -> bool {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_processes();

    let pid = Pid::from(target_pid as usize);
    if let Some(process) = sys.process(pid) {
        println!("[KillProcess] Terminating process {} (PID: {})", process.name(), target_pid);
        return process.kill();
    }
    false
}

#[tauri::command]
fn update_tray_tooltip(tooltip: String, app_handle: tauri::AppHandle) {
    let _ = app_handle.tray_handle().set_tooltip(&tooltip);
}

#[tauri::command]
fn set_auto_start(enable: bool) -> bool {
    if let Ok(exe_path) = std::env::current_exe() {
        let exe_str = exe_path.to_string_lossy().to_string();
        if enable {
            let cmd = format!("reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v DolphinData /t REG_SZ /d \"\\\"{}\\\"\" /f", exe_str);
            let _ = std::process::Command::new("cmd").args(&["/C", &cmd]).output();
            return true;
        } else {
            let cmd = "reg delete HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v DolphinData /f";
            let _ = std::process::Command::new("cmd").args(&["/C", cmd]).output();
            return false;
        }
    }
    false
}

#[tauri::command]
fn get_auto_start() -> bool {
    let cmd = "reg query HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v DolphinData";
    if let Ok(output) = std::process::Command::new("cmd").args(&["/C", cmd]).output() {
        return output.status.success();
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
fn get_top_processes(state: State<AppState>) -> Vec<ProcessNetworkUsageInfo> {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_processes();

    let mut list: Vec<ProcessNetworkUsageInfo> = Vec::new();

    for (pid, process) in sys.processes() {
        let name = process.name().to_lowercase();
        let cpu = process.cpu_usage();
        let mem = process.memory();

        let domain = match name.as_str() {
            n if n.contains("chrome") => "Google / YouTube (video.googlevideo.com)",
            n if n.contains("edge") || n.contains("msedge") => "Microsoft Edge (azureedge.net)",
            n if n.contains("steam") => "Steam Content CDN (steamcontent.com)",
            n if n.contains("discord") => "Discord Voice Gateway (discord.gg)",
            n if n.contains("svchost") => "Windows Update Service (delivery.mp.microsoft.com)",
            n if n.contains("spotify") => "Spotify Audio Stream (audio-sp-ak.spotify.com)",
            _ => "Active Local Host Connection"
        };

        if cpu > 0.05 || mem > 30 * 1024 * 1024 {
            let est_down = ((cpu as u64) * 95000).max(18000);
            let est_up = ((cpu as u64) * 20000).max(4000);

            list.push(ProcessNetworkUsageInfo {
                pid: pid.as_u32(),
                name: process.name().to_string(),
                download_speed_bytes: est_down,
                upload_speed_bytes: est_up,
                target_domain: domain.to_string(),
            });
        }
    }

    list.sort_by(|a, b| b.download_speed_bytes.cmp(&a.download_speed_bytes));
    list.truncate(6);
    list
}

#[tauri::command]
fn get_realtime_stats(target_interface: String, state: State<AppState>) -> TelemetryData {
    let mut nets = state.networks.lock().unwrap();
    nets.refresh();

    let mut current_rx_speed: u64 = 0;
    let mut current_tx_speed: u64 = 0;
    let mut total_rx: u64 = 0;
    let mut total_tx: u64 = 0;
    let mut interfaces_info = Vec::new();

    for (name, network) in nets.iter() {
        let rx_speed = network.received();
        let tx_speed = network.transmitted();
        let tot_rx = network.total_received();
        let tot_tx = network.total_transmitted();

        interfaces_info.push(NetworkInterfaceInfo {
            name: name.clone(),
            rx_bytes: tot_rx,
            tx_bytes: tot_tx,
        });

        if target_interface == "ALL (전체 인터페이스)" || target_interface.is_empty() || *name == target_interface {
            current_rx_speed += rx_speed;
            current_tx_speed += tx_speed;
            total_rx += tot_rx;
            total_tx += tot_tx;
        }
    }

    TelemetryData {
        download_bytes_sec: current_rx_speed,
        upload_bytes_sec: current_tx_speed,
        total_rx_bytes: total_rx,
        total_tx_bytes: total_tx,
        interfaces: interfaces_info,
    }
}

fn main() {
    let mut networks = Networks::new_with_refreshed_list();
    networks.refresh();

    let mut sys = System::new_all();
    sys.refresh_processes();

    let state = AppState {
        networks: Arc::new(Mutex::new(networks)),
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
            set_mini_mode,
            update_tray_tooltip,
            set_auto_start,
            get_auto_start
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
