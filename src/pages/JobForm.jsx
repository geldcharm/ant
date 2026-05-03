import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button, Input, Textarea, Card, Avatar } from '../components/ui';
import {
  useJob,
  useJobs,
  useCreateJob,
  useUpdateJob,
} from '../hooks/useJobs';
import { useEmployees } from '../hooks/useEmployees';
import { nextJobReference } from '../db/jobs';
import { JOB_STATUSES, getJobStatus } from '../constants/statuses';
import { isOnRoster, formatRoster } from '../constants/roster';
import { isNonEmpty } from '../lib/validation';
import {
  daysInMonth,
  firstDayOfMonthMondayIndex,
  makeISODate,
  todayISO,
  WEEKDAYS_SHORT_MON,
  MONTHS_LONG,
} from '../lib/dates';
import { LOCALE } from '../config/business';
import { readFilesAsDataURLs } from '../lib/files';
import { jobsOnDate } from '../features/jobs/jobConflicts';
import { StepShell } from '../features/jobs/StepShell';
import { PhotoGrid, FileList } from '../features/jobs/AttachmentField';

const EMPTY = {
  jobPhone: '',
  referenceNumber: '',
  description: '',
  status: 'new',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  primaryFirstName: '',
  primaryLastName: '',
  primaryEmail: '',
  additionalPeople: [],
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  notes: '',
  assignedEmployees: [],
  photos: [],
  documents: [],
  receipts: [],
};

const STEPS = [
  { id: 'details',  icon: '📋', label: 'Contact & Job Details' },
  { id: 'photos',   icon: '📷', label: 'Photos' },
  { id: 'docs',     icon: '📁', label: 'Documents & Receipts' },
  { id: 'schedule', icon: '📅', label: 'Calendar & Team' },
];

const ATTACHMENT_FIELD_BY_KIND = {
  photo: 'photos',
  document: 'documents',
  receipt: 'receipts',
};

function validate(form) {
  const errors = {};
  if (!isNonEmpty(form.referenceNumber)) errors.referenceNumber = 'Reference number is required';
  if (!isNonEmpty(form.contactName))     errors.contactName     = 'Contact name is required';
  if (!isNonEmpty(form.address))         errors.address         = 'Job site address is required';
  if (!form.startDate)                    errors.startDate       = 'Start date is required';
  return errors;
}

function isStepComplete(stepId, form) {
  switch (stepId) {
    case 'details':  return isNonEmpty(form.address) && isNonEmpty(form.contactName);
    case 'photos':   return form.photos.length > 0;
    case 'docs':     return form.documents.length > 0 || form.receipts.length > 0;
    case 'schedule': return Boolean(form.startDate);
    default: return false;
  }
}

function summarize(stepId, form) {
  switch (stepId) {
    case 'details': {
      const parts = [form.contactName, form.address].filter(isNonEmpty);
      return parts.join(' · ') || 'Not started';
    }
    case 'photos':
      return form.photos.length
        ? `${form.photos.length} photo${form.photos.length === 1 ? '' : 's'}`
        : 'No photos';
    case 'docs': {
      const count = form.documents.length + form.receipts.length;
      return count ? `${count} file${count === 1 ? '' : 's'}` : 'No files';
    }
    case 'schedule': {
      const parts = [form.startDate || 'Not set'];
      if (form.assignedEmployees.length) parts.push(`${form.assignedEmployees.length} crew`);
      return parts.join(' · ');
    }
    default: return '';
  }
}

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const initialDate = location.state?.startDate || '';

  const jobQuery = useJob(id);
  const jobsQuery = useJobs();
  const employeesQuery = useEmployees();
  const createMutation = useCreateJob();
  const updateMutation = useUpdateJob();

  const [form, setForm] = useState(() => ({
    ...EMPTY,
    startDate: initialDate,
    referenceNumber: nextJobReference(),
  }));
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(null);
  const [calMonth, setCalMonth] = useState(() => {
    const base = initialDate ? new Date(initialDate + 'T12:00:00') : new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (isEdit && jobQuery.data) setForm({ ...EMPTY, ...jobQuery.data });
  }, [isEdit, jobQuery.data]);

  const allJobs = jobsQuery.data || [];
  const employees = employeesQuery.data || [];
  const saving = createMutation.isPending || updateMutation.isPending;

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleEmployee(eid) {
    setField(
      'assignedEmployees',
      form.assignedEmployees.includes(eid)
        ? form.assignedEmployees.filter(e => e !== eid)
        : [...form.assignedEmployees, eid]
    );
  }

  function addAttachments(kind, files) {
    const field = ATTACHMENT_FIELD_BY_KIND[kind];
    setForm(f => ({ ...f, [field]: [...(f[field] || []), ...files] }));
  }

  function removeAttachment(kind, fileId) {
    const field = ATTACHMENT_FIELD_BY_KIND[kind];
    setField(field, form[field].filter(f => f.id !== fileId));
  }

  function addAdditionalPerson() {
    setField('additionalPeople', [
      ...(form.additionalPeople || []),
      { id: uuidv4(), firstName: '', lastName: '', email: '' },
    ]);
  }
  function updateAdditionalPerson(personId, field, value) {
    setField('additionalPeople',
      form.additionalPeople.map(p => p.id === personId ? { ...p, [field]: value } : p));
  }
  function removeAdditionalPerson(personId) {
    setField('additionalPeople', form.additionalPeople.filter(p => p.id !== personId));
  }

  async function handleSave() {
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.referenceNumber) setStep(null);
      else if (validationErrors.contactName || validationErrors.address) setStep('details');
      else if (validationErrors.startDate) setStep('schedule');
      return;
    }
    setSubmitError(null);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id, data: form });
        navigate(`/jobs/${id}`);
      } else {
        const created = await createMutation.mutateAsync(form);
        navigate(`/jobs/${created.id}`, { replace: true });
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to save job');
    }
  }

  const currentStatus = getJobStatus(form.status);
  const stepIdx = step ? STEPS.findIndex(s => s.id === step) : -1;
  const prevStep = stepIdx > 0 ? STEPS[stepIdx - 1] : null;
  const nextStep = stepIdx < STEPS.length - 1 ? STEPS[stepIdx + 1] : null;

  if (step === 'details') {
    return (
      <DetailsStep
        form={form}
        errors={errors}
        setField={setField}
        addAdditionalPerson={addAdditionalPerson}
        updateAdditionalPerson={updateAdditionalPerson}
        removeAdditionalPerson={removeAdditionalPerson}
        onBack={() => setStep(null)}
        onNext={() => setStep(nextStep?.id)}
        nextLabel={nextStep?.label}
        stepIdx={stepIdx}
      />
    );
  }
  if (step === 'photos') {
    return (
      <PhotosStep
        form={form}
        addAttachments={addAttachments}
        removeAttachment={removeAttachment}
        onBack={() => setStep(null)}
        onNext={() => setStep(nextStep?.id)}
        onPrev={() => setStep(prevStep?.id)}
        prevLabel={prevStep?.label}
        nextLabel={nextStep?.label}
        stepIdx={stepIdx}
      />
    );
  }
  if (step === 'docs') {
    return (
      <DocsStep
        form={form}
        addAttachments={addAttachments}
        removeAttachment={removeAttachment}
        onBack={() => setStep(null)}
        onNext={() => setStep(nextStep?.id)}
        onPrev={() => setStep(prevStep?.id)}
        prevLabel={prevStep?.label}
        nextLabel={nextStep?.label}
        stepIdx={stepIdx}
      />
    );
  }
  if (step === 'schedule') {
    return (
      <ScheduleStep
        form={form}
        errors={errors}
        setField={setField}
        toggleEmployee={toggleEmployee}
        allJobs={allJobs}
        employees={employees}
        editingJobId={isEdit ? id : null}
        calMonth={calMonth}
        setCalMonth={setCalMonth}
        onBack={() => setStep(null)}
        onPrev={() => setStep(prevStep?.id)}
        prevLabel={prevStep?.label}
        stepIdx={stepIdx}
      />
    );
  }

  // ── Overview ────────────────────────────────────
  const completedCount = STEPS.filter(s => isStepComplete(s.id, form)).length;

  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-5 pb-12">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1A1A18]">{isEdit ? 'Edit Job' : 'New Job'}</h1>
          <p className="text-xs text-[#9E9E98] mt-0.5">{completedCount} of {STEPS.length} sections completed</p>
        </div>
      </header>

      <div className="h-1.5 bg-[#F0EFEB] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#E8611A] rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
        />
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide block mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={e => setField('status', e.target.value)}
            aria-label="Job status"
            className="w-full px-4 py-3 rounded-xl border border-[#E0DED8] bg-white text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E8611A]/30"
            style={{ color: currentStatus.color }}
          >
            {JOB_STATUSES.map(s => (
              <option key={s.value} value={s.value} style={{ color: s.color }}>{s.label}</option>
            ))}
          </select>
        </div>
        <Input
          label="Job Reference Number *"
          placeholder="e.g. JOB-0001"
          value={form.referenceNumber}
          onChange={e => setField('referenceNumber', e.target.value)}
          error={errors.referenceNumber}
        />
      </Card>

      <div className="space-y-2">
        {STEPS.map(s => {
          const done = isStepComplete(s.id, form);
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border text-left transition-all hover:shadow-sm ${
                done
                  ? 'bg-white border-[#059669]/30 hover:border-[#059669]/50'
                  : 'bg-white border-[#E0DED8] hover:border-[#E8611A]/40'
              }`}
            >
              <span className="text-lg" aria-hidden="true">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A18]">{s.label}</p>
                <p className="text-xs text-[#9E9E98] truncate mt-0.5">{summarize(s.id, form)}</p>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                done ? 'bg-[#059669] text-white' : 'bg-[#F0EFEB] text-[#9E9E98]'
              }`}>
                {done ? <span className="text-xs font-bold">✓</span> : <span className="text-xs">›</span>}
              </div>
            </button>
          );
        })}
      </div>

      {submitError && <p className="text-sm text-red-500" role="alert">{submitError}</p>}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Job'}
        </Button>
      </div>
    </div>
  );
}

function DetailsStep({ form, errors, setField, addAdditionalPerson, updateAdditionalPerson, removeAdditionalPerson, onBack, onNext, nextLabel, stepIdx }) {
  return (
    <StepShell title="Contact & Job Details" onBack={onBack} onNext={onNext} nextLabel={nextLabel} step={stepIdx + 1} total={STEPS.length}>
      <Input label="Contact Name *" placeholder="Business or person's name" value={form.contactName} onChange={e => setField('contactName', e.target.value)} error={errors.contactName} />
      <Textarea label="Job Site Address *" placeholder="123 Main St, City, State ZIP" value={form.address} onChange={e => setField('address', e.target.value)} error={errors.address} rows={3} />
      <PrimaryPersonFields form={form} setField={setField} />
      {(form.additionalPeople || []).map((p, i) => (
        <AdditionalPersonFields
          key={p.id}
          person={p}
          index={i}
          onUpdate={updateAdditionalPerson}
          onRemove={removeAdditionalPerson}
        />
      ))}
      <button
        onClick={addAdditionalPerson}
        type="button"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E0DED8] text-sm font-medium text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors"
      >
        <span className="w-5 h-5 rounded-full border-2 border-[#1A1A18] flex items-center justify-center text-xs font-bold">+</span>
        Add Additional People
      </button>
      <Input label="Business or Job Phone Number" placeholder="(555) 555-0000" type="tel" value={form.jobPhone} onChange={e => setField('jobPhone', e.target.value)} />
      <Textarea label="Description" placeholder="Describe the work to be done..." value={form.description} onChange={e => setField('description', e.target.value)} rows={4} />
      <Input label="Notes" placeholder="Gate codes, special instructions..." value={form.notes} onChange={e => setField('notes', e.target.value)} />
    </StepShell>
  );
}

function PrimaryPersonFields({ form, setField }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide block mb-2">Primary Person</label>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="First name" value={form.primaryFirstName} onChange={e => setField('primaryFirstName', e.target.value)} />
        <Input placeholder="Last name" value={form.primaryLastName} onChange={e => setField('primaryLastName', e.target.value)} />
      </div>
      <div className="mt-2">
        <Input placeholder="Email" type="email" value={form.primaryEmail} onChange={e => setField('primaryEmail', e.target.value)} />
      </div>
    </div>
  );
}

function AdditionalPersonFields({ person, index, onUpdate, onRemove }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Additional Person {index + 1}</label>
        <button onClick={() => onRemove(person.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="First name" value={person.firstName} onChange={e => onUpdate(person.id, 'firstName', e.target.value)} />
        <Input placeholder="Last name"  value={person.lastName}  onChange={e => onUpdate(person.id, 'lastName',  e.target.value)} />
      </div>
      <div className="mt-2">
        <Input placeholder="Email" type="email" value={person.email} onChange={e => onUpdate(person.id, 'email', e.target.value)} />
      </div>
    </div>
  );
}

function PhotosStep({ form, addAttachments, removeAttachment, onBack, onNext, onPrev, prevLabel, nextLabel, stepIdx }) {
  const [error, setError] = useState(null);
  return (
    <StepShell title="Photos" onBack={onBack} onNext={onNext} onPrev={onPrev} prevLabel={prevLabel} nextLabel={nextLabel} step={stepIdx + 1} total={STEPS.length}>
      <PhotoGrid
        photos={form.photos}
        onAdd={files => addAttachments('photo', files)}
        onRemove={fileId => removeAttachment('photo', fileId)}
        onError={err => setError(err.message)}
      />
      {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
    </StepShell>
  );
}

function DocsStep({ form, addAttachments, removeAttachment, onBack, onNext, onPrev, prevLabel, nextLabel, stepIdx }) {
  const docRef = useRef(null);
  const receiptRef = useRef(null);
  const [error, setError] = useState(null);

  async function handleFiles(kind, files) {
    try {
      const list = await readFilesAsDataURLs(files);
      addAttachments(kind, list);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <StepShell title="Documents & Receipts" onBack={onBack} onNext={onNext} onPrev={onPrev} prevLabel={prevLabel} nextLabel={nextLabel} step={stepIdx + 1} total={STEPS.length}>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => docRef.current?.click()}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm font-medium text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors"
        >
          📄 Add Document
        </button>
        <button
          type="button"
          onClick={() => receiptRef.current?.click()}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm font-medium text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors"
        >
          🧾 Add Receipt
        </button>
      </div>
      <input
        ref={docRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
        multiple
        className="hidden"
        onChange={e => { handleFiles('document', e.target.files); e.target.value = ''; }}
      />
      <input
        ref={receiptRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={e => { handleFiles('receipt', e.target.files); e.target.value = ''; }}
      />
      {form.documents.length === 0 && form.receipts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="w-12 h-12 rounded-xl bg-[#F5F4F0] flex items-center justify-center">
            <span className="text-2xl opacity-40" aria-hidden="true">📁</span>
          </div>
          <p className="text-sm text-[#9E9E98]">No documents yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          <FileList items={form.documents} kind="document" onRemove={id => removeAttachment('document', id)} />
          <FileList items={form.receipts} kind="receipt" onRemove={id => removeAttachment('receipt', id)} />
        </div>
      )}
      {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
    </StepShell>
  );
}

function ScheduleStep({ form, errors, setField, toggleEmployee, allJobs, employees, editingJobId, calMonth, setCalMonth, onBack, onPrev, prevLabel, stepIdx }) {
  const { year, month } = calMonth;
  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonthMondayIndex(year, month);
  const today = todayISO();

  const selectedDateJobs = form.startDate
    ? jobsOnDate(allJobs, form.startDate, editingJobId)
    : [];
  const busyIds = new Set(selectedDateJobs.flatMap(j => j.assignedEmployees || []));

  function prevMonth() {
    setCalMonth(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  }
  function nextMonth() {
    setCalMonth(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });
  }

  return (
    <StepShell title="Calendar & Team" onBack={onBack} onPrev={onPrev} prevLabel={prevLabel} step={stepIdx + 1} total={STEPS.length} isLast>
      <p className="text-sm text-[#9E9E98]">Pick a day — busy days show how many jobs are already booked.</p>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#E0DED8]">
          <button type="button" onClick={prevMonth} aria-label="Previous month" className="w-8 h-8 rounded-lg hover:bg-[#F5F4F0] text-[#6B6B66]">‹</button>
          <p className="font-semibold text-sm text-[#1A1A18]">{MONTHS_LONG[month]} {year}</p>
          <button type="button" onClick={nextMonth} aria-label="Next month" className="w-8 h-8 rounded-lg hover:bg-[#F5F4F0] text-[#6B6B66]">›</button>
        </div>
        <div className="grid grid-cols-7 border-b border-[#E0DED8]">
          {WEEKDAYS_SHORT_MON.map(d => (
            <div key={d} className="py-1.5 text-center text-[10px] font-semibold text-[#9E9E98]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-[#E0DED8] min-h-[52px] bg-[#F9F8F5]" />
          ))}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
            const ds = makeISODate(year, month, day);
            const dayJobs = jobsOnDate(allJobs, ds, editingJobId);
            const isToday = ds === today;
            const isSelected = ds === form.startDate;
            const isLastCol = (day + firstDay - 1) % 7 === 6;
            return (
              <button
                type="button"
                key={day}
                onClick={() => setField('startDate', ds)}
                aria-label={`Select ${ds}`}
                aria-pressed={isSelected}
                className={`border-b border-[#E0DED8] min-h-[52px] p-1 text-left transition-colors ${isLastCol ? '' : 'border-r'} ${isSelected ? 'bg-[#FDF0E8] ring-2 ring-[#E8611A] ring-inset' : 'hover:bg-[#F9F8F5]'}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${isToday ? 'bg-[#E8611A] text-white' : 'text-[#6B6B66]'}`}>
                  {day}
                </div>
                {dayJobs.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap">
                    {dayJobs.slice(0, 3).map(j => {
                      const st = getJobStatus(j.status);
                      return (
                        <span
                          key={j.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: st.color }}
                          title={`${j.contactName} · ${st.label}`}
                        />
                      );
                    })}
                    {dayJobs.length > 3 && (
                      <span className="text-[8px] text-[#9E9E98] leading-none">+{dayJobs.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {form.startDate && (
        <SelectedDayCard
          startDate={form.startDate}
          selectedDateJobs={selectedDateJobs}
          employees={employees}
          busyIds={busyIds}
        />
      )}

      <div>
        <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide mb-2">From</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} error={errors.startDate} />
          <Input label="Time" type="time" value={form.startTime} onChange={e => setField('startTime', e.target.value)} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide mb-2">To (optional – for multi-day jobs)</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="End date" type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
          <Input label="End time" type="time" value={form.endTime} onChange={e => setField('endTime', e.target.value)} />
        </div>
      </div>

      <div className="pt-2 border-t border-[#E0DED8]">
        <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide mb-2">Assign Team</p>
        <p className="text-xs text-[#9E9E98] mb-3">Tap crew to assign. Busy/off-roster warnings show above.</p>
        <div className="space-y-2">
          {employees.map(emp => (
            <CrewToggle
              key={emp.id}
              employee={emp}
              selected={form.assignedEmployees.includes(emp.id)}
              busy={busyIds.has(emp.id)}
              startDate={form.startDate}
              onToggle={() => toggleEmployee(emp.id)}
            />
          ))}
        </div>
      </div>
    </StepShell>
  );
}

function SelectedDayCard({ startDate, selectedDateJobs, employees, busyIds }) {
  const dayLabel = new Date(startDate + 'T12:00:00').toLocaleDateString(LOCALE.date, {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm text-[#1A1A18]">{dayLabel}</p>
        <span className="text-xs text-[#9E9E98]">
          {selectedDateJobs.length} job{selectedDateJobs.length === 1 ? '' : 's'} booked
        </span>
      </div>

      {selectedDateJobs.length > 0 && (
        <div className="space-y-1.5">
          {selectedDateJobs.map(j => {
            const st = getJobStatus(j.status);
            const team = employees.filter(e => (j.assignedEmployees || []).includes(e.id));
            return (
              <div key={j.id} className="p-2 rounded-lg border border-[#E0DED8] flex items-center gap-2">
                <span className="w-1 self-stretch rounded-full" style={{ background: st.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1A1A18] truncate">
                    {j.contactName}{j.referenceNumber ? ` · ${j.referenceNumber}` : ''}
                  </p>
                  <p className="text-[10px] text-[#9E9E98] truncate">
                    {j.startTime || '—'}{j.endTime ? `–${j.endTime}` : ''} · {st.label}
                  </p>
                </div>
                {team.length > 0 && (
                  <div className="flex -space-x-1 flex-shrink-0">
                    {team.slice(0, 3).map(e => (
                      <span
                        key={e.id}
                        title={e.name}
                        style={{ background: e.color }}
                        className="w-5 h-5 rounded-full border border-white text-[8px] font-bold text-white flex items-center justify-center"
                      >
                        {e.avatar?.[0]}
                      </span>
                    ))}
                    {team.length > 3 && (
                      <span className="w-5 h-5 rounded-full border border-white bg-[#E0DED8] text-[8px] font-semibold text-[#6B6B66] flex items-center justify-center">
                        +{team.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CrewAvailability employees={employees} startDate={startDate} busyIds={busyIds} />
    </Card>
  );
}

function CrewAvailability({ employees, startDate, busyIds }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide mb-1.5">Crew availability</p>
      <div className="flex flex-wrap gap-1.5">
        {employees.map(emp => {
          const busy = busyIds.has(emp.id);
          const offRoster = !isOnRoster(emp, startDate);
          let style = 'bg-[#ECFDF5] text-[#059669] border-[#05966930]';
          let label = '✓ Free';
          if (busy) {
            style = 'bg-[#FEF2F2] text-[#DC2626] border-[#DC262630]';
            label = '● Busy';
          } else if (offRoster) {
            style = 'bg-[#F5F4F0] text-[#9E9E98] border-[#E0DED8]';
            label = '○ Off';
          }
          return (
            <div key={emp.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium ${style}`} title={formatRoster(emp.roster)}>
              <span style={{ background: emp.color }} className="w-4 h-4 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                {emp.avatar?.[0]}
              </span>
              {emp.name.split(' ')[0]}
              <span className="opacity-70">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrewToggle({ employee, selected, busy, startDate, onToggle }) {
  const offRoster = startDate && !isOnRoster(employee, startDate);
  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      aria-pressed={selected}
      className={`p-3 rounded-xl border cursor-pointer transition-all ${selected ? 'border-[#E8611A] bg-[#FDF0E8]' : 'border-[#E0DED8] hover:border-[#E8611A]/40 hover:bg-[#F9F8F5]'}`}
    >
      <div className="flex items-center gap-3">
        <Avatar name={employee.name} color={employee.color} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1A1A18]">{employee.name}</p>
          <p className="text-xs text-[#9E9E98]">{employee.role} · {formatRoster(employee.roster)}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${selected ? 'border-[#E8611A] bg-[#E8611A]' : 'border-[#E0DED8]'}`}>
          {selected && <span className="text-white text-[10px] font-bold">✓</span>}
        </div>
      </div>
      {selected && busy && (
        <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1 mt-2">
          ● {employee.name.split(' ')[0]} is already booked on another job this day.
        </p>
      )}
      {selected && offRoster && (
        <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-2">
          ⚠️ {employee.name.split(' ')[0]} is not rostered on {new Date(startDate + 'T12:00:00').toLocaleDateString(LOCALE.date, { weekday: 'long' })}.
        </p>
      )}
    </div>
  );
}
