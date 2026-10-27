import { ToolDirectorySkeleton } from "@/components/tools/tool-directory";
import { Skeleton } from "@/components/ui/misc";

export default function ToolsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading tools" className="mx-auto max-w-[1240px] px-4 pb-16 pt-16 sm:px-6 sm:pt-20">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-12 w-[28rem] max-w-full" />
      <Skeleton className="mt-4 mb-14 h-5 w-96 max-w-full" />
      <ToolDirectorySkeleton />
    </div>
  );
}
