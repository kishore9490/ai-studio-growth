import { Skeleton } from "@/components/ui/misc";

export default function ToolDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading tool" className="mx-auto max-w-[1240px] px-4 pb-16 pt-10 sm:px-6">
      <Skeleton className="h-3.5 w-20" />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div>
          <Skeleton className="size-14 rounded-[15px]" />
          <Skeleton className="mt-6 h-4 w-40" />
          <Skeleton className="mt-4 h-12 w-96 max-w-full" />
          <Skeleton className="mt-4 h-5 w-80 max-w-full" />
          <Skeleton className="mt-4 h-20 w-full max-w-xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-[var(--radius-panel)]" />
      </div>
    </div>
  );
}
