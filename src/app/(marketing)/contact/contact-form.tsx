"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { sendContactMessage, type ContactState } from "./actions";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "purchase", label: "Orders, downloads or refunds" },
  { value: "membership", label: "Membership and billing" },
  { value: "affiliate", label: "Affiliate programme" },
  { value: "privacy", label: "Privacy or account deletion" },
  { value: "feedback", label: "Feedback or a tool idea" },
];

export function ContactForm() {
  const [state, action] = useActionState<ContactState, FormData>(sendContactMessage, {});
  const v = state.values ?? {};
  const e = (k: string) => state.fieldErrors?.[k];
  const a = (k: string) => ({ "aria-invalid": e(k) ? true : undefined, "aria-describedby": e(k) ? `${k}-error` : undefined }) as const;

  if (state.ok) {
    return (
      <div role="status" className="flex flex-col items-start rounded-[var(--radius-panel)] border border-line bg-surface p-8">
        <span className="grid size-10 place-items-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-5" />
        </span>
        <h2 className="mt-5 text-[20px] font-semibold tracking-[-0.025em]">Message sent</h2>
        <p className="mt-1.5 text-[15px] text-ink-2">Thanks for getting in touch. We&apos;ll reply to the email address you provided.</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-5 rounded-[var(--radius-panel)] border border-line bg-surface p-6 sm:p-8">
      <FormMessage>{state.error}</FormMessage>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={e("name")}>
          <Input id="name" name="name" autoComplete="name" required defaultValue={v.name} {...a("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={e("email")}>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={v.email} {...a("email")} />
        </Field>
      </div>
      <Field label="Topic" htmlFor="topic" error={e("topic")}>
        <Select id="topic" name="topic" defaultValue={v.topic || "general"} {...a("topic")}>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Message" htmlFor="message" error={e("message")} hint="Include your order number if your question is about a purchase.">
        <Textarea id="message" name="message" rows={6} required defaultValue={v.message} {...a("message")} />
      </Field>
      {/* Honeypot: hidden from people and assistive technology. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-[12.5px] text-ink-3">We use your details only to reply. See our Privacy Policy.</p>
        <SubmitButton pendingLabel="Sending…">
          <Send /> Send message
        </SubmitButton>
      </div>
    </form>
  );
}
