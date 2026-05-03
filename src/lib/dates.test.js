import { test, expect } from 'vitest';
import {
  toISODate,
  makeISODate,
  daysInMonth,
  firstDayOfMonthMondayIndex,
  startOfWeekMonday,
  addDays,
  formatDate,
} from './dates';

test('toISODate formats year-month-day', () => {
  expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
});

test('makeISODate pads single-digit values', () => {
  expect(makeISODate(2026, 0, 1)).toBe('2026-01-01');
  expect(makeISODate(2026, 11, 31)).toBe('2026-12-31');
});

test('daysInMonth handles leap years', () => {
  expect(daysInMonth(2024, 1)).toBe(29);
  expect(daysInMonth(2025, 1)).toBe(28);
  expect(daysInMonth(2026, 0)).toBe(31);
});

test('firstDayOfMonthMondayIndex maps Sunday to 6', () => {
  // 2026-02-01 is a Sunday → Monday-first index 6
  expect(firstDayOfMonthMondayIndex(2026, 1)).toBe(6);
  // 2026-01-01 is a Thursday → Monday-first index 3
  expect(firstDayOfMonthMondayIndex(2026, 0)).toBe(3);
});

test('startOfWeekMonday returns the previous Monday', () => {
  const wednesday = new Date(2026, 3, 8); // Wed
  const monday = startOfWeekMonday(wednesday);
  expect(monday.getDay()).toBe(1);
  expect(toISODate(monday)).toBe('2026-04-06');
});

test('startOfWeekMonday on Sunday returns the Monday before, not after', () => {
  const sunday = new Date(2026, 3, 12); // Sun
  const monday = startOfWeekMonday(sunday);
  expect(toISODate(monday)).toBe('2026-04-06');
});

test('addDays adds and subtracts days without mutating', () => {
  const original = new Date(2026, 0, 1);
  const after = addDays(original, 5);
  expect(toISODate(after)).toBe('2026-01-06');
  expect(toISODate(original)).toBe('2026-01-01');
});

test('formatDate returns em-dash for empty input', () => {
  expect(formatDate(null)).toBe('—');
  expect(formatDate('')).toBe('—');
});
