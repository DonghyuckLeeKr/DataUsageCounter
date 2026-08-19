const hasDangerousFormulaPrefix = (text) => {
  let index = 0;
  while (index < text.length && text.charCodeAt(index) <= 0x20) index += 1;
  return index < text.length && '=+-@'.includes(text[index]);
};

const hasDangerousControlPrefix = (text) => {
  const firstCodePoint = text.charCodeAt(0);
  return firstCodePoint === 0x09 || firstCodePoint === 0x0a || firstCodePoint === 0x0d;
};

export const escapeCsvCell = (value) => {
  let text = value === null || value === undefined ? '' : String(value);
  if (hasDangerousFormulaPrefix(text) || hasDangerousControlPrefix(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
};

export const createCsvRow = (cells) => cells.map(escapeCsvCell).join(',');
