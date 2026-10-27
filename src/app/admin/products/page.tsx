import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Package, Plus, Star } from "lucide-react";
import { FilterBar, param, SampleBadge } from "@/components/admin/bits";
import { ProductArt } from "@/components/product-art";
import { ProductStatusBadge } from "@/components/status-badges";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { requireAdmin } from "@/lib/server/auth";
import { formatDate } from "@/lib/utils";


export const metadata: Metadata = { title: "Products · Admin" };

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = param(sp.q);
  const status = STATUSES.find((s) => s === param(sp.status));

  const products = await db.product.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { category: { select: { name: true } }, _count: { select: { entitlements: { where: { revokedAt: null } }, assets: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Products"
        description="Create, edit, publish and archive marketplace products. Changes to published products appear in the marketplace immediately."
        actions={
          <ButtonLink href="/admin/products/new">
            <Plus /> New product
          </ButtonLink>
        }
      />
      <FilterBar
        action="/admin/products"
        search={{ name: "q", value: q, placeholder: "Search by name or slug" }}
        selects={[
          {
            name: "status",
            label: "Status",
            value: status,
            options: [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase() }))],
          },
        ]}
      />
      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products match" description="Try a different search or status filter." />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <tr>
                <TH>Product</TH>
                <TH>Category</TH>
                <TH className="text-right">Price</TH>
                <TH>Status</TH>
                <TH>Flags</TH>
                <TH className="text-right">Owners</TH>
                <TH>Updated</TH>
              </tr>
            </THead>
            <tbody>
              {products.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <ProductArt artwork={p.artwork} hue={p.accentHue} className="aspect-[4/3] w-14 shrink-0 rounded-[8px] border border-line" />
                      <span className="min-w-0">
                        <span className="block font-medium hover:underline">{p.name}</span>
                        <span className="block font-mono text-[11.5px] text-ink-3">/{p.slug}</span>
                      </span>
                    </Link>
                  </TD>
                  <TD className="text-ink-2">{p.category.name}</TD>
                  <TD className="text-right tabular-nums">{p.priceInPaise === 0 ? "Free" : formatINR(p.priceInPaise, { exact: true })}</TD>
                  <TD>
                    <ProductStatusBadge status={p.status} />
                  </TD>
                  <TD>
                    <span className="flex flex-wrap items-center gap-1.5 text-ink-3">
                      {p.featured && <Star className="size-3.5" aria-label="Featured" />}
                      {p.includedWithPremium && <Crown className="size-3.5 text-accent" aria-label="Included with Premium" />}
                      {!p.commissionEligible && <span className="text-[11.5px]">No commission</span>}
                      <SampleBadge sample={p.isSampleData} />
                    </span>
                  </TD>
                  <TD className="text-right tabular-nums">{p._count.entitlements}</TD>
                  <TD className="whitespace-nowrap text-ink-3">{formatDate(p.updatedAt)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
