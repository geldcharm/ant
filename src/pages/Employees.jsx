import { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../db';
import { Avatar, Card, Button, Input, Select, Modal, EmptyState } from '../components/ui';

const ROLES = ['Foreman', 'Operator', 'Laborer', 'Driver', 'Supervisor'];
const EMPTY_EMP = { name: '', role: 'Laborer', phone: '', email: '' };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState(EMPTY_EMP);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function load() { setEmployees(await getEmployees()); }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY_EMP); setEditEmp(null); setShowModal(true); }
  function openEdit(emp) { setForm({ name: emp.name, role: emp.role, phone: emp.phone, email: emp.email }); setEditEmp(emp); setShowModal(true); }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editEmp) await updateEmployee(editEmp.id, form);
    else await createEmployee(form);
    await load(); setSaving(false); setShowModal(false);
  }

  async function handleDelete() {
    await deleteEmployee(confirmDelete.id);
    setConfirmDelete(null); await load();
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A18]">Team</h1>
          <p className="text-sm text-[#9E9E98] mt-0.5">{employees.length} members</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Add Member</Button>
      </div>

      {/* List */}
      {employees.length === 0 ? (
        <EmptyState icon="👥" title="No team members yet" subtitle="Add your crew to assign them to jobs" action={<Button variant="primary" onClick={openCreate}>+ Add Member</Button>} />
      ) : (
        <div className="space-y-2">
          {employees.map(emp => (
            <Card key={emp.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={emp.name} color={emp.color} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A1A18] text-sm">{emp.name}</p>
                  <p className="text-xs text-[#9E9E98]">{emp.role}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {emp.phone && <a href={`tel:${emp.phone}`} className="text-xs text-[#6B6B66] hover:text-[#E8611A]">📞 {emp.phone}</a>}
                    {emp.email && <a href={`mailto:${emp.email}`} className="text-xs text-[#6B6B66] hover:text-[#E8611A] truncate">✉️ {emp.email}</a>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(emp)} className="w-8 h-8 rounded-xl bg-[#F5F4F0] flex items-center justify-center text-[#6B6B66] hover:bg-[#E0DED8] transition-colors text-sm">✏️</button>
                  <button onClick={() => setConfirmDelete(emp)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors text-sm">🗑</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editEmp ? 'Edit Member' : 'Add Team Member'}>
        <div className="space-y-4">
          <div className="flex justify-center">
            <div style={{ background: editEmp?.color || '#E8611A' }} className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
              {form.name ? form.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?'}
            </div>
          </div>
          <Input label="Full Name *" placeholder="First Last" value={form.name} onChange={e => set('name', e.target.value)} />
          <Select label="Role" value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Input label="Phone" placeholder="+47 000 00 000" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
          <Input label="Email" placeholder="name@company.no" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1">
              {saving ? 'Saving…' : editEmp ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Remove Team Member">
        <p className="text-sm text-[#6B6B66] mb-5">Remove <strong>{confirmDelete?.name}</strong> from the team? They will be unassigned from all jobs.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
