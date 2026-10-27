import { db, type Tx } from "./db";

export type MembershipState = {
  isPremium: boolean;
  subscription: {
    id: string;
    planCode: string;
    planName: string;
    interval: "NONE" | "MONTH" | "YEAR";
    priceInPaise: number;
    status: "ACTIVE" | "CANCELLED" | "EXPIRED";
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    isTest: boolean;
    provider: string;
  } | null;
};

/**
 * A member is premium while they hold an ACTIVE subscription whose period has
 * not ended. Subscriptions set to cancel at period end keep access until then.
 * Expired subscriptions are marked lazily on read.
 */
export async function getMembership(userId: string, tx: Tx | typeof db = db): Promise<MembershipState> {
  const now = new Date();
  const sub = await tx.membershipSubscription.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { currentPeriodEnd: "desc" },
    include: { plan: true },
  });
  if (!sub) return { isPremium: false, subscription: null };
  if (sub.currentPeriodEnd <= now) {
    await tx.membershipSubscription.update({
      where: { id: sub.id },
      data: { status: sub.cancelAtPeriodEnd ? "CANCELLED" : "EXPIRED" },
    });
    return { isPremium: false, subscription: null };
  }
  return {
    isPremium: true,
    subscription: {
      id: sub.id,
      planCode: sub.plan.code,
      planName: sub.plan.name,
      interval: sub.plan.interval,
      priceInPaise: sub.plan.priceInPaise,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      isTest: sub.isTest,
      provider: sub.provider,
    },
  };
}

/** Whether a user may download / open a product. */
export async function productAccess(userId: string, productId: string) {
  const [ent, product] = await Promise.all([
    db.digitalEntitlement.findUnique({ where: { userId_productId: { userId, productId } } }),
    db.product.findUnique({ where: { id: productId }, select: { includedWithPremium: true, priceInPaise: true } }),
  ]);
  if (ent && !ent.revokedAt) return { allowed: true as const, via: "purchase" as const };
  if (product?.includedWithPremium) {
    const m = await getMembership(userId);
    if (m.isPremium) return { allowed: true as const, via: "premium" as const };
  }
  return { allowed: false as const, via: null };
}
