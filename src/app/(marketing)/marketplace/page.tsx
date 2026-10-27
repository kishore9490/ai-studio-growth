import type { Metadata } from "next";
import { MarketplaceBrowser } from "@/components/catalog/marketplace-browser";
import { getCategories, getPublishedProducts, toBrowserProduct } from "@/lib/server/catalog";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Templates, toolkits and guides you buy once and keep, with clear licences and contents.",
};

export default async function MarketplacePage() {
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategories()]);
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-14 sm:px-6">
      <div className="max-w-2xl">
        <p className="eyebrow">Marketplace</p>
        <h1 className="text-headline mt-3">
          Digital products, <span className="serif-accent">explained plainly.</span>
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
          Buy once, keep forever. Each listing shows exactly what&apos;s inside, the file formats, and how you&apos;re allowed to
          use it. Some products are also included with Premium.
        </p>
      </div>
      <div className="mt-12">
        <MarketplaceBrowser
          products={products.map(toBrowserProduct)}
          categories={categories.filter((c) => c._count.products > 0)}
          hrefBase="/marketplace"
        />
      </div>
    </div>
  );
}
