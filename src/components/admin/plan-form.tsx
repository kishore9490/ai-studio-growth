"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updatePlan } from "@/actions/admin/catalog";
import type { FormResult } from "@/actions/admin/utils";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function PlanForm({
  plan,
}: {
  plan: { id: string; code: string; name: string; description: string; price: string; interval: string; benefits: string; billingTerms: string; isActive: boolean };
}) {
  const [state, action] = useActionState<FormResult, FormData>(updatePlan, {});
  const fe = state.fieldErrors ?? {};
  const isFree = plan.code === "FREE";
  const p = (k: string) => `${plan.code}-${k}`;
  useEffect(() => {
    if (state.ok) toast.success(state.message);
  }, [state]);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="id" value={plan.id} />
      <FormMessage>{state.error}</FormMessage>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Display name" htmlFor={p("name")} error={fe.name}>
          <Input id={p("name")} name="name" defaultValue={plan.name} />
        </Field>
        <Field
          label={isFree ? "Price" : `Price (₹ per ${plan.interval === "YEAR" ? "year" : "month"})`}
          htmlFor={p("price")}
          error={fe.price}
          hint={isFree ? "The free plan is always ₹0." : "Illustrative and configurable. Applies to new orders only."}
        >
          <Input id={p("price")} name="price" defaultValue={plan.price} disabled={isFree} inputMode="decimal" />
        </Field>
      </div>
      <Field label="Description" htmlFor={p("description")} error={fe.description}>
        <Input id={p("description")} name="description" defaultValue={plan.description} />
      </Field>
      <Field label="Benefits (one per line)" htmlFor={p("benefits")} error={fe.benefits}>
        <Textarea id={p("benefits")} name="benefits" defaultValue={plan.benefits} rows={5} />
      </Field>
      <Field label="Billing terms" htmlFor={p("billingTerms")} error={fe.billingTerms} hint="Shown at checkout and on the membership page. Have this reviewed before launch.">
        <Textarea id={p("billingTerms")} name="billingTerms" defaultValue={plan.billingTerms} rows={3} />
      </Field>
      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2.5 text-[13.5px]">
          <input type="checkbox" name="isActive" defaultChecked={plan.isActive} disabled={isFree} className="size-4 accent-[var(--color-ink)]" />
          Plan is available for new sign-ups {isFree && <span className="text-ink-3">(always on for Free)</span>}
        </label>
        <SubmitButton size="sm" pendingLabel="Saving…">
          Save plan
        </SubmitButton>
      </div>
    </form>
  );
}
