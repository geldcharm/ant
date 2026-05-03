import { v4 as uuidv4 } from 'uuid';
import { delay, nowISO } from './client';
import { seedJobs } from './seed';
import { nextReference } from './referenceNumbers';

let jobs = [...seedJobs];

const ATTACHMENT_FIELDS = { photo: 'photos', document: 'documents', receipt: 'receipts' };

export function nextJobReference() {
  return nextReference('JOB', jobs, 'referenceNumber');
}

export async function listJobs() {
  await delay();
  return [...jobs];
}

export async function getJob(id) {
  await delay();
  return jobs.find(j => j.id === id) || null;
}

export async function createJob(data) {
  await delay();
  const job = {
    id: uuidv4(),
    referenceNumber: data.referenceNumber || nextJobReference(),
    assignedEmployees: [],
    photos: [],
    documents: [],
    receipts: [],
    createdAt: nowISO(),
    ...data,
  };
  jobs.push(job);
  return job;
}

export async function updateJob(id, data) {
  await delay();
  jobs = jobs.map(j => (j.id === id ? { ...j, ...data } : j));
  return jobs.find(j => j.id === id);
}

export async function deleteJob(id) {
  await delay();
  jobs = jobs.filter(j => j.id !== id);
}

export async function addJobAttachment(jobId, kind, file) {
  await delay();
  const field = ATTACHMENT_FIELDS[kind];
  if (!field) throw new Error(`Unknown attachment kind: ${kind}`);
  const attachment = {
    id: uuidv4(),
    name: file.name,
    url: file.url,
    size: file.size,
    type: file.type,
    addedAt: nowISO(),
  };
  jobs = jobs.map(j => (j.id === jobId
    ? { ...j, [field]: [...(j[field] || []), attachment] }
    : j));
  return attachment;
}

export async function removeJobAttachment(jobId, kind, attachmentId) {
  await delay();
  const field = ATTACHMENT_FIELDS[kind];
  if (!field) throw new Error(`Unknown attachment kind: ${kind}`);
  jobs = jobs.map(j => (j.id === jobId
    ? { ...j, [field]: (j[field] || []).filter(f => f.id !== attachmentId) }
    : j));
}
