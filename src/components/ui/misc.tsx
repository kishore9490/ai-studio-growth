import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn, initials } from "@/lib/utils";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "outline" | "dark";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-sunken text-ink-2",
  accent: "bg-lavender text-accent-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  outline: "border border-line text-ink-2 bg-surface",
  dark: "bg-ink text-white",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  icon: Icon,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium leading-none whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3" aria-hidden />}
      {children}
    </span>
  );
}

export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[var(--radius-panel)] border border-line bg-surface", className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton h-4", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-panel)] border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 grid size-11 place-items-center rounded-xl border border-line bg-surface text-ink-2 shadow-soft">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-2">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({ name, hue = 258, size = 32, className }: { name: string; hue?: number; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-medium text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(140deg, hsl(${hue} 70% 66%), hsl(${(hue + 28) % 360} 62% 48%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line bg-surface px-1 font-sans text-[11px] text-ink-3 shadow-soft">
      {children}
    </kbd>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="text-headline">{title}</h2>
        {description && <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, className }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[13px] text-ink-2">{label}</p>
      <p className="mt-1 text-[26px] font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function DemoLabel({ children = "Demo data", className }: { children?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-warning-soft px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-warning",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-warning" aria-hidden />
      {children}
    </span>
  );
}

export function Callout({
  icon: Icon,
  title,
  children,
  tone = "neutral",
  className,
}: {
  icon?: LucideIcon;
  title?: ReactNode;
  children: ReactNode;
  tone?: "neutral" | "accent" | "warning" | "success" | "danger";
  className?: string;
}) {
  const t = {
    neutral: "bg-sunken border-line text-ink-2",
    accent: "bg-lavender/70 border-accent/15 text-accent-ink",
    warning: "bg-warning-soft border-warning/20 text-[#7a5410]",
    success: "bg-success-soft border-success/20 text-success",
    danger: "bg-danger-soft border-danger/20 text-danger",
  }[tone];
  return (
    <div className={cn("flex gap-3 rounded-[12px] border px-4 py-3 text-sm", t, className)}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <div className="min-w-0">
        {title && <p className="font-medium text-ink">{title}</p>}
        <div className={cn(title && "mt-0.5")}>{children}</div>
      </div>
    </div>
  );
}
