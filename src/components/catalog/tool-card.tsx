import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import { ToolIcon } from "@/components/tool-icon";
import { Badge } from "@/components/ui/misc";
import { getToolCategory, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function AccessBadge({ access, status }: { access: Tool["access"]; status?: Tool["status"] }) {
  if (status === "planned") return <Badge tone="neutral">Planned</Badge>;
  return access === "premium" ? (
    <Badge tone="accent" icon={Crown}>
      Premium
    </Badge>
  ) : (
    <Badge tone="success">Free</Badge>
  );
}

export function ToolCard({ tool, href, className, cta = "Open tool" }: { tool: Tool; href: string; className?: string; cta?: string }) {
  const category = getToolCategory(tool.category);
  const planned = tool.status === "planned";
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-[var(--radius-panel)] border border-line bg-surface p-5 transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-lift",
        planned && "bg-surface/60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <ToolIcon icon={tool.icon} hue={tool.hue} />
        <AccessBadge access={tool.access} status={tool.status} />
      </div>
      <p className="mt-5 text-xs text-ink-3">{category?.name}</p>
      <h3 className="mt-1 text-[15.5px] font-semibold tracking-[-0.015em]">{tool.name}</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{tool.tagline}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-medium text-ink">
        {planned ? "View details" : cta}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
