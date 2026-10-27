import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { adminRefundOrder } from "@/actions/admin/operations";
import { KeyValue, SampleBadge } from "@/components/admin/bits";
import { ReasonDialog } from "@/components/admin/controls";
import { CommissionStatusBadge, OrderStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Badge, Callout, PageHeader, Panel } from "@/components/ui/misc";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/core/db";
import { formatBps, formatINR } from "@/lib/domain/money";
import { requireAdmin } from "@/lib/server/auth";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Order · Admin" };

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { id: true, name: true } }, entitlement: true, subscription: true } },
      payments: { orderBy: { createdAt: "asc" } },
      refunds: { include: { createdBy: { select: { name: true } } } },
      commissions: { include: { beneficiary: { select: { id: true, name: true } } }, orderBy: { level: "asc" } },
    },
  });
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
        <ArrowLeft className="size-3.5" /> Orders
      </Link>
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <SampleBadge test={order.isTest} sample={order.isSampleData} />
          </span>
        }
        title={order.number}
        description={`Placed ${formatDateTime(order.createdAt)}${order.paidAt ? ` · paid ${formatDateTime(order.paidAt)}` : ""}`}
        actions={
          order.status === "PAID" && order.isTest ? (
            <ReasonDialog
              trigger={
                <Button variant="secondary">
                  <RotateCcw /> Refund order
                </Button>
              }
              title="Refund this order?"
              description={
                <>
                  Refunds {formatINR(order.totalInPaise, { exact: true })} (test — no money moves), revokes access to the items, ends any membership bought with it and
                  reverses {order.commissions.filter((c) => c.status === "PENDING" || c.status === "APPROVED").length} unpaid commission(s).
                </>
              }
              label="Reason (visible in the audit log and to affected affiliates)"
              placeholder="e.g. Customer requested a refund within the cooling-off period"
              confirmLabel="Refund order"
              action={adminRefundOrder.bind(null, order.id)}
            />
          ) : undefined
        }
      />

      {order.status === "PAID" && !order.isTest && (
        <Callout tone="warning" className="mb-6" title="Live payment">
          Refunds for real payments must be issued from the payment provider&apos;s dashboard. The provider&apos;s signed refund webhook will then revoke access and
          reverse commissions automatically. (No live provider is configured in this MVP.)
        </Callout>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-[15px] font-semibold">Items</h2>
            <TableWrap>
              <Table>
                <THead>
                  <tr>
                    <TH>Item</TH>
                    <TH>Type</TH>
                    <TH className="text-right">Price</TH>
                    <TH>Access</TH>
                  </tr>
                </THead>
                <tbody>
                  {order.items.map((i) => (
                    <TR key={i.id}>
                      <TD>
                        {i.product ? (
                          <Link href={`/admin/products/${i.product.id}`} className="font-medium hover:underline">
                            {i.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{i.name}</span>
                        )}
                      </TD>
                      <TD className="text-ink-2">{i.type === "PRODUCT" ? "One-time purchase" : "Membership"}</TD>
                      <TD className="text-right tabular-nums">{formatINR(i.totalInPaise, { exact: true })}</TD>
                      <TD>
                        {i.entitlement ? (
                          i.entitlement.revokedAt ? <Badge tone="neutral">Revoked</Badge> : <Badge tone="success">Granted</Badge>
                        ) : i.subscription ? (
                          <Badge tone={i.subscription.status === "ACTIVE" ? "success" : "neutral"}>Subscription {i.subscription.status.toLowerCase()}</Badge>
                        ) : (
                          <span className="text-ink-3">—</span>
                        )}
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-semibold">Commissions on this order</h2>
            {order.commissions.length === 0 ? (
              <Panel className="p-4 text-[13.5px] text-ink-3">
                No commissions. Either the buyer wasn&apos;t referred, the items weren&apos;t eligible (memberships never are), or the programme was disabled.
              </Panel>
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <tr>
                      <TH>Beneficiary</TH>
                      <TH>Level</TH>
                      <TH className="text-right">Rate</TH>
                      <TH className="text-right">Amount</TH>
                      <TH>Status</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {order.commissions.map((c) => (
                      <TR key={c.id}>
                        <TD>
                          <Link href={`/admin/members/${c.beneficiary.id}`} className="hover:underline">
                            {c.beneficiary.name}
                          </Link>
                        </TD>
                        <TD>L{c.level}</TD>
                        <TD className="text-right tabular-nums">{formatBps(c.rateBps)}</TD>
                        <TD className="text-right tabular-nums">{formatINR(c.amountInPaise, { exact: true })}</TD>
                        <TD>
                          <CommissionStatusBadge status={c.status} />
                          {c.reversalReason && <p className="mt-1 text-[11.5px] text-ink-3">{c.reversalReason}</p>}
                        </TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold">Customer</h2>
            <Link href={`/admin/members/${order.user.id}`} className="mt-2 block text-[14px] font-medium hover:underline">
              {order.user.name}
            </Link>
            <p className="text-[13px] text-ink-3">{order.user.email}</p>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold">Summary</h2>
            <dl className="mt-2 divide-y divide-line">
              <KeyValue label="Subtotal">{formatINR(order.subtotalInPaise, { exact: true })}</KeyValue>
              <KeyValue label={`${order.taxLabel} (${formatBps(order.taxRateBps)})`}>{formatINR(order.taxInPaise, { exact: true })}</KeyValue>
              <KeyValue label="Total">
                <span className="font-semibold">{formatINR(order.totalInPaise, { exact: true })}</span>
              </KeyValue>
            </dl>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold">Payments</h2>
            {order.payments.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-3">No payment required (free order).</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {order.payments.map((p) => (
                  <li key={p.id} className="text-[13px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{p.provider === "mock" ? "Mock provider" : p.provider}</span>
                      <Badge tone={p.status === "SUCCEEDED" ? "success" : p.status === "FAILED" ? "danger" : "neutral"}>{p.status.toLowerCase()}</Badge>
                    </div>
                    <p className="font-mono text-[11.5px] text-ink-3">{p.providerRef ?? "no provider reference"}</p>
                    {p.failureReason && <p className="text-[12px] text-danger">{p.failureReason}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {order.refunds.length > 0 && (
            <Panel className="p-5">
              <h2 className="text-[15px] font-semibold">Refunds</h2>
              {order.refunds.map((r) => (
                <div key={r.id} className="mt-3 text-[13px]">
                  <p className="font-medium">
                    {formatINR(r.amountInPaise, { exact: true })} {r.isTest && <Badge tone="warning">Test</Badge>}
                  </p>
                  <p className="text-ink-2">{r.reason}</p>
                  <p className="text-[12px] text-ink-3">
                    {r.createdBy?.name ?? "System"} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
