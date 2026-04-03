// ============================================================
// DATABASE LAYER — currently uses in-memory dummy data
// TO SWITCH TO SUPABASE:
//   1. npm install @supabase/supabase-js
//   2. Replace each function body with the corresponding
//      Supabase query (see comments in each function)
//   3. Export createClient from supabase.js and import here
// ============================================================

import { v4 as uuidv4 } from 'uuid';

// ── Seed Data ────────────────────────────────────────────────
let employees = [
  { id: 'e1', name: 'Lars Hansen', role: 'Foreman', phone: '+47 900 11 111', email: 'lars@pavemaster.no', avatar: 'LH', color: '#6366F1', active: true },
  { id: 'e2', name: 'Mia Olsen',   role: 'Operator', phone: '+47 900 22 222', email: 'mia@pavemaster.no',  avatar: 'MO', color: '#10B981', active: true },
  { id: 'e3', name: 'Erik Berg',   role: 'Laborer',   phone: '+47 900 33 333', email: 'erik@pavemaster.no', avatar: 'EB', color: '#F59E0B', active: true },
  { id: 'e4', name: 'Sofia Dal',   role: 'Operator',  phone: '+47 900 44 444', email: 'sofia@pavemaster.no',avatar: 'SD', color: '#EC4899', active: true },
];

let jobs = [
  {
    id: 'j1',
    title: 'Driveway Resurfacing – Maple St',
    description: 'Full resurfacing of 200m² driveway. Remove existing surface and lay new asphalt.',
    address: '14 Maple Street, Trondheim',
    status: 'book',
    startDate: '2026-04-03',
    startTime: '08:00',
    endDate: '2026-04-04',
    endTime: '16:00',
    clientName: 'Jan Nordmann',
    clientPhone: '+47 950 12 345',
    clientEmail: 'jan@example.com',
    assignedEmployees: ['e1', 'e2'],
    photos: [],
    documents: [],
    receipts: [],
    notes: 'Gate code: 1234',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'j2',
    title: 'Parking Lot Repair – City Mall',
    description: 'Patch cracks and apply sealcoat to 1,500m² parking area.',
    address: 'City Mall, Beddingen 8, Trondheim',
    status: 'quote',
    startDate: '2026-04-07',
    startTime: '07:00',
    endDate: '2026-04-09',
    endTime: '17:00',
    clientName: 'City Mall Management',
    clientPhone: '+47 730 00 000',
    clientEmail: 'facility@citymall.no',
    assignedEmployees: ['e1', 'e3', 'e4'],
    photos: [],
    documents: [],
    receipts: [],
    notes: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'j3',
    title: 'Road Edge Repair – Haakon VII',
    description: 'Edge repair along 400m stretch.',
    address: 'Haakon VIIs gate, Trondheim',
    status: 'done',
    startDate: '2026-03-25',
    startTime: '06:00',
    endDate: '2026-03-25',
    endTime: '14:00',
    clientName: 'Trondheim Kommune',
    clientPhone: '+47 720 00 000',
    clientEmail: 'drift@trondheim.no',
    assignedEmployees: ['e2', 'e3'],
    photos: [],
    documents: [],
    receipts: [],
    notes: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'j4',
    title: 'School Courtyard – Lade Skole',
    description: 'New asphalt surface for school yard.',
    address: 'Ladevegen 10, Trondheim',
    status: 'visit',
    startDate: '2026-04-10',
    startTime: '09:00',
    endDate: '',
    endTime: '',
    clientName: 'Lade Skole',
    clientPhone: '+47 732 12 000',
    clientEmail: 'admin@ladeskole.no',
    assignedEmployees: ['e1'],
    photos: [],
    documents: [],
    receipts: [],
    notes: 'Site visit only – bring camera',
    createdAt: new Date().toISOString(),
  },
];

// ── Helpers ──────────────────────────────────────────────────
const delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

// ── Employees API ─────────────────────────────────────────────
// SUPABASE: supabase.from('employees').select('*')
export async function getEmployees() {
  await delay();
  return [...employees];
}

// SUPABASE: supabase.from('employees').insert([data]).select().single()
export async function createEmployee(data) {
  await delay();
  const emp = {
    id: uuidv4(),
    avatar: data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2),
    color: ['#6366F1','#10B981','#F59E0B','#EC4899','#3B82F6','#8B5CF6'][Math.floor(Math.random()*6)],
    active: true,
    createdAt: new Date().toISOString(),
    ...data,
  };
  employees.push(emp);
  return emp;
}

// SUPABASE: supabase.from('employees').update(data).eq('id', id).select().single()
export async function updateEmployee(id, data) {
  await delay();
  employees = employees.map(e => e.id === id ? { ...e, ...data } : e);
  return employees.find(e => e.id === id);
}

// SUPABASE: supabase.from('employees').delete().eq('id', id)
export async function deleteEmployee(id) {
  await delay();
  employees = employees.filter(e => e.id !== id);
}

// ── Jobs API ──────────────────────────────────────────────────
// SUPABASE: supabase.from('jobs').select('*').order('startDate')
export async function getJobs() {
  await delay();
  return [...jobs];
}

// SUPABASE: supabase.from('jobs').select('*').eq('id', id).single()
export async function getJob(id) {
  await delay();
  return jobs.find(j => j.id === id) || null;
}

// SUPABASE: supabase.from('jobs').insert([data]).select().single()
export async function createJob(data) {
  await delay();
  const job = {
    id: uuidv4(),
    assignedEmployees: [],
    photos: [],
    documents: [],
    receipts: [],
    createdAt: new Date().toISOString(),
    ...data,
  };
  jobs.push(job);
  return job;
}

// SUPABASE: supabase.from('jobs').update(data).eq('id', id).select().single()
export async function updateJob(id, data) {
  await delay();
  jobs = jobs.map(j => j.id === id ? { ...j, ...data } : j);
  return jobs.find(j => j.id === id);
}

// SUPABASE: supabase.from('jobs').delete().eq('id', id)
export async function deleteJob(id) {
  await delay();
  jobs = jobs.filter(j => j.id !== id);
}

// File attachments — in real app store files in Supabase Storage
// SUPABASE: supabase.storage.from('job-files').upload(path, file)
export async function addFileToJob(jobId, type, fileData) {
  await delay();
  const file = { id: uuidv4(), name: fileData.name, url: fileData.url, size: fileData.size, type: fileData.type, addedAt: new Date().toISOString() };
  jobs = jobs.map(j => {
    if (j.id !== jobId) return j;
    const field = type === 'photo' ? 'photos' : type === 'document' ? 'documents' : 'receipts';
    return { ...j, [field]: [...(j[field] || []), file] };
  });
  return file;
}

export async function removeFileFromJob(jobId, type, fileId) {
  await delay();
  jobs = jobs.map(j => {
    if (j.id !== jobId) return j;
    const field = type === 'photo' ? 'photos' : type === 'document' ? 'documents' : 'receipts';
    return { ...j, [field]: j[field].filter(f => f.id !== fileId) };
  });
}
