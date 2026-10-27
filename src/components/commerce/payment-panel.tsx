"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CircleCheck, CircleX, CreditCard, FlaskConical, Loader2, RotateCcw } from "lucide-react";
import { cancelPendingOrder, retryPayment, simulatePayment } from "@/actions/commerce";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { formatINR } from "@/lib/domain/money";

export function MockPaymentPanel({ orderId, totalInPaise }: { orderId: string; totalInPaise: number }) {
  const [pending, start] = useTransition();
  const run = (outcome: "success" | "failure") =>
    start(async () => {
      const res = await simulatePayment(orderId, outcome);
      if (res && !res.ok) toast.error(res.error);
    });
  return (
    <div className="rounded-[var(--radius-panel)] border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <CreditCard className="size-4 text-ink-2" />
        <h2 className="text-[15px] font-semibold">Payment</h2>
      </div>
      <div className="p-5">
        <div className="rounded-[12px] border border-dashed border-warning/40 bg-warning-soft/60 p-4">
          <p className="flex items-center gap-1.5 text-[13.5px] font-medium text-[#7a5410]">
            <FlaskConical className="size-4" /> Development payment simulator
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#7a5410]/90">
            No payment provider is connected, so no card is charged. Choose an outcome to test the flow. A successful simulation
            runs the same server-side fulfilment a verified provider webhook would trigger.
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <Button size="lg" variant="accent" disabled={pending} onClick={() => run("success")}>
            {pending ? <Loader2 className="animate-spin" /> : <CircleCheck />}
            Simulate successful payment · {formatINR(totalInPaise, { exact: true })}
          </Button>
          <Button size="lg" variant="secondary" disabled={pending} onClick={() => run("failure")}>
            <CircleX /> Simulate failed payment
          </Button>
        </div>
        <div className="mt-4 flex justify-center">
          <ConfirmDialog
            trigger={
              <button type="button" className="text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline" disabled={pending}>
                Cancel this order
              </button>
            }
            title="Cancel this order?"
            description="The order will be closed and nothing will be charged. Items stay in your cart only if you add them again."
            confirmLabel="Cancel order"
            onConfirm={() => cancelPendingOrder(orderId)}
          />
        </div>
      </div>
    </div>
  );
}

export function RetryPaymentButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button size="lg" disabled={pending} onClick={() => start(async () => void (await retryPayment(orderId)))}>
      {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />} Try payment again
    </Button>
  );
}

export function CancelOrderButton({ orderId }: { orderId: string }) {
  return (
    <ConfirmDialog
      trigger={<Button variant="secondary" size="lg">Cancel order</Button>}
      title="Cancel this order?"
      description="Nothing has been charged. The order will be closed."
      confirmLabel="Cancel order"
      onConfirm={() => cancelPendingOrder(orderId)}
    />
  );
}
