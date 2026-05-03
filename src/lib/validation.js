const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isNonNegativeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

export function isPercent(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}
