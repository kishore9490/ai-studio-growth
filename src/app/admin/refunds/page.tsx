import type { Metadata } from "next";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { StatTile } from "@/components/admin/bits";
import { Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { requireAdmin } from "@/lib/server/auth";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Refunds · Admin" };

export default async function AdminRefundsPage() {
  await requireAdmin();
  const [refunds, totals] = await Promise.all([
    db.refund.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { order: { select: { id: true, number: true, user: { select: { name: true, email: true } } } }, createdBy: { select: { name: true } } },
    }),
    db.refund.groupBy({ by: ["isTest"], _sum: { amountInPaise: true }, _count: true }),
  ]);
  const real = totals.find((t) => !t.isTest);
  const test = totals.find((t) => t.isTest);

  return (
    <div>
      <PageHeader title="Refund records" description="Every refund, who issued it and why. Refunds revoke access and reverse unpaid commissions in the same transaction." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatTile label="Refunded (real)" value={formatINR(real?._sum.amountInPaise ?? 0, { exact: true })} hint={`${real?._count ?? 0} refunds`} />
        <StatTile label="Refunded (test orders)" tone="test" value={formatINR(test?._sum.amountInPaise ?? 0, { exact: true })} hint={`${test?._count ?? 0} refunds — no money moved`} />
      </div>
      {refunds.length === 0 ? (
        <EmptyState icon={RotateCcw} title="No refunds yet" description="Refunds issued from an order's page will appear here." />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Customer</TH>
                <TH className="text-right">Amount</TH>
                <TH>Reason</TH>
                <TH>Issued by</TH>
                <TH>Date</TH>
              </tr>
            </THead>
            <tbody>
              {refunds.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/admin/orders/${r.order.id}`} className="font-medium hover:underline">
                      {r.order.number}
                    </Link>
                    {r.isTest && (
                      <div className="mt-1">
                        <Badge tone="warning">Test</Badge>
                      </div>
                    )}
                  </TD>
                  <TD>
                    <p>{r.order.user.name}</p>
                    <p className="text-xs text-ink-3">{r.order.user.email}</p>
                  </TD>
                  <TD className="text-right tabular-nums">{formatINR(r.amountInPaise, { exact: true })}</TD>
                  <TD className="max-w-[320px] text-ink-2">{r.reason}</TD>
                  <TD className="text-ink-2">{r.createdBy?.name ?? "System / webhook"}</TD>
                  <TD className="whitespace-nowrap text-ink-3">{formatDateTime(r.createdAt)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
