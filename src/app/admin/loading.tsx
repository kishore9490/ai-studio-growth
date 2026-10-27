import { Skeleton } from "@/components/ui/misc";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-panel)] border border-line bg-surface p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-[var(--radius-panel)] border border-line bg-surface p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mt-3 h-5 w-full first:mt-0" />
        ))}
      </div>
    </div>
  );
}
