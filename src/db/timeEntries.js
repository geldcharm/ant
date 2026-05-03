import { v4 as uuidv4 } from 'uuid';
import { delay, nowISO } from './client';
import { seedTimeEntries } from './seed';

let timeEntries = [...seedTimeEntries];

export async function listTimeEntries() {
  await delay();
  return [...timeEntries];
}

export async function createTimeEntry(data) {
  await delay();
  const entry = {
    id: uuidv4(),
    status: 'pending',
    createdAt: nowISO(),
    ...data,
  };
  timeEntries.push(entry);
  return entry;
}

export async function updateTimeEntry(id, data) {
  await delay();
  timeEntries = timeEntries.map(t => (t.id === id ? { ...t, ...data } : t));
  return timeEntries.find(t => t.id === id);
}

export async function deleteTimeEntry(id) {
  await delay();
  timeEntries = timeEntries.filter(t => t.id !== id);
}
