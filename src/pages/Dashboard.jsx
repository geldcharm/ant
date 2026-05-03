import { useNavigate } from 'react-router-dom';
import { Card, BackButton, StatusBadge, ListSkeleton, ErrorState } from '../components/ui';
import { useJobs } from '../hooks/useJobs';
import { useEmployees } from '../hooks/useEmployees';
import { JOB_STATUSES } from '../constants/statuses';
import { formatDate, todayISO, MONTHS_LONG } from '../lib/dates';
import { LOCALE } from '../config/business';

const UPCOMING_LIMIT = 5;
const TEAM_AVATAR_LIMIT = 3;

export default function Dashboard() {
  const navigate = useNavigate();
  const jobsQuery = useJobs();
  const employeesQuery = useEmployees();

  if (jobsQuery.isLoading || employeesQuery.isLoading) {
    return <div className="p-5 md:p-8 max-w-5xl"><ListSkeleton rows={4} /></div>;
  }
  if (jobsQuery.error || employeesQuery.error) {
    return (
      <div className="p-5 md:p-8 max-w-5xl">
        <ErrorState
          message={(jobsQuery.error || employeesQuery.error).message}
          onRetry={() => { jobsQuery.refetch(); employeesQuery.refetch(); }}
        />
      </div>
    );
  }

  const jobs = jobsQuery.data || [];
  const employees = employeesQuery.data || [];

  const today = todayISO();
  const now = new Date();
  const upcoming = jobs
    .filter(j => j.startDate >= today && j.status !== 'done')
    .slice(0, UPCOMING_LIMIT);

  const counts = JOB_STATUSES.map(s => ({
    ...s,
    count: jobs.filter(j => j.status === s.value).length,
  }));

  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = `${MONTHS_LONG[now.getMonth()]} ${now.getFullYear()}`;
  const jobsThisMonth = jobs.filter(j => j.startDate?.startsWith(monthPrefix)).length;

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-5xl">
      <header className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A18]">Good morning 👋</h1>
          <p className="text-sm text-[#9E9E98] mt-0.5">
            {now.toLocaleDateString(LOCALE.date, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Jobs"     value={jobs.length}      icon="📋" color="#E8611A" />
        <StatCard label="Team Members"   value={employees.length} icon="👥" color="#10B981" />
        <StatCard
          label={currentMonthName}
          value={jobsThisMonth}
          icon="📅"
          color="#6366F1"
          subtitle={`job${jobsThisMonth !== 1 ? 's' : ''} this month`}
          onClick={() => navigate('/calendar')}
        />
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-sm text-[#1A1A18] mb-4">Job Pipeline</h2>
        <div className="flex gap-2 flex-wrap">
          {counts.map(s => (
            <button
              key={s.value}
              onClick={() => navigate('/jobs', { state: { statusFilter: s.value } })}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:shadow-sm"
              style={{ borderColor: s.color + '30', background: s.bg }}
            >
              <span className="text-xl font-bold" style={{ color: s.color }}>{s.count}</span>
              <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-[#1A1A18]">Upcoming Jobs</h2>
          <button
            onClick={() => navigate('/jobs')}
            className="text-xs text-[#E8611A] font-semibold hover:underline"
          >
            View all →
          </button>
        </div>
        {upcoming.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-[#9E9E98] text-sm">No upcoming jobs</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcoming.map(job => (
              <UpcomingJobCard key={job.id} job={job} employees={employees} onClick={() => navigate(`/jobs/${job.id}`)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon, color, subtitle, onClick }) {
  return (
    <Card className="p-4" onClick={onClick} hover={Boolean(onClick)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#9E9E98] font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
          {subtitle && <p className="text-[10px] text-[#9E9E98] mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-2xl" aria-hidden="true">{icon}</span>
      </div>
    </Card>
  );
}

function UpcomingJobCard({ job, employees, onClick }) {
  const team = employees.filter(e => job.assignedEmployees?.includes(e.id));
  return (
    <Card hover onClick={onClick} className="p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <StatusBadge status={job.status} size="sm" />
        </div>
        <p className="font-semibold text-sm text-[#1A1A18] truncate">
          {job.contactName}{job.referenceNumber ? ` · ${job.referenceNumber}` : ''}
        </p>
        <p className="text-xs text-[#9E9E98] mt-0.5">{formatDate(job.startDate)} · {job.address}</p>
      </div>
      <div className="flex -space-x-2 flex-shrink-0">
        {team.slice(0, TEAM_AVATAR_LIMIT).map(e => (
          <div key={e.id} style={{ background: e.color }} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">
            {e.avatar}
          </div>
        ))}
        {team.length > TEAM_AVATAR_LIMIT && (
          <div className="w-7 h-7 rounded-full border-2 border-white bg-[#E0DED8] flex items-center justify-center text-[10px] font-semibold text-[#6B6B66]">
            +{team.length - TEAM_AVATAR_LIMIT}
          </div>
        )}
      </div>
    </Card>
  );
}
