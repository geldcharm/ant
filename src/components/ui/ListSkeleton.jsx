export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-[#F5F4F0] animate-pulse" />
      ))}
    </div>
  );
}
