import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/catalog/product-detail";
import type { PurchaseState } from "@/components/catalog/purchase-panel";
import { db } from "@/lib/core/db";
import { getMembership } from "@/lib/core/membership";
import { recordView } from "@/lib/server/activity";
import { requireUser } from "@/lib/server/auth";
import { getProductBySlug, getProductPreview } from "@/lib/server/catalog";

export async function generateMetadata(props: PageProps<"/app/marketplace/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Product not found" };
}

export default async function AppProductPage(props: PageProps<"/app/marketplace/[slug]">) {
  const { slug } = await props.params;
  const user = await requireUser(`/app/marketplace/${slug}`);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [preview, entitlement, inCart, membership] = await Promise.all([
    getProductPreview(product.id),
    db.digitalEntitlement.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }),
    db.cartItem.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }),
    getMembership(user.id),
  ]);
  recordView(user.id, "PRODUCT", product.id);

  let state: PurchaseState;
  if (entitlement && !entitlement.revokedAt) state = { kind: "owned" };
  else if (product.includedWithPremium && membership.isPremium) state = { kind: "premium-access" };
  else if (inCart) state = { kind: "in-cart" };
  else state = { kind: "available", isPremium: membership.isPremium };

  return <ProductDetail product={product} preview={preview} state={state} catalogHref="/app/marketplace" />;
}
