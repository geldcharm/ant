import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Button,
  EmptyState,
  StatusBadge,
  SearchBar,
  StatusFilterBar,
  PageHeader,
  ListSkeleton,
  ErrorState,
} from '../components/ui';
import { useJobs } from '../hooks/useJobs';
import { useEmployees } from '../hooks/useEmployees';
import { useRole } from '../auth/RoleContext';
import { JOB_STATUSES } from '../constants/statuses';
import { MONTHS_SHORT, formatDate } from '../lib/dates';
import { EMPTY_LIST } from '../hooks/queryHelpers';

const TEAM_AVATAR_LIMIT = 4;

function makeMatcher(needle) {
  if (!needle) return () => true;
  const lower = needle.toLowerCase();
  return job =>
    job.referenceNumber?.toLowerCase().includes(lower) ||
    job.contactName?.toLowerCase().includes(lower) ||
    job.address?.toLowerCase().includes(lower);
}

export default function JobsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useRole();

  const jobsQuery = useJobs();
  const employeesQuery = useEmployees();

  const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter || 'all');
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');

  const jobs = jobsQuery.data ?? EMPTY_LIST;
  const employees = employeesQuery.data ?? EMPTY_LIST;

  const filtered = useMemo(() => {
    const match = makeMatcher(search);
    return jobs
      .filter(j =>
        (statusFilter === 'all' || j.status === statusFilter) &&
        (monthFilter === 'all' || j.startDate?.startsWith(monthFilter)) &&
        match(j)
      )
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  }, [jobs, statusFilter, monthFilter, search]);

  const counts = useMemo(() => {
    const acc = {};
    for (const s of JOB_STATUSES) {
      acc[s.value] = jobs.filter(j => j.status === s.value).length;
    }
    return acc;
  }, [jobs]);

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-4xl">
      <PageHeader
        title="Jobs"
        actions={isAdmin ? <Button variant="primary" onClick={() => navigate('/jobs/new')}>+ New Job</Button> : null}
      />

      <div className="flex gap-2">
        <SearchBar
          className="flex-1"
          value={search}
          onChange={setSearch}
          placeholder="Search jobs, addresses, clients..."
        />
        <MonthFilter value={monthFilter} onChange={setMonthFilter} />
      </div>

      <StatusFilterBar
        statuses={JOB_STATUSES}
        value={statusFilter}
        onChange={setStatusFilter}
        counts={counts}
        total={jobs.length}
      />

      {jobsQuery.isLoading ? (
        <ListSkeleton />
      ) : jobsQuery.error ? (
        <ErrorState message={jobsQuery.error.message} onRetry={() => jobsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No jobs found"
          subtitle={search ? 'Try a different search term' : 'Create your first job to get started'}
          action={!search && isAdmin && (
            <Button variant="primary" onClick={() => navigate('/jobs/new')}>+ New Job</Button>
          )}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(job => (
            <JobRow key={job.id} job={job} employees={employees} onClick={() => navigate(`/jobs/${job.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MonthFilter({ value, onChange }) {
  const year = new Date().getFullYear();
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label="Filter by month"
      className="px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm font-medium text-[#1A1A18] appearance-none cursor-pointer focus:outline-none focus:border-[#E8611A] focus:ring-2 focus:ring-[#E8611A]/10 transition-all pr-8"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239E9E98' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
    >
      <option value="all">All months</option>
      {MONTHS_SHORT.map((label, i) => {
        const monthValue = `${year}-${String(i + 1).padStart(2, '0')}`;
        return <option key={monthValue} value={monthValue}>{label} {year}</option>;
      })}
    </select>
  );
}

function JobRow({ job, employees, onClick }) {
  const team = employees.filter(e => job.assignedEmployees?.includes(e.id));
  return (
    <Card hover onClick={onClick} className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={job.status} size="sm" />
            {job.startDate && (
              <span className="text-xs text-[#9E9E98] font-mono">{formatDate(job.startDate)}</span>
            )}
          </div>
          <h3 className="font-semibold text-[#1A1A18] text-sm">
            {job.contactName}{job.referenceNumber ? ` · ${job.referenceNumber}` : ''}
          </h3>
          {job.address && (
            <p className="text-xs text-[#9E9E98] mt-0.5 truncate">📍 {job.address}</p>
          )}
          {job.description && (
            <p className="text-xs text-[#9E9E98] mt-1 line-clamp-2">{job.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {team.length > 0 && (
            <div className="flex -space-x-1.5">
              {team.slice(0, TEAM_AVATAR_LIMIT).map(e => (
                <div
                  key={e.id}
                  style={{ background: e.color }}
                  title={e.name}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold"
                >
                  {e.avatar}
                </div>
              ))}
              {team.length > TEAM_AVATAR_LIMIT && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-[#E0DED8] flex items-center justify-center text-[9px] font-semibold text-[#6B6B66]">
                  +{team.length - TEAM_AVATAR_LIMIT}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-1.5">
            {job.photos?.length > 0 && (
              <span className="text-[10px] bg-[#F5F4F0] px-1.5 py-0.5 rounded-md text-[#6B6B66]">📷 {job.photos.length}</span>
            )}
            {job.documents?.length > 0 && (
              <span className="text-[10px] bg-[#F5F4F0] px-1.5 py-0.5 rounded-md text-[#6B6B66]">📄 {job.documents.length}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
