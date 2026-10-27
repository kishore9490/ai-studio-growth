"use server";

import { z } from "zod";
import { db } from "@/lib/core/db";
import { clientKey } from "@/lib/server/auth";
import { limiters, retryMessage } from "@/lib/server/rate-limits";

export type ContactState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80, "Use 80 characters or fewer."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  topic: z.enum(["general", "purchase", "membership", "affiliate", "privacy", "feedback"], { error: "Choose a topic." }),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(4000, "Keep your message under 4,000 characters."),
});

export async function sendContactMessage(_: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { name: raw.name ?? "", email: raw.email ?? "", topic: raw.topic ?? "", message: raw.message ?? "" };

  // Honeypot: real people never see or fill this field. Pretend success for bots.
  if (raw.website) return { ok: true };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors, values };
  }

  const limit = limiters.contact.check(await clientKey("contact"));
  if (!limit.allowed) return { error: retryMessage(limit.retryAfterMs), values };

  try {
    await db.contactMessage.create({ data: parsed.data });
  } catch {
    return { error: "We couldn't send your message just now. Please try again in a moment.", values };
  }
  return { ok: true };
}
