import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs, getEmployees } from '../db';
import { StatusBadge, Card } from '../components/ui';
import { formatDate, JOB_STATUSES } from '../utils/constants';

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getJobs(), getEmployees()]).then(([j, e]) => { setJobs(j); setEmployees(e); });
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = jobs.filter(j => j.startDate >= today && j.status !== 'done').slice(0, 5);
  const counts = JOB_STATUSES.map(s => ({ ...s, count: jobs.filter(j => j.status === s.value).length }));
  const activeCount = jobs.filter(j => !['done'].includes(j.status)).length;

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A18]">Good morning 👋</h1>
        <p className="text-sm text-[#9E9E98] mt-0.5">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Jobs', value: jobs.length, icon: '📋', accent: '#E8611A' },
          { label: 'Active Jobs', value: activeCount, icon: '🔧', accent: '#6366F1' },
          { label: 'Team Members', value: employees.length, icon: '👥', accent: '#10B981' },
          { label: 'Completed', value: counts.find(c=>c.value==='done')?.count||0, icon: '✅', accent: '#059669' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#9E9E98] font-medium">{s.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: s.accent }}>{s.value}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Status breakdown */}
      <Card className="p-5">
        <h2 className="font-semibold text-sm text-[#1A1A18] mb-4">Job Pipeline</h2>
        <div className="flex gap-2 flex-wrap">
          {counts.map(s => (
            <button
              key={s.value}
              onClick={() => navigate('/jobs')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:shadow-sm"
              style={{ borderColor: s.color + '30', background: s.bg }}
            >
              <span className="text-xl font-bold" style={{ color: s.color }}>{s.count}</span>
              <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Upcoming jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-[#1A1A18]">Upcoming Jobs</h2>
          <button onClick={() => navigate('/jobs')} className="text-xs text-[#E8611A] font-semibold hover:underline">View all →</button>
        </div>
        <div className="space-y-2">
          {upcoming.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-[#9E9E98] text-sm">No upcoming jobs</p>
            </Card>
          )}
          {upcoming.map(job => {
            const team = employees.filter(e => job.assignedEmployees?.includes(e.id));
            return (
              <Card key={job.id} className="p-4 flex items-center gap-4" hover onClick={() => navigate(`/jobs/${job.id}`)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                  <p className="font-semibold text-sm text-[#1A1A18] truncate">{job.title}</p>
                  <p className="text-xs text-[#9E9E98] mt-0.5">{formatDate(job.startDate)} · {job.address}</p>
                </div>
                <div className="flex -space-x-2 flex-shrink-0">
                  {team.slice(0,3).map(e => (
                    <div key={e.id} style={{ background: e.color }} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">{e.avatar}</div>
                  ))}
                  {team.length > 3 && <div className="w-7 h-7 rounded-full border-2 border-white bg-[#E0DED8] flex items-center justify-center text-[10px] font-semibold text-[#6B6B66]">+{team.length-3}</div>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
