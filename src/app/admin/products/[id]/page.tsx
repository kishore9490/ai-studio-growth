import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, ArrowUpRight, FileText, RotateCcw, Send, Undo2 } from "lucide-react";
import { setProductStatus } from "@/actions/admin/catalog";
import { paiseToRupeeString } from "@/actions/admin/utils";
import { SampleBadge } from "@/components/admin/bits";
import { ActionButton } from "@/components/admin/controls";
import { ProductForm } from "@/components/admin/product-form";
import { ARTWORK_KEYS } from "@/components/product-art";
import { ProductStatusBadge } from "@/components/status-badges";
import { buttonClasses } from "@/components/ui/button";
import { Callout, PageHeader, Panel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { requireAdmin } from "@/lib/server/auth";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit product · Admin" };

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const [product, categories, sales] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { assets: true } }),
    db.productCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.orderItem.count({ where: { productId: id, order: { status: "PAID" } } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
        <ArrowLeft className="size-3.5" /> Products
      </Link>
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <ProductStatusBadge status={product.status} />
            <SampleBadge sample={product.isSampleData} />
          </span>
        }
        title={product.name}
        description={`${sales} paid sale${sales === 1 ? "" : "s"} · created ${formatDate(product.createdAt)}${product.publishedAt ? ` · first published ${formatDate(product.publishedAt)}` : ""}`}
        actions={
          <>
            {product.status === "PUBLISHED" && (
              <Link href={`/marketplace/${product.slug}`} target="_blank" className={buttonClasses("ghost", "sm")}>
                View live <ArrowUpRight />
              </Link>
            )}
            {product.status === "DRAFT" && (
              <ActionButton action={setProductStatus.bind(null, product.id, "PUBLISHED")} variant="accent">
                <Send /> Publish
              </ActionButton>
            )}
            {product.status === "PUBLISHED" && (
              <ActionButton
                action={setProductStatus.bind(null, product.id, "DRAFT")}
                confirm={{
                  title: "Unpublish this product?",
                  description: "It will disappear from the marketplace. Customers who own it keep access to their downloads.",
                  confirmLabel: "Move to draft",
                  confirmVariant: "primary",
                }}
              >
                <Undo2 /> Unpublish
              </ActionButton>
            )}
            {product.status !== "ARCHIVED" ? (
              <ActionButton
                action={setProductStatus.bind(null, product.id, "ARCHIVED")}
                confirm={{
                  title: "Archive this product?",
                  description: "Archived products are hidden from the marketplace and can't be purchased. Existing owners keep access. You can restore it later.",
                  confirmLabel: "Archive",
                }}
              >
                <Archive /> Archive
              </ActionButton>
            ) : (
              <ActionButton action={setProductStatus.bind(null, product.id, "DRAFT")}>
                <RotateCcw /> Restore as draft
              </ActionButton>
            )}
          </>
        }
      />
      {sp.created && (
        <Callout tone="success" className="mb-6" title="Draft created">
          Review the listing, then publish it when it&apos;s ready.
        </Callout>
      )}

      <ProductForm
        categories={categories}
        artworkKeys={ARTWORK_KEYS}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          tagline: product.tagline,
          description: product.description,
          categoryId: product.categoryId,
          price: paiseToRupeeString(product.priceInPaise),
          format: product.format,
          licence: product.licence,
          licenceSummary: product.licenceSummary,
          includes: product.includes.join("\n"),
          fileFormats: product.fileFormats.join(", "),
          artwork: product.artwork,
          accentHue: product.accentHue,
          includedWithPremium: product.includedWithPremium,
          commissionEligible: product.commissionEligible,
          featured: product.featured,
        }}
      />

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold">Downloadable files</h2>
        <Panel className="divide-y divide-line">
          {product.assets.length === 0 ? (
            <p className="p-4 text-sm text-ink-3">No files attached.</p>
          ) : (
            product.assets.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <FileText className="size-4 text-ink-3" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{a.label}</p>
                  <p className="font-mono text-[12px] text-ink-3">
                    {a.storageKey} · {a.mimeType} · {(a.sizeBytes / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ))
          )}
        </Panel>
        <p className="mt-2 text-[12.5px] text-ink-3">
          Files live in private storage and are only served through expiring, signed download links. Uploading new files from the admin is a
          production TODO (connect object storage such as S3 or R2 with private buckets).
        </p>
      </section>
    </div>
  );
}
