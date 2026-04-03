import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createJob, updateJob, getJob, getEmployees } from '../db';
import { Button, Input, Textarea, Card, Avatar } from '../components/ui';
import { JOB_STATUSES } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

const EMPTY = {
  jobPhone: '',
  title: '',
  description: '',
  status: 'visit',
  // Client
  contactName: '',
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

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const photoRef = useRef();
  const docRef = useRef();
  const receiptRef = useRef();

  useEffect(() => {
    getEmployees().then(setEmployees);
    if (isEdit) getJob(id).then(j => j && setForm({ ...EMPTY, ...j }));
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Job title is required';
    if (!form.address.trim()) e.address = 'Job site address is required';
    if (!form.startDate) e.startDate = 'Start date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
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

  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors"
        >←</button>
        <h1 className="text-xl font-bold text-[#1A1A18]">{isEdit ? 'Edit Job' : 'New Job'}</h1>
      </div>

      {/* ── 1. Client Contact ─────────────────────── */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-[#1A1A18]">Client Contact</h2>

        <Input
          label="Contact Name"
          placeholder="Business or person's name"
          value={form.contactName}
          onChange={e => set('contactName', e.target.value)}
        />

        <Input
          label="Job Site Address *"
          placeholder="123 Main St, City, State ZIP"
          value={form.address}
          onChange={e => set('address', e.target.value)}
          error={errors.address}
        />

        {/* Primary Person */}
        <div>
          <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide block mb-2">Primary Person</label>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="First name" value={form.primaryFirstName} onChange={e => set('primaryFirstName', e.target.value)} />
            <Input placeholder="Last name" value={form.primaryLastName} onChange={e => set('primaryLastName', e.target.value)} />
            <Input placeholder="Email" type="email" value={form.primaryEmail} onChange={e => set('primaryEmail', e.target.value)} />
          </div>
        </div>

        {/* Additional People */}
        {(form.additionalPeople || []).map((p, i) => (
          <div key={p.id}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Additional Person {i + 1}</label>
              <button onClick={() => removeAdditionalPerson(p.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="First name" value={p.firstName} onChange={e => updateAdditionalPerson(p.id, 'firstName', e.target.value)} />
              <Input placeholder="Last name" value={p.lastName} onChange={e => updateAdditionalPerson(p.id, 'lastName', e.target.value)} />
              <Input placeholder="Email" type="email" value={p.email} onChange={e => updateAdditionalPerson(p.id, 'email', e.target.value)} />
            </div>
          </div>
        ))}

        <button
          onClick={addAdditionalPerson}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E0DED8] text-sm font-medium text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors"
        >
          <span className="w-5 h-5 rounded-full border-2 border-[#1A1A18] flex items-center justify-center text-xs font-bold">+</span>
          Add Additional People
        </button>

        <Input
          label="Notes"
          placeholder="Gate codes, special instructions..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </Card>

      {/* ── 2. Schedule ──────────────────────────── */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-[#1A1A18]">Schedule</h2>
        <p className="text-sm text-[#9E9E98] -mt-2">Add an end date/time for jobs that span multiple days.</p>

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
      </Card>

      {/* ── 3. Job Details ───────────────────────── */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-[#1A1A18]">Job Details</h2>
        <Input
          label="Business or Job Phone Number"
          placeholder="(555) 555-0000"
          type="tel"
          value={form.jobPhone}
          onChange={e => set('jobPhone', e.target.value)}
        />
        <Input
          label="Job Title *"
          placeholder="e.g. Driveway Resurfacing"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          error={errors.title}
        />
        <Textarea
          label="Description"
          placeholder="Describe the work to be done..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
        />
      </Card>

      {/* ── 4. Photos ────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#1A1A18]">Photos</h2>
          <Button variant="secondary" size="sm" onClick={() => photoRef.current?.click()}>
            📷 Add Photo
          </Button>
        </div>
        <input ref={photoRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleFileRead('photo', e.target.files)} />

        {form.photos.length === 0 ? (
          <div
            className="border-2 border-dashed border-[#E0DED8] rounded-2xl p-10 flex flex-col items-center gap-2 cursor-pointer hover:border-[#E8611A]/40 transition-colors"
            onClick={() => photoRef.current?.click()}
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F4F0] flex items-center justify-center">
              <span className="text-2xl opacity-40">🖼️</span>
            </div>
            <p className="text-sm text-[#9E9E98]">No photos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {form.photos.map(p => (
              <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-[#F5F4F0]">
                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeFile('photo', p.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >✕</button>
              </div>
            ))}
            <button
              onClick={() => photoRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-[#E0DED8] flex items-center justify-center text-[#9E9E98] hover:border-[#E8611A]/50 transition-colors text-2xl"
            >+</button>
          </div>
        )}
      </Card>

      {/* ── 5. Documents & Receipts ──────────────── */}
      <Card className="p-5">
        <h2 className="font-semibold text-[#1A1A18] mb-3">Documents & Receipts</h2>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => docRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm font-medium text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors"
          >📄 Add Document</button>
          <button
            onClick={() => receiptRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm font-medium text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors"
          >🧾 Add Receipt</button>
        </div>
        <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" multiple className="hidden"
          onChange={e => handleFileRead('document', e.target.files)} />
        <input ref={receiptRef} type="file" accept="image/*,.pdf" multiple className="hidden"
          onChange={e => handleFileRead('receipt', e.target.files)} />

        {form.documents.length === 0 && form.receipts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <div className="w-12 h-12 rounded-xl bg-[#F5F4F0] flex items-center justify-center">
              <span className="text-2xl opacity-40">📁</span>
            </div>
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
      </Card>

      {/* ── 6. Assign Team ───────────────────────── */}
      <Card className="p-5">
        <h2 className="font-semibold text-[#1A1A18] mb-1">Assign Team</h2>
        <p className="text-xs text-[#9E9E98] mb-4">Select crew members to assign to this job.</p>
        <div className="space-y-2">
          {employees.map(emp => {
            const selected = form.assignedEmployees.includes(emp.id);
            return (
              <div
                key={emp.id}
                onClick={() => toggleEmployee(emp.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selected ? 'border-[#E8611A] bg-[#FDF0E8]' : 'border-[#E0DED8] hover:border-[#E8611A]/40 hover:bg-[#F9F8F5]'
                }`}
              >
                <Avatar name={emp.name} color={emp.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A18]">{emp.name}</p>
                  <p className="text-xs text-[#9E9E98]">{emp.role}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${selected ? 'border-[#E8611A] bg-[#E8611A]' : 'border-[#E0DED8]'}`}>
                  {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── 7. Status ────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-[#1A1A18]">Status</h2>

        <select
          value={form.status}
          onChange={e => set('status', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-[#E0DED8] bg-white text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E8611A]/30"
          style={{ color: currentStatus.color }}
        >
          {JOB_STATUSES.map(s => (
            <option key={s.value} value={s.value} style={{ color: s.color }}>
              {s.label}
            </option>
          ))}
        </select>
      </Card>

      {/* ── Create / Save button ─────────────────── */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Job'}
        </Button>
      </div>
    </div>
  );
}
