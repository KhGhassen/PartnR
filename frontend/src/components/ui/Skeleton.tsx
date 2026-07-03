export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-cream-deep ${className}`} />;
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <Skeleton className="h-28 rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}
