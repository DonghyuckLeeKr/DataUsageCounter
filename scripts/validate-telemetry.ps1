param(
    [ValidateRange(1, 86400)]
    [int]$DurationSeconds = 3600,

    [ValidateRange(100, 60000)]
    [int]$IntervalMilliseconds = 1000,

    [string]$InterfaceName = '',

    [ValidateRange(0.1, 20.0)]
    [double]$MaximumErrorPercent = 1.5,

    [ValidateRange(1, 10240)]
    [int]$MinimumTrafficMiB = 10
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$tauriRoot = Join-Path $repoRoot 'src-tauri'
$reportRoot = Join-Path $repoRoot 'validation'

if (-not $InterfaceName) {
    $route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' |
        Where-Object { $_.State -eq 'Alive' } |
        Sort-Object RouteMetric, InterfaceMetric |
        Select-Object -First 1
    if (-not $route) {
        throw '활성 IPv4 기본 경로를 찾지 못했습니다. -InterfaceName을 지정하세요.'
    }
    $adapter = Get-NetAdapter -InterfaceIndex $route.InterfaceIndex
    $InterfaceName = $adapter.Name
} else {
    $adapter = Get-NetAdapter -Name $InterfaceName
}

if ($adapter.Status -ne 'Up') {
    throw "선택한 인터페이스가 연결 상태가 아닙니다: $InterfaceName ($($adapter.Status))"
}

New-Item -ItemType Directory -Path $reportRoot -Force | Out-Null

Push-Location $tauriRoot
try {
    cargo build --release --example telemetry_probe
    if ($LASTEXITCODE -ne 0) {
        throw "telemetry_probe 빌드 실패: exit $LASTEXITCODE"
    }

    $probePath = Join-Path $tauriRoot 'target\release\examples\telemetry_probe.exe'
    $osStart = Get-NetAdapterStatistics -Name $InterfaceName
    $probeJson = & $probePath `
        --duration-seconds $DurationSeconds `
        --interval-ms $IntervalMilliseconds `
        --interface $InterfaceName
    if ($LASTEXITCODE -ne 0) {
        throw "telemetry_probe 실행 실패: exit $LASTEXITCODE"
    }
    $osEnd = Get-NetAdapterStatistics -Name $InterfaceName
} finally {
    Pop-Location
}

$probe = $probeJson | ConvertFrom-Json
$osReceivedBytes = [uint64]($osEnd.ReceivedBytes - $osStart.ReceivedBytes)
$osSentBytes = [uint64]($osEnd.SentBytes - $osStart.SentBytes)
$osCombinedBytes = $osReceivedBytes + $osSentBytes
$probeCombinedBytes = [uint64]$probe.combined_bytes
$differenceBytes = [math]::Abs([double]$probeCombinedBytes - [double]$osCombinedBytes)
$errorPercent = if ($osCombinedBytes -eq 0) { 100.0 } else { ($differenceBytes / $osCombinedBytes) * 100.0 }
$minimumTrafficBytes = [uint64]$MinimumTrafficMiB * 1MB

$status = if ($osCombinedBytes -lt $minimumTrafficBytes) {
    'INSUFFICIENT_TRAFFIC'
} elseif ($errorPercent -le $MaximumErrorPercent) {
    'PASS'
} else {
    'FAIL'
}

$report = [ordered]@{
    status = $status
    measuredAt = (Get-Date).ToString('o')
    durationSeconds = $DurationSeconds
    intervalMilliseconds = $IntervalMilliseconds
    interface = [ordered]@{
        name = $InterfaceName
        description = $adapter.InterfaceDescription
        linkSpeed = $adapter.LinkSpeed
    }
    thresholds = [ordered]@{
        maximumErrorPercent = $MaximumErrorPercent
        minimumTrafficMiB = $MinimumTrafficMiB
    }
    windows = [ordered]@{
        receivedBytes = $osReceivedBytes
        sentBytes = $osSentBytes
        combinedBytes = $osCombinedBytes
    }
    dolphinProbe = $probe
    comparison = [ordered]@{
        differenceBytes = [uint64]$differenceBytes
        errorPercent = [math]::Round($errorPercent, 4)
    }
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = Join-Path $reportRoot "telemetry-$timestamp.json"
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8
$report | ConvertTo-Json -Depth 8
Write-Host "Report: $reportPath"

if ($status -eq 'FAIL') { exit 1 }
if ($status -eq 'INSUFFICIENT_TRAFFIC') { exit 2 }
