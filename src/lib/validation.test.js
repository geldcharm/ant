import { test, expect } from 'vitest';
import { isEmail, isNonEmpty, isNonNegativeNumber, isPercent } from './validation';

test('isEmail accepts well-formed addresses', () => {
  expect(isEmail('jane@example.com')).toBe(true);
  expect(isEmail('  jane@example.com  ')).toBe(true);
});

test('isEmail rejects malformed addresses', () => {
  expect(isEmail('')).toBe(false);
  expect(isEmail('jane')).toBe(false);
  expect(isEmail('jane@')).toBe(false);
  expect(isEmail('@example.com')).toBe(false);
  expect(isEmail(null)).toBe(false);
});

test('isNonEmpty rejects empty / whitespace-only strings', () => {
  expect(isNonEmpty('hello')).toBe(true);
  expect(isNonEmpty('')).toBe(false);
  expect(isNonEmpty('   ')).toBe(false);
  expect(isNonEmpty(undefined)).toBe(false);
});

test('isNonNegativeNumber accepts zero and positives, rejects negatives & NaN', () => {
  expect(isNonNegativeNumber(0)).toBe(true);
  expect(isNonNegativeNumber('5')).toBe(true);
  expect(isNonNegativeNumber(-1)).toBe(false);
  expect(isNonNegativeNumber('foo')).toBe(false);
});

test('isPercent enforces 0..100 range', () => {
  expect(isPercent(0)).toBe(true);
  expect(isPercent(100)).toBe(true);
  expect(isPercent(50)).toBe(true);
  expect(isPercent(101)).toBe(false);
  expect(isPercent(-1)).toBe(false);
});
