"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { approveCommission, reverseCommission, reviewPayout } from "@/lib/core/affiliate";
import { audit, notify } from "@/lib/core/audit";
import { db } from "@/lib/core/db";
import { refundOrder } from "@/lib/core/orders";
import { validateLevelRates } from "@/lib/domain/commissions";
import { rupeesToPaise } from "@/lib/domain/money";
import { assertAdmin } from "@/lib/server/auth";
import { errorMessage, percentToBps, zodFieldErrors, type ActionResult, type FormResult } from "./utils";

const id = z.string().min(1).max(64);
const reason = z.string().trim().min(5, "Give a reason of at least 5 characters.").max(500);

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function adminRefundOrder(orderId: string, refundReason: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  const parsed = z.object({ orderId: id, reason }).safeParse({ orderId, reason: refundReason });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found." };
  if (!order.isTest) {
    // Real-money refunds must be initiated with the payment provider; its
    // signed refund webhook then applies the same reversal logic.
    return { ok: false, error: "This order was paid through a live provider. Issue the refund from the provider dashboard." };
  }
  try {
    const res = await refundOrder(orderId, { reason: parsed.data.reason, actorId: admin.id });
    refresh();
    if (res.status === "already-refunded") return { ok: true, message: "This order was already refunded." };
    return { ok: true, message: `Order refunded. Access revoked and ${res.reversed} commission${res.reversed === 1 ? "" : "s"} reversed.` };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

// ─── Members ────────────────────────────────────────────────────────────────

export async function suspendMember(userId: string, suspendReason: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  const parsed = z.object({ userId: id, reason }).safeParse({ userId, reason: suspendReason });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (userId === admin.id) return { ok: false, error: "You can't suspend your own account." };
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "Member not found." };
  if (target.role === "ADMIN") return { ok: false, error: "Administrators can't be suspended from here. Remove the admin role first (database change)." };
  if (target.status === "SUSPENDED") return { ok: true, message: "Member is already suspended." };
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { status: "SUSPENDED", suspendedReason: parsed.data.reason } });
    const { count } = await tx.session.deleteMany({ where: { userId } });
    await audit({ actorId: admin.id, action: "member.suspended", entityType: "User", entityId: userId, metadata: { reason: parsed.data.reason, sessionsRevoked: count } }, tx);
  });
  refresh();
  return { ok: true, message: `${target.name} suspended and signed out of all devices.` };
}

export async function reinstateMember(userId: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  if (!id.safeParse(userId).success) return { ok: false, error: "Invalid request." };
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "Member not found." };
  if (target.status === "ACTIVE") return { ok: true };
  await db.user.update({ where: { id: userId }, data: { status: "ACTIVE", suspendedReason: null } });
  await audit({ actorId: admin.id, action: "member.reinstated", entityType: "User", entityId: userId, metadata: { previousReason: target.suspendedReason } });
  refresh();
  return { ok: true, message: `${target.name} reinstated.` };
}

export async function grantEntitlement(userId: string, productId: string, grantReason: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  const parsed = z.object({ userId: id, productId: id, reason }).safeParse({ userId, productId, reason: grantReason });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const [user, product, existing] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.product.findUnique({ where: { id: productId } }),
    db.digitalEntitlement.findUnique({ where: { userId_productId: { userId, productId } } }),
  ]);
  if (!user || !product) return { ok: false, error: "Member or product not found." };
  if (existing && !existing.revokedAt) return { ok: false, error: `${user.name} already has access to ${product.name}.` };
  await db.$transaction(async (tx) => {
    await tx.digitalEntitlement.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, source: "ADMIN_GRANT" },
      update: { source: "ADMIN_GRANT", revokedAt: null, revokeReason: null, grantedAt: new Date(), orderItemId: null },
    });
    await notify(userId, { title: "Added to your library", body: `${product.name} was added to your library by the LifeOS team.`, href: "/app/library" }, tx);
    await audit({ actorId: admin.id, action: "entitlement.granted", entityType: "User", entityId: userId, metadata: { productId, product: product.name, reason: parsed.data.reason } }, tx);
  });
  refresh();
  return { ok: true, message: `${product.name} granted to ${user.name}.` };
}

// ─── Affiliate programme ────────────────────────────────────────────────────

const affiliateSchema = z.object({
  commissionMode: z.enum(["DISABLED", "TEST"], { error: "Commission mode must be Disabled or Test." }),
  attributionWindowDays: z.coerce.number().int("Use whole days.").min(1, "At least 1 day.").max(365, "At most 365 days."),
  holdPeriodDays: z.coerce.number().int("Use whole days.").min(0, "Can't be negative.").max(120, "At most 120 days."),
  minPayout: z.string().trim().min(1, "Enter a minimum payout."),
});

export async function updateAffiliateSettings(_: FormResult, formData: FormData): Promise<FormResult> {
  const admin = await assertAdmin();
  const parsed = affiliateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const minPayoutInPaise = rupeesToPaise(parsed.data.minPayout);
  if (minPayoutInPaise === null) return { error: "Please fix the highlighted fields.", fieldErrors: { minPayout: "Enter an amount in rupees." } };

  const levels: { level: number; rateBps: number; enabled: boolean }[] = [];
  const fieldErrors: Record<string, string> = {};
  for (const level of [1, 2, 3]) {
    const bps = percentToBps(String(formData.get(`rate${level}`) ?? ""));
    if (bps === null) fieldErrors[`rate${level}`] = "Enter a percentage like 15 or 2.5.";
    levels.push({ level, rateBps: bps ?? 0, enabled: formData.get(`enabled${level}`) === "on" });
  }
  if (Object.keys(fieldErrors).length) return { error: "Please fix the highlighted fields.", fieldErrors };
  const rateProblem = validateLevelRates(levels);
  if (rateProblem) return { error: rateProblem };

  const [beforeSettings, beforeLevels] = await Promise.all([
    db.affiliateSettings.findUniqueOrThrow({ where: { id: 1 } }),
    db.commissionLevel.findMany({ orderBy: { level: "asc" } }),
  ]);
  const after = {
    programEnabled: formData.get("programEnabled") === "on",
    commissionMode: parsed.data.commissionMode,
    attributionWindowDays: parsed.data.attributionWindowDays,
    holdPeriodDays: parsed.data.holdPeriodDays,
    minPayoutInPaise,
  };
  await db.$transaction(async (tx) => {
    await tx.affiliateSettings.update({ where: { id: 1 }, data: after });
    for (const l of levels) {
      await tx.commissionLevel.upsert({ where: { level: l.level }, create: l, update: { rateBps: l.rateBps, enabled: l.enabled } });
    }
    await audit(
      {
        actorId: admin.id,
        action: "affiliate.settings_updated",
        entityType: "AffiliateSettings",
        entityId: "1",
        metadata: {
          before: {
            programEnabled: beforeSettings.programEnabled,
            commissionMode: beforeSettings.commissionMode,
            attributionWindowDays: beforeSettings.attributionWindowDays,
            holdPeriodDays: beforeSettings.holdPeriodDays,
            minPayoutInPaise: beforeSettings.minPayoutInPaise,
            levels: beforeLevels.map((l) => ({ level: l.level, rateBps: l.rateBps, enabled: l.enabled })),
          },
          after: { ...after, levels },
        },
      },
      tx,
    );
  });
  // The public /affiliate-programme page caches programme settings and rates.
  updateTag("affiliate-settings");
  refresh();
  return { ok: true, message: "Affiliate settings saved. Changes apply to orders paid from now on." };
}

// ─── Commissions & payouts ──────────────────────────────────────────────────

export async function adminApproveCommission(commissionId: string, overrideHold: boolean): Promise<ActionResult & { holdBlocked?: boolean }> {
  const admin = await assertAdmin();
  if (!id.safeParse(commissionId).success) return { ok: false, error: "Invalid request." };
  try {
    await approveCommission(commissionId, admin.id, { overrideHold: !!overrideHold });
    refresh();
    return { ok: true, message: overrideHold ? "Approved (hold period overridden)." : "Commission approved." };
  } catch (e) {
    const msg = errorMessage(e);
    return { ok: false, error: msg, holdBlocked: msg.includes("hold period") };
  }
}

export async function adminReverseCommission(commissionId: string, reverseReason: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  const parsed = z.object({ commissionId: id, reason }).safeParse({ commissionId, reason: reverseReason });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    await reverseCommission(commissionId, parsed.data.reason, admin.id);
    refresh();
    return { ok: true, message: "Commission reversed and recorded in the ledger." };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

export async function adminReviewPayout(payoutId: string, decision: "APPROVED" | "REJECTED", note: string): Promise<ActionResult> {
  const admin = await assertAdmin();
  const parsed = z
    .object({ payoutId: id, decision: z.enum(["APPROVED", "REJECTED"]), note: z.string().trim().max(500) })
    .refine((v) => v.decision === "APPROVED" || v.note.length >= 5, { message: "Explain why the request is declined (at least 5 characters)." })
    .safeParse({ payoutId, decision, note });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    await reviewPayout(payoutId, parsed.data.decision, admin.id, parsed.data.note || undefined);
    refresh();
    return { ok: true, message: parsed.data.decision === "APPROVED" ? "Approved for testing. No money was sent." : "Payout request declined." };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

// ─── Platform settings ──────────────────────────────────────────────────────

const settingsSchema = z.object({
  taxRate: z.string().trim().min(1, "Enter a tax rate (0 for none)."),
  taxLabel: z.string().trim().min(2, "Enter a label shown at checkout.").max(60),
  supportEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
  announcement: z.string().trim().max(200, "Keep announcements under 200 characters.").optional(),
});

export async function updatePlatformSettings(_: FormResult, formData: FormData): Promise<FormResult> {
  const admin = await assertAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const taxRateBps = percentToBps(parsed.data.taxRate);
  if (taxRateBps === null || taxRateBps > 10000) return { error: "Please fix the highlighted fields.", fieldErrors: { taxRate: "Enter a percentage between 0 and 100." } };
  const before = await db.platformSettings.findUniqueOrThrow({ where: { id: 1 } });
  const after = {
    taxRateBps,
    taxLabel: parsed.data.taxLabel,
    supportEmail: parsed.data.supportEmail,
    announcement: parsed.data.announcement || null,
    signupsEnabled: formData.get("signupsEnabled") === "on",
  };
  await db.platformSettings.update({ where: { id: 1 }, data: after });
  await audit({
    actorId: admin.id,
    action: "platform.settings_updated",
    entityType: "PlatformSettings",
    entityId: "1",
    metadata: {
      before: { taxRateBps: before.taxRateBps, taxLabel: before.taxLabel, supportEmail: before.supportEmail, announcement: before.announcement, signupsEnabled: before.signupsEnabled },
      after,
    },
  });
  refresh();
  return { ok: true, message: "Platform settings saved." };
}
