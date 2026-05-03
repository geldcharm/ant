// Generates the next sequential reference like JOB-0001, QUO-0001, INV-0001.
// When moving to Supabase, replace with a sequence/RPC call so concurrent
// inserts don't collide.
export function nextReference(prefix, existing, field) {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  const numbers = existing
    .map(item => item[field])
    .filter(value => value && re.test(value))
    .map(value => parseInt(re.exec(value)[1], 10));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}
