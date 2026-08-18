param(
    [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$keyPath = Join-Path $env:USERPROFILE '.tauri\dolphindata.key'
$passwordPath = "$keyPath.password.clixml"

if (-not (Test-Path -LiteralPath $keyPath)) {
    throw "Tauri updater private key not found: $keyPath"
}
if (-not (Test-Path -LiteralPath $passwordPath)) {
    throw "DPAPI password backup not found: $passwordPath"
}

$securePassword = Import-Clixml -LiteralPath $passwordPath
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $env:TAURI_PRIVATE_KEY = (Get-Content -LiteralPath $keyPath -Raw).Trim()
    $env:TAURI_KEY_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)

    Push-Location $repoRoot
    try {
        if (-not $SkipTests) {
            npm.cmd test
            if ($LASTEXITCODE -ne 0) { throw "JavaScript tests failed: exit $LASTEXITCODE" }

            Push-Location (Join-Path $repoRoot 'src-tauri')
            try {
                cargo test
                if ($LASTEXITCODE -ne 0) { throw "Rust tests failed: exit $LASTEXITCODE" }
            } finally {
                Pop-Location
            }
        }

        npm.cmd run tauri -- build
        if ($LASTEXITCODE -ne 0) { throw "Tauri release build failed: exit $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
} finally {
    $env:TAURI_PRIVATE_KEY = $null
    $env:TAURI_KEY_PASSWORD = $null
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
}
