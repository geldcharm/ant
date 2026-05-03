import { test, expect } from 'vitest';
import { nextReference } from './referenceNumbers';

test('nextReference starts at 0001 when nothing exists', () => {
  expect(nextReference('JOB', [], 'referenceNumber')).toBe('JOB-0001');
});

test('nextReference picks the highest number plus one', () => {
  const existing = [
    { ref: 'JOB-0001' },
    { ref: 'JOB-0042' },
    { ref: 'JOB-0017' },
  ];
  expect(nextReference('JOB', existing, 'ref')).toBe('JOB-0043');
});

test('nextReference ignores malformed values', () => {
  const existing = [
    { ref: 'JOB-0001' },
    { ref: 'CUSTOM-1' },
    { ref: '' },
    { ref: null },
  ];
  expect(nextReference('JOB', existing, 'ref')).toBe('JOB-0002');
});

test('nextReference uses different prefixes independently', () => {
  expect(nextReference('QUO', [{ q: 'QUO-0009' }], 'q')).toBe('QUO-0010');
  expect(nextReference('INV', [{ i: 'INV-0099' }], 'i')).toBe('INV-0100');
});
