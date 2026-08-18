use data_usage_counter::telemetry::{NetworkSampler, ALL_INTERFACES};
use serde::Serialize;
use std::env;
use std::thread;
use std::time::{Duration, Instant};

#[derive(Serialize)]
struct ProbeSummary {
    interface: String,
    duration_ms: u64,
    interval_ms: u64,
    samples: u64,
    received_bytes: u64,
    transmitted_bytes: u64,
    combined_bytes: u64,
    min_sample_interval_ms: u64,
    max_sample_interval_ms: u64,
    available_interfaces: Vec<String>,
}

struct Options {
    duration: Duration,
    interval: Duration,
    interface: String,
}

fn value_after(args: &[String], flag: &str) -> Option<String> {
    args.iter()
        .position(|arg| arg == flag)
        .and_then(|index| args.get(index + 1))
        .cloned()
}

fn parse_options() -> Result<Options, String> {
    let args: Vec<String> = env::args().skip(1).collect();
    let duration_seconds = value_after(&args, "--duration-seconds")
        .unwrap_or_else(|| "60".to_string())
        .parse::<u64>()
        .map_err(|_| "--duration-seconds must be a positive integer".to_string())?;
    let interval_ms = value_after(&args, "--interval-ms")
        .unwrap_or_else(|| "1000".to_string())
        .parse::<u64>()
        .map_err(|_| "--interval-ms must be a positive integer".to_string())?;
    if duration_seconds == 0 || interval_ms == 0 {
        return Err("duration and interval must be greater than zero".to_string());
    }

    Ok(Options {
        duration: Duration::from_secs(duration_seconds),
        interval: Duration::from_millis(interval_ms),
        interface: value_after(&args, "--interface").unwrap_or_else(|| ALL_INTERFACES.to_string()),
    })
}

fn main() -> Result<(), String> {
    let options = parse_options()?;
    let mut sampler = NetworkSampler::new();
    let available_interfaces = sampler.interface_names();
    if options.interface != ALL_INTERFACES
        && !available_interfaces
            .iter()
            .any(|name| name == &options.interface)
    {
        return Err(format!(
            "interface '{}' was not found; available: {}",
            options.interface,
            available_interfaces.join(", ")
        ));
    }

    let started_at = Instant::now();
    let mut samples = 0_u64;
    let mut received_bytes = 0_u64;
    let mut transmitted_bytes = 0_u64;
    let mut min_sample_interval_ms = u64::MAX;
    let mut max_sample_interval_ms = 0_u64;

    while started_at.elapsed() < options.duration {
        thread::sleep(options.interval);
        let data = sampler.sample(&options.interface);
        samples += 1;
        received_bytes = received_bytes.saturating_add(data.rx_delta_bytes);
        transmitted_bytes = transmitted_bytes.saturating_add(data.tx_delta_bytes);
        min_sample_interval_ms = min_sample_interval_ms.min(data.sample_interval_ms);
        max_sample_interval_ms = max_sample_interval_ms.max(data.sample_interval_ms);
    }

    let summary = ProbeSummary {
        interface: options.interface,
        duration_ms: started_at.elapsed().as_millis().min(u64::MAX as u128) as u64,
        interval_ms: options.interval.as_millis().min(u64::MAX as u128) as u64,
        samples,
        received_bytes,
        transmitted_bytes,
        combined_bytes: received_bytes.saturating_add(transmitted_bytes),
        min_sample_interval_ms: if samples == 0 {
            0
        } else {
            min_sample_interval_ms
        },
        max_sample_interval_ms,
        available_interfaces,
    };

    println!(
        "{}",
        serde_json::to_string_pretty(&summary).map_err(|error| error.to_string())?
    );
    Ok(())
}
