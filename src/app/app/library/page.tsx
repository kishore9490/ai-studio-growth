import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Download, FileText, Library, Lock } from "lucide-react";
import { ProductArt } from "@/components/product-art";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Badge, Callout, DemoLabel, EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { getMembership } from "@/lib/core/membership";
import { requireUser } from "@/lib/server/auth";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Library" };

type LibraryProduct = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  artwork: string;
  accentHue: number;
  licenceSummary: string;
  assets: { id: string; label: string; fileName: string; sizeBytes: number }[];
};

function formatBytes(n: number) {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

function LibraryItem({ product, meta }: { product: LibraryProduct; meta: React.ReactNode }) {
  return (
    <article id={product.slug} className="scroll-mt-24 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface target:ring-2 target:ring-accent/40">
      <div className="grid grid-cols-1 gap-0 md:grid-cols-[220px_1fr]">
        <ProductArt artwork={product.artwork} hue={product.accentHue} className="aspect-[4/3] w-full border-b border-line md:aspect-auto md:h-full md:border-b-0 md:border-r" />
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">{meta}</div>
          <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.02em]">
            <Link href={`/app/marketplace/${product.slug}`} className="hover:underline">
              {product.name}
            </Link>
          </h2>
          <p className="mt-0.5 text-[13.5px] text-ink-2">{product.tagline}</p>
          <ul className="mt-4 divide-y divide-line rounded-[12px] border border-line">
            {product.assets.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <FileText className="size-4 shrink-0 text-ink-3" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium">{a.label}</span>
                  <span className="block truncate text-[12px] text-ink-3">
                    {a.fileName} · {formatBytes(a.sizeBytes)}
                  </span>
                </span>
                {/* Plain link: the route checks access and redirects to an expiring signed URL. */}
                <a href={`/api/downloads/${a.id}`} className={buttonClasses("secondary", "sm")} download>
                  <Download /> Download
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-ink-3">Licence: {product.licenceSummary}</p>
        </div>
      </div>
    </article>
  );
}

export default async function LibraryPage() {
  const user = await requireUser("/app/library");
  const [entitlements, membership, revoked] = await Promise.all([
    db.digitalEntitlement.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: { grantedAt: "desc" },
      include: { product: { include: { assets: { orderBy: { createdAt: "asc" } } } } },
    }),
    getMembership(user.id),
    db.digitalEntitlement.count({ where: { userId: user.id, revokedAt: { not: null } } }),
  ]);
  const ownedIds = new Set(entitlements.map((e) => e.productId));
  const premiumProducts = await db.product.findMany({
    where: { includedWithPremium: true, status: "PUBLISHED", id: { notIn: [...ownedIds] } },
    include: { assets: { orderBy: { createdAt: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="My Library"
        description="Everything you own or can access. Downloads use secure links that expire after five minutes."
        actions={<ButtonLink href="/app/orders" variant="secondary">Order history</ButtonLink>}
      />

      {revoked > 0 && (
        <Callout tone="neutral" className="mb-6">
          {revoked} item{revoked === 1 ? " was" : "s were"} removed from your library after a refund. See your order history for details.
        </Callout>
      )}

      <section aria-labelledby="owned">
        <h2 id="owned" className="mb-4 text-[15px] font-semibold">
          Purchased <span className="font-normal text-ink-3">· {entitlements.length}</span>
        </h2>
        {entitlements.length === 0 ? (
          <EmptyState
            icon={Library}
            title="No purchases yet"
            description="Products you buy — or claim for free — appear here with their downloads."
            action={<ButtonLink href="/app/marketplace" size="sm">Browse the marketplace</ButtonLink>}
          />
        ) : (
          <div className="space-y-4">
            {entitlements.map((e) => (
              <LibraryItem
                key={e.id}
                product={e.product}
                meta={
                  <>
                    <Badge tone="dark">Owned</Badge>
                    <span className="text-[12px] text-ink-3">{e.source === "ADMIN_GRANT" ? "Granted" : "Added"} {formatDate(e.grantedAt)}</span>
                    {e.isTest && <DemoLabel>Test purchase</DemoLabel>}
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="premium" className="mt-14">
        <h2 id="premium" className="mb-1 flex items-center gap-2 text-[15px] font-semibold">
          <Crown className="size-4 text-accent" /> Included with Premium
        </h2>
        <p className="mb-4 text-[13.5px] text-ink-2">Available while your Premium membership is active. Buy a product outright to keep it permanently.</p>
        {membership.isPremium ? (
          premiumProducts.length === 0 ? (
            <p className="text-sm text-ink-3">You already own every Premium-included product.</p>
          ) : (
            <div className="space-y-4">
              {premiumProducts.map((p) => (
                <LibraryItem key={p.id} product={p} meta={<Badge tone="accent" icon={Crown}>Premium access</Badge>} />
              ))}
            </div>
          )
        ) : (
          <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-lavender text-accent-ink">
                  <Lock className="size-[18px]" />
                </span>
                <div>
                  <p className="font-medium">{premiumProducts.length} products are included with Premium</p>
                  <p className="mt-0.5 text-[13.5px] text-ink-2">{premiumProducts.map((p) => p.name).join(", ")}</p>
                </div>
              </div>
              <ButtonLink href="/app/membership" className="shrink-0">
                See Premium
              </ButtonLink>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
