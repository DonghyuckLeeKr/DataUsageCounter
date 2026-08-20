const parseIpv4 = (value) => {
  const parts = String(value).split('.');
  if (parts.length !== 4) return null;
  const numbers = parts.map(part => Number(part));
  if (numbers.some((number, index) => !Number.isInteger(number)
    || number < 0
    || number > 255
    || String(number) !== parts[index])) {
    return null;
  }
  return numbers;
};

export const isPrivateIpv4 = (value) => {
  const parts = parseIpv4(value);
  if (!parts) return false;
  const [first, second] = parts;
  return first === 10
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168);
};

export const buildRouterAdminUrl = (gateway) => {
  const value = typeof gateway === 'string' ? gateway.trim() : '';
  if (!value) throw new Error('현재 네트워크의 기본 게이트웨이를 확인하지 못했습니다.');

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `http://${value}/`);
  } catch {
    throw new Error('기본 게이트웨이 주소 형식이 올바르지 않습니다.');
  }
  if (!['http:', 'https:'].includes(url.protocol)
    || url.username
    || url.password
    || !isPrivateIpv4(url.hostname)) {
    throw new Error('사설 네트워크의 안전한 게이트웨이 주소만 열 수 있습니다.');
  }
  return url.toString();
};
