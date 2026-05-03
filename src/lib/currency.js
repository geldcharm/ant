import { LOCALE } from '../config/business';

export function formatAmount(value) {
  const n = Number(value) || 0;
  return n.toLocaleString(LOCALE.number, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrency(value) {
  return `${LOCALE.currencySymbol}${formatAmount(value)}`;
}
