import { test, expect } from 'vitest';
import { calcLineAmount, calcTotals } from './totals';

test('calcLineAmount multiplies qty × price', () => {
  expect(calcLineAmount({ quantity: 2, unitPrice: 50 })).toBe(100);
});

test('calcLineAmount applies percentage discount', () => {
  expect(calcLineAmount({ quantity: 4, unitPrice: 100, discountPercent: 25 })).toBe(300);
});

test('calcLineAmount returns 0 for non-numeric inputs', () => {
  expect(calcLineAmount({ quantity: '', unitPrice: 'abc' })).toBe(0);
});

test('calcTotals computes subtotal, GST and total from items', () => {
  const items = [
    { amount: 100, tax: 'GST (15%)' },
    { amount: 200, tax: 'GST (10%)' },
    { amount: 50,  tax: 'No Tax (0%)' },
  ];
  const totals = calcTotals(items);
  expect(totals.subtotal).toBe(350);
  expect(totals.gstAmount).toBeCloseTo(35, 5);
  expect(totals.total).toBeCloseTo(385, 5);
});

test('calcTotals handles unknown tax as zero rate', () => {
  const totals = calcTotals([{ amount: 100, tax: 'Unknown' }]);
  expect(totals.gstAmount).toBe(0);
  expect(totals.total).toBe(100);
});

test('calcTotals handles empty items list', () => {
  expect(calcTotals([])).toEqual({ subtotal: 0, gstAmount: 0, total: 0 });
});
