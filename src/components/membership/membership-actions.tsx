"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { setMembershipCancellation, startMembershipCheckout } from "@/actions/commerce";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";

export function UpgradeButton({ planId, label, variant = "primary" }: { planId: string; label: string; variant?: ButtonVariant }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      variant={variant}
      className="w-full"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await startMembershipCheckout(planId);
          if (res && !res.ok) toast.error(res.error);
        })
      }
    >
      {pending && <Loader2 className="animate-spin" />}
      {label} <ArrowRight />
    </Button>
  );
}

export function CancelMembershipButton({ endsOn }: { endsOn: string }) {
  return (
    <ConfirmDialog
      trigger={<Button variant="secondary">Cancel membership</Button>}
      title="Cancel Premium?"
      description={`You'll keep Premium until ${endsOn}. After that your account moves to the Free plan; products you bought outright stay in your library.`}
      confirmLabel="Cancel at period end"
      onConfirm={async () => {
        const res = await setMembershipCancellation(true);
        if (res.ok) toast.success(res.message ?? "Membership cancelled.");
        else toast.error(res.error);
      }}
    />
  );
}

export function ResumeMembershipButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setMembershipCancellation(false);
          if (res.ok) toast.success(res.message ?? "Membership resumed.");
          else toast.error(res.error);
        })
      }
    >
      {pending && <Loader2 className="animate-spin" />} Keep my membership
    </Button>
  );
}
