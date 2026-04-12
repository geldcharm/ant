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
const DEFAULT_ROSTER = { days: ['mon','tue','wed','thu','fri'], startTime: '07:00', endTime: '16:00' };
let employees = [
  { id: 'e1', name: 'Lars Hansen', role: 'Foreman', phone: '+47 900 11 111', email: 'lars@pavemaster.no', avatar: 'LH', color: '#EC4899', active: true, roster: { ...DEFAULT_ROSTER } },
  { id: 'e2', name: 'Mia Olsen',   role: 'Operator', phone: '+47 900 22 222', email: 'mia@pavemaster.no',  avatar: 'MO', color: '#EC4899', active: true, roster: { ...DEFAULT_ROSTER } },
  { id: 'e3', name: 'Erik Berg',   role: 'Laborer',   phone: '+47 900 33 333', email: 'erik@pavemaster.no', avatar: 'EB', color: '#EC4899', active: true, roster: { days: ['wed','thu','fri','sat','sun'], startTime: '06:30', endTime: '17:30' } },
  { id: 'e4', name: 'Sofia Dal',   role: 'Operator',  phone: '+47 900 44 444', email: 'sofia@pavemaster.no',avatar: 'SD', color: '#EC4899', active: true, roster: { ...DEFAULT_ROSTER } },
];

let jobs = [
  {
    id: 'j1',
    referenceNumber: 'JOB-0001',
    description: 'Full resurfacing of 200m² driveway. Remove existing surface and lay new asphalt.',
    address: '14 Maple Street, Trondheim',
    status: 'book',
    startDate: '2026-04-03',
    startTime: '08:00',
    endDate: '2026-04-04',
    endTime: '16:00',
    contactName: 'Jan Nordmann',
    contactPhone: '+47 950 12 345',
    contactEmail: 'jan@example.com',
    assignedEmployees: ['e1', 'e2'],
    photos: [],
    documents: [],
    receipts: [],
    notes: 'Gate code: 1234',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'j2',
    referenceNumber: 'JOB-0002',
    description: 'Patch cracks and apply sealcoat to 1,500m² parking area.',
    address: 'City Mall, Beddingen 8, Trondheim',
    status: 'quote',
    startDate: '2026-04-07',
    startTime: '07:00',
    endDate: '2026-04-09',
    endTime: '17:00',
    contactName: 'City Mall Management',
    contactPhone: '+47 730 00 000',
    contactEmail: 'facility@citymall.no',
    assignedEmployees: ['e1', 'e3', 'e4'],
    photos: [],
    documents: [],
    receipts: [],
    notes: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'j3',
    referenceNumber: 'JOB-0003',
    description: 'Edge repair along 400m stretch.',
    address: 'Haakon VIIs gate, Trondheim',
    status: 'done',
    startDate: '2026-03-25',
    startTime: '06:00',
    endDate: '2026-03-25',
    endTime: '14:00',
    contactName: 'Trondheim Kommune',
    contactPhone: '+47 720 00 000',
    contactEmail: 'drift@trondheim.no',
    assignedEmployees: ['e2', 'e3'],
    photos: [],
    documents: [],
    receipts: [],
    notes: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'j4',
    referenceNumber: 'JOB-0004',
    description: 'New asphalt surface for school yard.',
    address: 'Ladevegen 10, Trondheim',
    status: 'visit',
    startDate: '2026-04-10',
    startTime: '09:00',
    endDate: '',
    endTime: '',
    contactName: 'Lade Skole',
    contactPhone: '+47 732 12 000',
    contactEmail: 'admin@ladeskole.no',
    assignedEmployees: ['e1'],
    photos: [],
    documents: [],
    receipts: [],
    notes: 'Site visit only – bring camera',
    createdAt: new Date().toISOString(),
  },
];

let quotes = [
  {
    id: 'q1',
    quoteNumber: 'QUO-0001',
    jobId: 'j2',
    jobRef: 'JOB-0002',
    date: '2026-04-07',
    validUntil: '2026-05-07',
    status: 'sent',
    contactName: 'City Mall Management',
    clientAddress: 'Beddingen 8',
    clientSuburb: 'Trondheim, 7014',
    clientCountry: 'Norway',
    businessName: 'PaveMaster AS',
    businessAddress: 'Industriveien 12',
    businessSuburb: 'Trondheim, 7030',
    businessPhone: '+47 900 00 000',
    businessEmail: 'post@pavemaster.no',
    businessAbn: 'Org: 912 345 678',
    tradeType: 'Paving & Asphalt',
    licenceNo: 'PA-20198',
    items: [
      { id: 'qi1', item: 'Crack repair', description: 'Patch cracks – 150m²', quantity: 150, unitPrice: 85, discountPercent: 0, tax: 'GST (15%)', amount: 12750 },
      { id: 'qi2', item: 'Sealcoat', description: 'Application – 1,500m²', quantity: 1500, unitPrice: 25, discountPercent: 0, tax: 'GST (15%)', amount: 37500 },
      { id: 'qi3', item: 'Line marking', description: 'Parking bay lines', quantity: 1, unitPrice: 4800, discountPercent: 0, tax: 'GST (15%)', amount: 4800 },
    ],
    subtotal: 55050,
    gstAmount: 8257.5,
    total: 63307.5,
    notes: 'Quote valid for 30 days. Work to be completed outside mall opening hours (18:00–07:00). All work guaranteed 12 months.',
    paymentTerms: '50% deposit, balance on completion',
    bankName: 'DNB',
    bankBsb: '1234',
    bankAccount: '1234.56.78901',
    logo: '',
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
    color: '#EC4899',
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
// Generate next reference number based on existing jobs
function generateReferenceNumber() {
  const existing = jobs
    .map(j => j.referenceNumber)
    .filter(r => r && /^JOB-\d+$/.test(r))
    .map(r => parseInt(r.replace('JOB-', ''), 10));
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `JOB-${String(next).padStart(4, '0')}`;
}

export { generateReferenceNumber };

export async function createJob(data) {
  await delay();
  const job = {
    id: uuidv4(),
    referenceNumber: data.referenceNumber || generateReferenceNumber(),
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

// ── Quotes API ───────────────────────────────────────────────

function generateQuoteNumber() {
  const existing = quotes
    .map(q => q.quoteNumber)
    .filter(r => r && /^QUO-\d+$/.test(r))
    .map(r => parseInt(r.replace('QUO-', ''), 10));
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `QUO-${String(next).padStart(4, '0')}`;
}

export { generateQuoteNumber };

export async function getQuotes() {
  await delay();
  return [...quotes];
}

export async function getQuote(id) {
  await delay();
  return quotes.find(q => q.id === id) || null;
}

export async function createQuote(data) {
  await delay();
  const quote = {
    id: uuidv4(),
    quoteNumber: data.quoteNumber || generateQuoteNumber(),
    items: [],
    subtotal: 0,
    taxRate: 25,
    taxAmount: 0,
    total: 0,
    status: 'draft',
    createdAt: new Date().toISOString(),
    ...data,
  };
  quotes.push(quote);
  return quote;
}

export async function updateQuote(id, data) {
  await delay();
  quotes = quotes.map(q => q.id === id ? { ...q, ...data } : q);
  return quotes.find(q => q.id === id);
}

export async function deleteQuote(id) {
  await delay();
  quotes = quotes.filter(q => q.id !== id);
}

// ── Invoices API ─────────────────────────────────────────────
let invoices = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-0001',
    jobId: 'j3',
    jobRef: 'JOB-0003',
    quoteId: '',
    date: '2026-03-26',
    dueDate: '2026-04-09',
    status: 'awaiting_payment',
    contactName: 'Trondheim Kommune',
    clientAddress: 'Haakon VIIs gate',
    clientSuburb: 'Trondheim',
    clientCountry: 'Norway',
    businessName: 'PaveMaster AS',
    businessAddress: 'Industriveien 12',
    businessSuburb: 'Trondheim, 7030',
    businessPhone: '+47 900 00 000',
    businessEmail: 'post@pavemaster.no',
    businessAbn: 'Org: 912 345 678',
    items: [
      { id: 'ii1', item: 'Edge repair', description: '400m stretch', quantity: 400, unitPrice: 11.5, discountPercent: 0, tax: 'GST (15%)', amount: 4600 },
    ],
    subtotal: 4600,
    gstAmount: 690,
    total: 5290,
    notes: 'Payment within 14 days.',
    paymentTerms: 'Net 14 days',
    bankName: 'DNB',
    bankBsb: '1234',
    bankAccount: '1234.56.78901',
    logo: '',
    createdAt: new Date().toISOString(),
  },
];

function generateInvoiceNumber() {
  const existing = invoices
    .map(i => i.invoiceNumber)
    .filter(r => r && /^INV-\d+$/.test(r))
    .map(r => parseInt(r.replace('INV-', ''), 10));
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `INV-${String(next).padStart(4, '0')}`;
}

export { generateInvoiceNumber };

export async function getInvoices() {
  await delay();
  return [...invoices];
}

export async function getInvoice(id) {
  await delay();
  return invoices.find(i => i.id === id) || null;
}

export async function createInvoice(data) {
  await delay();
  const invoice = {
    id: uuidv4(),
    invoiceNumber: data.invoiceNumber || generateInvoiceNumber(),
    items: [],
    subtotal: 0,
    gstAmount: 0,
    total: 0,
    status: 'draft',
    createdAt: new Date().toISOString(),
    ...data,
  };
  invoices.push(invoice);
  return invoice;
}

export async function updateInvoice(id, data) {
  await delay();
  invoices = invoices.map(i => i.id === id ? { ...i, ...data } : i);
  return invoices.find(i => i.id === id);
}

export async function deleteInvoice(id) {
  await delay();
  invoices = invoices.filter(i => i.id !== id);
}

// ── Time Entries API ─────────────────────────────────────────
let timeEntries = [
  { id: 'te1', employeeId: 'e1', jobId: 'j1', date: '2026-04-06', startTime: '08:00', endTime: '16:00', breakMinutes: 30, hours: 7.5, notes: 'Prep and base layer', status: 'approved', createdAt: new Date().toISOString() },
  { id: 'te2', employeeId: 'e2', jobId: 'j1', date: '2026-04-06', startTime: '08:00', endTime: '16:00', breakMinutes: 30, hours: 7.5, notes: '', status: 'approved', createdAt: new Date().toISOString() },
  { id: 'te3', employeeId: 'e1', jobId: 'j1', date: '2026-04-07', startTime: '08:00', endTime: '15:00', breakMinutes: 30, hours: 6.5, notes: '', status: 'pending', createdAt: new Date().toISOString() },
  { id: 'te4', employeeId: 'e3', jobId: 'j2', date: '2026-04-08', startTime: '07:00', endTime: '17:00', breakMinutes: 45, hours: 9.25, notes: 'Sealcoat day 1', status: 'pending', createdAt: new Date().toISOString() },
];

export async function getTimeEntries() {
  await delay();
  return [...timeEntries];
}

export async function createTimeEntry(data) {
  await delay();
  const entry = { id: uuidv4(), status: 'pending', createdAt: new Date().toISOString(), ...data };
  timeEntries.push(entry);
  return entry;
}

export async function updateTimeEntry(id, data) {
  await delay();
  timeEntries = timeEntries.map(t => t.id === id ? { ...t, ...data } : t);
  return timeEntries.find(t => t.id === id);
}

export async function deleteTimeEntry(id) {
  await delay();
  timeEntries = timeEntries.filter(t => t.id !== id);
}
