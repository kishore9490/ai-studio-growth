"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updatePlatformSettings } from "@/actions/admin/operations";
import type { FormResult } from "@/actions/admin/utils";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/form";
import { Panel } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";

export function SettingsForm({
  initial,
}: {
  initial: { taxRate: string; taxLabel: string; supportEmail: string; announcement: string; signupsEnabled: boolean };
}) {
  const [state, action] = useActionState<FormResult, FormData>(updatePlatformSettings, {});
  const fe = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) toast.success(state.message);
  }, [state]);
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormMessage>{state.error}</FormMessage>
      <Panel className="space-y-5 p-6">
        <div>
          <h2 className="text-[15px] font-semibold">Tax</h2>
          <p className="mt-1 text-[13px] text-ink-2">Applied to the order subtotal at checkout. Confirm the correct GST treatment with a tax professional before launch.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tax rate (%)" htmlFor="taxRate" error={fe.taxRate} hint="e.g. 18 or 0. Up to two decimals.">
            <Input id="taxRate" name="taxRate" inputMode="decimal" defaultValue={initial.taxRate} aria-invalid={fe.taxRate ? true : undefined} />
          </Field>
          <Field label="Label shown at checkout" htmlFor="taxLabel" error={fe.taxLabel}>
            <Input id="taxLabel" name="taxLabel" defaultValue={initial.taxLabel} aria-invalid={fe.taxLabel ? true : undefined} />
          </Field>
        </div>
      </Panel>
      <Panel className="space-y-5 p-6">
        <h2 className="text-[15px] font-semibold">Platform</h2>
        <Field label="Support email" htmlFor="supportEmail" error={fe.supportEmail}>
          <Input id="supportEmail" name="supportEmail" type="email" defaultValue={initial.supportEmail} aria-invalid={fe.supportEmail ? true : undefined} />
        </Field>
        <Field label="Announcement" htmlFor="announcement" optional error={fe.announcement} hint="Short notice for members, e.g. planned maintenance. Leave blank for none.">
          <Textarea id="announcement" name="announcement" rows={2} maxLength={200} defaultValue={initial.announcement} />
        </Field>
        <label className="flex items-start gap-3 rounded-[12px] border border-line p-4">
          <input type="checkbox" name="signupsEnabled" defaultChecked={initial.signupsEnabled} className="mt-0.5 size-4 accent-[var(--color-ink)]" />
          <span>
            <span className="block text-[13.5px] font-medium">Allow new sign-ups</span>
            <span className="block text-[12.5px] text-ink-3">Turn off temporarily during an incident. Existing members can still sign in.</span>
          </span>
        </label>
      </Panel>
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
      </div>
    </form>
  );
}
