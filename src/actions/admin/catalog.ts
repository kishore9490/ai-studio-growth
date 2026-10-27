"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { ARTWORK_KEYS } from "@/components/product-art";
import { audit } from "@/lib/core/audit";
import { db } from "@/lib/core/db";
import { rupeesToPaise } from "@/lib/domain/money";
import { assertAdmin } from "@/lib/server/auth";
import { CATALOG_TAG, PLANS_TAG } from "@/lib/server/catalog";
import { errorMessage, lines, zodFieldErrors, type ActionResult, type FormResult } from "./utils";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ─── Products ───────────────────────────────────────────────────────────────

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3, "Name must be at least 3 characters.").max(90),
  slug: z.string().trim().toLowerCase().max(80).regex(slugRe, "Use lowercase letters, numbers and single hyphens."),
  tagline: z.string().trim().min(5, "Add a short tagline.").max(140),
  description: z.string().trim().min(20, "Description should be at least 20 characters.").max(4000),
  categoryId: z.string().min(1, "Choose a category."),
  price: z.string().trim().min(1, "Enter a price (0 for free)."),
  format: z.string().trim().min(2, "Enter a format, e.g. Template.").max(40),
  licence: z.enum(["PERSONAL", "COMMERCIAL"]),
  licenceSummary: z.string().trim().min(10, "Explain the licence in a sentence.").max(400),
  artwork: z.enum(ARTWORK_KEYS as [string, ...string[]], { error: "Choose an artwork style." }),
  accentHue: z.coerce.number().int().min(0, "Hue must be 0–359.").max(359, "Hue must be 0–359."),
});

export async function saveProduct(_: FormResult, formData: FormData): Promise<FormResult> {
  const admin = await assertAdmin();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = productSchema.safeParse({ ...raw, slug: raw.slug || slugify(raw.name ?? "") });
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const d = parsed.data;

  const priceInPaise = rupeesToPaise(d.price);
  if (priceInPaise === null) return { error: "Please fix the highlighted fields.", fieldErrors: { price: "Enter an amount in rupees, e.g. 499 or 499.50." } };
  const includes = lines(formData.get("includes"), 20);
  if (includes.length === 0) return { error: "Please fix the highlighted fields.", fieldErrors: { includes: "List at least one thing the product includes." } };
  const fileFormats = String(formData.get("fileFormats") ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const clash = await db.product.findUnique({ where: { slug: d.slug }, select: { id: true } });
  if (clash && clash.id !== d.id) return { error: "Please fix the highlighted fields.", fieldErrors: { slug: "Another product already uses this URL slug." } };
  if (!(await db.productCategory.findUnique({ where: { id: d.categoryId } }))) {
    return { error: "Please fix the highlighted fields.", fieldErrors: { categoryId: "That category no longer exists." } };
  }

  const data = {
    name: d.name,
    slug: d.slug,
    tagline: d.tagline,
    description: d.description,
    categoryId: d.categoryId,
    priceInPaise,
    format: d.format,
    licence: d.licence,
    licenceSummary: d.licenceSummary,
    includes,
    fileFormats,
    artwork: d.artwork,
    accentHue: d.accentHue,
    includedWithPremium: formData.get("includedWithPremium") === "on",
    commissionEligible: formData.get("commissionEligible") === "on" && priceInPaise > 0,
    featured: formData.get("featured") === "on",
  };

  let id = d.id;
  try {
    if (id) {
      const before = await db.product.findUnique({ where: { id } });
      if (!before) return { error: "Product not found." };
      await db.product.update({ where: { id }, data });
      const changed = Object.fromEntries(
        Object.entries(data).filter(([k, v]) => JSON.stringify((before as Record<string, unknown>)[k]) !== JSON.stringify(v)).map(([k, v]) => [k, { from: (before as Record<string, unknown>)[k] as never, to: v as never }]),
      );
      await audit({ actorId: admin.id, action: "product.updated", entityType: "Product", entityId: id, metadata: { changed } });
    } else {
      const created = await db.product.create({ data: { ...data, status: "DRAFT" } });
      id = created.id;
      await audit({ actorId: admin.id, action: "product.created", entityType: "Product", entityId: id, metadata: { name: d.name, priceInPaise } });
    }
  } catch (e) {
    return { error: errorMessage(e) };
  }
  updateTag(CATALOG_TAG);
  if (!d.id) redirect(`/admin/products/${id}?created=1`);
  refresh();
  return { ok: true, message: "Product saved." };
}

const statusSchema = z.object({ id: z.string().min(1), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) });

export async function setProductStatus(id: string, status: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  const parsed = statusSchema.safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return { ok: false, error: "Product not found." };
  if (product.status === parsed.data.status) return { ok: true };
  await db.product.update({
    where: { id },
    data: { status: parsed.data.status, publishedAt: parsed.data.status === "PUBLISHED" ? (product.publishedAt ?? new Date()) : product.publishedAt },
  });
  await audit({ actorId: admin.id, action: `product.status_changed`, entityType: "Product", entityId: id, metadata: { from: product.status, to: parsed.data.status } });
  updateTag(CATALOG_TAG);
  refresh();
  const label = { DRAFT: "moved to draft", PUBLISHED: "published", ARCHIVED: "archived" }[parsed.data.status];
  return { ok: true, message: `${product.name} ${label}.` };
}

// ─── Categories ─────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  description: z.string().trim().min(5, "Add a short description.").max(200),
});

export async function createCategory(_: FormResult, formData: FormData): Promise<FormResult> {
  const admin = await assertAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const slug = slugify(parsed.data.name);
  if (!slug) return { fieldErrors: { name: "Use letters or numbers in the name." } };
  if (await db.productCategory.findUnique({ where: { slug } })) return { fieldErrors: { name: "A category with this name already exists." } };
  const max = await db.productCategory.aggregate({ _max: { sortOrder: true } });
  const c = await db.productCategory.create({ data: { ...parsed.data, slug, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  await audit({ actorId: admin.id, action: "category.created", entityType: "ProductCategory", entityId: c.id, metadata: { name: c.name } });
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: `Category “${c.name}” created.` };
}

export async function updateCategory(id: string, input: { name: string; description: string }): Promise<ActionResult> {
  const admin = await assertAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const before = await db.productCategory.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Category not found." };
  await db.productCategory.update({ where: { id }, data: parsed.data });
  await audit({ actorId: admin.id, action: "category.updated", entityType: "ProductCategory", entityId: id, metadata: { before: { name: before.name, description: before.description }, after: parsed.data } });
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: "Category updated." };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  const c = await db.productCategory.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!c) return { ok: false, error: "Category not found." };
  if (c._count.products > 0) {
    return { ok: false, error: `“${c.name}” still has ${c._count.products} product${c._count.products === 1 ? "" : "s"} (including drafts and archived). Move them to another category first.` };
  }
  await db.productCategory.delete({ where: { id } });
  await audit({ actorId: admin.id, action: "category.deleted", entityType: "ProductCategory", entityId: id, metadata: { name: c.name } });
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: `Category “${c.name}” deleted.` };
}

// ─── Membership plans ───────────────────────────────────────────────────────

const planSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(40),
  description: z.string().trim().min(5, "Add a short description.").max(200),
  price: z.string().trim().optional(),
  billingTerms: z.string().trim().min(10, "Billing terms must be clear to customers.").max(600),
});

export async function updatePlan(_: FormResult, formData: FormData): Promise<FormResult> {
  const admin = await assertAdmin();
  const parsed = planSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const plan = await db.membershipPlan.findUnique({ where: { id: parsed.data.id } });
  if (!plan) return { error: "Plan not found." };

  let priceInPaise = 0;
  if (plan.code !== "FREE") {
    const p = rupeesToPaise(parsed.data.price ?? "");
    if (p === null || p <= 0) return { error: "Please fix the highlighted fields.", fieldErrors: { price: "Paid plans need a price above ₹0." } };
    priceInPaise = p;
  }
  const benefits = lines(formData.get("benefits"), 12);
  if (benefits.length === 0) return { error: "Please fix the highlighted fields.", fieldErrors: { benefits: "List at least one benefit." } };
  const isActive = plan.code === "FREE" ? true : formData.get("isActive") === "on";

  const data = { name: parsed.data.name, description: parsed.data.description, priceInPaise, benefits, billingTerms: parsed.data.billingTerms, isActive };
  await db.membershipPlan.update({ where: { id: plan.id }, data });
  await audit({
    actorId: admin.id,
    action: "plan.updated",
    entityType: "MembershipPlan",
    entityId: plan.id,
    metadata: {
      before: { name: plan.name, priceInPaise: plan.priceInPaise, isActive: plan.isActive, benefits: plan.benefits },
      after: { name: data.name, priceInPaise, isActive, benefits },
    },
  });
  updateTag(PLANS_TAG);
  refresh();
  return { ok: true, message: `${data.name} saved. New prices apply to new orders only.` };
}
