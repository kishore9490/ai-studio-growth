import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { ARTWORK_KEYS } from "@/components/product-art";
import { PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { requireAdmin } from "@/lib/server/auth";

export const metadata: Metadata = { title: "New product · Admin" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await db.productCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
        <ArrowLeft className="size-3.5" /> Products
      </Link>
      <PageHeader title="New product" description="New products are saved as drafts. Publish when the listing is ready." />
      <ProductForm
        categories={categories}
        artworkKeys={ARTWORK_KEYS}
        initial={{
          name: "",
          slug: "",
          tagline: "",
          description: "",
          categoryId: categories[0]?.id ?? "",
          price: "",
          format: "Template",
          licence: "PERSONAL",
          licenceSummary: "Personal use. Do not resell or redistribute.",
          includes: "",
          fileFormats: "",
          artwork: "kit",
          accentHue: 258,
          includedWithPremium: false,
          commissionEligible: true,
          featured: false,
        }}
      />
    </div>
  );
}
