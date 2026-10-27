import { Skeleton } from "@/components/ui/misc";

export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-panel)] border border-line bg-surface p-5">
            <Skeleton className="size-10 rounded-[11px]" />
            <Skeleton className="mt-5 h-3 w-24" />
            <Skeleton className="mt-2.5 h-4 w-40" />
            <Skeleton className="mt-2 h-3.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
