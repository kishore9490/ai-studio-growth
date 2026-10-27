import { applyBps, assertPaise, type Paise } from "./money";

// Pure commission rules. The database layer (src/lib/server/fulfilment.ts)
// calls these inside a transaction; nothing here touches I/O so the rules can
// be unit tested exhaustively.

export const MAX_LEVELS = 3;

export type CommissionModeValue = "DISABLED" | "TEST";

export type LevelConfig = { level: number; rateBps: number; enabled: boolean };

export type UplineMember = {
  userId: string;
  level: number;
  /** Affiliates must explicitly opt in to the programme to earn. */
  affiliateOptIn: boolean;
  status: "ACTIVE" | "SUSPENDED";
};

export type CommissionableItem = {
  orderItemId: string;
  type: "PRODUCT" | "MEMBERSHIP";
  totalInPaise: Paise;
  commissionEligible: boolean;
};

export type CommissionDraft = {
  orderItemId: string;
  beneficiaryId: string;
  level: number;
  rateBps: number;
  baseAmountInPaise: Paise;
  amountInPaise: Paise;
};

export type CommissionContext = {
  mode: CommissionModeValue;
  programEnabled: boolean;
  buyerId: string;
  levels: LevelConfig[];
  upline: UplineMember[];
  items: CommissionableItem[];
};

export type SkipReason =
  | "programme-disabled"
  | "commissions-disabled"
  | "no-upline"
  | "no-eligible-items";

/**
 * Compute commission drafts for a verified, paid order.
 *
 * Rules:
 * - Nothing accrues unless the programme is enabled AND the mode is TEST
 *   (there is no live mode in this MVP).
 * - Only PRODUCT items flagged commissionEligible qualify. Memberships never do,
 *   so nobody is rewarded for selling a subscription or for recruitment alone.
 * - Each level must be enabled with a positive rate.
 * - A beneficiary must be ACTIVE, opted in, and never the buyer.
 * - A beneficiary appears at most once per order item (cycle protection).
 * - Amounts are floored to whole paise — we never round commission up.
 */
export function computeCommissions(ctx: CommissionContext): { drafts: CommissionDraft[]; skipped?: SkipReason } {
  if (!ctx.programEnabled) return { drafts: [], skipped: "programme-disabled" };
  if (ctx.mode !== "TEST") return { drafts: [], skipped: "commissions-disabled" };
  if (ctx.upline.length === 0) return { drafts: [], skipped: "no-upline" };

  const eligibleItems = ctx.items.filter((i) => i.type === "PRODUCT" && i.commissionEligible && i.totalInPaise > 0);
  if (eligibleItems.length === 0) return { drafts: [], skipped: "no-eligible-items" };

  const levelByNumber = new Map(ctx.levels.map((l) => [l.level, l]));
  const drafts: CommissionDraft[] = [];

  for (const item of eligibleItems) {
    assertPaise(item.totalInPaise);
    const seen = new Set<string>([ctx.buyerId]);
    for (const member of [...ctx.upline].sort((a, b) => a.level - b.level)) {
      if (member.level < 1 || member.level > MAX_LEVELS) continue;
      if (seen.has(member.userId)) continue;
      seen.add(member.userId);

      const config = levelByNumber.get(member.level);
      if (!config || !config.enabled || config.rateBps <= 0) continue;
      if (member.status !== "ACTIVE" || !member.affiliateOptIn) continue;

      const amount = applyBps(item.totalInPaise, config.rateBps, "floor");
      if (amount <= 0) continue;
      drafts.push({
        orderItemId: item.orderItemId,
        beneficiaryId: member.userId,
        level: member.level,
        rateBps: config.rateBps,
        baseAmountInPaise: item.totalInPaise,
        amountInPaise: amount,
      });
    }
  }
  return { drafts };
}

/**
 * Walk referral relationships upwards from the buyer, at most MAX_LEVELS deep.
 * `referrerOf` resolves the direct referrer of a user (or null).
 */
export async function resolveUpline(
  buyerId: string,
  referrerOf: (userId: string) => Promise<Omit<UplineMember, "level"> | null>,
): Promise<UplineMember[]> {
  const upline: UplineMember[] = [];
  const visited = new Set<string>([buyerId]);
  let current = buyerId;
  for (let level = 1; level <= MAX_LEVELS; level++) {
    const ref = await referrerOf(current);
    if (!ref || visited.has(ref.userId)) break;
    visited.add(ref.userId);
    upline.push({ ...ref, level });
    current = ref.userId;
  }
  return upline;
}

export type CommissionStatusValue = "PENDING" | "APPROVED" | "REVERSED" | "PAID";

/** Allowed transitions for the commission state machine. */
export function canTransition(from: CommissionStatusValue, to: CommissionStatusValue): boolean {
  const allowed: Record<CommissionStatusValue, CommissionStatusValue[]> = {
    PENDING: ["APPROVED", "REVERSED"],
    APPROVED: ["REVERSED", "PAID"],
    REVERSED: [],
    PAID: [],
  };
  return allowed[from].includes(to);
}

/** A pending commission may only be approved once the refund hold period has elapsed. */
export function isPastHoldPeriod(createdAt: Date, holdPeriodDays: number, now = new Date()): boolean {
  return now.getTime() - createdAt.getTime() >= holdPeriodDays * 24 * 60 * 60 * 1000;
}

export function validateLevelRates(levels: LevelConfig[]): string | null {
  const total = levels.filter((l) => l.enabled).reduce((sum, l) => sum + l.rateBps, 0);
  for (const l of levels) {
    if (!Number.isInteger(l.rateBps) || l.rateBps < 0 || l.rateBps > 5000) {
      return `Level ${l.level} rate must be between 0% and 50%.`;
    }
  }
  if (total > 5000) return "Combined enabled rates cannot exceed 50% of the item price.";
  return null;
}
