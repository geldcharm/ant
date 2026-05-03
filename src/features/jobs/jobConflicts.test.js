import { test, expect } from 'vitest';
import { jobRunsOn, jobsOnDate } from './jobConflicts';

const oneDay  = { id: 'a', startDate: '2026-04-10' };
const multi   = { id: 'b', startDate: '2026-04-08', endDate: '2026-04-12' };
const empty   = { id: 'c', startDate: '' };
const single  = { id: 'd', startDate: '2026-04-09' };

test('jobRunsOn matches single-day jobs', () => {
  expect(jobRunsOn(oneDay, '2026-04-10')).toBe(true);
  expect(jobRunsOn(oneDay, '2026-04-11')).toBe(false);
});

test('jobRunsOn includes the inclusive range for multi-day jobs', () => {
  expect(jobRunsOn(multi, '2026-04-08')).toBe(true);
  expect(jobRunsOn(multi, '2026-04-10')).toBe(true);
  expect(jobRunsOn(multi, '2026-04-12')).toBe(true);
  expect(jobRunsOn(multi, '2026-04-13')).toBe(false);
});

test('jobRunsOn returns false when start date is missing', () => {
  expect(jobRunsOn(empty, '2026-04-10')).toBe(false);
});

test('jobsOnDate excludes the given id (used when editing a job)', () => {
  const jobs = [oneDay, multi, single];
  const result = jobsOnDate(jobs, '2026-04-10', 'a');
  expect(result.map(j => j.id)).toEqual(['b']);
});
