import { canTransition, isPastHoldPeriod } from "@/lib/domain/commissions";
import { checkReferralEligibility, normaliseReferralCode } from "@/lib/domain/referrals";
import { audit, notify } from "./audit";
import { db, type Tx } from "./db";

// Referral attribution, commission review and payout requests.
// Payout *processing* is intentionally absent: no code path moves money.

export const PAYOUTS_ENABLED = false as const;

export async function attributeReferral(
  tx: Tx,
  input: { newUserId: string; newUserEmail: string; code: string | null; source: "LINK" | "CODE" },
) {
  const code = normaliseReferralCode(input.code);
  if (!code) return { attributed: false as const, reason: "no-code" as const };
  const [settings, referrer] = await Promise.all([
    tx.affiliateSettings.findUniqueOrThrow({ where: { id: 1 } }),
    tx.user.findUnique({ where: { referralCode: code }, select: { id: true, email: true, status: true } }),
  ]);
  const check = checkReferralEligibility({ programEnabled: settings.programEnabled, newUserEmail: input.newUserEmail, referrer });
  if (!check.ok || !referrer || referrer.id === input.newUserId) {
    return { attributed: false as const, reason: check.ok ? ("self-referral" as const) : check.reason };
  }
  await tx.referralRelationship.create({
    data: { referrerId: referrer.id, referredUserId: input.newUserId, source: input.source, codeUsed: code },
  });
  await notify(referrer.id, { title: "New referral", body: "Someone joined LifeOS with your referral link.", href: "/app/referrals" }, tx);
  return { attributed: true as const };
}

export class AffiliateError extends Error {}

export async function approveCommission(id: string, actorId: string, opts: { overrideHold?: boolean } = {}) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "CommissionRecord" WHERE id = ${id} FOR UPDATE`;
    const c = await tx.commissionRecord.findUnique({ where: { id } });
    if (!c) throw new AffiliateError("Commission not found.");
    if (!canTransition(c.status, "APPROVED")) throw new AffiliateError(`A ${c.status.toLowerCase()} commission cannot be approved.`);
    const settings = await tx.affiliateSettings.findUniqueOrThrow({ where: { id: 1 } });
    if (!opts.overrideHold && !isPastHoldPeriod(c.createdAt, settings.holdPeriodDays)) {
      throw new AffiliateError(`This commission is still inside the ${settings.holdPeriodDays}-day refund hold period.`);
    }
    await tx.commissionRecord.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date() } });
    await tx.commissionLedgerEntry.create({
      data: { commissionId: id, beneficiaryId: c.beneficiaryId, type: "APPROVED", amountInPaise: 0, note: opts.overrideHold ? "Approved (hold period overridden)" : "Approved after hold period", actorId },
    });
    await audit({ actorId, action: "commission.approved", entityType: "CommissionRecord", entityId: id, metadata: { overrideHold: !!opts.overrideHold } }, tx);
  });
}

export async function reverseCommission(id: string, reason: string, actorId: string) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "CommissionRecord" WHERE id = ${id} FOR UPDATE`;
    const c = await tx.commissionRecord.findUnique({ where: { id } });
    if (!c) throw new AffiliateError("Commission not found.");
    if (!canTransition(c.status, "REVERSED")) throw new AffiliateError(`A ${c.status.toLowerCase()} commission cannot be reversed.`);
    await tx.commissionRecord.update({
      where: { id },
      data: { status: "REVERSED", reversedAt: new Date(), reversalReason: reason, payoutRequestId: null },
    });
    await tx.commissionLedgerEntry.create({
      data: { commissionId: id, beneficiaryId: c.beneficiaryId, type: "REVERSED", amountInPaise: -c.amountInPaise, note: reason, actorId },
    });
    await audit({ actorId, action: "commission.reversed", entityType: "CommissionRecord", entityId: id, metadata: { reason } }, tx);
  });
}

export async function commissionSummary(userId: string) {
  const groups = await db.commissionRecord.groupBy({
    by: ["status"],
    where: { beneficiaryId: userId },
    _sum: { amountInPaise: true },
    _count: true,
  });
  const pick = (s: string) => groups.find((g) => g.status === s);
  const available = await db.commissionRecord.aggregate({
    where: { beneficiaryId: userId, status: "APPROVED", payoutRequestId: null },
    _sum: { amountInPaise: true },
  });
  return {
    pending: pick("PENDING")?._sum.amountInPaise ?? 0,
    approved: pick("APPROVED")?._sum.amountInPaise ?? 0,
    reversed: pick("REVERSED")?._sum.amountInPaise ?? 0,
    paid: pick("PAID")?._sum.amountInPaise ?? 0,
    counts: Object.fromEntries(groups.map((g) => [g.status, g._count])) as Record<string, number>,
    availableForRequest: available._sum.amountInPaise ?? 0,
  };
}

/**
 * Create a TEST payout request from approved, unrequested commissions.
 * The request is recorded for review only; no transfer is ever initiated.
 */
export async function requestPayout(userId: string, note?: string) {
  return db.$transaction(async (tx) => {
    const settings = await tx.affiliateSettings.findUniqueOrThrow({ where: { id: 1 } });
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.affiliateOptIn) throw new AffiliateError("Join the affiliate programme first.");
    const open = await tx.payoutRequest.count({ where: { userId, status: "REQUESTED" } });
    if (open > 0) throw new AffiliateError("You already have a payout request under review.");
    const eligible = await tx.commissionRecord.findMany({ where: { beneficiaryId: userId, status: "APPROVED", payoutRequestId: null } });
    const amount = eligible.reduce((s, c) => s + c.amountInPaise, 0);
    if (amount < settings.minPayoutInPaise) throw new AffiliateError("Your approved balance is below the minimum payout threshold.");
    const req = await tx.payoutRequest.create({ data: { userId, amountInPaise: amount, isTest: true, note } });
    await tx.commissionRecord.updateMany({ where: { id: { in: eligible.map((c) => c.id) } }, data: { payoutRequestId: req.id } });
    await audit({ actorId: userId, action: "payout.requested", entityType: "PayoutRequest", entityId: req.id, metadata: { amount, isTest: true } }, tx);
    return req;
  });
}

export async function reviewPayout(id: string, decision: "APPROVED" | "REJECTED", actorId: string, reviewNote?: string) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "PayoutRequest" WHERE id = ${id} FOR UPDATE`;
    const req = await tx.payoutRequest.findUnique({ where: { id } });
    if (!req) throw new AffiliateError("Payout request not found.");
    if (req.status !== "REQUESTED") throw new AffiliateError("This request has already been reviewed.");
    await tx.payoutRequest.update({ where: { id }, data: { status: decision, reviewedById: actorId, reviewedAt: new Date(), reviewNote } });
    if (decision === "REJECTED") {
      await tx.commissionRecord.updateMany({ where: { payoutRequestId: id }, data: { payoutRequestId: null } });
    }
    await notify(req.userId, {
      title: decision === "APPROVED" ? "Payout request approved (test)" : "Payout request declined",
      body: decision === "APPROVED"
        ? "Recorded for testing only. Payouts are disabled until the programme receives legal approval."
        : reviewNote || "Your payout request was declined. Contact support for details.",
      href: "/app/referrals",
    }, tx);
    await audit({ actorId, action: `payout.${decision.toLowerCase()}`, entityType: "PayoutRequest", entityId: id, metadata: { reviewNote: reviewNote ?? null, isTest: true } }, tx);
  });
}
