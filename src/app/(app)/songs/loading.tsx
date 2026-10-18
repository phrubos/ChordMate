import { Skeleton } from '@/components/ui/skeleton';

export default function SongsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-1.5 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
      <div className="mt-6 flex flex-col gap-4">
        {/* Search bar */}
        <Skeleton className="h-10 w-full rounded-lg" />
        {/* Filter chips */}
        <div className="flex gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
        {/* Song cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="size-14 shrink-0 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-1.5 h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-2/3" />
                </div>
              </div>
              <Skeleton className="mt-3 h-px w-full" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
