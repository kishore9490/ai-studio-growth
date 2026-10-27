"use client";

import { Check, X } from "lucide-react";
import { adminReviewPayout } from "@/actions/admin/operations";
import { Button } from "@/components/ui/button";
import { ReasonDialog } from "./controls";

export function PayoutActions({ id, name }: { id: string; name: string }) {
  return (
    <div className="flex justify-end gap-1.5">
      <ReasonDialog
        trigger={
          <Button size="sm">
            <Check /> Approve (test)
          </Button>
        }
        title={`Approve ${name}'s request?`}
        description="This records the approval for testing only. No transfer is initiated — payouts are disabled until the programme is approved."
        confirmLabel="Approve for testing"
        confirmVariant="primary"
        label="Note"
        required={false}
        action={(note) => adminReviewPayout(id, "APPROVED", note)}
      />
      <ReasonDialog
        trigger={
          <Button size="sm" variant="ghost">
            <X /> Decline
          </Button>
        }
        title="Decline this payout request?"
        description="The commissions are released back to the member's approved balance. The note is shared with the member."
        confirmLabel="Decline request"
        label="Reason (shared with the member)"
        action={(note) => adminReviewPayout(id, "REJECTED", note)}
      />
    </div>
  );
}
