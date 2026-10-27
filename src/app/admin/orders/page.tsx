import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { FilterBar, Pagination, param, parsePage, qs, SampleBadge } from "@/components/admin/bits";
import { OrderStatusBadge } from "@/components/status-badges";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { requireAdmin } from "@/lib/server/auth";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders · Admin" };

const STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"] as const;
const PAGE_SIZE = 25;

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = param(sp.q);
  const status = STATUSES.find((s) => s === param(sp.status));
  const page = parsePage(sp.page);
  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" as const } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } }, items: { select: { name: true, type: true } } },
    }),
    db.order.count({ where }),
  ]);

  return (
    <div>
      <PageHeader title="Orders" description="Every checkout, including unpaid and failed attempts. Test orders were paid with the mock provider — no money moved." />
      <FilterBar
        action="/admin/orders"
        search={{ name: "q", value: q, placeholder: "Order number, customer name or email" }}
        selects={[
          {
            name: "status",
            label: "Status",
            value: status,
            options: [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase() }))],
          },
        ]}
      />
      {orders.length === 0 ? (
        <EmptyState icon={Receipt} title="No orders found" description="Adjust the search or status filter." />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Customer</TH>
                <TH>Items</TH>
                <TH className="text-right">Total</TH>
                <TH>Status</TH>
                <TH>Created</TH>
              </tr>
            </THead>
            <tbody>
              {orders.map((o) => (
                <TR key={o.id}>
                  <TD>
                    <Link href={`/admin/orders/${o.id}`} className="whitespace-nowrap font-medium hover:underline">
                      {o.number}
                    </Link>
                    <div className="mt-1">
                      <SampleBadge test={o.isTest} sample={o.isSampleData} />
                    </div>
                  </TD>
                  <TD>
                    <p>{o.user.name}</p>
                    <p className="text-xs text-ink-3">{o.user.email}</p>
                  </TD>
                  <TD className="max-w-[260px] truncate text-ink-2" title={o.items.map((i) => i.name).join(", ")}>
                    {o.items.map((i) => i.name).join(", ")}
                  </TD>
                  <TD className="text-right tabular-nums">{formatINR(o.totalInPaise, { exact: true })}</TD>
                  <TD>
                    <OrderStatusBadge status={o.status} />
                  </TD>
                  <TD className="whitespace-nowrap text-ink-3">{formatDateTime(o.createdAt)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} href={(p) => qs("/admin/orders", { q, status, page: p })} />
    </div>
  );
}
