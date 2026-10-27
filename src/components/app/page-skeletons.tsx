import { Skeleton } from "@/components/ui/misc";

function Header() {
  return (
    <div className="mb-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Header />
      <Skeleton className="h-10 w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Header />
      <div className="divide-y divide-line rounded-[var(--radius-panel)] border border-line bg-surface">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="size-12 shrink-0 rounded-[10px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-6 aspect-[16/10] w-full rounded-[22px]" />
        <Skeleton className="mt-8 h-10 w-3/4" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
      </div>
      <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-5">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-6 h-12 w-full" />
        <Skeleton className="mt-2 h-12 w-full" />
      </div>
    </div>
  );
}

export function PanelsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Header />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-panel)] border border-line bg-surface p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-3 h-7 w-32" />
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-2 rounded-[var(--radius-panel)] border border-line bg-surface p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
