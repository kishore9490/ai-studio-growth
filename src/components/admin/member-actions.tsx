"use client";

import { useState } from "react";
import { Ban, Gift, UserCheck } from "lucide-react";
import { grantEntitlement, reinstateMember, suspendMember } from "@/actions/admin/operations";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form";
import { ActionButton, ReasonDialog } from "./controls";

export function MemberActions({
  userId,
  name,
  status,
  canSuspend,
  suspendBlockedReason,
  grantable,
}: {
  userId: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
  canSuspend: boolean;
  suspendBlockedReason?: string;
  grantable: { id: string; name: string }[];
}) {
  const [productId, setProductId] = useState(grantable[0]?.id ?? "");
  return (
    <div className="flex flex-wrap gap-2">
      {grantable.length > 0 && (
        <ReasonDialog
          trigger={
            <Button variant="secondary" size="sm">
              <Gift /> Grant product
            </Button>
          }
          title="Grant a product"
          description={`Adds the product to ${name}'s library without an order (recorded as an admin grant). No commission is created.`}
          confirmLabel="Grant access"
          confirmVariant="primary"
          label="Reason"
          placeholder="e.g. Replacement for a corrupted download"
          action={(reason) => grantEntitlement(userId, productId, reason)}
        >
          <Field label="Product" htmlFor="grant-product" className="mb-4">
            <Select id="grant-product" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {grantable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </ReasonDialog>
      )}
      {status === "SUSPENDED" ? (
        <ActionButton
          action={reinstateMember.bind(null, userId)}
          confirm={{ title: `Reinstate ${name}?`, description: "They'll be able to sign in again.", confirmLabel: "Reinstate", confirmVariant: "primary" }}
        >
          <UserCheck /> Reinstate
        </ActionButton>
      ) : canSuspend ? (
        <ReasonDialog
          trigger={
            <Button variant="danger" size="sm">
              <Ban /> Suspend account
            </Button>
          }
          title={`Suspend ${name}?`}
          description="They'll be signed out of every device immediately and won't be able to sign in. Their data, orders and referral records are kept."
          confirmLabel="Suspend account"
          label="Reason (recorded in the audit log)"
          placeholder="e.g. Self-referral abuse across multiple accounts"
          action={(reason) => suspendMember(userId, reason)}
        />
      ) : (
        <Button variant="secondary" size="sm" disabled title={suspendBlockedReason}>
          <Ban /> {suspendBlockedReason}
        </Button>
      )}
    </div>
  );
}
