import { test, expect } from 'vitest';
import { computeHours } from './time';

test('computeHours subtracts breaks', () => {
  expect(computeHours('08:00', '16:00', 30)).toBe(7.5);
  expect(computeHours('07:00', '17:00', 45)).toBe(9.25);
});

test('computeHours returns 0 when end is before start', () => {
  expect(computeHours('17:00', '08:00', 0)).toBe(0);
});

test('computeHours returns 0 for missing inputs', () => {
  expect(computeHours('', '16:00', 0)).toBe(0);
  expect(computeHours('08:00', '', 0)).toBe(0);
});

test('computeHours handles missing break minutes', () => {
  expect(computeHours('08:00', '12:00')).toBe(4);
});
