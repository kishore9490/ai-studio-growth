"use client";

import { useTransition } from "react";
import { Check, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { adminApproveCommission, adminReverseCommission } from "@/actions/admin/operations";
import { Button } from "@/components/ui/button";
import { ReasonDialog } from "./controls";

export function CommissionActions({ id, status, inHold }: { id: string; status: string; inHold: boolean }) {
  const [pending, start] = useTransition();
  if (status !== "PENDING" && status !== "APPROVED") return <span className="text-ink-3">—</span>;

  const approve = (override: boolean) =>
    start(async () => {
      const r = await adminApproveCommission(id, override);
      if (r.ok) toast.success(r.message);
      else if (r.holdBlocked && !override) {
        toast.warning(r.error, {
          description: "Approving early risks paying commission on an order that is later refunded.",
          action: { label: "Approve anyway", onClick: () => approve(true) },
          duration: 10000,
        });
      } else toast.error(r.error);
    });

  return (
    <div className="flex justify-end gap-1.5">
      {status === "PENDING" && (
        <Button size="sm" variant={inHold ? "secondary" : "primary"} disabled={pending} onClick={() => approve(false)}>
          {pending ? <Loader2 className="animate-spin" /> : <Check />} Approve
        </Button>
      )}
      <ReasonDialog
        trigger={
          <Button size="sm" variant="ghost" disabled={pending} aria-label="Reverse commission">
            <Undo2 /> Reverse
          </Button>
        }
        title="Reverse this commission?"
        description="The commission is marked reversed and a negative entry is appended to the ledger. This can't be undone."
        confirmLabel="Reverse commission"
        placeholder="e.g. Suspected self-referral via a second account"
        action={(reason) => adminReverseCommission(id, reason)}
      />
    </div>
  );
}
