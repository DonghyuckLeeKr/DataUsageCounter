export const DEFAULT_KOREAN_UPDATE_NOTES = '사용성 개선과 안정화 작업이 포함된 최신 버전입니다.';

export function getKoreanUpdateNotes(notes) {
  const normalized = String(notes || '').trim();
  if (!normalized || !/[가-힣]/.test(normalized)) {
    return DEFAULT_KOREAN_UPDATE_NOTES;
  }
  return normalized;
}
