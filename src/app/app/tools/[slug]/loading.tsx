import { Skeleton } from "@/components/ui/misc";

export default function ToolLoading() {
  return (
    <div aria-busy="true" aria-label="Loading tool">
      <Skeleton className="h-3.5 w-24" />
      <div className="mt-5 flex items-center gap-4">
        <Skeleton className="size-14 rounded-[15px]" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[5fr_6fr]">
        <div className="h-[420px] rounded-[var(--radius-panel)] border border-line bg-surface p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-5 h-8 w-full" />
          <Skeleton className="mt-4 h-40 w-full" />
        </div>
        <div className="h-[420px] rounded-[var(--radius-panel)] border border-line bg-surface p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-5 h-56 w-full" />
        </div>
      </div>
    </div>
  );
}
