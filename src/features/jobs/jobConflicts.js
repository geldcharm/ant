// True if `job` runs on `dateStr` (handles both single-day and multi-day jobs).
export function jobRunsOn(job, dateStr) {
  if (!job.startDate) return false;
  if (job.startDate === dateStr) return true;
  if (job.endDate && job.startDate <= dateStr && job.endDate >= dateStr) return true;
  return false;
}

// Returns jobs scheduled on the given date, optionally excluding one (used
// when editing a job so it doesn't conflict with itself).
export function jobsOnDate(jobs, dateStr, excludeId = null) {
  return jobs.filter(j => j.id !== excludeId && jobRunsOn(j, dateStr));
}
