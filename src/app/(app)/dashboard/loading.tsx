import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>

      {/* Calendar + detail panel */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={`h-${i}`} className="h-8 rounded-md" />
            ))}
            {Array.from({ length: 35 }, (_, i) => (
              <Skeleton key={i} className="h-[4.5rem] rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>

      {/* Practice history */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
