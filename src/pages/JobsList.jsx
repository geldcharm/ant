import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs, getEmployees } from '../db';
import { StatusBadge, Card, Button, EmptyState } from '../components/ui';
import { formatDate, JOB_STATUSES } from '../utils/constants';

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getJobs(), getEmployees()]).then(([j, e]) => { setJobs(j); setEmployees(e); });
  }, []);

  const filtered = jobs.filter(j => {
    const matchStatus = filter === 'all' || j.status === filter;
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.address?.toLowerCase().includes(search.toLowerCase()) || j.clientName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }).sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));

  function getTeam(job) {
    return employees.filter(e => job.assignedEmployees?.includes(e.id));
  }

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A18]">Jobs</h1>
        <Button variant="primary" onClick={() => navigate('/jobs/new')}>+ New Job</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]">🔍</span>
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A] focus:ring-2 focus:ring-[#E8611A]/10 transition-all"
          placeholder="Search jobs, addresses, clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${filter === 'all' ? 'bg-[#1A1A18] text-white border-[#1A1A18]' : 'bg-white text-[#6B6B66] border-[#E0DED8] hover:border-[#1A1A18]/30'}`}
        >
          All ({jobs.length})
        </button>
        {JOB_STATUSES.map(s => {
          const count = jobs.filter(j => j.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all"
              style={filter === s.value
                ? { background: s.color, color: '#fff', borderColor: s.color }
                : { background: s.bg, color: s.color, borderColor: s.color + '30' }}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No jobs found"
          subtitle={search ? 'Try a different search term' : 'Create your first job to get started'}
          action={!search && <Button variant="primary" onClick={() => navigate('/jobs/new')}>+ New Job</Button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(job => {
            const team = getTeam(job);
            return (
              <Card
                key={job.id}
                hover
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StatusBadge status={job.status} size="sm" />
                      {job.startDate && (
                        <span className="text-xs text-[#9E9E98] mono">{formatDate(job.startDate)}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[#1A1A18] text-sm">{job.title}</h3>
                    {job.address && <p className="text-xs text-[#9E9E98] mt-0.5 truncate">📍 {job.address}</p>}
                    {job.clientName && <p className="text-xs text-[#9E9E98] truncate">👤 {job.clientName}</p>}
                    {job.description && (
                      <p className="text-xs text-[#9E9E98] mt-1 line-clamp-2">{job.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {/* Team avatars */}
                    {team.length > 0 && (
                      <div className="flex -space-x-1.5">
                        {team.slice(0,4).map(e => (
                          <div key={e.id} style={{ background: e.color }} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold" title={e.name}>
                            {e.avatar}
                          </div>
                        ))}
                        {team.length > 4 && (
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-[#E0DED8] flex items-center justify-center text-[9px] font-semibold text-[#6B6B66]">+{team.length-4}</div>
                        )}
                      </div>
                    )}
                    {/* Attachment counts */}
                    <div className="flex gap-1.5">
                      {(job.photos?.length > 0) && <span className="text-[10px] bg-[#F5F4F0] px-1.5 py-0.5 rounded-md text-[#6B6B66]">📷 {job.photos.length}</span>}
                      {(job.documents?.length > 0) && <span className="text-[10px] bg-[#F5F4F0] px-1.5 py-0.5 rounded-md text-[#6B6B66]">📄 {job.documents.length}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
