import { v4 as uuidv4 } from 'uuid';
import { delay, nowISO } from './client';
import { seedQuotes } from './seed';
import { nextReference } from './referenceNumbers';

let quotes = [...seedQuotes];

export function nextQuoteReference() {
  return nextReference('QUO', quotes, 'quoteNumber');
}

export async function listQuotes() {
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
    quoteNumber: data.quoteNumber || nextQuoteReference(),
    items: [],
    subtotal: 0,
    gstAmount: 0,
    total: 0,
    status: 'draft',
    createdAt: nowISO(),
    ...data,
  };
  quotes.push(quote);
  return quote;
}

export async function updateQuote(id, data) {
  await delay();
  quotes = quotes.map(q => (q.id === id ? { ...q, ...data } : q));
  return quotes.find(q => q.id === id);
}

export async function deleteQuote(id) {
  await delay();
  quotes = quotes.filter(q => q.id !== id);
}
