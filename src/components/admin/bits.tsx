import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function SampleBadge({ sample, test }: { sample?: boolean; test?: boolean }) {
  if (!sample && !test) return null;
  return (
    <span className="inline-flex gap-1">
      {test && <Badge tone="warning">Test</Badge>}
      {sample && <Badge tone="outline">Sample</Badge>}
    </span>
  );
}

/** Plain GET form so filters work without JavaScript and are shareable as URLs. */
export function FilterBar({
  action,
  search,
  selects = [],
  children,
}: {
  action: string;
  search?: { name: string; value?: string; placeholder: string };
  selects?: { name: string; label: string; value?: string; options: { value: string; label: string }[] }[];
  children?: ReactNode;
}) {
  return (
    <form method="get" action={action} className="mb-5 flex flex-wrap items-end gap-2" role="search">
      {search && (
        <div className="min-w-[220px] flex-1">
          <label htmlFor={`f-${search.name}`} className="sr-only">
            {search.placeholder}
          </label>
          <Input id={`f-${search.name}`} name={search.name} defaultValue={search.value} placeholder={search.placeholder} type="search" />
        </div>
      )}
      {selects.map((s) => (
        <div key={s.name} className="w-[180px]">
          <label htmlFor={`f-${s.name}`} className="sr-only">
            {s.label}
          </label>
          <Select id={`f-${s.name}`} name={s.name} defaultValue={s.value ?? ""} aria-label={s.label}>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      ))}
      {children}
      <button type="submit" className={buttonClasses("primary", "md")}>
        Apply
      </button>
      <Link href={action} className={buttonClasses("ghost", "md")}>
        Reset
      </Link>
    </form>
  );
}

export function Pagination({ page, pageSize, total, href }: { page: number; pageSize: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return <p className="mt-4 text-[13px] text-ink-3">{total} result{total === 1 ? "" : "s"}</p>;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-[13px] text-ink-3">
      <p>
        Page {page} of {pages} · {total} results
      </p>
      <div className="flex gap-1.5">
        <Link
          aria-disabled={page <= 1}
          href={href(Math.max(1, page - 1))}
          className={cn(buttonClasses("secondary", "sm"), page <= 1 && "pointer-events-none opacity-50")}
        >
          <ChevronLeft /> Previous
        </Link>
        <Link
          aria-disabled={page >= pages}
          href={href(Math.min(pages, page + 1))}
          className={cn(buttonClasses("secondary", "sm"), page >= pages && "pointer-events-none opacity-50")}
        >
          Next <ChevronRight />
        </Link>
      </div>
    </nav>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-[13.5px]">
      <dt className="text-ink-3">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

export function StatTile({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "test" }) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-ink-2">{label}</p>
        {tone === "test" && <Badge tone="warning">Test</Badge>}
      </div>
      <p className="mt-2 text-[26px] font-semibold tabular-nums tracking-[-0.03em]">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function JsonDetails({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-ink-3">—</span>;
  const text = JSON.stringify(value, null, 2);
  const preview = JSON.stringify(value);
  return (
    <details className="group max-w-[420px]">
      <summary className="cursor-pointer list-none truncate font-mono text-[12px] text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="text-ink-3 group-open:hidden">▸ </span>
        <span className="hidden text-ink-3 group-open:inline">▾ </span>
        {preview.length > 70 ? `${preview.slice(0, 70)}…` : preview}
      </summary>
      <pre className="mt-2 max-h-72 overflow-auto rounded-[10px] border border-line bg-[#fbfaf8] p-3 font-mono text-[11.5px] leading-relaxed text-ink-2">{text}</pre>
    </details>
  );
}

export function parsePage(v: string | string[] | undefined) {
  const n = Number(typeof v === "string" ? v : "1");
  return Number.isInteger(n) && n > 0 ? Math.min(n, 1000) : 1;
}

export function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v.trim().slice(0, 100) : "";
}

export function qs(base: string, params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}
