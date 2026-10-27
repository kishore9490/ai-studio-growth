import type { Metadata } from "next";
import { CommissionStatusBadge } from "@/components/status-badges";
import { Badge, PageHeader, Panel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { requireAdmin } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Reports · Admin" };

const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" });

function lastMonths(now: Date, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - i), 1));
    return { key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, label: monthFmt.format(d), start: d };
  });
}
const keyOf = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth()}`;

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const pct = max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0;
  return <div className={className} style={{ height: `${pct}%` }} />;
}

export default async function AdminReportsPage() {
  await requireAdmin();
  const now = new Date();
  const months = lastMonths(now, 6);
  const since = months[0].start;

  const [orders, users, topItems, commissionTotals] = await Promise.all([
    db.order.findMany({ where: { status: "PAID", paidAt: { gte: since } }, select: { paidAt: true, totalInPaise: true, isTest: true } }),
    db.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: { type: "PRODUCT", productId: { not: null }, order: { status: "PAID" } },
      _count: true,
      _sum: { totalInPaise: true },
      orderBy: { _count: { productId: "desc" } },
      take: 8,
    }),
    db.commissionRecord.groupBy({ by: ["status"], _sum: { amountInPaise: true }, _count: true }),
  ]);
  const productNames = await db.product.findMany({ where: { id: { in: topItems.map((t) => t.productId!).filter(Boolean) } }, select: { id: true, name: true } });

  const revenue = months.map((m) => {
    const inMonth = orders.filter((o) => o.paidAt && keyOf(o.paidAt) === m.key);
    return {
      ...m,
      real: inMonth.filter((o) => !o.isTest).reduce((s, o) => s + o.totalInPaise, 0),
      test: inMonth.filter((o) => o.isTest).reduce((s, o) => s + o.totalInPaise, 0),
    };
  });
  const maxRevenue = Math.max(...revenue.map((r) => r.real + r.test), 1);
  const signups = months.map((m) => ({ ...m, count: users.filter((u) => keyOf(u.createdAt) === m.key).length }));
  const maxSignups = Math.max(...signups.map((s) => s.count), 1);
  const maxUnits = Math.max(...topItems.map((t) => t._count), 1);
  const commissionMax = Math.max(...commissionTotals.map((c) => c._sum.amountInPaise ?? 0), 1);

  return (
    <div>
      <PageHeader title="Reports" description="Basic reporting for the last six months. Figures from mock payments are shown separately and are not revenue." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Paid revenue by month</h2>
            <div className="flex items-center gap-3 text-[12px] text-ink-3">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-ink" /> Real
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-warning/50" /> Test (mock)
              </span>
            </div>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3" role="img" aria-label="Revenue by month">
            {revenue.map((r) => (
              <div key={r.key} className="flex h-full flex-1 flex-col justify-end gap-px" title={`${r.label}: ${formatINR(r.real)} real, ${formatINR(r.test)} test`}>
                <Bar value={r.test} max={maxRevenue} className="w-full rounded-t-[4px] bg-warning/50" />
                <Bar value={r.real} max={maxRevenue} className="w-full bg-ink" />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            {revenue.map((r) => (
              <div key={r.key} className="flex-1 text-center">
                <p className="text-[11.5px] text-ink-3">{r.label}</p>
                <p className="text-[11.5px] tabular-nums">{formatINR(r.real + r.test)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-[15px] font-semibold">New members by month</h2>
          <div className="mt-6 flex h-48 items-end gap-3" role="img" aria-label="Signups by month">
            {signups.map((s) => (
              <div key={s.key} className="flex h-full flex-1 flex-col justify-end" title={`${s.label}: ${s.count}`}>
                <Bar value={s.count} max={maxSignups} className="w-full rounded-t-[4px] bg-accent/70" />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            {signups.map((s) => (
              <div key={s.key} className="flex-1 text-center">
                <p className="text-[11.5px] text-ink-3">{s.label}</p>
                <p className="text-[11.5px] tabular-nums">{s.count}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-[15px] font-semibold">Top products by units sold</h2>
          <ul className="mt-5 space-y-3">
            {topItems.length === 0 && <li className="text-[13px] text-ink-3">No paid product sales yet.</li>}
            {topItems.map((t) => (
              <li key={t.productId}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="truncate font-medium">{productNames.find((p) => p.id === t.productId)?.name ?? "Deleted product"}</span>
                  <span className="shrink-0 tabular-nums text-ink-3">
                    {t._count} · {formatINR(t._sum.totalInPaise ?? 0)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-sunken">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(t._count / maxUnits) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Commission totals by status</h2>
            <Badge tone="warning">Test mode</Badge>
          </div>
          <ul className="mt-5 space-y-3">
            {commissionTotals.map((c) => (
              <li key={c.status}>
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <CommissionStatusBadge status={c.status} />
                  <span className="tabular-nums text-ink-2">
                    {c._count} · {formatINR(c._sum.amountInPaise ?? 0, { exact: true })}
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-sunken">
                  <div className="h-full rounded-full bg-accent/70" style={{ width: `${((c._sum.amountInPaise ?? 0) / commissionMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
