import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolDirectory, ToolDirectorySkeleton } from "@/components/tools/tool-directory";
import { PageHeader } from "@/components/ui/misc";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = { title: "Digital Tools" };

export default function AppToolsPage() {
  const available = TOOLS.filter((t) => t.status === "available").length;
  return (
    <>
      <PageHeader
        title="Digital Tools"
        description={`${available} interactive tools for writing, careers, business and everyday organisation. Your work is saved in this browser.`}
      />
      <Suspense fallback={<ToolDirectorySkeleton />}>
        <ToolDirectory hrefBase="/app/tools" />
      </Suspense>
    </>
  );
}
