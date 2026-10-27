import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PlannedTool, PremiumGate, ToolHeader, renderTool } from "@/components/tools/tool-views";
import { getMembership } from "@/lib/core/membership";
import { requireUser } from "@/lib/server/auth";
import { recordView } from "@/lib/server/activity";
import { aiConfigured } from "@/lib/server/env";
import { getTool } from "@/lib/tools";
import ToolLoading from "./loading";

export async function generateMetadata({ params }: PageProps<"/app/tools/[slug]">): Promise<Metadata> {
  const tool = getTool((await params).slug);
  return { title: tool?.name ?? "Tool not found" };
}

async function ToolPage({ params }: { params: PageProps<"/app/tools/[slug]">["params"] }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const user = await requireUser(`/app/tools/${slug}`);
  if (tool.opens) redirect(tool.opens);

  if (tool.status === "planned") {
    return (
      <>
        <ToolHeader tool={tool} backHref="/app/tools" />
        <PlannedTool tool={tool} backHref="/app/tools" />
      </>
    );
  }

  // Premium access is decided on the server from the member's verified subscription.
  if (tool.access === "premium") {
    const membership = await getMembership(user.id);
    if (!membership.isPremium) {
      return (
        <>
          <ToolHeader tool={tool} backHref="/app/tools" />
          <PremiumGate tool={tool} />
        </>
      );
    }
  }

  recordView(user.id, "TOOL", tool.slug);
  return (
    <>
      <ToolHeader tool={tool} backHref="/app/tools" />
      {renderTool(tool.slug, { aiEnabled: aiConfigured() })}
    </>
  );
}

export default function AppToolPage(props: PageProps<"/app/tools/[slug]">) {
  return (
    <Suspense fallback={<ToolLoading />}>
      <ToolPage params={props.params} />
    </Suspense>
  );
}
