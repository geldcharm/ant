import { useState } from 'react';
import {
  Avatar,
  Card,
  Button,
  Input,
  Select,
  Modal,
  EmptyState,
  PageHeader,
  ListSkeleton,
  ErrorState,
} from '../components/ui';
import { RosterDayPicker } from '../features/employees/RosterDayPicker';
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '../hooks/useEmployees';
import { EMPLOYEE_ROLES } from '../constants/trades';
import { DEFAULT_ROSTER, formatRoster } from '../constants/roster';
import { isNonEmpty } from '../lib/validation';

const EMPTY_FORM = {
  name: '',
  role: 'Laborer',
  phone: '',
  email: '',
  roster: { ...DEFAULT_ROSTER },
};

function formFromEmployee(emp) {
  return {
    name: emp.name,
    role: emp.role,
    phone: emp.phone,
    email: emp.email,
    roster: emp.roster
      ? { ...emp.roster, days: [...(emp.roster.days || [])] }
      : { ...DEFAULT_ROSTER },
  };
}

export default function Employees() {
  const employeesQuery = useEmployees();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const employees = employeesQuery.data || [];
  const editing = editingId ? employees.find(e => e.id === editingId) : null;
  const saving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setForm({ ...EMPTY_FORM, roster: { ...DEFAULT_ROSTER } });
    setEditingId(null);
    setShowModal(true);
  }
  function openEdit(employee) {
    setForm(formFromEmployee(employee));
    setEditingId(employee.id);
    setShowModal(true);
  }
  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }
  function setRosterField(key, value) {
    setForm(f => ({ ...f, roster: { ...f.roster, [key]: value } }));
  }
  function setRosterDays(days) {
    setForm(f => ({ ...f, roster: { ...f.roster, days } }));
  }

  async function handleSave() {
    if (!isNonEmpty(form.name)) return;
    if (editingId) await updateMutation.mutateAsync({ id: editingId, data: form });
    else await createMutation.mutateAsync(form);
    setShowModal(false);
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(confirmDelete.id);
    setConfirmDelete(null);
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-5">
      <PageHeader
        title="Team"
        subtitle={`${employees.length} member${employees.length === 1 ? '' : 's'}`}
        actions={<Button variant="primary" onClick={openCreate}>+ Add Member</Button>}
      />

      {employeesQuery.isLoading ? (
        <ListSkeleton />
      ) : employeesQuery.error ? (
        <ErrorState message={employeesQuery.error.message} onRetry={() => employeesQuery.refetch()} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No team members yet"
          subtitle="Add your crew to assign them to jobs"
          action={<Button variant="primary" onClick={openCreate}>+ Add Member</Button>}
        />
      ) : (
        <div className="space-y-2">
          {employees.map(emp => (
            <EmployeeRow key={emp.id} employee={emp} onEdit={openEdit} onDelete={setConfirmDelete} />
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Member' : 'Add Team Member'}>
        <div className="space-y-4">
          <div className="flex justify-center">
            <div
              style={{ background: editing?.color || '#E8611A' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
            >
              {form.name
                ? form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : '?'}
            </div>
          </div>
          <Input label="Full Name *" placeholder="First Last" value={form.name} onChange={e => setField('name', e.target.value)} />
          <Select label="Role" value={form.role} onChange={e => setField('role', e.target.value)}>
            {EMPLOYEE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Input label="Phone" placeholder="+47 000 00 000" type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} />
          <Input label="Email" placeholder="name@company.no" type="email" value={form.email} onChange={e => setField('email', e.target.value)} />

          <div className="pt-2 border-t border-[#E0DED8]">
            <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide block mb-2">Roster</label>
            <div className="mb-3">
              <RosterDayPicker value={form.roster?.days || []} onChange={setRosterDays} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start"
                type="time"
                value={form.roster?.startTime || ''}
                onChange={e => setRosterField('startTime', e.target.value)}
              />
              <Input
                label="End"
                type="time"
                value={form.roster?.endTime || ''}
                onChange={e => setRosterField('endTime', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !isNonEmpty(form.name)}
              className="flex-1"
            >
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Remove Team Member">
        <p className="text-sm text-[#6B6B66] mb-5">
          Remove <strong>{confirmDelete?.name}</strong> from the team? They will be unassigned from all jobs.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1">
            {deleteMutation.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function EmployeeRow({ employee, onEdit, onDelete }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Avatar name={employee.name} color={employee.color} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1A1A18] text-sm">{employee.name}</p>
          <p className="text-xs text-[#9E9E98]">{employee.role}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {employee.phone && (
              <a href={`tel:${employee.phone}`} className="text-xs text-[#6B6B66] hover:text-[#E8611A]">📞 {employee.phone}</a>
            )}
            {employee.email && (
              <a href={`mailto:${employee.email}`} className="text-xs text-[#6B6B66] hover:text-[#E8611A] truncate">✉️ {employee.email}</a>
            )}
          </div>
          <p className="text-[11px] text-[#9E9E98] mt-1">🗓 {formatRoster(employee.roster)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(employee)}
            aria-label={`Edit ${employee.name}`}
            className="w-8 h-8 rounded-xl bg-[#F5F4F0] flex items-center justify-center text-[#6B6B66] hover:bg-[#E0DED8] transition-colors text-sm"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(employee)}
            aria-label={`Remove ${employee.name}`}
            className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors text-sm"
          >
            🗑
          </button>
        </div>
      </div>
    </Card>
  );
}
