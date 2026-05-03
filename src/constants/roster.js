export const ROSTER_DAYS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

export const ROSTER_DAY_VALUES = ROSTER_DAYS.map(d => d.value);

export const DEFAULT_ROSTER = {
  days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  startTime: '07:00',
  endTime: '16:00',
};

const DAY_INDEX_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function isOnRoster(employee, dateStr) {
  if (!employee?.roster?.days || !dateStr) return true;
  const date = new Date(dateStr + 'T12:00:00');
  return employee.roster.days.includes(DAY_INDEX_TO_KEY[date.getDay()]);
}

export function formatRoster(roster) {
  if (!roster?.days?.length) return 'No roster';
  const sorted = [...roster.days].sort(
    (a, b) => ROSTER_DAY_VALUES.indexOf(a) - ROSTER_DAY_VALUES.indexOf(b)
  );
  const labels = sorted
    .map(d => ROSTER_DAYS.find(r => r.value === d)?.label)
    .filter(Boolean);
  const dayText = labels.length === 7 ? 'Every day' : labels.join(', ');
  return `${dayText} · ${roster.startTime || '—'}–${roster.endTime || '—'}`;
}
