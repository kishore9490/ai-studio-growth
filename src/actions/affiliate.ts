"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { AffiliateError, requestPayout } from "@/lib/core/affiliate";
import { audit } from "@/lib/core/audit";
import { db } from "@/lib/core/db";
import { clientKey, requireUser } from "@/lib/server/auth";
import { limiters, retryMessage } from "@/lib/server/rate-limits";

type Result = { ok: true; message: string } | { ok: false; error: string };

export async function joinAffiliateProgramme(accepted: boolean): Promise<Result> {
  const user = await requireUser("/app/referrals");
  if (!accepted) return { ok: false, error: "Please confirm you've read the programme terms." };
  const settings = await db.affiliateSettings.findUniqueOrThrow({ where: { id: 1 } });
  if (!settings.programEnabled) return { ok: false, error: "The affiliate programme is not accepting new members right now." };
  await db.user.update({ where: { id: user.id }, data: { affiliateOptIn: true, affiliateOptInAt: new Date() } });
  await audit({ actorId: user.id, action: "affiliate.joined", entityType: "User", entityId: user.id });
  refresh();
  return { ok: true, message: "You've joined the affiliate programme." };
}

export async function leaveAffiliateProgramme(): Promise<Result> {
  const user = await requireUser("/app/referrals");
  await db.user.update({ where: { id: user.id }, data: { affiliateOptIn: false } });
  await audit({ actorId: user.id, action: "affiliate.left", entityType: "User", entityId: user.id });
  refresh();
  return { ok: true, message: "You've left the affiliate programme. Your referral link still identifies you, but no new commissions will accrue." };
}

export async function submitPayoutRequest(note: string): Promise<Result> {
  const user = await requireUser("/app/referrals");
  const limit = limiters.payout.check(await clientKey("payout", user.id));
  if (!limit.allowed) return { ok: false, error: retryMessage(limit.retryAfterMs) };
  const parsed = z.string().max(300).safeParse(note.trim());
  if (!parsed.success) return { ok: false, error: "Keep the note under 300 characters." };
  try {
    await requestPayout(user.id, parsed.data || undefined);
  } catch (e) {
    if (e instanceof AffiliateError) return { ok: false, error: e.message };
    throw e;
  }
  refresh();
  return { ok: true, message: "Test payout request submitted for review. No money will be transferred." };
}
