import { test, expect } from 'vitest';
import {
  listJobs,
  createJob,
  updateJob,
  deleteJob,
  getJob,
  addJobAttachment,
  removeJobAttachment,
} from './jobs';

test('jobs CRUD round-trip', async () => {
  const before = await listJobs();

  const created = await createJob({
    contactName: 'Test Customer',
    address: '1 Test St',
    status: 'new',
    startDate: '2026-05-01',
  });

  expect(created.id).toBeDefined();
  expect(created.referenceNumber).toMatch(/^JOB-\d{4}$/);
  expect(created.photos).toEqual([]);

  const fetched = await getJob(created.id);
  expect(fetched?.contactName).toBe('Test Customer');

  const updated = await updateJob(created.id, { contactName: 'Renamed' });
  expect(updated.contactName).toBe('Renamed');

  const after = await listJobs();
  expect(after.length).toBe(before.length + 1);

  await deleteJob(created.id);
  expect(await getJob(created.id)).toBeNull();
});

test('addJobAttachment routes to the correct field by kind', async () => {
  const job = await createJob({ contactName: 'Attach Test' });
  await addJobAttachment(job.id, 'photo',    { name: 'a.jpg', url: 'data:', size: 1, type: 'image/jpeg' });
  await addJobAttachment(job.id, 'document', { name: 'a.pdf', url: 'data:', size: 1, type: 'application/pdf' });
  await addJobAttachment(job.id, 'receipt',  { name: 'r.pdf', url: 'data:', size: 1, type: 'application/pdf' });

  const updated = await getJob(job.id);
  expect(updated.photos.length).toBe(1);
  expect(updated.documents.length).toBe(1);
  expect(updated.receipts.length).toBe(1);

  const receiptId = updated.receipts[0].id;
  await removeJobAttachment(job.id, 'receipt', receiptId);

  const after = await getJob(job.id);
  expect(after.receipts.length).toBe(0);
  expect(after.photos.length).toBe(1);

  await deleteJob(job.id);
});

test('addJobAttachment throws on unknown kind', async () => {
  const job = await createJob({ contactName: 'Throw Test' });
  await expect(
    addJobAttachment(job.id, 'unknown', { name: 'x', url: 'data:', size: 1 })
  ).rejects.toThrow();
  await deleteJob(job.id);
});
