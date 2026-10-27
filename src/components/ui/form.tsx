import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full bg-surface text-ink placeholder:text-ink-3 border border-line rounded-[var(--radius-control)] transition-[border-color,box-shadow] duration-150 hover:border-line-strong focus:border-accent focus:shadow-[0_0_0_3px_rgb(117_87_246/0.16)] disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgb(176_65_47/0.14)]";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-10 px-3 text-sm", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "px-3 py-2.5 text-sm leading-relaxed resize-y min-h-24", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(control, "h-10 appearance-none pl-3 pr-9 text-sm cursor-pointer", className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-[13px] font-medium text-ink", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
  optional,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional && <span className="text-xs text-ink-3">Optional</span>}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[13px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({ tone = "danger", children }: { tone?: "danger" | "success" | "info"; children: ReactNode }) {
  if (!children) return null;
  const tones = {
    danger: "bg-danger-soft text-danger border-danger/15",
    success: "bg-success-soft text-success border-success/15",
    info: "bg-lavender text-accent-ink border-accent/15",
  };
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-[10px] border px-3.5 py-2.5 text-sm", tones[tone])}>
      {children}
    </div>
  );
}
