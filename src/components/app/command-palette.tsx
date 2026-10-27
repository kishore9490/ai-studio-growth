"use client";

import { Dialog as D } from "radix-ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpen, CornerDownLeft, FileText, Loader2, Search, ShoppingBag, Wrench } from "lucide-react";
import { Kbd } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export type SearchResult = { id: string; type: "tool" | "product" | "resource" | "page"; title: string; subtitle: string; href: string };

const TYPE_META = {
  tool: { label: "Tools", icon: Wrench },
  product: { label: "Marketplace", icon: ShoppingBag },
  resource: { label: "Resources", icon: BookOpen },
  page: { label: "Pages", icon: FileText },
} as const;

export function CommandPalette({ scope = "app" }: { scope?: "app" | "admin" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&scope=${scope}`, { signal: controller.signal });
        if (res.ok) {
          setResults((await res.json()).results);
          setActive(0);
        }
      } catch {
        /* aborted or offline — keep previous results */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 140);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, open, scope]);

  const go = useCallback(
    (r: SearchResult) => {
      setOpen(false);
      setQuery("");
      router.push(r.href);
    },
    [router],
  );

  const grouped = useMemo(() => {
    const order: SearchResult["type"][] = ["page", "tool", "product", "resource"];
    return order.map((type) => ({ type, items: results.filter((r) => r.type === type) })).filter((g) => g.items.length);
  }, [results]);
  const flat = grouped.flatMap((g) => g.items);

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Trigger asChild>
        <button
          type="button"
          className="flex h-9 w-full max-w-[420px] items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-[13.5px] text-ink-3 shadow-soft transition-colors hover:border-line-strong"
        >
          <Search className="size-4" />
          <span className="flex-1 truncate text-left">{scope === "admin" ? "Search members, orders, admin pages…" : "Search tools, products, resources…"}</span>
          <span className="hidden items-center gap-0.5 sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </D.Trigger>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 animate-fade-in bg-ink/25 backdrop-blur-[2px]" />
        <D.Content
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-24px)] max-w-[600px] -translate-x-1/2 animate-fade-up overflow-hidden rounded-[18px] border border-line bg-surface shadow-float focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, flat.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && flat[active]) {
              e.preventDefault();
              go(flat[active]);
            }
          }}
        >
          <D.Title className="sr-only">Search</D.Title>
          <D.Description className="sr-only">Search tools, marketplace products, resources and pages.</D.Description>
          <div className="flex items-center gap-3 border-b border-line px-4">
            {loading ? <Loader2 className="size-4 animate-spin text-ink-3" /> : <Search className="size-4 text-ink-3" />}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={scope === "admin" ? "Search members by name or email, orders by number…" : "Search LifeOS…"}
              className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3"
              role="combobox"
              aria-expanded
              aria-controls="search-results"
              aria-activedescendant={flat[active] ? `sr-${flat[active].id}` : undefined}
            />
            <Kbd>Esc</Kbd>
          </div>
          <div ref={listRef} id="search-results" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
            {!loading && flat.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-medium">No matches for “{query}”</p>
                <p className="mt-1 text-[13px] text-ink-3">Try a broader term like “resume”, “budget” or “templates”.</p>
              </div>
            )}
            {grouped.map((g) => {
              const meta = TYPE_META[g.type];
              return (
                <div key={g.type} className="mb-1">
                  <p className="px-2.5 pb-1 pt-2 text-[11.5px] font-medium text-ink-3">{meta.label}</p>
                  {g.items.map((r) => {
                    const idx = flat.indexOf(r);
                    return (
                      <button
                        type="button"
                        key={r.id}
                        id={`sr-${r.id}`}
                        role="option"
                        aria-selected={idx === active}
                        onMouseMove={() => setActive(idx)}
                        onClick={() => go(r)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left",
                          idx === active ? "bg-sunken" : "",
                        )}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-[8px] border border-line bg-surface text-ink-2">
                          <meta.icon className="size-4" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">{r.title}</span>
                          <span className="block truncate text-[12px] text-ink-3">{r.subtitle}</span>
                        </span>
                        {idx === active ? <CornerDownLeft className="size-3.5 text-ink-3" /> : <ArrowRight className="size-3.5 text-transparent" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
