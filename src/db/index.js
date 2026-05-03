// Data layer — currently in-memory. To migrate to Supabase:
//   1. npm install @supabase/supabase-js
//   2. Replace the body of each function in employees.js / jobs.js / quotes.js /
//      invoices.js / timeEntries.js with the equivalent supabase.from(...) call.
//   3. Delete client.js and seed.js (or keep seed.js for local-dev fixtures).
// The function names and return shapes were chosen to map cleanly onto Supabase.
export * from './employees';
export * from './jobs';
export * from './quotes';
export * from './invoices';
export * from './timeEntries';
