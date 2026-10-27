import type { Metadata } from "next";
import { CategoryRow, CreateCategoryForm } from "@/components/admin/category-manager";
import { PageHeader, Panel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { requireAdmin } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Categories · Admin" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await db.productCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <div>
      <PageHeader title="Product categories" description="Categories organise the marketplace. A category can only be deleted once it has no products." />
      <Panel className="mb-6 p-5">
        <h2 className="mb-4 text-[15px] font-semibold">Add a category</h2>
        <CreateCategoryForm />
      </Panel>
      <Panel className="divide-y divide-line">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={{ id: c.id, name: c.name, slug: c.slug, description: c.description, products: c._count.products }} />
        ))}
      </Panel>
    </div>
  );
}
