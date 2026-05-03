import { useMemo, useState } from 'react';
import {
  BackButton,
  Card,
  Button,
  Input,
  Select,
  Modal,
  Avatar,
  ListSkeleton,
  ErrorState,
} from '../components/ui';
import {
  useTimeEntries,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
} from '../hooks/useTimeEntries';
import { useEmployees } from '../hooks/useEmployees';
import { useJobs } from '../hooks/useJobs';
import { useRole } from '../auth/RoleContext';
import {
  WEEKDAYS_SHORT_MON,
  MONTHS_SHORT,
  startOfWeekMonday,
  toISODate,
  addDays,
  todayISO,
} from '../lib/dates';
import { LOCALE } from '../config/business';
import { computeHours } from '../lib/time';
import { EMPTY_LIST } from '../hooks/queryHelpers';

const EMPTY_ENTRY = {
  employeeId: '',
  jobId: '',
  date: '',
  startTime: '08:00',
  endTime: '16:00',
  breakMinutes: 30,
  notes: '',
  status: 'pending',
};

const STATUS_FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
];

const GRID = { gridTemplateColumns: '180px repeat(7, 1fr) 80px' };

function buildWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { date: d, str: toISODate(d), label: WEEKDAYS_SHORT_MON[i], num: d.getDate() };
  });
}

function formatWeekLabel(weekStart, weekEnd) {
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  if (sameMonth) {
    return `${MONTHS_SHORT[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  }
  return `${MONTHS_SHORT[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS_SHORT[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
}

export default function TimeSheet() {
  const { isAdmin } = useRole();
  const entriesQuery = useTimeEntries();
  const employeesQuery = useEmployees();
  const jobsQuery = useJobs();
  const createMutation = useCreateTimeEntry();
  const updateMutation = useUpdateTimeEntry();
  const deleteMutation = useDeleteTimeEntry();

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const entries = entriesQuery.data ?? EMPTY_LIST;
  const employees = employeesQuery.data ?? EMPTY_LIST;
  const jobs = jobsQuery.data ?? EMPTY_LIST;
  const saving = createMutation.isPending || updateMutation.isPending;

  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const weekRange = { start: weekDays[0].str, end: weekDays[6].str };
  const weekLabel = formatWeekLabel(weekStart, weekDays[6].date);
  const today = todayISO();
  const isThisWeek = weekRange.start <= today && today <= weekRange.end;

  const weekEntries = useMemo(() => entries.filter(t =>
    t.date >= weekRange.start &&
    t.date <= weekRange.end &&
    (employeeFilter === 'all' || t.employeeId === employeeFilter) &&
    (statusFilter === 'all' || t.status === statusFilter)
  ), [entries, weekRange.start, weekRange.end, employeeFilter, statusFilter]);

  const visibleEmployees = employeeFilter === 'all'
    ? employees
    : employees.filter(e => e.id === employeeFilter);

  function entriesFor(empId, dateStr) {
    return weekEntries.filter(t => t.employeeId === empId && t.date === dateStr);
  }
  function hoursFor(empId, dateStr) {
    return entriesFor(empId, dateStr).reduce((sum, t) => sum + (t.hours || 0), 0);
  }
  function weekTotalFor(empId) {
    return weekDays.reduce((sum, d) => sum + hoursFor(empId, d.str), 0);
  }
  const grandTotal = visibleEmployees.reduce((sum, e) => sum + weekTotalFor(e.id), 0);
  const pendingCount = weekEntries.filter(t => t.status === 'pending').length;

  function shiftWeek(weeks) {
    setWeekStart(prev => addDays(prev, weeks * 7));
  }
  function goThisWeek() {
    setWeekStart(startOfWeekMonday(new Date()));
  }

  function openCreate(empId = '', dateStr = '') {
    setForm({ ...EMPTY_ENTRY, employeeId: empId, date: dateStr || todayISO() });
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(entry) {
    setForm({
      employeeId: entry.employeeId,
      jobId: entry.jobId || '',
      date: entry.date,
      startTime: entry.startTime || '08:00',
      endTime: entry.endTime || '16:00',
      breakMinutes: entry.breakMinutes || 0,
      notes: entry.notes || '',
      status: entry.status || 'pending',
    });
    setEditing(entry);
    setModalOpen(true);
  }
  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const computedHours = computeHours(form.startTime, form.endTime, Number(form.breakMinutes));

  async function handleSave() {
    if (!form.employeeId || !form.date) return;
    const payload = { ...form, breakMinutes: Number(form.breakMinutes) || 0, hours: computedHours };
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data: payload });
    else await createMutation.mutateAsync(payload);
    setModalOpen(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    await deleteMutation.mutateAsync(confirmDelete.id);
    setConfirmDelete(null);
    setModalOpen(false);
  }

  async function toggleApprove(entry) {
    await updateMutation.mutateAsync({
      id: entry.id,
      data: { status: entry.status === 'approved' ? 'pending' : 'approved' },
    });
  }

  async function approveAllPending() {
    const pending = weekEntries.filter(t => t.status === 'pending');
    await Promise.all(pending.map(t => updateMutation.mutateAsync({ id: t.id, data: { status: 'approved' } })));
  }

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-6xl">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A18]">Time Sheet</h1>
            <p className="text-xs text-[#9E9E98] mt-0.5">
              {grandTotal.toFixed(1)}h this week
              {pendingCount > 0 && <span className="ml-2 text-[#D97706]">· {pendingCount} pending</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && pendingCount > 0 && (
            <Button variant="secondary" onClick={approveAllPending}>✓ Approve All</Button>
          )}
          <Button variant="primary" onClick={() => openCreate()}>+ Log Time</Button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={employeeFilter}
          onChange={e => setEmployeeFilter(e.target.value)}
          aria-label="Filter by employee"
          className="px-3 py-2 rounded-xl border border-[#E0DED8] bg-white text-sm font-medium text-[#1A1A18] cursor-pointer focus:outline-none focus:border-[#E8611A]"
        >
          <option value="all">All team members</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <div className="flex gap-1 bg-[#F5F4F0] p-1 rounded-xl" role="tablist">
          {STATUS_FILTERS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              role="tab"
              aria-selected={statusFilter === s.value}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s.value ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-[#9E9E98]'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => shiftWeek(-1)} aria-label="Previous week" className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0]">‹</button>
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-[#1A1A18] text-sm">{weekLabel}</h2>
          {!isThisWeek && (
            <button onClick={goThisWeek} className="text-xs text-[#E8611A] font-medium hover:underline">This week</button>
          )}
        </div>
        <button onClick={() => shiftWeek(1)} aria-label="Next week" className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0]">›</button>
      </div>

      {entriesQuery.isLoading ? (
        <ListSkeleton rows={4} />
      ) : entriesQuery.error ? (
        <ErrorState message={entriesQuery.error.message} onRetry={() => entriesQuery.refetch()} />
      ) : visibleEmployees.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-sm text-[#6B6B66]">No team members to show.</p></Card>
      ) : (
        <Card className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid border-b border-[#E0DED8]" style={GRID}>
              <div className="px-3 py-2 text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide">Team Member</div>
              {weekDays.map(d => (
                <div key={d.str} className={`px-2 py-2 text-center border-l border-[#E0DED8] ${d.str === today ? 'bg-[#FDF0E8]' : ''}`}>
                  <p className="text-[10px] font-semibold text-[#9E9E98] uppercase">{d.label}</p>
                  <p className={`text-sm font-bold ${d.str === today ? 'text-[#E8611A]' : 'text-[#1A1A18]'}`}>{d.num}</p>
                </div>
              ))}
              <div className="px-2 py-2 text-center border-l border-[#E0DED8] text-[10px] font-bold text-[#6B6B66] uppercase">Total</div>
            </div>

            {visibleEmployees.map(emp => (
              <div key={emp.id} className="grid border-b border-[#E0DED8] last:border-b-0 hover:bg-[#F9F8F5]" style={GRID}>
                <div className="px-3 py-2 flex items-center gap-2 min-w-0">
                  <Avatar name={emp.name} color={emp.color} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1A1A18] truncate">{emp.name}</p>
                    <p className="text-[10px] text-[#9E9E98] truncate">{emp.role}</p>
                  </div>
                </div>
                {weekDays.map(d => {
                  const dayEntries = entriesFor(emp.id, d.str);
                  const dayHours = dayEntries.reduce((sum, t) => sum + (t.hours || 0), 0);
                  const anyPending = dayEntries.some(t => t.status === 'pending');
                  return (
                    <button
                      key={d.str}
                      onClick={() => dayEntries.length > 0 ? openEdit(dayEntries[0]) : openCreate(emp.id, d.str)}
                      className={`border-l border-[#E0DED8] p-2 text-center min-h-[52px] transition-colors hover:bg-[#F5F4F0] ${d.str === today ? 'bg-[#FDF0E8]/40' : ''}`}
                    >
                      {dayEntries.length === 0 ? (
                        <span className="text-[#E0DED8] text-base">+</span>
                      ) : (
                        <>
                          <p className={`text-sm font-bold ${anyPending ? 'text-[#D97706]' : 'text-[#059669]'}`}>{dayHours.toFixed(1)}h</p>
                          {dayEntries.length > 1 && <p className="text-[9px] text-[#9E9E98]">{dayEntries.length} entries</p>}
                          {anyPending && <p className="text-[9px] text-[#D97706]">pending</p>}
                        </>
                      )}
                    </button>
                  );
                })}
                <div className="border-l border-[#E0DED8] px-2 py-2 text-center flex items-center justify-center">
                  <p className="text-sm font-bold text-[#1A1A18]">{weekTotalFor(emp.id).toFixed(1)}h</p>
                </div>
              </div>
            ))}

            <div className="grid bg-[#F9F8F5] border-t-2 border-[#E0DED8]" style={GRID}>
              <div className="px-3 py-2 text-xs font-bold text-[#1A1A18]">Daily Total</div>
              {weekDays.map(d => {
                const dayTotal = visibleEmployees.reduce((sum, e) => sum + hoursFor(e.id, d.str), 0);
                return (
                  <div key={d.str} className="border-l border-[#E0DED8] px-2 py-2 text-center">
                    <p className="text-xs font-bold text-[#6B6B66]">{dayTotal > 0 ? `${dayTotal.toFixed(1)}h` : '—'}</p>
                  </div>
                );
              })}
              <div className="border-l border-[#E0DED8] px-2 py-2 text-center">
                <p className="text-xs font-bold text-[#E8611A]">{grandTotal.toFixed(1)}h</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {weekEntries.length > 0 && (
        <section>
          <p className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide mb-2">Entries this week ({weekEntries.length})</p>
          <div className="space-y-2">
            {weekEntries
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date) || (a.startTime || '').localeCompare(b.startTime || ''))
              .map(t => (
                <EntryCard
                  key={t.id}
                  entry={t}
                  employee={employees.find(e => e.id === t.employeeId)}
                  job={jobs.find(j => j.id === t.jobId)}
                  isAdmin={isAdmin}
                  onToggleApprove={() => toggleApprove(t)}
                  onEdit={() => openEdit(t)}
                />
              ))}
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Time Entry' : 'Log Time'}>
        <div className="space-y-4">
          <Select label="Team Member *" value={form.employeeId} onChange={e => setField('employeeId', e.target.value)}>
            <option value="">Select…</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Select label="Job (optional)" value={form.jobId} onChange={e => setField('jobId', e.target.value)}>
            <option value="">No job</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.referenceNumber} · {j.contactName}</option>)}
          </Select>
          <Input label="Date *" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start" type="time" value={form.startTime} onChange={e => setField('startTime', e.target.value)} />
            <Input label="End"   type="time" value={form.endTime}   onChange={e => setField('endTime', e.target.value)} />
          </div>
          <Input label="Break (minutes)" type="number" min="0" value={form.breakMinutes} onChange={e => setField('breakMinutes', e.target.value)} />
          <div className="px-3 py-2 rounded-xl bg-[#F5F4F0] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B66]">Total hours</span>
            <span className="text-base font-bold text-[#1A1A18]">{computedHours.toFixed(2)}h</span>
          </div>
          <Input label="Notes" placeholder="What was worked on…" value={form.notes} onChange={e => setField('notes', e.target.value)} />
          {isAdmin && (
            <Select label="Status" value={form.status} onChange={e => setField('status', e.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </Select>
          )}
          <div className="flex gap-3 pt-2">
            {editing && (
              <Button variant="danger" onClick={() => setConfirmDelete(editing)} className="flex-shrink-0">🗑</Button>
            )}
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !form.employeeId || !form.date}
              className="flex-1"
            >
              {saving ? 'Saving…' : editing ? 'Save' : 'Log Time'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Delete Time Entry">
        <p className="text-sm text-[#6B6B66] mb-5">Remove this time entry? This can't be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1">
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function EntryCard({ entry, employee, job, isAdmin, onToggleApprove, onEdit }) {
  const isApproved = entry.status === 'approved';
  const dateLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString(LOCALE.date, {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        {employee && <Avatar name={employee.name} color={employee.color} size="sm" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#1A1A18]">{employee?.name || 'Unknown'}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isApproved ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FFFBEB] text-[#D97706]'}`}>
              {isApproved ? '✓ Approved' : '⏳ Pending'}
            </span>
          </div>
          <p className="text-xs text-[#9E9E98] mt-0.5">
            {dateLabel} · {entry.startTime}–{entry.endTime}
            {entry.breakMinutes ? ` · ${entry.breakMinutes}m break` : ''}
          </p>
          {job && <p className="text-xs text-[#6B6B66] mt-0.5 truncate">📋 {job.referenceNumber} · {job.contactName}</p>}
          {entry.notes && <p className="text-xs text-[#9E9E98] mt-0.5 truncate">📝 {entry.notes}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="text-sm font-bold text-[#1A1A18]">{entry.hours?.toFixed(1)}h</p>
          {isAdmin && (
            <button
              onClick={onToggleApprove}
              aria-label={isApproved ? 'Unapprove entry' : 'Approve entry'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${isApproved ? 'bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5]' : 'bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7]'}`}
            >
              {isApproved ? '↺' : '✓'}
            </button>
          )}
          <button onClick={onEdit} aria-label="Edit entry" className="w-8 h-8 rounded-lg bg-[#F5F4F0] flex items-center justify-center text-[#6B6B66] hover:bg-[#E0DED8] transition-colors text-sm">✏️</button>
        </div>
      </div>
    </Card>
  );
}
