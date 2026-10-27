import type { Metadata } from "next";
import { MarketplaceBrowser } from "@/components/catalog/marketplace-browser";
import { PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { requireUser } from "@/lib/server/auth";
import { getCategories, getPublishedProducts, toBrowserProduct } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Marketplace" };

export default async function AppMarketplacePage() {
  const user = await requireUser("/app/marketplace");
  const [products, categories, owned] = await Promise.all([
    getPublishedProducts(),
    getCategories(),
    db.digitalEntitlement.findMany({ where: { userId: user.id, revokedAt: null }, select: { productId: true } }),
  ]);
  return (
    <div>
      <PageHeader title="Marketplace" description="Templates, toolkits and guides. One-time purchases are yours to keep." />
      <MarketplaceBrowser
        products={products.map(toBrowserProduct)}
        categories={categories.filter((c) => c._count.products > 0)}
        hrefBase="/app/marketplace"
        ownedIds={owned.map((o) => o.productId)}
      />
    </div>
  );
}
