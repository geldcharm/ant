import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs, getEmployees } from '../db';
import { StatusBadge, Card } from '../components/ui';
import { getStatus, JOB_STATUSES } from '../utils/constants';
import { useRole } from '../context/RoleContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; }

// Priority statuses shown first in the filter bar
const STATUS_FILTERS = [
  { value: 'all',     label: 'All',     color: '#1A1A18', bg: '#F5F4F0' },
  { value: 'new',     label: 'New',     color: '#9E9E98', bg: '#F5F4F0' },
  { value: 'visit',   label: 'Visit',   color: '#6366F1', bg: '#EEF2FF' },
  { value: 'book',    label: 'Book',    color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'quote',   label: 'Quote',   color: '#D97706', bg: '#FFFBEB' },
  { value: 'approve', label: 'Approve', color: '#2563EB', bg: '#EFF6FF' },
  { value: 'done',    label: 'Done',    color: '#059669', bg: '#ECFDF5' },
];

export default function Calendar() {
  const [jobs, setJobs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [view, setView] = useState('month');
  const [today] = useState(new Date());
  const [current, setCurrent] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [crewFilter, setCrewFilter] = useState([]); // [] = all, or array of employee ids
  const [crewOpen, setCrewOpen] = useState(false);
  const navigate = useNavigate();
  const { role } = useRole();
  const isAdmin = role === 'admin';

  useEffect(() => {
    Promise.all([getJobs(), getEmployees()]).then(([j, e]) => { setJobs(j); setEmployees(e); });
  }, []);

  // Apply both filters
  function applyFilters(jobList) {
    return jobList.filter(j => {
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      const matchCrew = crewFilter.length === 0 || crewFilter.some(id => (j.assignedEmployees || []).includes(id));
      return matchStatus && matchCrew;
    });
  }

  function jobsForDate(dateStr) {
    const dateJobs = jobs.filter(j => {
      if (!j.startDate) return false;
      if (j.startDate === dateStr) return true;
      if (j.endDate && j.startDate <= dateStr && j.endDate >= dateStr) return true;
      return false;
    });
    return applyFilters(dateJobs);
  }

  function prevMonth() { setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }); }
  function nextMonth() { setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }); }

  const { year, month } = current;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  function makeDateStr(day) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  const selectedJobs = selected ? jobsForDate(selected) : [];

  // Week view
  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  })();
  const weekDays = Array.from({length: 7}, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    return { date: d, str: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, label: DAYS[i], num: d.getDate() };
  });

  const selectedCrewMembers = employees.filter(e => crewFilter.includes(e.id));
  const totalFiltered = applyFilters(jobs).length;

  return (
    <div className="p-5 md:p-8 space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A18]">Calendar</h1>
          <p className="text-xs text-[#9E9E98] mt-0.5">{totalFiltered} job{totalFiltered !== 1 ? 's' : ''} shown</p>
        </div>
        <div className="flex gap-1 bg-[#F5F4F0] p-1 rounded-xl">
          {['month','week'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${view===v ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-[#9E9E98]'}`}
            >{v}</button>
          ))}
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1">
          {STATUS_FILTERS.map(s => {
            const isActive = statusFilter === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
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

        {/* Crew filter dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setCrewOpen(o => !o)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
              crewFilter.length > 0
                ? 'bg-[#1A1A18] text-white border-[#1A1A18]'
                : 'bg-white text-[#6B6B66] border-[#E0DED8] hover:border-[#1A1A18]/30'
            }`}
          >
            {crewFilter.length === 0 ? (
              <>
                <span className="text-sm">👥</span>
                All Crew
              </>
            ) : (
              <>
                <div className="flex -space-x-1">
                  {selectedCrewMembers.slice(0, 3).map(e => (
                    <span
                      key={e.id}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 border border-[#1A1A18]"
                      style={{ background: e.color }}
                    >{e.avatar?.[0]}</span>
                  ))}
                </div>
                {crewFilter.length === 1 ? selectedCrewMembers[0]?.name.split(' ')[0] : `${crewFilter.length} selected`}
              </>
            )}
            <span className={`ml-1 transition-transform ${crewOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {crewOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E0DED8] rounded-2xl shadow-xl z-20 min-w-[200px] overflow-hidden">
              {/* All option */}
              <button
                onClick={() => { setCrewFilter([]); setCrewOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[#F5F4F0] transition-colors border-b border-[#E0DED8] ${crewFilter.length === 0 ? 'bg-[#F5F4F0] font-semibold' : ''}`}
              >
                <span className="w-7 h-7 rounded-full bg-[#F5F4F0] flex items-center justify-center text-base">👥</span>
                <span className="text-[#1A1A18] font-medium">All Crew</span>
                {crewFilter.length === 0 && <span className="ml-auto text-[#E8611A] text-xs">✓</span>}
              </button>

              {/* Employee options — toggle on click */}
              {employees.map(emp => {
                const isSelected = crewFilter.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    onClick={() => setCrewFilter(prev => isSelected ? prev.filter(id => id !== emp.id) : [...prev, emp.id])}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[#F5F4F0] transition-colors ${isSelected ? 'bg-[#FDF0E8]' : ''}`}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: emp.color }}
                    >{emp.avatar}</span>
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
          )}
        </div>
      </div>

      {/* Active filter pills */}
      {(statusFilter !== 'all' || crewFilter.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#9E9E98]">Filtering:</span>
          {statusFilter !== 'all' && (
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: STATUS_FILTERS.find(s=>s.value===statusFilter)?.bg, color: STATUS_FILTERS.find(s=>s.value===statusFilter)?.color }}
            >
              {STATUS_FILTERS.find(s=>s.value===statusFilter)?.label}
              <button onClick={() => setStatusFilter('all')} className="opacity-60 hover:opacity-100">✕</button>
            </span>
          )}
          {selectedCrewMembers.map(emp => (
            <span key={emp.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1A1A18]/8 text-[#1A1A18]">
              <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: emp.color }} />
              {emp.name}
              <button onClick={() => setCrewFilter(prev => prev.filter(id => id !== emp.id))} className="opacity-60 hover:opacity-100">✕</button>
            </span>
          ))}
          <button onClick={() => { setStatusFilter('all'); setCrewFilter([]); }} className="text-xs text-[#E8611A] font-medium hover:underline">Clear all</button>
        </div>
      )}

      {/* Month Nav */}
      {view === 'month' && (
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors">‹</button>
          <h2 className="font-semibold text-[#1A1A18]">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors">›</button>
        </div>
      )}

      {/* ── Month Grid ───────────────────────────── */}
      {view === 'month' && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#E0DED8]">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-[#9E9E98]">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({length: firstDay}).map((_, i) => (
              <div key={`e${i}`} className="border-b border-r border-[#E0DED8] min-h-[72px] bg-[#F9F8F5]" />
            ))}
            {Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => {
              const ds = makeDateStr(day);
              const dayJobs = jobsForDate(ds);
              const isToday = ds === todayStr;
              const isSelected = ds === selected;
              const isLastCol = (day + firstDay - 1) % 7 === 6;
              return (
                <div
                  key={day}
                  onClick={() => setSelected(isSelected ? null : ds)}
                  className={`border-b border-[#E0DED8] min-h-[72px] p-1.5 cursor-pointer transition-colors ${isLastCol ? '' : 'border-r'} ${isSelected ? 'bg-[#FDF0E8]' : 'hover:bg-[#F9F8F5]'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${isToday ? 'bg-[#E8611A] text-white' : 'text-[#6B6B66]'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayJobs.slice(0, 2).map(j => {
                      const st = getStatus(j.status);
                      // Show crew avatar dot if filtering by a specific person
                      return (
                        <div
                          key={j.id}
                          className="truncate text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {crewFilter.length > 0 && crewFilter.length === 1 && selectedCrewMembers[0] && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedCrewMembers[0].color }} />
                          )}
                          <span className="truncate">{j.contactName}{j.referenceNumber ? ` · ${j.referenceNumber}` : ''}</span>
                        </div>
                      );
                    })}
                    {dayJobs.length > 2 && (
                      <div className="text-[9px] text-[#9E9E98] pl-1">+{dayJobs.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Week View ────────────────────────────── */}
      {view === 'week' && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#E0DED8]">
            {weekDays.map(d => {
              const isToday = d.str === todayStr;
              const count = jobsForDate(d.str).length;
              return (
                <div key={d.str} className="p-2 text-center border-r border-[#E0DED8] last:border-r-0">
                  <p className="text-xs text-[#9E9E98]">{d.label}</p>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto mt-1 ${isToday ? 'bg-[#E8611A] text-white' : 'text-[#1A1A18]'}`}>{d.num}</div>
                  {count > 0 && <div className="w-1 h-1 rounded-full bg-[#E8611A] mx-auto mt-1" />}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[220px]">
            {weekDays.map(d => {
              const dayJobs = jobsForDate(d.str);
              return (
                <div key={d.str} className="p-1.5 border-r border-[#E0DED8] last:border-r-0">
                  {dayJobs.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-1 h-8 rounded-full bg-[#F0EFEB]" />
                    </div>
                  )}
                  {dayJobs.map(j => {
                    const st = getStatus(j.status);
                    const team = employees.filter(e => j.assignedEmployees?.includes(e.id));
                    return (
                      <div
                        key={j.id}
                        onClick={() => navigate(`/jobs/${j.id}`)}
                        className="mb-1.5 p-2 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ background: st.bg, borderLeft: `3px solid ${st.color}` }}
                      >
                        <p className="text-[10px] font-bold truncate" style={{ color: st.color }}>{j.contactName}{j.referenceNumber ? ` · ${j.referenceNumber}` : ''}</p>
                        {j.startTime && <p className="text-[9px] text-[#9E9E98] font-mono mt-0.5">{j.startTime}</p>}
                        {team.length > 0 && (
                          <div className="flex -space-x-1 mt-1.5">
                            {team.slice(0,3).map(e => (
                              <div
                                key={e.id}
                                style={{ background: e.color, outline: crewFilter.includes(e.id) ? `2px solid ${e.color}` : 'none', outlineOffset: '1px' }}
                                className="w-4 h-4 rounded-full border border-white text-[7px] font-bold text-white flex items-center justify-center"
                                title={e.name}
                              >{e.avatar?.[0]}</div>
                            ))}
                            {team.length > 3 && <div className="w-4 h-4 rounded-full border border-white bg-[#E0DED8] flex items-center justify-center text-[7px] text-[#6B6B66]">+{team.length-3}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Selected day panel ───────────────────── */}
      {selected && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-[#1A1A18]">
              {new Date(selected + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <button onClick={() => setSelected(null)} className="text-xs text-[#9E9E98] hover:text-[#1A1A18]">✕ Close</button>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/jobs/new', { state: { startDate: selected } })}
              className="w-full flex items-center justify-center gap-2 mb-3 px-4 py-2.5 rounded-xl bg-[#E8611A] text-white text-sm font-semibold hover:bg-[#C44E10] transition-colors shadow-sm"
            >
              + Add Job
            </button>
          )}
          {selectedJobs.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-[#9E9E98] text-sm">No matching jobs on this day</p>
              {(statusFilter !== 'all' || crewFilter.length > 0) && (
                <button onClick={() => { setStatusFilter('all'); setCrewFilter([]); }} className="text-xs text-[#E8611A] font-medium mt-1 hover:underline">Clear filters</button>
              )}
            </Card>
          ) : (
            <div className="space-y-2">
              {selectedJobs.map(job => {
                const team = employees.filter(e => job.assignedEmployees?.includes(e.id));
                const st = getStatus(job.status);
                return (
                  <Card key={job.id} hover onClick={() => navigate(`/jobs/${job.id}`)} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: st.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={job.status} size="sm" />
                          {job.startTime && <span className="text-xs text-[#9E9E98] font-mono">{job.startTime}</span>}
                        </div>
                        <p className="font-semibold text-sm text-[#1A1A18]">{job.contactName}{job.referenceNumber ? ` · ${job.referenceNumber}` : ''}</p>
                        {job.address && <p className="text-xs text-[#9E9E98] mt-0.5">📍 {job.address}</p>}
                      </div>
                      <div className="flex -space-x-1.5 flex-shrink-0">
                        {team.slice(0,3).map(e => (
                          <div
                            key={e.id}
                            style={{ background: e.color, outline: crewFilter.includes(e.id) ? `2px solid ${e.color}` : 'none', outlineOffset: '1px' }}
                            className="w-7 h-7 rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center"
                            title={e.name}
                          >{e.avatar}</div>
                        ))}
                        {team.length > 3 && <div className="w-7 h-7 rounded-full border-2 border-white bg-[#E0DED8] flex items-center justify-center text-[9px] font-semibold text-[#6B6B66]">+{team.length-3}</div>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Click outside crew dropdown */}
      {crewOpen && <div className="fixed inset-0 z-10" onClick={() => setCrewOpen(false)} />}
    </div>
  );
}
