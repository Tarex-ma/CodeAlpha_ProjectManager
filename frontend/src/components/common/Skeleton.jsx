/**
 * Skeleton
 * A pulsing placeholder block used during loading states.
 *
 * Props:
 *   className – Tailwind classes for width, height, border-radius, etc.
 */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`bg-[#1e1e1e] animate-pulse rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

/** 4-column stat cards skeleton */
export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[#161616] border border-[#1e1e1e] rounded-xl p-5">
          <Skeleton className="w-24 h-3 mb-3 rounded" />
          <Skeleton className="w-16 h-7 mb-2 rounded" />
          <Skeleton className="w-20 h-2.5 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Project card skeleton */
export function ProjectCardSkeleton() {
  return (
    <div className="bg-[#161616] border border-[#1e1e1e] rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="w-3/4 h-3.5 mb-2 rounded" />
          <Skeleton className="w-full h-2.5 rounded" />
        </div>
      </div>
      <Skeleton className="w-16 h-5 rounded-full mb-4" />
      <Skeleton className="w-full h-1.5 rounded-full mb-2" />
      <div className="flex justify-between">
        <Skeleton className="w-20 h-2.5 rounded" />
        <Skeleton className="w-16 h-2.5 rounded" />
      </div>
    </div>
  );
}

/** Recent task row skeleton */
export function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0">
      <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="w-3/5 h-3 mb-1.5 rounded" />
        <Skeleton className="w-2/5 h-2.5 rounded" />
      </div>
      <Skeleton className="w-14 h-5 rounded-full" />
    </div>
  );
}

/** Activity feed skeleton */
export function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="w-4/5 h-2.5 mb-1.5 rounded" />
            <Skeleton className="w-1/3 h-2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}