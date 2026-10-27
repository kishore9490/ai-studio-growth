import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Receipt } from "lucide-react";
import { PriceBreakdown } from "@/components/commerce/order-summary";
import { OrderStatusBadge } from "@/components/status-badges";
import { ButtonLink } from "@/components/ui/button";
import { DemoLabel, EmptyState, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { requireUser } from "@/lib/server/auth";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireUser("/app/orders");
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true, payments: { orderBy: { createdAt: "desc" } }, refunds: true },
  });

  return (
    <div>
      <PageHeader title="Orders" description="Your purchase history, payments and refunds." />
      {orders.length === 0 ? (
        <EmptyState icon={Receipt} title="No orders yet" description="When you buy a product or a membership, the receipt appears here." action={<ButtonLink href="/app/marketplace" size="sm">Browse the marketplace</ButtonLink>} />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <details className="group rounded-[var(--radius-panel)] border border-line bg-surface open:shadow-soft">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{o.items.map((i) => i.name).join(", ")}</p>
                    <p className="text-[12.5px] text-ink-3">
                      {o.number} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.isTest && <DemoLabel>Test</DemoLabel>}
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="w-24 text-right font-medium tabular-nums">{formatINR(o.totalInPaise)}</p>
                  <ChevronDown className="size-4 text-ink-3 transition-transform group-open:rotate-180" />
                </summary>
                <div className="grid gap-6 border-t border-line px-5 py-5 md:grid-cols-2">
                  <div>
                    <p className="text-[12px] font-medium text-ink-3">Items</p>
                    <ul className="mt-2 space-y-1.5 text-[14px]">
                      {o.items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-4">
                          <span>
                            {i.name}{" "}
                            <span className="text-ink-3">· {i.type === "MEMBERSHIP" ? "Subscription" : "One-time"}</span>
                          </span>
                          <span className="tabular-nums">{formatINR(i.totalInPaise, { exact: true })}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 border-t border-line pt-4">
                      <PriceBreakdown {...o} />
                    </div>
                  </div>
                  <div className="space-y-4 text-[13.5px]">
                    <div>
                      <p className="text-[12px] font-medium text-ink-3">Payments</p>
                      {o.payments.length === 0 ? (
                        <p className="mt-2 text-ink-2">No payment required.</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {o.payments.map((p) => (
                            <li key={p.id} className="flex justify-between gap-3 text-ink-2">
                              <span>
                                {p.provider === "mock" ? "Mock provider" : p.provider} · {p.status.toLowerCase()}
                                {p.failureReason ? ` · ${p.failureReason}` : ""}
                              </span>
                              <span className="text-ink-3">{formatDateTime(p.updatedAt)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {o.refunds.length > 0 && (
                      <div>
                        <p className="text-[12px] font-medium text-ink-3">Refunds</p>
                        {o.refunds.map((r) => (
                          <p key={r.id} className="mt-2 text-ink-2">
                            {formatINR(r.amountInPaise, { exact: true })} on {formatDate(r.createdAt)} — {r.reason}
                          </p>
                        ))}
                      </div>
                    )}
                    {o.status === "PENDING" && (
                      <ButtonLink href={`/app/checkout/${o.id}`} size="sm">
                        Complete payment
                      </ButtonLink>
                    )}
                    {o.status === "FAILED" && (
                      <ButtonLink href={`/app/checkout/${o.id}/failed`} size="sm" variant="secondary">
                        Retry payment
                      </ButtonLink>
                    )}
                    {o.status === "PAID" && o.items.some((i) => i.type === "PRODUCT") && (
                      <Link href="/app/library" className="inline-block text-[13px] font-medium underline underline-offset-4">
                        Open library
                      </Link>
                    )}
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
