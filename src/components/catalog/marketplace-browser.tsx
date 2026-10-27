"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Crown, LayoutGrid, List, Search, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { ProductCard, ProductRow, type ProductCardData } from "./product-card";

export type BrowserProduct = ProductCardData & { id: string; description: string; publishedAt: string | null; featured: boolean; category: { name: string; slug: string } };

type Sort = "featured" | "newest" | "price-asc" | "price-desc" | "name";

const VIEW_KEY = "lifeos.marketplace.view";
const viewListeners = new Set<() => void>();
const readView = () => {
  try {
    return (localStorage.getItem(VIEW_KEY) as "grid" | "list") ?? "grid";
  } catch {
    return "grid";
  }
};

export function MarketplaceBrowser({
  products,
  categories,
  hrefBase,
  ownedIds = [],
}: {
  products: BrowserProduct[];
  categories: { slug: string; name: string }[];
  hrefBase: string;
  ownedIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [premiumOnly, setPremiumOnly] = useState(false);
  const view = useSyncExternalStore(
    (cb) => {
      viewListeners.add(cb);
      return () => viewListeners.delete(cb);
    },
    readView,
    () => "grid" as const,
  );
  const setView = (v: "grid" | "list") => {
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* not persisted */
    }
    viewListeners.forEach((l) => l());
  };
  const owned = useMemo(() => new Set(ownedIds), [ownedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (category === "all" || p.category.slug === category) &&
        (!premiumOnly || p.includedWithPremium) &&
        (!q || [p.name, p.tagline, p.description, p.category.name, p.format].some((f) => f.toLowerCase().includes(q))),
    );
    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.priceInPaise - b.priceInPaise);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.priceInPaise - a.priceInPaise);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return sorted;
  }, [products, query, category, sort, premiumOnly]);

  const reset = () => {
    setQuery("");
    setCategory("all");
    setPremiumOnly(false);
  };
  const filtersActive = query || category !== "all" || premiumOnly;

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates, toolkits, guides…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products" className="w-auto min-w-44">
            <option value="featured">Featured first</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </Select>
          <button
            type="button"
            aria-pressed={premiumOnly}
            onClick={() => setPremiumOnly((v) => !v)}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] border px-3 text-sm transition-colors",
              premiumOnly ? "border-accent/40 bg-lavender text-accent-ink" : "border-line bg-surface text-ink-2 hover:border-line-strong",
            )}
          >
            <Crown className="size-3.5" /> In Premium
          </button>
          <div className="flex rounded-[var(--radius-control)] border border-line bg-surface p-0.5" role="group" aria-label="Layout">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                aria-label={v === "grid" ? "Grid view" : "List view"}
                onClick={() => setView(v)}
                className={cn("grid size-[34px] place-items-center rounded-[8px] transition-colors", view === v ? "bg-sunken text-ink" : "text-ink-3 hover:text-ink")}
              >
                {v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Categories">
        {[{ slug: "all", name: "All products" }, ...categories].map((c) => (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={category === c.slug}
            onClick={() => setCategory(c.slug)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors",
              category === c.slug ? "bg-ink text-white" : "border border-line bg-surface text-ink-2 hover:text-ink",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-[13px] text-ink-3">
        <p aria-live="polite">
          {filtered.length} product{filtered.length === 1 ? "" : "s"}
        </p>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X /> Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={SearchX}
          title={query ? `No products match “${query}”` : "No products in this view"}
          description="Try a different search term, choose another category, or clear the filters."
          action={
            <Button variant="secondary" size="sm" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} href={`${hrefBase}/${p.slug}`} owned={owned.has(p.id)} />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-1 rounded-[var(--radius-panel)] border border-line bg-canvas p-1.5">
          {filtered.map((p) => (
            <ProductRow key={p.id} product={p} href={`${hrefBase}/${p.slug}`} owned={owned.has(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
