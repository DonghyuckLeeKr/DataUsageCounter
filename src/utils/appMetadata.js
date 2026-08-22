export const SUPPORT_EMAIL = 'donghyucklee.kr@gmail.com';

export function buildSupportMailto(version) {
  const normalizedVersion = String(version || '').trim();
  const subject = /^\d+\.\d+\.\d+/.test(normalizedVersion)
    ? `[DolphinData v${normalizedVersion}] 문의`
    : '[DolphinData] 문의';
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
