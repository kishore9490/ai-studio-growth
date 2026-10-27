import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { CheckoutButton, RemoveFromCartButton } from "@/components/commerce/cart-actions";
import { PriceBreakdown } from "@/components/commerce/order-summary";
import { ProductArt } from "@/components/product-art";
import { ButtonLink } from "@/components/ui/button";
import { Callout, EmptyState, PageHeader, Panel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { computeOrderTotals } from "@/lib/domain/pricing";
import { requireUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await requireUser("/app/cart");
  const [items, settings] = await Promise.all([
    db.cartItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { product: { include: { category: { select: { name: true } } } } },
    }),
    db.platformSettings.findUniqueOrThrow({ where: { id: 1 } }),
  ]);
  const available = items.filter((i) => i.product.status === "PUBLISHED");
  const unavailable = items.filter((i) => i.product.status !== "PUBLISHED");
  const totals = computeOrderTotals(available.map((i) => ({ unitPriceInPaise: i.product.priceInPaise, quantity: 1 })), settings.taxRateBps);

  return (
    <div>
      <PageHeader title="Cart" description="Digital products are delivered to your library as soon as payment is confirmed." />
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the marketplace for templates, toolkits and guides."
          action={<ButtonLink href="/app/marketplace">Browse the marketplace</ButtonLink>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {unavailable.length > 0 && (
              <Callout tone="warning" title="Some items are no longer available">
                They won&apos;t be included at checkout. You can remove them below.
              </Callout>
            )}
            <Panel className="divide-y divide-line">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-4 p-4">
                  <ProductArt artwork={i.product.artwork} hue={i.product.accentHue} className="aspect-[4/3] w-24 shrink-0 rounded-[10px] border border-line" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-3">
                      {i.product.category.name} · {i.product.format} · {i.product.licence === "COMMERCIAL" ? "Commercial licence" : "Personal licence"}
                    </p>
                    <Link href={`/app/marketplace/${i.product.slug}`} className="block truncate font-medium hover:underline">
                      {i.product.name}
                    </Link>
                    <p className="text-[12.5px] text-ink-3">
                      {i.product.status === "PUBLISHED" ? "One-time purchase · yours to keep" : "Unavailable"}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">{formatINR(i.product.priceInPaise)}</p>
                  <RemoveFromCartButton productId={i.productId} name={i.product.name} />
                </div>
              ))}
            </Panel>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Panel className="p-5">
              <h2 className="text-[15px] font-semibold">Order summary</h2>
              <div className="mt-4">
                <PriceBreakdown {...totals} taxLabel={settings.taxLabel} />
              </div>
              <div className="mt-5">
                <CheckoutButton disabled={available.length === 0} />
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
                Tax rate is a configurable placeholder pending confirmation from a tax professional.
              </p>
            </Panel>
          </aside>
        </div>
      )}
    </div>
  );
}
