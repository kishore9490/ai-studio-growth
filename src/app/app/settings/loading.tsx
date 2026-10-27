import { Skeleton } from "@/components/ui/misc";

export default function SettingsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading settings">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-10 space-y-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid grid-cols-1 gap-6 border-t border-line pt-10 lg:grid-cols-[260px_1fr]">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="mt-4 h-10 w-full" />
              <Skeleton className="mt-4 h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
