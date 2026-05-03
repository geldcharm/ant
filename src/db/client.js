// Simulates network latency so the UI behaves the same way it will against
// a real backend. When wiring Supabase, delete this file and replace each
// domain module's body with supabase.from(...) calls.
const DELAY_MS = 150;

export function delay(ms = DELAY_MS) {
  return new Promise(r => setTimeout(r, ms));
}

export function nowISO() {
  return new Date().toISOString();
}
