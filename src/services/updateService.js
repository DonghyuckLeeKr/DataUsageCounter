export async function checkForAppUpdate() {
  const [{ checkUpdate }, { getVersion }] = await Promise.all([
    import('@tauri-apps/api/updater'),
    import('@tauri-apps/api/app')
  ]);
  const [result, currentVersion] = await Promise.all([
    checkUpdate(),
    getVersion()
  ]);
  return { ...result, currentVersion };
}

export async function installAppUpdate() {
  const { installUpdate } = await import('@tauri-apps/api/updater');
  await installUpdate();
}

export async function getInstalledAppVersion() {
  const { getVersion } = await import('@tauri-apps/api/app');
  return getVersion();
}
