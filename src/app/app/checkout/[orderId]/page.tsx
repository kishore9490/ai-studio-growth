import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarSync, ChevronLeft, Crown, Package, ShieldCheck, TriangleAlert } from "lucide-react";
import { PriceBreakdown } from "@/components/commerce/order-summary";
import { CancelOrderButton, MockPaymentPanel } from "@/components/commerce/payment-panel";
import { ProductArt } from "@/components/product-art";
import { Badge, Callout, DemoLabel, Panel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { requireUser } from "@/lib/server/auth";
import { paymentConfig } from "@/lib/server/env";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage(props: PageProps<"/app/checkout/[orderId]">) {
  const { orderId } = await props.params;
  const user = await requireUser(`/app/checkout/${orderId}`);
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { slug: true, artwork: true, accentHue: true, format: true, licence: true } }, plan: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order || order.userId !== user.id) notFound();
  if (order.status === "PAID" || order.status === "REFUNDED") redirect(`/app/checkout/${order.id}/success`);
  if (order.status === "FAILED") redirect(`/app/checkout/${order.id}/failed`);
  const config = paymentConfig();
  const hasMembership = order.items.some((i) => i.type === "MEMBERSHIP");

  return (
    <div>
      <Link href={hasMembership ? "/app/membership" : "/app/cart"} className="mb-6 inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
        <ChevronLeft className="size-4" /> Back
      </Link>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Checkout</h1>
        <Badge tone="outline">Order {order.number}</Badge>
        {order.isTest && <DemoLabel>Test order</DemoLabel>}
      </div>

      {order.status === "CANCELLED" ? (
        <Callout tone="neutral" title="This order was cancelled">
          Nothing was charged. <Link href="/app/marketplace" className="underline">Return to the marketplace</Link>.
        </Callout>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Panel>
              <div className="border-b border-line px-5 py-3.5">
                <h2 className="text-[15px] font-semibold">Order summary</h2>
              </div>
              <ul className="divide-y divide-line">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                    {item.product ? (
                      <ProductArt artwork={item.product.artwork} hue={item.product.accentHue} className="aspect-[4/3] w-20 shrink-0 rounded-[10px] border border-line" />
                    ) : (
                      <span className="grid aspect-[4/3] w-20 shrink-0 place-items-center rounded-[10px] border border-line bg-lavender text-accent-ink">
                        <Crown className="size-6" strokeWidth={1.5} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-3">
                        {item.type === "PRODUCT" ? (
                          <>
                            <Package className="size-3.5" /> One-time purchase · {item.product?.format} ·{" "}
                            {item.product?.licence === "COMMERCIAL" ? "Commercial licence" : "Personal licence"}
                          </>
                        ) : (
                          <>
                            <CalendarSync className="size-3.5" /> Subscription · billed {item.plan?.interval === "YEAR" ? "yearly" : "monthly"}
                          </>
                        )}
                      </p>
                    </div>
                    <p className="font-medium tabular-nums">{formatINR(item.totalInPaise, { exact: true })}</p>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line px-5 py-4">
                <PriceBreakdown {...order} />
              </div>
            </Panel>

            {hasMembership && (
              <Callout tone="neutral" icon={CalendarSync} title="About this subscription">
                {order.items.find((i) => i.plan)?.plan?.billingTerms} Automatic renewal is not configured in this environment — no further
                charges will be made.
              </Callout>
            )}
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <span>
                Access is granted only after the payment is confirmed on our servers. By completing this order you agree to the{" "}
                <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/refund-policy" className="underline">Refund Policy</Link>.
              </span>
            </p>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            {config.mockAllowed && order.isTest ? (
              <MockPaymentPanel orderId={order.id} totalInPaise={order.totalInPaise} />
            ) : (
              <Panel className="p-5">
                <p className="flex items-center gap-2 text-[15px] font-semibold">
                  <TriangleAlert className="size-4 text-warning" /> Payments are not available
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                  {config.reason ?? "This order cannot be paid in the current environment."} Your order has not been charged and nothing has been
                  granted.
                </p>
                <div className="mt-5">
                  <CancelOrderButton orderId={order.id} />
                </div>
              </Panel>
            )}
            <p className="mt-3 px-1 text-[12.5px] text-ink-3">Payment status: {order.payments[0]?.status.toLowerCase() ?? "not started"}</p>
          </aside>
        </div>
      )}
    </div>
  );
}
