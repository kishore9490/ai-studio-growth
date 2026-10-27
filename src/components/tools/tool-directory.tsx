"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import { ToolCard } from "@/components/catalog/tool-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";
import { cn } from "@/lib/utils";

type AccessFilter = "all" | "free" | "premium";

/**
 * Searchable, filterable tool directory. Filter state lives in the URL
 * (?q=&category=&access=) so results can be shared and survive reloads.
 */
export function ToolDirectory({ hrefBase, cta }: { hrefBase: "/tools" | "/app/tools"; cta?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // The query is local state (mirrored to the URL) so typing never waits on a navigation.
  const [q, setQ] = useState(params.get("q") ?? "");
  const category = params.get("category") ?? "all";
  const access = (params.get("access") as AccessFilter) ?? "all";

  const update = (next: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "all") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (access !== "all" && t.access !== access) return false;
      if (!needle) return true;
      const cat = TOOL_CATEGORIES.find((c) => c.slug === t.category)?.name ?? "";
      return [t.name, t.tagline, t.description, cat, ...t.highlights].some((f) => f.toLowerCase().includes(needle));
    }).sort((a, b) => Number(a.status === "planned") - Number(b.status === "planned"));
  }, [q, category, access]);

  const filtered = q || category !== "all" || access !== "all";

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <label htmlFor="tool-search" className="sr-only">
            Search tools
          </label>
          <input
            id="tool-search"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              update({ q: e.target.value });
            }}
            placeholder="Search tools…"
            className="h-10 w-full rounded-[var(--radius-control)] border border-line bg-surface pl-9 pr-3 text-sm shadow-soft transition-[border-color,box-shadow] placeholder:text-ink-3 hover:border-line-strong focus:border-accent focus:shadow-[0_0_0_3px_rgb(117_87_246/0.16)]"
          />
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-1.5" role="group" aria-label="Filter by category">
          {[{ slug: "all", name: "All" }, ...TOOL_CATEGORIES].map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={category === c.slug}
              onClick={() => update({ category: c.slug })}
              className={cn(
                "h-8 rounded-full border px-3 text-[13px] transition-colors",
                category === c.slug ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 rounded-[10px] border border-line bg-surface p-0.5 shadow-soft" role="group" aria-label="Filter by access">
          {(["all", "free", "premium"] as const).map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={access === a}
              onClick={() => update({ access: a })}
              className={cn(
                "h-8 rounded-[8px] px-3 text-[13px] capitalize transition-colors",
                access === a ? "bg-sunken font-medium text-ink" : "text-ink-2 hover:text-ink",
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[13px] text-ink-3" aria-live="polite">
        <span>
          {results.length} tool{results.length === 1 ? "" : "s"}
          {filtered ? " match your filters" : ""}
        </span>
        {filtered && (
          <button type="button" onClick={() => {
              setQ("");
              update({ q: "", category: "all", access: "all" });
            }} className="inline-flex items-center gap-1 hover:text-ink">
            <X className="size-3.5" /> Clear filters
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={SearchX}
          title={q ? `No tools match “${q}”` : "No tools in this view"}
          description="Try a broader search such as “resume”, “plan” or “write”, or clear the filters to see every tool."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQ("");
                update({ q: "", category: "all", access: "all" });
              }}
            >
              Show all tools
            </Button>
          }
        />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t) => (
            <ToolCard key={t.slug} tool={t} href={`${hrefBase}/${t.slug}`} cta={cta} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ToolDirectorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading tools">
      <div className="h-10 w-80 max-w-full rounded-[10px] skeleton" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[196px] rounded-[var(--radius-panel)] border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
