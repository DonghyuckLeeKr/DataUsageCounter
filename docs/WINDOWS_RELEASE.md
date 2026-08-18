# Windows release checklist

## What is signed

DolphinData uses two independent trust mechanisms:

1. Tauri updater signatures protect automatic-update archives from tampering. The private key is stored outside the repository and mirrored to GitHub Actions secrets.
2. Windows Authenticode identifies the publisher to Windows and contributes to SmartScreen reputation. Updater signatures do not replace Authenticode.

## Local release build

Run from PowerShell:

```powershell
./scripts/build-release.ps1
```

The script runs the JavaScript and Rust test suites, loads the updater key using the current Windows user's DPAPI-protected password backup, and produces NSIS/MSI installers plus updater archives and `.sig` files.

## GitHub release

1. Keep `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` on the same semantic version.
2. Merge the release changes after all checks pass.
3. Push a matching tag such as `v1.2.1`.
4. `.github/workflows/release-windows.yml` builds on `windows-latest`, publishes both installers, prefers NSIS for updates, and publishes `latest.json`.
5. Confirm `https://github.com/DonghyuckLeeKr/DolphinData/releases/latest/download/latest.json` returns the published version before announcing the release.

Never commit the updater private key, its password backup, a PFX certificate, or certificate passwords.

## Authenticode without a paid certificate

The practical no-cost route is an application to SignPath Foundation for the public open-source repository. The project must retain a recognized open-source license and satisfy SignPath's eligibility and review requirements. Approval and certificate issuance are external steps and cannot be completed by repository code alone.

Until SignPath approves the project or another trusted certificate is configured, Windows installers remain `NotSigned` and may show SmartScreen warnings. Self-signed certificates are not a production substitute.
