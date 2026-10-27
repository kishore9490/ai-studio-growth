import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { X } from "lucide-react";
import { CancelOrderButton, RetryPaymentButton } from "@/components/commerce/payment-panel";
import { DemoLabel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { requireUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Payment failed" };

export default async function CheckoutFailedPage(props: PageProps<"/app/checkout/[orderId]/failed">) {
  const { orderId } = await props.params;
  const user = await requireUser();
  const order = await db.order.findUnique({ where: { id: orderId }, include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!order || order.userId !== user.id) notFound();
  if (order.status !== "FAILED") redirect(`/app/checkout/${order.id}`);

  return (
    <div className="mx-auto max-w-lg py-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
        <X className="size-7" strokeWidth={2.25} />
      </div>
      <h1 className="mt-6 text-[30px] font-semibold tracking-[-0.035em]">Payment didn&apos;t go through</h1>
      <p className="mt-2 text-[15.5px] text-ink-2">
        You haven&apos;t been charged and nothing was added to your account.
        {order.payments[0]?.failureReason ? ` Reason: ${order.payments[0].failureReason}.` : ""}
      </p>
      {order.isTest && (
        <div className="mt-4 flex justify-center">
          <DemoLabel>Simulated failure</DemoLabel>
        </div>
      )}
      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        <RetryPaymentButton orderId={order.id} />
        <CancelOrderButton orderId={order.id} />
      </div>
      <p className="mt-6 text-[13px] text-ink-3">
        Order {order.number} · Need help? <Link href="/contact" className="underline">Contact support</Link>
      </p>
    </div>
  );
}
