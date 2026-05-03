import { test, expect } from 'vitest';
import { formatAmount, formatCurrency } from './currency';

test('formatAmount renders 2 decimal places', () => {
  expect(formatAmount(1234.5)).toMatch(/^1,234\.50$/);
  expect(formatAmount(0)).toBe('0.00');
});

test('formatAmount treats invalid input as zero', () => {
  expect(formatAmount(undefined)).toBe('0.00');
  expect(formatAmount('not-a-number')).toBe('0.00');
});

test('formatCurrency prefixes the currency symbol', () => {
  expect(formatCurrency(50)).toMatch(/^\$50\.00$/);
});
