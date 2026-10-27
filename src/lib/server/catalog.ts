import "server-only";
import { readFile } from "node:fs/promises";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/core/db";
import { resolveStoragePath } from "./storage";

// Public catalogue reads. These are shared by every visitor, so they are
// cached and tagged; admin mutations call updateTag(CATALOG_TAG).

export const CATALOG_TAG = "catalog";
export const PLANS_TAG = "plans";
export const RESOURCES_TAG = "resources";

const productSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  description: true,
  priceInPaise: true,
  format: true,
  licence: true,
  licenceSummary: true,
  includes: true,
  fileFormats: true,
  artwork: true,
  accentHue: true,
  includedWithPremium: true,
  featured: true,
  isSampleData: true,
  publishedAt: true,
  category: { select: { slug: true, name: true } },
  assets: { select: { id: true, label: true, fileName: true, mimeType: true, sizeBytes: true } },
} as const;

export type CatalogProduct = Awaited<ReturnType<typeof getPublishedProducts>>[number];

export async function getPublishedProducts() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db.product.findMany({
    where: { status: "PUBLISHED" },
    select: productSelect,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
  });
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db.product.findFirst({ where: { slug, status: "PUBLISHED" }, select: productSelect });
}

export async function getCategories() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db.productCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, description: true, _count: { select: { products: { where: { status: "PUBLISHED" } } } } },
  });
}

export async function getPlans() {
  "use cache";
  cacheTag(PLANS_TAG);
  cacheLife("hours");
  return db.membershipPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

export async function getResourceCollections() {
  "use cache";
  cacheTag(RESOURCES_TAG);
  cacheLife("hours");
  return db.resourceCollection.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { publishedAt: "desc" },
        select: { id: true, slug: true, title: true, summary: true, kind: true, access: true, readingMinutes: true, publishedAt: true },
      },
    },
  });
}

export async function getResourceBySlug(slug: string) {
  "use cache";
  cacheTag(RESOURCES_TAG);
  cacheLife("hours");
  return db.resourceItem.findUnique({ where: { slug }, include: { collection: { select: { slug: true, title: true, accentHue: true } } } });
}

/** Serialisable shape for client-side catalogue browsing. */
export function toBrowserProduct(p: CatalogProduct) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    priceInPaise: p.priceInPaise,
    artwork: p.artwork,
    accentHue: p.accentHue,
    includedWithPremium: p.includedWithPremium,
    format: p.format,
    featured: p.featured,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    category: p.category,
  };
}

/**
 * A short excerpt of a product's first file, shown on the product page so
 * buyers can see the quality before purchasing. Only the opening lines are
 * returned; full files are only reachable through signed download links.
 */
export async function getProductPreview(productId: string) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const asset = await db.productAsset.findFirst({ where: { productId }, orderBy: { createdAt: "asc" } });
  if (!asset) return null;
  try {
    const text = await readFile(resolveStoragePath(asset.storageKey), "utf8");
    const lines = text
      .replace(/<!--[\s\S]*?-->\s*/g, "")
      .split("\n")
      .slice(0, 14);
    return { fileName: asset.fileName, label: asset.label, excerpt: lines.join("\n").trimEnd(), truncated: text.split("\n").length > 14 };
  } catch {
    return null;
  }
}
