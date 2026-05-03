import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, Card, BackButton, Modal } from '../components/ui';
import { useJobs } from '../hooks/useJobs';
import { useEmployees } from '../hooks/useEmployees';
import { useRole } from '../auth/RoleContext';
import { JOB_STATUSES, getJobStatus } from '../constants/statuses';
import {
  daysInMonth,
  firstDayOfMonthMondayIndex,
  makeISODate,
  todayISO,
  WEEKDAYS_SHORT_MON,
  MONTHS_LONG,
  startOfWeekMonday,
  toISODate,
  addDays,
} from '../lib/dates';
import { LOCALE } from '../config/business';
import { jobRunsOn } from '../features/jobs/jobConflicts';

const PRIORITY_STATUS_FILTERS = [
  { value: 'all',     label: 'All',         color: '#1A1A18', bg: '#F5F4F0' },
  ...JOB_STATUSES.filter(s => ['new', 'visit', 'approve'].includes(s.value)),
];

export default function Calendar() {
  const navigate = useNavigate();
  const jobsQuery = useJobs();
  const employeesQuery = useEmployees();
  const { isAdmin } = useRole();

  const [view, setView] = useState('month');
  const [today] = useState(new Date());
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [crewFilter, setCrewFilter] = useState([]);
  const [crewOpen, setCrewOpen] = useState(false);

  const jobs = jobsQuery.data || [];
  const employees = employeesQuery.data || [];

  const filterJobs = useMemo(() => {
    return list => list.filter(j =>
      (statusFilter === 'all' || j.status === statusFilter) &&
      (crewFilter.length === 0 || crewFilter.some(id => (j.assignedEmployees || []).includes(id)))
    );
  }, [statusFilter, crewFilter]);

  function jobsForDate(dateStr) {
    return filterJobs(jobs.filter(j => jobRunsOn(j, dateStr)));
  }

  function shiftSelected(days) {
    if (!selected) return;
    const next = addDays(new Date(selected + 'T12:00:00'), days);
    setSelected(toISODate(next));
    setCurrent({ year: next.getFullYear(), month: next.getMonth() });
  }

  const { year, month } = current;
  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonthMondayIndex(year, month);
  const today_iso = todayISO();

  const weekStart = useMemo(() => {
    const start = startOfWeekMonday(new Date());
    start.setDate(start.getDate() + weekOffset * 7);
    return start;
  }, [weekOffset]);

  const weekEnd = addDays(weekStart, 6);
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${MONTHS_LONG[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${MONTHS_LONG[weekStart.getMonth()]} – ${MONTHS_LONG[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { date: d, str: toISODate(d), label: WEEKDAYS_SHORT_MON[i], num: d.getDate() };
  }), [weekStart]);

  const selectedJobs = selected ? jobsForDate(selected) : [];
  const selectedCrewMembers = employees.filter(e => crewFilter.includes(e.id));
  const totalFiltered = filterJobs(jobs).length;

  function prevMonth() {
    setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  }
  function nextMonth() {
    setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });
  }

  return (
    <div className="p-5 md:p-8 space-y-4 max-w-5xl">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A18]">Calendar</h1>
            <p className="text-xs text-[#9E9E98] mt-0.5">{totalFiltered} job{totalFiltered === 1 ? '' : 's'} shown</p>
          </div>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <StatusPills filters={PRIORITY_STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        <CrewFilter
          employees={employees}
          selected={crewFilter}
          selectedMembers={selectedCrewMembers}
          open={crewOpen}
          onToggle={() => setCrewOpen(o => !o)}
          onChange={setCrewFilter}
          onClose={() => setCrewOpen(false)}
        />
      </div>

      {(statusFilter !== 'all' || crewFilter.length > 0) && (
        <ActiveFilters
          statusFilter={statusFilter}
          onClearStatus={() => setStatusFilter('all')}
          selectedMembers={selectedCrewMembers}
          onRemoveMember={id => setCrewFilter(prev => prev.filter(x => x !== id))}
          onClearAll={() => { setStatusFilter('all'); setCrewFilter([]); }}
        />
      )}

      {view === 'month' && (
        <>
          <MonthNav month={month} year={year} onPrev={prevMonth} onNext={nextMonth} />
          <MonthGrid
            year={year}
            month={month}
            totalDays={totalDays}
            firstDay={firstDay}
            todayIso={today_iso}
            selected={selected}
            onSelect={ds => setSelected(prev => prev === ds ? null : ds)}
            jobsForDate={jobsForDate}
            crewFilter={crewFilter}
            selectedCrewMembers={selectedCrewMembers}
          />
        </>
      )}

      {view === 'week' && (
        <>
          <WeekNav label={weekLabel} weekOffset={weekOffset} onPrev={() => setWeekOffset(o => o - 1)} onNext={() => setWeekOffset(o => o + 1)} onToday={() => setWeekOffset(0)} />
          <WeekGrid
            weekDays={weekDays}
            todayIso={today_iso}
            selected={selected}
            onSelect={ds => setSelected(prev => prev === ds ? null : ds)}
            jobsForDate={jobsForDate}
            employees={employees}
            crewFilter={crewFilter}
            navigate={navigate}
          />
        </>
      )}

      <SelectedDayModal
        open={Boolean(selected)}
        selected={selected}
        onClose={() => setSelected(null)}
        selectedJobs={selectedJobs}
        employees={employees}
        crewFilter={crewFilter}
        isAdmin={isAdmin}
        onPrev={() => shiftSelected(-1)}
        onNext={() => shiftSelected(1)}
        onAddJob={() => navigate('/jobs/new', { state: { startDate: selected } })}
        onClearFilters={() => { setStatusFilter('all'); setCrewFilter([]); }}
        navigate={navigate}
      />
    </div>
  );
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="flex gap-1 bg-[#F5F4F0] p-1 rounded-xl" role="tablist">
      {['month', 'week'].map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          role="tab"
          aria-selected={view === v}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${view === v ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-[#9E9E98]'}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function StatusPills({ filters, value, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1">
      {filters.map(s => {
        const isActive = value === s.value;
        return (
          <button
            key={s.value}
            onClick={() => onChange(s.value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0"
            style={isActive
              ? { background: s.color, color: '#fff', borderColor: s.color, boxShadow: `0 2px 8px ${s.color}40` }
              : { background: s.bg, color: s.color, borderColor: s.color + '30' }}
          >
            {s.value !== 'all' && (
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: isActive ? '#fff' : s.color }} />
            )}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function CrewFilter({ employees, selected, selectedMembers, open, onToggle, onChange, onClose }) {
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
          selected.length > 0
            ? 'bg-[#1A1A18] text-white border-[#1A1A18]'
            : 'bg-white text-[#6B6B66] border-[#E0DED8] hover:border-[#1A1A18]/30'
        }`}
      >
        {selected.length === 0 ? (
          <>
            <span className="text-sm" aria-hidden="true">👥</span>
            All Crew
          </>
        ) : (
          <>
            <div className="flex -space-x-1">
              {selectedMembers.slice(0, 3).map(e => (
                <span key={e.id} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 border border-[#1A1A18]" style={{ background: e.color }}>
                  {e.avatar?.[0]}
                </span>
              ))}
            </div>
            {selected.length === 1 ? selectedMembers[0]?.name.split(' ')[0] : `${selected.length} selected`}
          </>
        )}
        <span className={`ml-1 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E0DED8] rounded-2xl shadow-xl z-20 min-w-[200px] overflow-hidden">
            <button
              onClick={() => { onChange([]); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[#F5F4F0] transition-colors border-b border-[#E0DED8] ${selected.length === 0 ? 'bg-[#F5F4F0] font-semibold' : ''}`}
            >
              <span className="w-7 h-7 rounded-full bg-[#F5F4F0] flex items-center justify-center text-base" aria-hidden="true">👥</span>
              <span className="text-[#1A1A18] font-medium">All Crew</span>
              {selected.length === 0 && <span className="ml-auto text-[#E8611A] text-xs">✓</span>}
            </button>
            {employees.map(emp => {
              const isSelected = selected.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  onClick={() => onChange(isSelected ? selected.filter(id => id !== emp.id) : [...selected, emp.id])}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[#F5F4F0] transition-colors ${isSelected ? 'bg-[#FDF0E8]' : ''}`}
                >
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: emp.color }}>
                    {emp.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isSelected ? 'text-[#E8611A]' : 'text-[#1A1A18]'}`}>{emp.name}</p>
                    <p className="text-[10px] text-[#9E9E98]">{emp.role}</p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? 'border-[#E8611A] bg-[#E8611A]' : 'border-[#E0DED8]'}`}>
                    {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ActiveFilters({ statusFilter, onClearStatus, selectedMembers, onRemoveMember, onClearAll }) {
  const status = PRIORITY_STATUS_FILTERS.find(s => s.value === statusFilter);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-[#9E9E98]">Filtering:</span>
      {statusFilter !== 'all' && status && (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: status.bg, color: status.color }}>
          {status.label}
          <button onClick={onClearStatus} aria-label="Clear status filter" className="opacity-60 hover:opacity-100">✕</button>
        </span>
      )}
      {selectedMembers.map(emp => (
        <span key={emp.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1A1A18]/8 text-[#1A1A18]">
          <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: emp.color }} />
          {emp.name}
          <button onClick={() => onRemoveMember(emp.id)} aria-label={`Remove ${emp.name}`} className="opacity-60 hover:opacity-100">✕</button>
        </span>
      ))}
      <button onClick={onClearAll} className="text-xs text-[#E8611A] font-medium hover:underline">Clear all</button>
    </div>
  );
}

function MonthNav({ month, year, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onPrev} aria-label="Previous month" className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors">‹</button>
      <h2 className="font-semibold text-[#1A1A18]">{MONTHS_LONG[month]} {year}</h2>
      <button onClick={onNext} aria-label="Next month" className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors">›</button>
    </div>
  );
}

function MonthGrid({ year, month, totalDays, firstDay, todayIso, selected, onSelect, jobsForDate, crewFilter, selectedCrewMembers }) {
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[#E0DED8]">
        {WEEKDAYS_SHORT_MON.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-[#9E9E98]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="border-b border-r border-[#E0DED8] min-h-[72px] bg-[#F9F8F5]" />
        ))}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const ds = makeISODate(year, month, day);
          const dayJobs = jobsForDate(ds);
          const isToday = ds === todayIso;
          const isSelected = ds === selected;
          const isLastCol = (day + firstDay - 1) % 7 === 6;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(ds)}
              aria-label={`${ds}, ${dayJobs.length} jobs`}
              className={`border-b border-[#E0DED8] min-h-[72px] p-1.5 text-left cursor-pointer transition-colors ${isLastCol ? '' : 'border-r'} ${isSelected ? 'bg-[#FDF0E8]' : 'hover:bg-[#F9F8F5]'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${isToday ? 'bg-[#E8611A] text-white' : 'text-[#6B6B66]'}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayJobs.slice(0, 2).map(j => {
                  const st = getJobStatus(j.status);
                  return (
                    <div
                      key={j.id}
                      className="truncate text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {crewFilter.length === 1 && selectedCrewMembers[0] && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedCrewMembers[0].color }} />
                      )}
                      <span className="truncate">{j.contactName}{j.referenceNumber ? ` · ${j.referenceNumber}` : ''}</span>
                    </div>
                  );
                })}
                {dayJobs.length > 2 && <div className="text-[9px] text-[#9E9E98] pl-1">+{dayJobs.length - 2} more</div>}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function WeekNav({ label, weekOffset, onPrev, onNext, onToday }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onPrev} aria-label="Previous week" className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors">‹</button>
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-[#1A1A18]">{label}</h2>
        {weekOffset !== 0 && (
          <button onClick={onToday} className="text-xs text-[#E8611A] font-medium hover:underline">Today</button>
        )}
      </div>
      <button onClick={onNext} aria-label="Next week" className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors">›</button>
    </div>
  );
}

function WeekGrid({ weekDays, todayIso, selected, onSelect, jobsForDate, employees, crewFilter, navigate }) {
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[#E0DED8]">
        {weekDays.map(d => {
          const isToday = d.str === todayIso;
          const isSelected = d.str === selected;
          const count = jobsForDate(d.str).length;
          return (
            <button
              key={d.str}
              onClick={() => onSelect(d.str)}
              className={`p-2 text-center border-r border-[#E0DED8] last:border-r-0 cursor-pointer transition-colors ${isSelected ? 'bg-[#FDF0E8]' : 'hover:bg-[#F9F8F5]'}`}
            >
              <p className="text-xs text-[#9E9E98]">{d.label}</p>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto mt-1 ${isToday ? 'bg-[#E8611A] text-white' : 'text-[#1A1A18]'}`}>
                {d.num}
              </div>
              {count > 0 && <div className="w-1 h-1 rounded-full bg-[#E8611A] mx-auto mt-1" />}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[220px]">
        {weekDays.map(d => {
          const dayJobs = jobsForDate(d.str);
          return (
            <div key={d.str} className="p-1.5 border-r border-[#E0DED8] last:border-r-0">
              {dayJobs.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-1 h-8 rounded-full bg-[#F0EFEB]" />
                </div>
              ) : (
                dayJobs.map(j => {
                  const st = getJobStatus(j.status);
                  const team = employees.filter(e => j.assignedEmployees?.includes(e.id));
                  return (
                    <div
                      key={j.id}
                      onClick={() => navigate(`/jobs/${j.id}`)}
                      className="mb-1.5 p-2 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ background: st.bg, borderLeft: `3px solid ${st.color}` }}
                    >
                      <p className="text-[10px] font-bold truncate" style={{ color: st.color }}>
                        {j.contactName}{j.referenceNumber ? ` · ${j.referenceNumber}` : ''}
                      </p>
                      {j.startTime && <p className="text-[9px] text-[#9E9E98] font-mono mt-0.5">{j.startTime}</p>}
                      {team.length > 0 && (
                        <div className="flex -space-x-1 mt-1.5">
                          {team.slice(0, 3).map(e => (
                            <div
                              key={e.id}
                              style={{ background: e.color, outline: crewFilter.includes(e.id) ? `2px solid ${e.color}` : 'none', outlineOffset: '1px' }}
                              className="w-4 h-4 rounded-full border border-white text-[7px] font-bold text-white flex items-center justify-center"
                              title={e.name}
                            >
                              {e.avatar?.[0]}
                            </div>
                          ))}
                          {team.length > 3 && (
                            <div className="w-4 h-4 rounded-full border border-white bg-[#E0DED8] flex items-center justify-center text-[7px] text-[#6B6B66]">
                              +{team.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SelectedDayModal({ open, selected, onClose, selectedJobs, employees, crewFilter, isAdmin, onPrev, onNext, onAddJob, onClearFilters, navigate }) {
  const title = selected
    ? new Date(selected + 'T12:00:00').toLocaleDateString(LOCALE.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  if (!selected) return <Modal open={open} onClose={onClose} title="" />;

  const workingIds = new Set(selectedJobs.flatMap(j => j.assignedEmployees || []));
  const working = employees.filter(e => workingIds.has(e.id));

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onPrev} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F5F4F0] text-xs font-semibold text-[#6B6B66] hover:bg-[#E0DED8] transition-colors">‹ Prev day</button>
          <span className="text-xs text-[#9E9E98]">{selectedJobs.length} job{selectedJobs.length === 1 ? '' : 's'}</span>
          <button onClick={onNext} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F5F4F0] text-xs font-semibold text-[#6B6B66] hover:bg-[#E0DED8] transition-colors">Next day ›</button>
        </div>

        {isAdmin && (
          <button
            onClick={onAddJob}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#E8611A] text-white text-sm font-semibold hover:bg-[#C44E10] transition-colors shadow-sm"
          >
            + Add Job on this day
          </button>
        )}

        {working.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide mb-1.5">Working this day</p>
            <div className="flex flex-wrap gap-1.5">
              {working.map(e => (
                <span key={e.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#E0DED8] bg-white text-xs font-medium text-[#1A1A18]">
                  <span style={{ background: e.color }} className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {e.avatar?.[0]}
                  </span>
                  {e.name.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedJobs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-[#9E9E98] text-sm">No jobs on this day</p>
            <button onClick={onClearFilters} className="text-xs text-[#E8611A] font-medium mt-1 hover:underline">Clear filters</button>
          </Card>
        ) : (
          <div>
            <p className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide mb-1.5">Jobs</p>
            <div className="space-y-2">
              {selectedJobs.map(job => (
                <SelectedJobCard
                  key={job.id}
                  job={job}
                  employees={employees}
                  crewFilter={crewFilter}
                  onClick={() => { onClose(); navigate(`/jobs/${job.id}`); }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function SelectedJobCard({ job, employees, crewFilter, onClick }) {
  const team = employees.filter(e => job.assignedEmployees?.includes(e.id));
  const st = getJobStatus(job.status);
  return (
    <Card hover onClick={onClick} className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: st.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={job.status} size="sm" />
            {job.startTime && <span className="text-xs text-[#9E9E98] font-mono">{job.startTime}{job.endTime ? `–${job.endTime}` : ''}</span>}
          </div>
          <p className="font-semibold text-sm text-[#1A1A18]">
            {job.contactName}{job.referenceNumber ? ` · ${job.referenceNumber}` : ''}
          </p>
          {job.address && <p className="text-xs text-[#9E9E98] mt-0.5">📍 {job.address}</p>}
          {job.description && <p className="text-xs text-[#9E9E98] mt-1 line-clamp-2">{job.description}</p>}
        </div>
        <div className="flex -space-x-1.5 flex-shrink-0">
          {team.slice(0, 3).map(e => (
            <div
              key={e.id}
              style={{ background: e.color, outline: crewFilter.includes(e.id) ? `2px solid ${e.color}` : 'none', outlineOffset: '1px' }}
              className="w-7 h-7 rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center"
              title={e.name}
            >
              {e.avatar}
            </div>
          ))}
          {team.length > 3 && (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-[#E0DED8] flex items-center justify-center text-[9px] font-semibold text-[#6B6B66]">
              +{team.length - 3}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
