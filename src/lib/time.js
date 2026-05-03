// Hours worked between two HH:mm times, minus break minutes. Returns 0 for invalid input.
export function computeHours(startTime, endTime, breakMinutes = 0) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some(n => Number.isNaN(n))) return 0;
  let mins = eh * 60 + em - (sh * 60 + sm) - (Number(breakMinutes) || 0);
  if (mins < 0) mins = 0;
  return Math.round((mins / 60) * 100) / 100;
}
