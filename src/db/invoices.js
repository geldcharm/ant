import { v4 as uuidv4 } from 'uuid';
import { delay, nowISO } from './client';
import { seedInvoices } from './seed';
import { nextReference } from './referenceNumbers';

let invoices = [...seedInvoices];

export function nextInvoiceReference() {
  return nextReference('INV', invoices, 'invoiceNumber');
}

export async function listInvoices() {
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
    invoiceNumber: data.invoiceNumber || nextInvoiceReference(),
    items: [],
    subtotal: 0,
    gstAmount: 0,
    total: 0,
    status: 'draft',
    createdAt: nowISO(),
    ...data,
  };
  invoices.push(invoice);
  return invoice;
}

export async function updateInvoice(id, data) {
  await delay();
  invoices = invoices.map(i => (i.id === id ? { ...i, ...data } : i));
  return invoices.find(i => i.id === id);
}

export async function deleteInvoice(id) {
  await delay();
  invoices = invoices.filter(i => i.id !== id);
}
