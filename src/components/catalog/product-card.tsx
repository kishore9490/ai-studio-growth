import Link from "next/link";
import { ArrowUpRight, Crown } from "lucide-react";
import { ProductArt } from "@/components/product-art";
import { Badge } from "@/components/ui/misc";
import { formatINR } from "@/lib/domain/money";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  slug: string;
  name: string;
  tagline: string;
  priceInPaise: number;
  artwork: string;
  accentHue: number;
  includedWithPremium: boolean;
  format: string;
  category: { name: string };
};

export function PriceTag({ priceInPaise, className }: { priceInPaise: number; className?: string }) {
  return (
    <span className={cn("font-medium tabular-nums", className)}>{priceInPaise === 0 ? "Free" : formatINR(priceInPaise)}</span>
  );
}

export function ProductCard({
  product,
  href,
  owned,
  className,
}: {
  product: ProductCardData;
  href: string;
  owned?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
        className,
      )}
    >
      <div className="relative">
        <ProductArt artwork={product.artwork} hue={product.accentHue} className="aspect-[4/3] w-full" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {owned && <Badge tone="dark">Owned</Badge>}
          {product.includedWithPremium && product.priceInPaise > 0 && (
            <Badge tone="outline" icon={Crown} className="bg-surface/90 backdrop-blur">
              In Premium
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-line p-4">
        <p className="text-xs text-ink-3">
          {product.category.name} · {product.format}
        </p>
        <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.015em]">{product.name}</h3>
        <p className="line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">{product.tagline}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <PriceTag priceInPaise={product.priceInPaise} className="text-[15px]" />
          <span className="inline-flex items-center gap-1 text-[13px] text-ink-3 transition-colors group-hover:text-ink">
            Details <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductRow({ product, href, owned }: { product: ProductCardData; href: string; owned?: boolean }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-[14px] border border-transparent p-2.5 transition-colors hover:border-line hover:bg-surface"
    >
      <ProductArt artwork={product.artwork} hue={product.accentHue} className="aspect-[4/3] w-28 shrink-0 rounded-[10px] border border-line" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-3">
          {product.category.name} · {product.format}
        </p>
        <p className="truncate font-medium tracking-[-0.01em]">{product.name}</p>
        <p className="truncate text-[13px] text-ink-2">{product.tagline}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <PriceTag priceInPaise={product.priceInPaise} />
        {owned ? <Badge tone="dark">Owned</Badge> : product.includedWithPremium && product.priceInPaise > 0 ? <Badge tone="accent">In Premium</Badge> : null}
      </div>
    </Link>
  );
}
