import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Crown, Hourglass, Lock } from "lucide-react";
import { AccessBadge } from "@/components/catalog/tool-card";
import { ToolIcon } from "@/components/tool-icon";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/misc";
import { getToolCategory, type Tool } from "@/lib/tools";
import { BudgetPlanner } from "./budget-planner";
import { ContentPlanner } from "./content-planner";
import { ProductivityWorkspace } from "./productivity-workspace";
import { ProposalBuilder } from "./proposal-builder";
import { ResumeBuilder } from "./resume-builder";
import { WritingWorkspace } from "./writing-workspace";

/** Interactive implementations, keyed by tool slug. */
export function renderTool(slug: string, opts: { aiEnabled: boolean }) {
  switch (slug) {
    case "ai-writing-workspace":
      return <WritingWorkspace aiEnabled={opts.aiEnabled} />;
    case "resume-builder":
      return <ResumeBuilder />;
    case "proposal-builder":
      return <ProposalBuilder />;
    case "budget-planner":
      return <BudgetPlanner />;
    case "content-planner":
      return <ContentPlanner />;
    case "productivity-workspace":
      return <ProductivityWorkspace />;
    default:
      return null;
  }
}

export function ToolHeader({ tool, backHref }: { tool: Tool; backHref: string }) {
  const category = getToolCategory(tool.category);
  return (
    <div className="print-hidden mb-7">
      <Link href={backHref} className="inline-flex items-center gap-1 text-[13px] text-ink-3 transition-colors hover:text-ink">
        <ArrowLeft className="size-3.5" /> Digital Tools
      </Link>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <ToolIcon icon={tool.icon} hue={tool.hue} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]">{tool.name}</h1>
              <AccessBadge access={tool.access} status={tool.status} />
            </div>
            <p className="mt-0.5 text-[14.5px] text-ink-2">
              {category?.name} · {tool.tagline}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PremiumGate({ tool }: { tool: Tool }) {
  return (
    <Panel className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_0%,rgb(117_87_246/0.12),transparent_70%)]" />
      <div className="relative grid grid-cols-1 gap-8 p-8 md:grid-cols-[1.2fr_1fr] md:p-10">
        <div>
          <span className="inline-grid size-11 place-items-center rounded-xl bg-ink text-white">
            <Lock className="size-5" strokeWidth={1.75} />
          </span>
          <h2 className="mt-5 text-[24px] font-semibold tracking-[-0.03em]">{tool.name} is a Premium tool</h2>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">{tool.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink href="/app/membership" variant="accent">
              <Crown /> See Premium plans
            </ButtonLink>
            <ButtonLink href="/app/tools?access=free" variant="secondary">
              Browse free tools
            </ButtonLink>
          </div>
          <p className="mt-4 text-[12.5px] text-ink-3">Membership is optional. Every free tool stays free.</p>
        </div>
        <div className="rounded-[14px] border border-line bg-surface p-5">
          <p className="text-[13px] font-medium">What you get with this tool</p>
          <ul className="mt-3 space-y-2.5">
            {tool.highlights.map((h) => (
              <li key={h} className="flex gap-2.5 text-[14px] text-ink-2">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

export function PlannedTool({ tool, backHref }: { tool: Tool; backHref: string }) {
  return (
    <Panel className="p-8 md:p-10">
      <span className="inline-grid size-11 place-items-center rounded-xl border border-line bg-sunken text-ink-2">
        <Hourglass className="size-5" strokeWidth={1.75} />
      </span>
      <h2 className="mt-5 text-[22px] font-semibold tracking-[-0.03em]">Planned for a future release</h2>
      <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-2">
        {tool.name} isn&apos;t available yet. We list it so you know what&apos;s coming — there&apos;s nothing to sign up for and no date
        promised. In the meantime, these available tools cover similar ground.
      </p>
      <ButtonLink href={backHref} variant="secondary" className="mt-6">
        Browse available tools <ArrowRight />
      </ButtonLink>
    </Panel>
  );
}
