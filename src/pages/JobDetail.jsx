import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  StatusBadge,
  Card,
  Button,
  Avatar,
  Modal,
  ListSkeleton,
  ErrorState,
} from '../components/ui';
import { useJob, useUpdateJob, useDeleteJob } from '../hooks/useJobs';
import { useEmployees } from '../hooks/useEmployees';
import { useQuotes } from '../hooks/useQuotes';
import { useRole } from '../auth/RoleContext';
import { JOB_STATUSES, getJobStatus } from '../constants/statuses';
import { formatDate } from '../lib/dates';
import { exportJobReport } from '../lib/pdf';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useRole();

  const jobQuery = useJob(id);
  const employeesQuery = useEmployees();
  const quotesQuery = useQuotes();
  const updateMutation = useUpdateJob();
  const deleteMutation = useDeleteJob();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportError, setExportError] = useState(null);

  if (jobQuery.isLoading) return <div className="p-5 md:p-8 max-w-3xl"><ListSkeleton rows={4} /></div>;
  if (jobQuery.error) {
    return (
      <div className="p-5 md:p-8 max-w-3xl">
        <ErrorState message={jobQuery.error.message} onRetry={() => jobQuery.refetch()} />
      </div>
    );
  }
  const job = jobQuery.data;
  if (!job) {
    navigate('/jobs', { replace: true });
    return null;
  }

  const employees = employeesQuery.data || [];
  const quotes = quotesQuery.data || [];
  const team = employees.filter(e => job.assignedEmployees?.includes(e.id));
  const status = getJobStatus(job.status);
  const linkedQuote = quotes.find(q => q.jobId === id) || null;

  function handleStatusChange(newStatus) {
    updateMutation.mutate({ id, data: { status: newStatus } });
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(id);
    navigate('/jobs');
  }

  function handleExport() {
    setExportError(null);
    try { exportJobReport(job, employees); } catch (err) { setExportError(err.message); }
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl space-y-5">
      <header className="flex items-start gap-3">
        <button
          onClick={() => navigate('/jobs')}
          aria-label="Back to jobs"
          className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors mt-0.5"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <StatusBadge status={job.status} />
          <h1 className="text-xl font-bold text-[#1A1A18] mt-1">
            {job.contactName}{job.referenceNumber ? ` · ${job.referenceNumber}` : ''}
          </h1>
          <p className="text-sm text-[#9E9E98]">📍 {job.address}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" onClick={handleExport}>📄 PDF</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/jobs/${id}/edit`)}>✏️ Edit</Button>
          </div>
        )}
      </header>

      {exportError && <p className="text-sm text-red-500" role="alert">{exportError}</p>}

      <Card className="p-4">
        <h2 className="font-semibold text-sm text-[#1A1A18] mb-3">Job Status</h2>
        {isAdmin ? (
          <select
            value={job.status}
            onChange={e => handleStatusChange(e.target.value)}
            aria-label="Job status"
            className="w-full px-4 py-3 rounded-xl border border-[#E0DED8] bg-white text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E8611A]/30"
            style={{ color: status.color }}
          >
            {JOB_STATUSES.map(s => (
              <option key={s.value} value={s.value} style={{ color: s.color }}>{s.label}</option>
            ))}
          </select>
        ) : (
          <StatusBadge status={job.status} />
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold text-xs text-[#9E9E98] uppercase tracking-wide mb-3">Calendar</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#9E9E98]">Start</span>
              <span className="font-medium">
                {formatDate(job.startDate)}{job.startTime && <span className="text-[#9E9E98]"> {job.startTime}</span>}
              </span>
            </div>
            {job.endDate && (
              <div className="flex justify-between">
                <span className="text-[#9E9E98]">End</span>
                <span className="font-medium">
                  {formatDate(job.endDate)}{job.endTime && <span className="text-[#9E9E98]"> {job.endTime}</span>}
                </span>
              </div>
            )}
          </div>
        </Card>

        {(job.contactName || job.contactPhone || job.contactEmail) && (
          <Card className="p-4">
            <h2 className="font-semibold text-xs text-[#9E9E98] uppercase tracking-wide mb-3">Contact</h2>
            <div className="space-y-1.5 text-sm">
              {job.contactName && <p className="font-semibold text-[#1A1A18]">{job.contactName}</p>}
              {job.contactPhone && (
                <a href={`tel:${job.contactPhone}`} className="flex items-center gap-2 text-[#6B6B66] hover:text-[#E8611A]">
                  📞 {job.contactPhone}
                </a>
              )}
              {job.contactEmail && (
                <a href={`mailto:${job.contactEmail}`} className="flex items-center gap-2 text-[#6B6B66] hover:text-[#E8611A] truncate">
                  ✉️ {job.contactEmail}
                </a>
              )}
            </div>
          </Card>
        )}
      </div>

      {isAdmin && (
        linkedQuote ? (
          <Button variant="secondary" onClick={() => navigate(`/quotes/${linkedQuote.id}`)} className="w-full justify-center">
            📝 Go to Quote {linkedQuote.quoteNumber}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => navigate('/quotes/new', { state: { fromJobId: job.id } })}
            className="w-full justify-center"
          >
            📝 Create Quote from this Job
          </Button>
        )
      )}

      {job.description && (
        <Card className="p-4">
          <h2 className="font-semibold text-xs text-[#9E9E98] uppercase tracking-wide mb-2">Description</h2>
          <p className="text-sm text-[#1A1A18] leading-relaxed">{job.description}</p>
        </Card>
      )}

      {job.notes && (
        <Card className="p-4 border-l-4 border-l-amber-400">
          <h2 className="font-semibold text-xs text-[#9E9E98] uppercase tracking-wide mb-2">⚠️ Notes</h2>
          <p className="text-sm text-[#1A1A18]">{job.notes}</p>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="font-semibold text-xs text-[#9E9E98] uppercase tracking-wide mb-3">Team ({team.length})</h2>
        {team.length === 0 ? (
          <p className="text-sm text-[#9E9E98]">
            No team assigned yet.
            {isAdmin && <> <button onClick={() => navigate(`/jobs/${id}/edit`)} className="text-[#E8611A] font-medium">Edit job</button></>}
          </p>
        ) : (
          <div className="space-y-2">
            {team.map(emp => (
              <div key={emp.id} className="flex items-center gap-3">
                <Avatar name={emp.name} color={emp.color} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1A1A18]">{emp.name}</p>
                  <p className="text-xs text-[#9E9E98]">{emp.role}</p>
                </div>
                <a href={`tel:${emp.phone}`} className="text-xs text-[#E8611A] font-medium">📞 Call</a>
              </div>
            ))}
          </div>
        )}
      </Card>

      {job.photos?.length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold text-xs text-[#9E9E98] uppercase tracking-wide mb-3">Photos ({job.photos.length})</h2>
          <div className="grid grid-cols-3 gap-2">
            {job.photos.map(p => (
              <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-[#F5F4F0]">
                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {(job.documents?.length > 0 || job.receipts?.length > 0) && (
        <Card className="p-4">
          <h2 className="font-semibold text-xs text-[#9E9E98] uppercase tracking-wide mb-3">Documents & Receipts</h2>
          <div className="space-y-2">
            {job.documents?.map(d => (
              <a key={d.id} href={d.url} download={d.name} className="flex items-center gap-3 p-3 bg-[#F5F4F0] rounded-xl hover:bg-[#EEEDE8] transition-colors">
                <span aria-hidden="true">📄</span>
                <span className="text-sm font-medium text-[#1A1A18] flex-1 truncate">{d.name}</span>
                <span className="text-xs text-[#9E9E98]">↓</span>
              </a>
            ))}
            {job.receipts?.map(r => (
              <a key={r.id} href={r.url} download={r.name} className="flex items-center gap-3 p-3 bg-[#FFFBEB] rounded-xl hover:bg-amber-50 transition-colors">
                <span aria-hidden="true">🧾</span>
                <span className="text-sm font-medium text-[#1A1A18] flex-1 truncate">{r.name}</span>
                <span className="text-xs text-[#9E9E98]">↓</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {isAdmin && (
        <>
          <div className="pb-8">
            <Button variant="danger" onClick={() => setConfirmDelete(true)} className="w-full">🗑 Delete Job</Button>
          </div>

          <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Job">
            <p className="text-sm text-[#6B6B66] mb-5">
              Are you sure you want to delete <strong>{job.contactName}{job.referenceNumber ? ` (${job.referenceNumber})` : ''}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
