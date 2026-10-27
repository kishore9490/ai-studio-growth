import { ToolDirectorySkeleton } from "@/components/tools/tool-directory";
import { Skeleton } from "@/components/ui/misc";

export default function ToolsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading tools">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 mb-8 h-4 w-96 max-w-full" />
      <ToolDirectorySkeleton />
    </div>
  );
}
