import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createJob, updateJob, getJob, getJobs, getEmployees, generateReferenceNumber } from '../db';
import { Button, Input, Textarea, Card, Avatar } from '../components/ui';
import { JOB_STATUSES, isOnRoster, formatRoster, getStatus } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

const EMPTY = {
  jobPhone: '',
  referenceNumber: '',
  description: '',
  status: 'new',
  // Client
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  primaryFirstName: '',
  primaryLastName: '',
  primaryEmail: '',
  additionalPeople: [],
  // Schedule
  startDate: '', startTime: '', endDate: '', endTime: '',
  // Notes
  notes: '',
  // Team
  assignedEmployees: [],
  // Files
  photos: [], documents: [], receipts: [],
};

const STEPS = [
  { id: 'details',  icon: '📋', label: 'Contact & Job Details' },
  { id: 'photos',   icon: '📷', label: 'Photos' },
  { id: 'docs',     icon: '📁', label: 'Documents & Receipts' },
  { id: 'schedule', icon: '📅', label: 'Calendar & Team' },
];

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const initialDate = location.state?.startDate || '';
  const [form, setForm] = useState({ ...EMPTY, startDate: initialDate, referenceNumber: generateReferenceNumber() });
  const [employees, setEmployees] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [calMonth, setCalMonth] = useState(() => {
    const base = initialDate ? new Date(initialDate + 'T12:00:00') : new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(null); // null = overview, string = step id
  const photoRef = useRef();
  const docRef = useRef();
  const receiptRef = useRef();

  useEffect(() => {
    getEmployees().then(setEmployees);
    getJobs().then(setAllJobs);
    if (isEdit) getJob(id).then(j => j && setForm({ ...EMPTY, ...j }));
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function validate() {
    const e = {};
    if (!form.referenceNumber.trim()) e.referenceNumber = 'Reference number is required';
    if (!form.contactName.trim()) e.contactName = 'Contact name is required';
    if (!form.address.trim()) e.address = 'Job site address is required';
    if (!form.startDate) e.startDate = 'Start date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) {
      // Jump to the step that has the first error
      if (errors.referenceNumber) setStep(null);
      else if (errors.contactName || errors.address) setStep('details');
      else if (errors.startDate) setStep('schedule');
      return;
    }
    setSaving(true);
    try {
      const jobData = { ...form };
      if (isEdit) {
        await updateJob(id, jobData);
        navigate(`/jobs/${id}`);
      } else {
        const job = await createJob(jobData);
        navigate(`/jobs/${job.id}`, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleEmployee(eid) {
    set('assignedEmployees', form.assignedEmployees.includes(eid)
      ? form.assignedEmployees.filter(e => e !== eid)
      : [...form.assignedEmployees, eid]);
  }

  function handleFileRead(type, files) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const fileData = { id: uuidv4(), name: file.name, url: e.target.result, size: file.size, type: file.type };
        const field = type === 'photo' ? 'photos' : type === 'document' ? 'documents' : 'receipts';
        setForm(f => ({ ...f, [field]: [...(f[field] || []), fileData] }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeFile(type, fileId) {
    const field = type === 'photo' ? 'photos' : type === 'document' ? 'documents' : 'receipts';
    set(field, form[field].filter(f => f.id !== fileId));
  }

  function addAdditionalPerson() {
    set('additionalPeople', [...(form.additionalPeople || []), { id: uuidv4(), firstName: '', lastName: '', email: '' }]);
  }
  function updateAdditionalPerson(pid, field, value) {
    set('additionalPeople', form.additionalPeople.map(p => p.id === pid ? { ...p, [field]: value } : p));
  }
  function removeAdditionalPerson(pid) {
    set('additionalPeople', form.additionalPeople.filter(p => p.id !== pid));
  }

  const currentStatus = JOB_STATUSES.find(s => s.value === form.status) || JOB_STATUSES[0];

  // Completion checks for each section
  function isComplete(id) {
    switch (id) {
      case 'details':  return !!(form.address.trim() && form.contactName.trim());
      case 'photos':   return form.photos.length > 0;
      case 'docs':     return form.documents.length > 0 || form.receipts.length > 0;
      case 'schedule': return !!form.startDate;
      default: return false;
    }
  }

  function summary(id) {
    switch (id) {
      case 'details': {
        const parts = [];
        if (form.contactName.trim()) parts.push(form.contactName.trim());
        if (form.address.trim()) parts.push(form.address.trim());
        return parts.join(' · ') || 'Not started';
      }
      case 'photos':
        return form.photos.length ? `${form.photos.length} photo${form.photos.length !== 1 ? 's' : ''}` : 'No photos';
      case 'docs': {
        const count = form.documents.length + form.receipts.length;
        return count ? `${count} file${count !== 1 ? 's' : ''}` : 'No files';
      }
      case 'schedule': {
        const parts = [];
        parts.push(form.startDate || 'Not set');
        if (form.assignedEmployees.length) parts.push(`${form.assignedEmployees.length} crew`);
        return parts.join(' · ');
      }
      default: return '';
    }
  }

  // Navigation between steps
  const stepIdx = step ? STEPS.findIndex(s => s.id === step) : -1;
  const prevStep = stepIdx > 0 ? STEPS[stepIdx - 1] : null;
  const nextStep = stepIdx < STEPS.length - 1 ? STEPS[stepIdx + 1] : null;

  // ── Step views ──────────────────────────────────

  if (step === 'details') return (
    <StepShell title="Contact & Job Details" onBack={() => setStep(null)} onNext={() => setStep(nextStep?.id)} nextLabel={nextStep?.label} step={stepIdx + 1} total={STEPS.length}>
      <Input label="Contact Name *" placeholder="Business or person's name" value={form.contactName} onChange={e => set('contactName', e.target.value)} error={errors.contactName} />
      <Textarea label="Job Site Address *" placeholder="123 Main St, City, State ZIP" value={form.address} onChange={e => set('address', e.target.value)} error={errors.address} rows={3} />
      <div>
        <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide block mb-2">Primary Person</label>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="First name" value={form.primaryFirstName} onChange={e => set('primaryFirstName', e.target.value)} />
          <Input placeholder="Last name" value={form.primaryLastName} onChange={e => set('primaryLastName', e.target.value)} />
        </div>
        <div className="mt-2">
          <Input placeholder="Email" type="email" value={form.primaryEmail} onChange={e => set('primaryEmail', e.target.value)} />
        </div>
      </div>
      {(form.additionalPeople || []).map((p, i) => (
        <div key={p.id}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Additional Person {i + 1}</label>
            <button onClick={() => removeAdditionalPerson(p.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="First name" value={p.firstName} onChange={e => updateAdditionalPerson(p.id, 'firstName', e.target.value)} />
            <Input placeholder="Last name" value={p.lastName} onChange={e => updateAdditionalPerson(p.id, 'lastName', e.target.value)} />
          </div>
          <div className="mt-2">
            <Input placeholder="Email" type="email" value={p.email} onChange={e => updateAdditionalPerson(p.id, 'email', e.target.value)} />
          </div>
        </div>
      ))}
      <button onClick={addAdditionalPerson} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E0DED8] text-sm font-medium text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors">
        <span className="w-5 h-5 rounded-full border-2 border-[#1A1A18] flex items-center justify-center text-xs font-bold">+</span>
        Add Additional People
      </button>
      <Input label="Business or Job Phone Number" placeholder="(555) 555-0000" type="tel" value={form.jobPhone} onChange={e => set('jobPhone', e.target.value)} />
      <Textarea label="Description" placeholder="Describe the work to be done..." value={form.description} onChange={e => set('description', e.target.value)} rows={4} />
      <Input label="Notes" placeholder="Gate codes, special instructions..." value={form.notes} onChange={e => set('notes', e.target.value)} />
    </StepShell>
  );

  if (step === 'photos') return (
    <StepShell title="Photos" onBack={() => setStep(null)} onNext={() => setStep(nextStep?.id)} onPrev={() => setStep(prevStep?.id)} prevLabel={prevStep?.label} nextLabel={nextStep?.label} step={stepIdx + 1} total={STEPS.length}>
      <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileRead('photo', e.target.files)} />
      {form.photos.length === 0 ? (
        <div className="border-2 border-dashed border-[#E0DED8] rounded-2xl p-10 flex flex-col items-center gap-2 cursor-pointer hover:border-[#E8611A]/40 transition-colors" onClick={() => photoRef.current?.click()}>
          <div className="w-12 h-12 rounded-xl bg-[#F5F4F0] flex items-center justify-center"><span className="text-2xl opacity-40">🖼️</span></div>
          <p className="text-sm text-[#9E9E98]">Tap to add photos</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {form.photos.map(p => (
              <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-[#F5F4F0]">
                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                <button onClick={() => removeFile('photo', p.id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">✕</button>
              </div>
            ))}
            <button onClick={() => photoRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-[#E0DED8] flex items-center justify-center text-[#9E9E98] hover:border-[#E8611A]/50 transition-colors text-2xl">+</button>
          </div>
        </>
      )}
      {form.photos.length === 0 && (
        <Button variant="secondary" onClick={() => photoRef.current?.click()} className="w-full">📷 Add Photos</Button>
      )}
    </StepShell>
  );

  if (step === 'docs') return (
    <StepShell title="Documents & Receipts" onBack={() => setStep(null)} onNext={() => setStep(nextStep?.id)} onPrev={() => setStep(prevStep?.id)} prevLabel={prevStep?.label} nextLabel={nextStep?.label} step={stepIdx + 1} total={STEPS.length}>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => docRef.current?.click()} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm font-medium text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors">📄 Add Document</button>
        <button onClick={() => receiptRef.current?.click()} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm font-medium text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors">🧾 Add Receipt</button>
      </div>
      <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple className="hidden" onChange={e => handleFileRead('document', e.target.files)} />
      <input ref={receiptRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => handleFileRead('receipt', e.target.files)} />
      {form.documents.length === 0 && form.receipts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="w-12 h-12 rounded-xl bg-[#F5F4F0] flex items-center justify-center"><span className="text-2xl opacity-40">📁</span></div>
          <p className="text-sm text-[#9E9E98]">No documents yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {form.documents.map(d => (
            <div key={d.id} className="flex items-center gap-3 p-3 bg-[#F5F4F0] rounded-xl">
              <span>📄</span>
              <p className="text-xs font-medium text-[#1A1A18] flex-1 truncate">{d.name}</p>
              <button onClick={() => removeFile('document', d.id)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
            </div>
          ))}
          {form.receipts.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 bg-[#FFFBEB] rounded-xl">
              <span>🧾</span>
              <p className="text-xs font-medium text-[#1A1A18] flex-1 truncate">{r.name}</p>
              <button onClick={() => removeFile('receipt', r.id)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
            </div>
          ))}
        </div>
      )}
    </StepShell>
  );

  if (step === 'schedule') {
    const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const { year, month } = calMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDowSun = new Date(year, month, 1).getDay();
    const firstDay = firstDowSun === 0 ? 6 : firstDowSun - 1; // Mon-first
    const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
    const makeDateStr = day => `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

    // Other jobs that occupy a given date (excluding the job being edited)
    const jobsOnDate = ds => allJobs.filter(j => {
      if (isEdit && j.id === id) return false;
      if (!j.startDate) return false;
      if (j.startDate === ds) return true;
      if (j.endDate && j.startDate <= ds && j.endDate >= ds) return true;
      return false;
    });

    const selectedDateJobs = form.startDate ? jobsOnDate(form.startDate) : [];
    const busyIds = new Set(selectedDateJobs.flatMap(j => j.assignedEmployees || []));
    const selectedDow = form.startDate ? new Date(form.startDate + 'T12:00:00') : null;

    function prevMonth() { setCalMonth(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }); }
    function nextMonth() { setCalMonth(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }); }

    return (
      <StepShell title="Calendar & Team" onBack={() => setStep(null)} onPrev={() => setStep(prevStep?.id)} prevLabel={prevStep?.label} step={stepIdx + 1} total={STEPS.length} isLast>
        <p className="text-sm text-[#9E9E98]">Pick a day — busy days show how many jobs are already booked.</p>

        {/* Mini month calendar */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#E0DED8]">
            <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-[#F5F4F0] text-[#6B6B66]">‹</button>
            <p className="font-semibold text-sm text-[#1A1A18]">{MONTHS[month]} {year}</p>
            <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-[#F5F4F0] text-[#6B6B66]">›</button>
          </div>
          <div className="grid grid-cols-7 border-b border-[#E0DED8]">
            {DAYS.map(d => <div key={d} className="py-1.5 text-center text-[10px] font-semibold text-[#9E9E98]">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({length: firstDay}).map((_, i) => <div key={`e${i}`} className="border-b border-r border-[#E0DED8] min-h-[52px] bg-[#F9F8F5]" />)}
            {Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => {
              const ds = makeDateStr(day);
              const dayJobs = jobsOnDate(ds);
              const isToday = ds === todayStr;
              const isSelected = ds === form.startDate;
              const isLastCol = (day + firstDay - 1) % 7 === 6;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => set('startDate', ds)}
                  className={`border-b border-[#E0DED8] min-h-[52px] p-1 text-left transition-colors ${isLastCol ? '' : 'border-r'} ${isSelected ? 'bg-[#FDF0E8] ring-2 ring-[#E8611A] ring-inset' : 'hover:bg-[#F9F8F5]'}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${isToday ? 'bg-[#E8611A] text-white' : 'text-[#6B6B66]'}`}>{day}</div>
                  {dayJobs.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap">
                      {dayJobs.slice(0, 3).map(j => {
                        const st = getStatus(j.status);
                        return <span key={j.id} className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} title={`${j.contactName} · ${st.label}`} />;
                      })}
                      {dayJobs.length > 3 && <span className="text-[8px] text-[#9E9E98] leading-none">+{dayJobs.length - 3}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected day availability */}
        {form.startDate && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm text-[#1A1A18]">
                {selectedDow?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <span className="text-xs text-[#9E9E98]">{selectedDateJobs.length} job{selectedDateJobs.length !== 1 ? 's' : ''} booked</span>
            </div>

            {selectedDateJobs.length > 0 && (
              <div className="space-y-1.5">
                {selectedDateJobs.map(j => {
                  const st = getStatus(j.status);
                  const team = employees.filter(e => (j.assignedEmployees || []).includes(e.id));
                  return (
                    <div key={j.id} className="p-2 rounded-lg border border-[#E0DED8] flex items-center gap-2">
                      <span className="w-1 self-stretch rounded-full" style={{ background: st.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1A1A18] truncate">{j.contactName}{j.referenceNumber ? ` · ${j.referenceNumber}` : ''}</p>
                        <p className="text-[10px] text-[#9E9E98] truncate">{j.startTime || '—'}{j.endTime ? `–${j.endTime}` : ''} · {st.label}</p>
                      </div>
                      {team.length > 0 && (
                        <div className="flex -space-x-1 flex-shrink-0">
                          {team.slice(0,3).map(e => (
                            <span key={e.id} title={e.name} style={{ background: e.color }} className="w-5 h-5 rounded-full border border-white text-[8px] font-bold text-white flex items-center justify-center">{e.avatar?.[0]}</span>
                          ))}
                          {team.length > 3 && <span className="w-5 h-5 rounded-full border border-white bg-[#E0DED8] text-[8px] font-semibold text-[#6B6B66] flex items-center justify-center">+{team.length-3}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Crew availability */}
            <div>
              <p className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide mb-1.5">Crew availability</p>
              <div className="flex flex-wrap gap-1.5">
                {employees.map(emp => {
                  const busy = busyIds.has(emp.id);
                  const offRoster = !isOnRoster(emp, form.startDate);
                  const status = busy ? 'busy' : offRoster ? 'off' : 'free';
                  const styles = status === 'free'
                    ? 'bg-[#ECFDF5] text-[#059669] border-[#05966930]'
                    : status === 'busy'
                      ? 'bg-[#FEF2F2] text-[#DC2626] border-[#DC262630]'
                      : 'bg-[#F5F4F0] text-[#9E9E98] border-[#E0DED8]';
                  const label = status === 'free' ? '✓ Free' : status === 'busy' ? '● Busy' : '○ Off';
                  return (
                    <div key={emp.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium ${styles}`} title={formatRoster(emp.roster)}>
                      <span style={{ background: emp.color }} className="w-4 h-4 rounded-full text-white text-[8px] font-bold flex items-center justify-center">{emp.avatar?.[0]}</span>
                      {emp.name.split(' ')[0]}
                      <span className="opacity-70">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        <div>
          <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide mb-2">From</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} error={errors.startDate} />
            <Input label="Time" type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide mb-2">To (optional – for multi-day jobs)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="End date" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            <Input label="End time" type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
          </div>
        </div>

        {/* Assign team */}
        <div className="pt-2 border-t border-[#E0DED8]">
          <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide mb-2">Assign Team</p>
          <p className="text-xs text-[#9E9E98] mb-3">Tap crew to assign. Busy/off-roster warnings show above.</p>
          <div className="space-y-2">
            {employees.map(emp => {
              const selected = form.assignedEmployees.includes(emp.id);
              const offRoster = form.startDate && !isOnRoster(emp, form.startDate);
              const busy = busyIds.has(emp.id);
              return (
                <div key={emp.id} onClick={() => toggleEmployee(emp.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${selected ? 'border-[#E8611A] bg-[#FDF0E8]' : 'border-[#E0DED8] hover:border-[#E8611A]/40 hover:bg-[#F9F8F5]'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} color={emp.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A18]">{emp.name}</p>
                      <p className="text-xs text-[#9E9E98]">{emp.role} · {formatRoster(emp.roster)}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${selected ? 'border-[#E8611A] bg-[#E8611A]' : 'border-[#E0DED8]'}`}>
                      {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                  </div>
                  {selected && busy && (
                    <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1 mt-2">● {emp.name.split(' ')[0]} is already booked on another job this day.</p>
                  )}
                  {selected && offRoster && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-2">⚠️ {emp.name.split(' ')[0]} is not rostered on {new Date(form.startDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long' })}.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </StepShell>
    );
  }

  // ── Overview (step === null) ────────────────────

  const completedCount = STEPS.filter(s => isComplete(s.id)).length;

  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1A1A18]">{isEdit ? 'Edit Job' : 'New Job'}</h1>
          <p className="text-xs text-[#9E9E98] mt-0.5">{completedCount} of {STEPS.length} sections completed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#F0EFEB] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#E8611A] rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Status + Reference Number */}
      <Card className="p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide block mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
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
          onChange={e => set('referenceNumber', e.target.value)}
          error={errors.referenceNumber}
        />
      </Card>

      {/* Section buttons */}
      <div className="space-y-2">
        {STEPS.map(s => {
          const done = isComplete(s.id);
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
              <span className="text-lg">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A18]">{s.label}</p>
                <p className="text-xs text-[#9E9E98] truncate mt-0.5">{summary(s.id)}</p>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                done ? 'bg-[#059669] text-white' : 'bg-[#F0EFEB] text-[#9E9E98]'
              }`}>
                {done
                  ? <span className="text-xs font-bold">✓</span>
                  : <span className="text-xs">›</span>
                }
              </div>
            </button>
          );
        })}
      </div>

      {/* Create / Save button */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Job'}
        </Button>
      </div>
    </div>
  );
}

// Reusable step page shell
function StepShell({ title, onBack, onNext, onPrev, prevLabel, nextLabel, step, total, isLast, children }) {
  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors">←</button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#1A1A18]">{title}</h1>
          <p className="text-xs text-[#9E9E98]">Step {step} of {total}</p>
        </div>
      </div>

      {/* Step progress dots */}
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < step ? 'bg-[#E8611A]' : 'bg-[#F0EFEB]'}`} />
        ))}
      </div>

      {/* Content */}
      <Card className="p-5 space-y-4">
        {children}
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        {onPrev ? (
          <button onClick={onPrev} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#E0DED8] bg-white text-sm font-semibold text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors">
            ← {prevLabel}
          </button>
        ) : (
          <button onClick={onBack} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#E0DED8] bg-white text-sm font-semibold text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors">
            ← Overview
          </button>
        )}
        {onNext && !isLast && (
          <button onClick={onNext} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#E8611A] text-white text-sm font-semibold hover:bg-[#C44E10] transition-colors shadow-sm">
            {nextLabel} →
          </button>
        )}
        {isLast && (
          <button onClick={onBack} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#E8611A] text-white text-sm font-semibold hover:bg-[#C44E10] transition-colors shadow-sm">
            Done →
          </button>
        )}
      </div>
    </div>
  );
}
