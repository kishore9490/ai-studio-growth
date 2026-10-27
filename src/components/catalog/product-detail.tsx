import Link from "next/link";
import { ChevronRight, FileText, FlaskConical, Layers, ScrollText, ShieldCheck } from "lucide-react";
import { ProductArt } from "@/components/product-art";
import { Badge, DemoLabel } from "@/components/ui/misc";
import type { CatalogProduct } from "@/lib/server/catalog";
import { PurchasePanel, type PurchaseState } from "./purchase-panel";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function ProductDetail({
  product,
  preview,
  state,
  catalogHref,
}: {
  product: CatalogProduct;
  preview: { fileName: string; label: string; excerpt: string; truncated: boolean } | null;
  state: PurchaseState;
  catalogHref: string;
}) {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-[13px] text-ink-3">
        <Link href={catalogHref} className="hover:text-ink">
          Marketplace
        </Link>
        <ChevronRight className="size-3.5" />
        <span>{product.category.name}</span>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-ink-2">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <ProductArt
            artwork={product.artwork}
            hue={product.accentHue}
            label={`Illustration for ${product.name}`}
            className="aspect-[16/10] w-full rounded-[22px] border border-line"
          />

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="outline">{product.category.name}</Badge>
              <Badge tone="outline">{product.format}</Badge>
              <Badge tone="outline">{product.licence === "COMMERCIAL" ? "Commercial licence" : "Personal licence"}</Badge>
              {product.isSampleData && <DemoLabel>Sample product</DemoLabel>}
            </div>
            <h1 className="mt-4 text-[36px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[42px]">{product.name}</h1>
            <p className="mt-3 text-[18px] leading-relaxed text-ink-2">{product.tagline}</p>
            <p className="mt-6 max-w-2xl text-[15.5px] leading-[1.7] text-ink">{product.description}</p>
          </div>

          <div className="mt-10 grid gap-8 border-t border-line pt-8 md:grid-cols-2">
            <section>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                <Layers className="size-4 text-ink-3" /> What&apos;s included
              </h2>
              <ul className="mt-4 space-y-2.5">
                {product.includes.map((i) => (
                  <li key={i} className="flex gap-2.5 text-[14.5px] text-ink-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {i}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                <FileText className="size-4 text-ink-3" /> Files
              </h2>
              <ul className="mt-4 divide-y divide-line rounded-[14px] border border-line bg-surface">
                {product.assets.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13.5px]">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{a.label}</span>
                      <span className="block truncate text-[12px] text-ink-3">{a.fileName}</span>
                    </span>
                    <span className="shrink-0 text-[12px] text-ink-3">{formatBytes(a.sizeBytes)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12.5px] text-ink-3">Formats: {product.fileFormats.join(", ")}</p>
            </section>
          </div>

          {preview && (
            <section className="mt-10 border-t border-line pt-8">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                <ScrollText className="size-4 text-ink-3" /> Preview
              </h2>
              <p className="mt-1 text-[13px] text-ink-3">The opening lines of “{preview.label}”.</p>
              <div className="relative mt-4 overflow-hidden rounded-[14px] border border-line bg-surface">
                <div className="flex items-center justify-between border-b border-line bg-[#fbfaf8] px-4 py-2 text-[12px] text-ink-3">
                  <span className="font-mono">{preview.fileName}</span>
                  <span>Read-only excerpt</span>
                </div>
                <pre className="max-h-80 overflow-hidden whitespace-pre-wrap px-4 py-4 font-mono text-[12.5px] leading-relaxed text-ink-2">{preview.excerpt}</pre>
                {preview.truncated && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent" />}
              </div>
            </section>
          )}

          <section className="mt-10 rounded-[16px] border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <ShieldCheck className="size-4 text-ink-3" /> Licence
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{product.licenceSummary}</p>
            <p className="mt-3 text-[13px] text-ink-3">
              Digital products are delivered instantly to your library. See the{" "}
              <Link href="/legal/refund-policy" className="underline underline-offset-2 hover:text-ink">
                Refund Policy
              </Link>{" "}
              for cancellations.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PurchasePanel
            productId={product.id}
            slug={product.slug}
            priceInPaise={product.priceInPaise}
            includedWithPremium={product.includedWithPremium}
            state={state}
          />
          {(process.env.PAYMENT_PROVIDER ?? "mock") === "mock" && (
            <p className="mt-4 flex items-start gap-2 px-1 text-[12.5px] leading-relaxed text-ink-3">
              <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
              Checkout currently uses a development mock payment provider. Access is granted only after the payment is confirmed on the server.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
