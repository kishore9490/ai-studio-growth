import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ban, CheckCircle2, CreditCard, FlaskConical, ShieldCheck } from "lucide-react";
import { SampleBadge, StatTile } from "@/components/admin/bits";
import { OrderStatusBadge } from "@/components/status-badges";
import { Badge, Callout, PageHeader, Panel } from "@/components/ui/misc";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/ui/table";
import { PAYOUTS_ENABLED } from "@/lib/core/affiliate";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { requireAdmin } from "@/lib/server/auth";
import { paymentConfig } from "@/lib/server/env";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const now = new Date();
  const [revenue, orderCounts, members, premium, pending, approved, refunds, recentOrders, recentAudit, affiliate, levels] = await Promise.all([
    db.order.groupBy({ by: ["isTest"], where: { status: "PAID" }, _sum: { totalInPaise: true }, _count: true }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.user.count({ where: { role: "USER" } }),
    db.membershipSubscription.findMany({ where: { status: "ACTIVE", currentPeriodEnd: { gt: now } }, distinct: ["userId"], select: { userId: true } }),
    db.commissionRecord.aggregate({ where: { status: "PENDING" }, _sum: { amountInPaise: true }, _count: true }),
    db.commissionRecord.aggregate({ where: { status: "APPROVED" }, _sum: { amountInPaise: true }, _count: true }),
    db.refund.count(),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true, email: true } }, _count: { select: { items: true } } } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { name: true } } } }),
    db.affiliateSettings.findUnique({ where: { id: 1 } }),
    db.commissionLevel.findMany({ orderBy: { level: "asc" } }),
  ]);
  const real = revenue.find((r) => !r.isTest);
  const test = revenue.find((r) => r.isTest);
  const count = (s: string) => orderCounts.find((o) => o.status === s)?._count ?? 0;
  const payments = paymentConfig();

  return (
    <div>
      <PageHeader title="Overview" description="Platform health, recent activity and the safety switches that keep the MVP in test mode." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Revenue (verified, real)" value={formatINR(real?._sum.totalInPaise ?? 0)} hint={`${real?._count ?? 0} paid orders`} />
        <StatTile label="Revenue (mock payments)" tone="test" value={formatINR(test?._sum.totalInPaise ?? 0)} hint={`${test?._count ?? 0} test orders — no money moved`} />
        <StatTile label="Members" value={members} hint={`${premium.length} with active Premium`} />
        <StatTile
          label="Pending commissions"
          tone="test"
          value={formatINR(pending._sum.amountInPaise ?? 0, { exact: true })}
          hint={`${pending._count} pending · ${formatINR(approved._sum.amountInPaise ?? 0, { exact: true })} approved`}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
              All orders <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <TableWrap>
            <Table>
              <THead>
                <tr>
                  <TH>Order</TH>
                  <TH>Customer</TH>
                  <TH className="text-right">Total</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                </tr>
              </THead>
              <tbody>
                {recentOrders.map((o) => (
                  <TR key={o.id}>
                    <TD>
                      <Link href={`/admin/orders/${o.id}`} className="whitespace-nowrap font-medium hover:underline">
                        {o.number}
                      </Link>
                      <div className="mt-0.5">
                        <SampleBadge test={o.isTest} sample={o.isSampleData} />
                      </div>
                    </TD>
                    <TD>
                      <p>{o.user.name}</p>
                      <p className="text-xs text-ink-3">{o.user.email}</p>
                    </TD>
                    <TD className="text-right tabular-nums">{formatINR(o.totalInPaise, { exact: true })}</TD>
                    <TD>
                      <OrderStatusBadge status={o.status} />
                    </TD>
                    <TD className="whitespace-nowrap text-ink-3">{relativeTime(o.createdAt, now)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </TableWrap>
          <p className="mt-3 text-[13px] text-ink-3">
            {count("PAID")} paid · {count("PENDING")} awaiting payment · {count("FAILED")} failed · {count("REFUNDED")} refunded ({refunds} refund records)
          </p>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="mb-3 text-[15px] font-semibold">Safety status</h2>
            <Panel className="divide-y divide-line">
              <div className="flex items-start gap-3 p-4">
                <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-medium">Commission accrual</p>
                    <Badge tone={affiliate?.commissionMode === "TEST" ? "warning" : "neutral"}>{affiliate?.commissionMode === "TEST" ? "Test mode" : "Disabled"}</Badge>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">
                    Programme {affiliate?.programEnabled ? "enabled" : "disabled"} · levels{" "}
                    {levels.map((l) => `L${l.level} ${l.enabled ? `${l.rateBps / 100}%` : "off"}`).join(" · ")}. No live mode exists.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <Ban className="mt-0.5 size-4 shrink-0 text-danger" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-medium">Payouts</p>
                    <Badge tone="danger">{PAYOUTS_ENABLED ? "Enabled" : "Disabled"}</Badge>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">No code path transfers money. Requests can only be reviewed for testing.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <CreditCard className="mt-0.5 size-4 shrink-0 text-ink-2" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-medium">Payment provider</p>
                    <Badge tone={payments.mockAllowed ? "warning" : "danger"}>{payments.mockAllowed ? "Mock (allowed)" : "Mock (blocked)"}</Badge>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">
                    {payments.reason ?? "Mock payments create test orders and test entitlements only. Configure a real provider before launch."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
                <div className="flex-1">
                  <p className="text-[13.5px] font-medium">Server-side authorisation</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">Admin role is read from the database on every request and action.</p>
                </div>
              </div>
            </Panel>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Recent activity</h2>
              <Link href="/admin/audit" className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
                Audit log <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <Panel className="divide-y divide-line">
              {recentAudit.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-ink-3" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[12.5px] text-ink">{a.action}</p>
                    <p className="text-[12px] text-ink-3">
                      {a.actor?.name ?? "System"} · {relativeTime(a.createdAt, now)}
                    </p>
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        </section>
      </div>

      {!payments.mockAllowed && (
        <Callout tone="danger" className="mt-8" title="Checkout is unavailable">
          {payments.reason}
        </Callout>
      )}
    </div>
  );
}
