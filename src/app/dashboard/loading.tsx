import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={`h-${i}`} className="h-8" />
            ))}
            {Array.from({ length: 35 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
