import { useState, useEffect } from 'react';
import { getTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry, getEmployees, getJobs } from '../db';
import { BackButton, Card, Button, Input, Select, Modal, Avatar } from '../components/ui';
import { useRole } from '../context/RoleContext';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

// Monday of the current week
function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setHours(12, 0, 0, 0);
  x.setDate(diff);
  return x;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeHours(startTime, endTime, breakMinutes) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm) - (breakMinutes || 0);
  if (mins < 0) mins = 0;
  return Math.round((mins / 60) * 100) / 100;
}

export default function TimeSheet() {
  const [entries, setEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { role } = useRole();
  const isAdmin = role === 'admin';

  async function load() {
    const [t, e, j] = await Promise.all([getTimeEntries(), getEmployees(), getJobs()]);
    setEntries(t); setEmployees(e); setJobs(j); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { date: d, str: toDateStr(d), label: DAY_LABELS[i], num: d.getDate() };
  });
  const weekEnd = weekDays[6].date;
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
    : `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;

  const weekRange = { start: weekDays[0].str, end: weekDays[6].str };
  const weekEntries = entries.filter(t =>
    t.date >= weekRange.start && t.date <= weekRange.end
    && (employeeFilter === 'all' || t.employeeId === employeeFilter)
    && (statusFilter === 'all' || t.status === statusFilter)
  );

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
  const grandTotal = visibleEmployees.reduce((s, e) => s + weekTotalFor(e.id), 0);
  const pendingCount = weekEntries.filter(t => t.status === 'pending').length;

  function shiftWeek(weeks) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + weeks * 7);
    setWeekStart(d);
  }
  function goThisWeek() {
    setWeekStart(startOfWeek(new Date()));
  }

  function openCreate(empId = '', dateStr = '') {
    setForm({ ...EMPTY_ENTRY, employeeId: empId, date: dateStr || toDateStr(new Date()) });
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

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const computedHours = computeHours(form.startTime, form.endTime, Number(form.breakMinutes));

  async function handleSave() {
    if (!form.employeeId || !form.date) return;
    setSaving(true);
    const payload = { ...form, breakMinutes: Number(form.breakMinutes) || 0, hours: computedHours };
    if (editing) await updateTimeEntry(editing.id, payload);
    else await createTimeEntry(payload);
    await load();
    setSaving(false);
    setModalOpen(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    await deleteTimeEntry(confirmDelete.id);
    setConfirmDelete(null);
    setModalOpen(false);
    await load();
  }

  async function toggleApprove(entry) {
    await updateTimeEntry(entry.id, { status: entry.status === 'approved' ? 'pending' : 'approved' });
    await load();
  }

  async function approveAllPending() {
    const pending = weekEntries.filter(t => t.status === 'pending');
    for (const t of pending) await updateTimeEntry(t.id, { status: 'approved' });
    await load();
  }

  const todayStr = toDateStr(new Date());
  const isThisWeek = weekRange.start <= todayStr && todayStr <= weekRange.end;

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={employeeFilter}
          onChange={e => setEmployeeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#E0DED8] bg-white text-sm font-medium text-[#1A1A18] cursor-pointer focus:outline-none focus:border-[#E8611A]"
        >
          <option value="all">All team members</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <div className="flex gap-1 bg-[#F5F4F0] p-1 rounded-xl">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
          ].map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s.value ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-[#9E9E98]'}`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftWeek(-1)} className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0]">‹</button>
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-[#1A1A18] text-sm">{weekLabel}</h2>
          {!isThisWeek && (
            <button onClick={goThisWeek} className="text-xs text-[#E8611A] font-medium hover:underline">This week</button>
          )}
        </div>
        <button onClick={() => shiftWeek(1)} className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0]">›</button>
      </div>

      {/* Week grid */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-[#F5F4F0] animate-pulse" />
      ) : visibleEmployees.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-[#6B6B66]">No team members to show.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Header row */}
            <div className="grid border-b border-[#E0DED8]" style={{ gridTemplateColumns: '180px repeat(7, 1fr) 80px' }}>
              <div className="px-3 py-2 text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide">Team Member</div>
              {weekDays.map(d => {
                const isToday = d.str === todayStr;
                return (
                  <div key={d.str} className={`px-2 py-2 text-center border-l border-[#E0DED8] ${isToday ? 'bg-[#FDF0E8]' : ''}`}>
                    <p className="text-[10px] font-semibold text-[#9E9E98] uppercase">{d.label}</p>
                    <p className={`text-sm font-bold ${isToday ? 'text-[#E8611A]' : 'text-[#1A1A18]'}`}>{d.num}</p>
                  </div>
                );
              })}
              <div className="px-2 py-2 text-center border-l border-[#E0DED8] text-[10px] font-bold text-[#6B6B66] uppercase">Total</div>
            </div>

            {/* Employee rows */}
            {visibleEmployees.map(emp => {
              const total = weekTotalFor(emp.id);
              return (
                <div key={emp.id} className="grid border-b border-[#E0DED8] last:border-b-0 hover:bg-[#F9F8F5]" style={{ gridTemplateColumns: '180px repeat(7, 1fr) 80px' }}>
                  <div className="px-3 py-2 flex items-center gap-2 min-w-0">
                    <Avatar name={emp.name} color={emp.color} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1A1A18] truncate">{emp.name}</p>
                      <p className="text-[10px] text-[#9E9E98] truncate">{emp.role}</p>
                    </div>
                  </div>
                  {weekDays.map(d => {
                    const dayEntries = entriesFor(emp.id, d.str);
                    const dayHours = dayEntries.reduce((s, t) => s + (t.hours || 0), 0);
                    const anyPending = dayEntries.some(t => t.status === 'pending');
                    return (
                      <button
                        key={d.str}
                        onClick={() => dayEntries.length === 1 ? openEdit(dayEntries[0]) : dayEntries.length > 1 ? openEdit(dayEntries[0]) : openCreate(emp.id, d.str)}
                        className={`border-l border-[#E0DED8] p-2 text-center min-h-[52px] transition-colors hover:bg-[#F5F4F0] ${d.str === todayStr ? 'bg-[#FDF0E8]/40' : ''}`}
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
                    <p className="text-sm font-bold text-[#1A1A18]">{total.toFixed(1)}h</p>
                  </div>
                </div>
              );
            })}

            {/* Grand total */}
            <div className="grid bg-[#F9F8F5] border-t-2 border-[#E0DED8]" style={{ gridTemplateColumns: '180px repeat(7, 1fr) 80px' }}>
              <div className="px-3 py-2 text-xs font-bold text-[#1A1A18]">Daily Total</div>
              {weekDays.map(d => {
                const dayTotal = visibleEmployees.reduce((s, e) => s + hoursFor(e.id, d.str), 0);
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

      {/* Entries list for selected week */}
      {weekEntries.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide mb-2">Entries this week ({weekEntries.length})</p>
          <div className="space-y-2">
            {weekEntries
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date) || (a.startTime || '').localeCompare(b.startTime || ''))
              .map(t => {
                const emp = employees.find(e => e.id === t.employeeId);
                const job = jobs.find(j => j.id === t.jobId);
                const isApproved = t.status === 'approved';
                return (
                  <Card key={t.id} className="p-3">
                    <div className="flex items-center gap-3">
                      {emp && <Avatar name={emp.name} color={emp.color} size="sm" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#1A1A18]">{emp?.name || 'Unknown'}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isApproved ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FFFBEB] text-[#D97706]'}`}>
                            {isApproved ? '✓ Approved' : '⏳ Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-[#9E9E98] mt-0.5">
                          {new Date(t.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}{t.startTime}–{t.endTime}
                          {t.breakMinutes ? ` · ${t.breakMinutes}m break` : ''}
                        </p>
                        {job && <p className="text-xs text-[#6B6B66] mt-0.5 truncate">📋 {job.referenceNumber} · {job.contactName}</p>}
                        {t.notes && <p className="text-xs text-[#9E9E98] mt-0.5 truncate">📝 {t.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-sm font-bold text-[#1A1A18]">{t.hours?.toFixed(1)}h</p>
                        {isAdmin && (
                          <button
                            onClick={() => toggleApprove(t)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${isApproved ? 'bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5]' : 'bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7]'}`}
                            title={isApproved ? 'Unapprove' : 'Approve'}
                          >{isApproved ? '↺' : '✓'}</button>
                        )}
                        <button onClick={() => openEdit(t)} className="w-8 h-8 rounded-lg bg-[#F5F4F0] flex items-center justify-center text-[#6B6B66] hover:bg-[#E0DED8] transition-colors text-sm">✏️</button>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Time Entry' : 'Log Time'}>
        <div className="space-y-4">
          <Select label="Team Member *" value={form.employeeId} onChange={e => set('employeeId', e.target.value)}>
            <option value="">Select…</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Select label="Job (optional)" value={form.jobId} onChange={e => set('jobId', e.target.value)}>
            <option value="">No job</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.referenceNumber} · {j.contactName}</option>)}
          </Select>
          <Input label="Date *" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start" type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
            <Input label="End" type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
          </div>
          <Input label="Break (minutes)" type="number" min="0" value={form.breakMinutes} onChange={e => set('breakMinutes', e.target.value)} />
          <div className="px-3 py-2 rounded-xl bg-[#F5F4F0] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6B66]">Total hours</span>
            <span className="text-base font-bold text-[#1A1A18]">{computedHours.toFixed(2)}h</span>
          </div>
          <Input label="Notes" placeholder="What was worked on…" value={form.notes} onChange={e => set('notes', e.target.value)} />
          {isAdmin && (
            <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </Select>
          )}
          <div className="flex gap-3 pt-2">
            {editing && (
              <Button variant="danger" onClick={() => setConfirmDelete(editing)} className="flex-shrink-0">🗑</Button>
            )}
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !form.employeeId || !form.date} className="flex-1">
              {saving ? 'Saving…' : editing ? 'Save' : 'Log Time'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Delete Time Entry">
        <p className="text-sm text-[#6B6B66] mb-5">Remove this time entry? This can't be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
