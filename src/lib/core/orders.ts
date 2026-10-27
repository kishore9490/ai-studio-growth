import { computeCommissions, resolveUpline } from "@/lib/domain/commissions";
import { addBillingPeriod, computeOrderTotals } from "@/lib/domain/pricing";
import { formatINR } from "@/lib/domain/money";
import { audit, notify } from "./audit";
import { db, type Tx } from "./db";
import { getMembership } from "./membership";

// Order lifecycle. Every state change runs inside a database transaction and
// takes a row lock on the order, so concurrent webhook deliveries or double
// clicks cannot fulfil, refund or accrue commission twice.

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "not-found"
      | "invalid-state"
      | "amount-mismatch"
      | "empty"
      | "unavailable"
      | "already-owned"
      | "already-member",
  ) {
    super(message);
  }
}

export type OrderLineInput = { type: "PRODUCT"; productId: string } | { type: "MEMBERSHIP"; planId: string };

async function nextOrderNumber(tx: Tx) {
  const year = new Date().getUTCFullYear();
  const count = await tx.order.count();
  // Random suffix keeps numbers unique without a sequence table; the column is unique anyway.
  return `LOS-${year}-${String(count + 1).padStart(5, "0")}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
}

export async function createOrder(
  userId: string,
  lines: OrderLineInput[],
  opts: { provider: string; isTest: boolean; isSampleData?: boolean },
) {
  if (lines.length === 0) throw new OrderError("Your cart is empty.", "empty");
  return db.$transaction(async (tx) => {
    const settings = await tx.platformSettings.findUniqueOrThrow({ where: { id: 1 } });
    const items: { type: "PRODUCT" | "MEMBERSHIP"; productId?: string; planId?: string; name: string; unitPriceInPaise: number }[] = [];

    const productIds = lines.flatMap((l) => (l.type === "PRODUCT" ? [l.productId] : []));
    if (new Set(productIds).size !== productIds.length) throw new OrderError("Duplicate items in order.", "invalid-state");

    if (productIds.length) {
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const owned = await tx.digitalEntitlement.findMany({
        where: { userId, productId: { in: productIds }, revokedAt: null },
        select: { productId: true },
      });
      if (owned.length) throw new OrderError("You already own one of these products.", "already-owned");
      for (const id of productIds) {
        const p = products.find((x) => x.id === id);
        if (!p || p.status !== "PUBLISHED") throw new OrderError("A product in your cart is no longer available.", "unavailable");
        items.push({ type: "PRODUCT", productId: p.id, name: p.name, unitPriceInPaise: p.priceInPaise });
      }
    }

    for (const line of lines) {
      if (line.type !== "MEMBERSHIP") continue;
      const plan = await tx.membershipPlan.findUnique({ where: { id: line.planId } });
      if (!plan || !plan.isActive || plan.interval === "NONE" || plan.priceInPaise <= 0) {
        throw new OrderError("That membership plan is not available.", "unavailable");
      }
      const membership = await getMembership(userId, tx);
      if (membership.isPremium) throw new OrderError("You already have an active Premium membership.", "already-member");
      items.push({ type: "MEMBERSHIP", planId: plan.id, name: `${plan.name} membership`, unitPriceInPaise: plan.priceInPaise });
    }

    const totals = computeOrderTotals(
      items.map((i) => ({ unitPriceInPaise: i.unitPriceInPaise, quantity: 1 })),
      settings.taxRateBps,
    );

    const order = await tx.order.create({
      data: {
        number: await nextOrderNumber(tx),
        userId,
        subtotalInPaise: totals.subtotalInPaise,
        taxInPaise: totals.taxInPaise,
        totalInPaise: totals.totalInPaise,
        taxRateBps: totals.taxRateBps,
        taxLabel: settings.taxLabel,
        isTest: opts.isTest,
        isSampleData: opts.isSampleData ?? false,
        items: {
          create: items.map((i) => ({
            type: i.type,
            productId: i.productId,
            planId: i.planId,
            name: i.name,
            unitPriceInPaise: i.unitPriceInPaise,
            quantity: 1,
            totalInPaise: i.unitPriceInPaise,
          })),
        },
        payments: totals.totalInPaise > 0 ? { create: { provider: opts.provider, amountInPaise: totals.totalInPaise } } : undefined,
      },
      include: { items: true },
    });
    await audit({ actorId: userId, action: "order.created", entityType: "Order", entityId: order.id, metadata: { total: order.totalInPaise, isTest: opts.isTest } }, tx);
    return order;
  });
}

async function lockOrder(tx: Tx, orderId: string) {
  await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true, plan: true } } },
  });
  if (!order) throw new OrderError("Order not found.", "not-found");
  return order;
}

export type FulfilResult = { status: "fulfilled" | "already-fulfilled"; commissionsCreated: number };

/**
 * Mark an order as paid and grant everything it includes. Must only be called
 * after the payment has been verified server-side (mock provider in dev, or a
 * signature-verified webhook). Safe to call repeatedly: the second call is a no-op.
 */
export async function fulfilOrder(
  orderId: string,
  payment: { provider: string; providerRef: string | null; amountInPaise?: number },
): Promise<FulfilResult> {
  return db.$transaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (order.status === "PAID" || order.status === "REFUNDED") return { status: "already-fulfilled", commissionsCreated: 0 };
    if (order.status !== "PENDING") throw new OrderError(`Order is ${order.status.toLowerCase()} and cannot be fulfilled.`, "invalid-state");
    if (payment.amountInPaise !== undefined && payment.amountInPaise !== order.totalInPaise) {
      throw new OrderError("Paid amount does not match the order total.", "amount-mismatch");
    }

    const now = new Date();
    await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: now } });
    await tx.payment.updateMany({
      where: { orderId: order.id, status: "CREATED" },
      data: { status: "SUCCEEDED", providerRef: payment.providerRef },
    });

    const productIds: string[] = [];
    for (const item of order.items) {
      if (item.type === "PRODUCT" && item.productId) {
        productIds.push(item.productId);
        await tx.digitalEntitlement.upsert({
          where: { userId_productId: { userId: order.userId, productId: item.productId } },
          create: { userId: order.userId, productId: item.productId, orderItemId: item.id, source: "PURCHASE", isTest: order.isTest },
          update: { orderItemId: item.id, revokedAt: null, revokeReason: null, grantedAt: now, isTest: order.isTest },
        });
      }
      if (item.type === "MEMBERSHIP" && item.plan && item.plan.interval !== "NONE") {
        await tx.membershipSubscription.create({
          data: {
            userId: order.userId,
            planId: item.plan.id,
            orderItemId: item.id,
            provider: payment.provider,
            isTest: order.isTest,
            currentPeriodStart: now,
            currentPeriodEnd: addBillingPeriod(now, item.plan.interval),
          },
        });
      }
    }
    if (productIds.length) {
      await tx.cartItem.deleteMany({ where: { userId: order.userId, productId: { in: productIds } } });
    }

    const commissionsCreated = await accrueCommissions(tx, order);

    await notify(
      order.userId,
      {
        title: order.isTest ? "Test purchase complete" : "Purchase complete",
        body: `Order ${order.number} · ${formatINR(order.totalInPaise)}. Your items are ready in your library.`,
        href: "/app/library",
      },
      tx,
    );
    await audit({ actorId: order.userId, action: "order.paid", entityType: "Order", entityId: order.id, metadata: { provider: payment.provider, providerRef: payment.providerRef, commissionsCreated } }, tx);
    return { status: "fulfilled", commissionsCreated };
  });
}

async function accrueCommissions(tx: Tx, order: Awaited<ReturnType<typeof lockOrder>>) {
  const [settings, levels] = await Promise.all([
    tx.affiliateSettings.findUniqueOrThrow({ where: { id: 1 } }),
    tx.commissionLevel.findMany(),
  ]);
  const upline = await resolveUpline(order.userId, async (userId) => {
    const rel = await tx.referralRelationship.findUnique({
      where: { referredUserId: userId },
      include: { referrer: { select: { id: true, affiliateOptIn: true, status: true } } },
    });
    return rel ? { userId: rel.referrer.id, affiliateOptIn: rel.referrer.affiliateOptIn, status: rel.referrer.status } : null;
  });
  const { drafts } = computeCommissions({
    mode: settings.commissionMode,
    programEnabled: settings.programEnabled,
    buyerId: order.userId,
    levels,
    upline,
    items: order.items.map((i) => ({
      orderItemId: i.id,
      type: i.type,
      totalInPaise: i.totalInPaise,
      commissionEligible: i.product?.commissionEligible ?? false,
    })),
  });

  let created = 0;
  for (const d of drafts) {
    // The (orderItemId, level) unique constraint is the final guard against duplicates.
    const existing = await tx.commissionRecord.findUnique({ where: { orderItemId_level: { orderItemId: d.orderItemId, level: d.level } } });
    if (existing) continue;
    const record = await tx.commissionRecord.create({
      data: { ...d, buyerId: order.userId, orderId: order.id, isTest: true, status: "PENDING" },
    });
    await tx.commissionLedgerEntry.create({
      data: { commissionId: record.id, beneficiaryId: d.beneficiaryId, type: "ACCRUED", amountInPaise: d.amountInPaise, note: `Level ${d.level} · order ${order.number} (test mode)` },
    });
    await notify(
      d.beneficiaryId,
      { title: "Test commission recorded", body: `${formatINR(d.amountInPaise, { exact: true })} pending from a level ${d.level} referral sale. Test mode — no payout.`, href: "/app/referrals" },
      tx,
    );
    created++;
  }
  return created;
}

export async function failOrder(orderId: string, reason: string) {
  return db.$transaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (order.status !== "PENDING") return { status: "unchanged" as const };
    await tx.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    await tx.payment.updateMany({ where: { orderId: order.id, status: "CREATED" }, data: { status: "FAILED", failureReason: reason } });
    await audit({ actorId: order.userId, action: "order.payment_failed", entityType: "Order", entityId: order.id, metadata: { reason } }, tx);
    return { status: "failed" as const };
  });
}

/** Re-open a failed order for another payment attempt. */
export async function retryOrder(orderId: string, provider: string) {
  return db.$transaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (order.status !== "FAILED") return;
    await tx.order.update({ where: { id: order.id }, data: { status: "PENDING" } });
    await tx.payment.create({ data: { orderId: order.id, provider, amountInPaise: order.totalInPaise } });
  });
}

export async function cancelOrder(orderId: string, userId: string) {
  return db.$transaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (order.userId !== userId) throw new OrderError("Order not found.", "not-found");
    if (order.status !== "PENDING" && order.status !== "FAILED") return;
    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await tx.payment.updateMany({ where: { orderId: order.id, status: "CREATED" }, data: { status: "FAILED", failureReason: "Cancelled by customer" } });
  });
}

/**
 * Refund a paid order: revoke entitlements, end memberships bought with it and
 * reverse any commissions that have not been paid out.
 */
export async function refundOrder(orderId: string, opts: { reason: string; actorId: string | null }) {
  return db.$transaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (order.status === "REFUNDED") return { status: "already-refunded" as const, reversed: 0 };
    if (order.status !== "PAID") throw new OrderError("Only paid orders can be refunded.", "invalid-state");
    const now = new Date();

    await tx.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
    await tx.payment.updateMany({ where: { orderId: order.id, status: "SUCCEEDED" }, data: { status: "REFUNDED" } });
    await tx.refund.create({
      data: { orderId: order.id, amountInPaise: order.totalInPaise, reason: opts.reason, isTest: order.isTest, createdById: opts.actorId },
    });

    const itemIds = order.items.map((i) => i.id);
    await tx.digitalEntitlement.updateMany({
      where: { orderItemId: { in: itemIds }, revokedAt: null },
      data: { revokedAt: now, revokeReason: `Refunded: ${opts.reason}` },
    });
    await tx.membershipSubscription.updateMany({
      where: { orderItemId: { in: itemIds }, status: "ACTIVE" },
      data: { status: "CANCELLED", cancelledAt: now, currentPeriodEnd: now },
    });

    const commissions = await tx.commissionRecord.findMany({ where: { orderId: order.id } });
    let reversed = 0;
    for (const c of commissions) {
      if (c.status === "PENDING" || c.status === "APPROVED") {
        await tx.commissionRecord.update({
          where: { id: c.id },
          data: { status: "REVERSED", reversedAt: now, reversalReason: `Order refunded: ${opts.reason}`, payoutRequestId: null },
        });
        await tx.commissionLedgerEntry.create({
          data: { commissionId: c.id, beneficiaryId: c.beneficiaryId, type: "REVERSED", amountInPaise: -c.amountInPaise, note: `Refund of order ${order.number}`, actorId: opts.actorId },
        });
        await notify(c.beneficiaryId, { title: "Test commission reversed", body: `A referred order was refunded, so ${formatINR(c.amountInPaise, { exact: true })} was reversed.`, href: "/app/referrals" }, tx);
        reversed++;
      } else if (c.status === "PAID") {
        await audit({ actorId: opts.actorId, action: "commission.clawback_required", entityType: "CommissionRecord", entityId: c.id, metadata: { orderId: order.id } }, tx);
      }
    }

    await notify(order.userId, { title: "Refund processed", body: `Order ${order.number} was refunded${order.isTest ? " (test order — no money moved)" : ""}.`, href: "/app/orders" }, tx);
    await audit({ actorId: opts.actorId, action: "order.refunded", entityType: "Order", entityId: order.id, metadata: { reason: opts.reason, reversedCommissions: reversed, isTest: order.isTest } }, tx);
    return { status: "refunded" as const, reversed };
  });
}
