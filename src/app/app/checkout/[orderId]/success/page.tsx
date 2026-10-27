import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Check, Crown, Download, Receipt } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { DemoLabel, Panel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { requireUser } from "@/lib/server/auth";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment confirmed" };

export default async function CheckoutSuccessPage(props: PageProps<"/app/checkout/[orderId]/success">) {
  const { orderId } = await props.params;
  const user = await requireUser();
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true, payments: { where: { status: { in: ["SUCCEEDED", "REFUNDED"] } } } } });
  if (!order || order.userId !== user.id) notFound();
  // Never show a success screen for an order the server has not marked as paid.
  if (order.status !== "PAID" && order.status !== "REFUNDED") redirect(`/app/checkout/${order.id}`);
  const hasMembership = order.items.some((i) => i.type === "MEMBERSHIP");
  const hasProducts = order.items.some((i) => i.type === "PRODUCT");

  return (
    <div className="mx-auto max-w-xl py-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
        <Check className="size-7" strokeWidth={2.25} />
      </div>
      <h1 className="mt-6 text-[30px] font-semibold tracking-[-0.035em]">
        {order.status === "REFUNDED" ? "This order was refunded" : "Payment confirmed"}
      </h1>
      <p className="mt-2 text-[15.5px] text-ink-2">
        {order.status === "REFUNDED"
          ? "Access granted by this order has been removed."
          : hasMembership
            ? "Premium is now active on your account."
            : "Your products are ready in your library."}
      </p>
      {order.isTest && (
        <div className="mt-4 flex justify-center">
          <DemoLabel>Test payment · no money moved</DemoLabel>
        </div>
      )}

      <Panel className="mt-8 text-left">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 text-[13px] text-ink-2">
          <span>Order {order.number}</span>
          <span>{order.paidAt ? formatDateTime(order.paidAt) : ""}</span>
        </div>
        <ul className="divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 px-5 py-3 text-[14px]">
              <span>{i.name}</span>
              <span className="tabular-nums">{formatINR(i.totalInPaise, { exact: true })}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-line px-5 py-3.5 text-[14px] font-semibold">
          <span>Total paid</span>
          <span className="tabular-nums">{formatINR(order.totalInPaise, { exact: true })}</span>
        </div>
        {order.payments[0]?.providerRef && (
          <p className="border-t border-line px-5 py-2.5 font-mono text-[11.5px] text-ink-3">Payment reference {order.payments[0].providerRef}</p>
        )}
      </Panel>

      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        {hasProducts && order.status === "PAID" && (
          <ButtonLink href="/app/library" size="lg">
            <Download /> Go to my library
          </ButtonLink>
        )}
        {hasMembership && order.status === "PAID" && (
          <ButtonLink href="/app/membership" size="lg">
            <Crown /> View membership
          </ButtonLink>
        )}
        <ButtonLink href="/app/orders" size="lg" variant="secondary">
          <Receipt /> Order history
        </ButtonLink>
      </div>
    </div>
  );
}
