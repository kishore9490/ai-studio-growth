"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/core/audit";
import { db } from "@/lib/core/db";
import { getMembership } from "@/lib/core/membership";
import { OrderError, cancelOrder, createOrder, failOrder, fulfilOrder, retryOrder, type OrderLineInput } from "@/lib/core/orders";
import { clientKey, getCurrentUser, requireUser } from "@/lib/server/auth";
import { paymentConfig } from "@/lib/server/env";
import { limiters, retryMessage } from "@/lib/server/rate-limits";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const id = z.string().min(1).max(64);

async function userOrSignIn(next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

function orderError(e: unknown): ActionResult {
  if (e instanceof OrderError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
}

// ─── Cart ───────────────────────────────────────────────────────────────────

export async function addToCart(productId: string, returnTo: string): Promise<ActionResult> {
  const user = await userOrSignIn(returnTo);
  if (!id.safeParse(productId).success) return { ok: false, error: "Invalid product." };
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "PUBLISHED") return { ok: false, error: "This product is not available." };
  const owned = await db.digitalEntitlement.findFirst({ where: { userId: user.id, productId, revokedAt: null } });
  if (owned) return { ok: false, error: "You already own this product." };
  await db.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { userId: user.id, productId },
    update: {},
  });
  refresh();
  return { ok: true, message: `${product.name} added to your cart.` };
}

export async function removeFromCart(productId: string): Promise<ActionResult> {
  const user = await requireUser();
  await db.cartItem.deleteMany({ where: { userId: user.id, productId } });
  refresh();
  return { ok: true };
}

async function startCheckout(userId: string, lines: OrderLineInput[]) {
  const limit = limiters.checkout.check(await clientKey("checkout", userId));
  if (!limit.allowed) return { ok: false as const, error: retryMessage(limit.retryAfterMs) };
  const config = paymentConfig();
  // Re-use an identical unpaid order from the last day instead of piling up duplicates.
  const key = (l: { productId?: string | null; planId?: string | null }) => l.productId ?? l.planId ?? "";
  const wanted = lines.map((l) => (l.type === "PRODUCT" ? l.productId : l.planId)).sort().join("|");
  const open = await db.order.findMany({
    where: { userId, status: "PENDING", createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    include: { items: { select: { productId: true, planId: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const existing = open.find((o) => o.items.map(key).sort().join("|") === wanted);
  if (existing) return { ok: true as const, order: existing };
  try {
    const order = await createOrder(userId, lines, { provider: config.provider, isTest: config.provider === "mock" });
    return { ok: true as const, order };
  } catch (e) {
    return orderError(e) as { ok: false; error: string };
  }
}

export async function checkoutCart(): Promise<ActionResult> {
  const user = await requireUser("/app/cart");
  const items = await db.cartItem.findMany({ where: { userId: user.id } });
  if (items.length === 0) return { ok: false, error: "Your cart is empty." };
  const res = await startCheckout(user.id, items.map((i) => ({ type: "PRODUCT", productId: i.productId })));
  if (!res.ok) return res;
  redirect(`/app/checkout/${res.order.id}`);
}

export async function buyNow(productId: string, returnTo: string): Promise<ActionResult> {
  const user = await userOrSignIn(returnTo);
  if (!id.safeParse(productId).success) return { ok: false, error: "Invalid product." };
  const res = await startCheckout(user.id, [{ type: "PRODUCT", productId }]);
  if (!res.ok) return res;
  redirect(`/app/checkout/${res.order.id}`);
}

/** Free products: no payment is involved, so the zero-value order is fulfilled immediately. */
export async function claimFreeProduct(productId: string, returnTo: string): Promise<ActionResult> {
  const user = await userOrSignIn(returnTo);
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "PUBLISHED" || product.priceInPaise !== 0) return { ok: false, error: "This product is not free." };
  try {
    const order = await createOrder(user.id, [{ type: "PRODUCT", productId }], { provider: "free", isTest: false });
    if (order.totalInPaise !== 0) return { ok: false, error: "This product is not free." };
    await fulfilOrder(order.id, { provider: "free", providerRef: null, amountInPaise: 0 });
  } catch (e) {
    return orderError(e);
  }
  refresh();
  return { ok: true, message: `${product.name} was added to your library.` };
}

export async function startMembershipCheckout(planId: string): Promise<ActionResult> {
  const user = await requireUser("/app/membership");
  if (!id.safeParse(planId).success) return { ok: false, error: "Invalid plan." };
  const res = await startCheckout(user.id, [{ type: "MEMBERSHIP", planId }]);
  if (!res.ok) return res;
  redirect(`/app/checkout/${res.order.id}`);
}

// ─── Payment (development simulator) ────────────────────────────────────────

async function ownedOrder(orderId: string, userId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) return null;
  return order;
}

/**
 * Development-only payment simulator. Refused whenever mock payments are not
 * allowed (always in production unless explicitly enabled for a staging demo).
 * A "success" goes through the same verified fulfilment path a real provider
 * webhook would use; nothing is granted unless fulfilment succeeds.
 */
export async function simulatePayment(orderId: string, outcome: "success" | "failure"): Promise<ActionResult> {
  const user = await requireUser();
  const config = paymentConfig();
  if (!config.mockAllowed) return { ok: false, error: config.reason ?? "Payments are not available." };
  const order = await ownedOrder(orderId, user.id);
  if (!order) return { ok: false, error: "Order not found." };
  if (!order.isTest) return { ok: false, error: "This order was not created with the mock provider." };

  if (outcome === "failure") {
    await failOrder(order.id, "Simulated card decline (development)");
    redirect(`/app/checkout/${order.id}/failed`);
  }
  try {
    await fulfilOrder(order.id, {
      provider: "mock",
      providerRef: `mock_${randomBytes(8).toString("hex")}`,
      amountInPaise: order.totalInPaise,
    });
  } catch (e) {
    return orderError(e);
  }
  redirect(`/app/checkout/${order.id}/success`);
}

export async function retryPayment(orderId: string): Promise<ActionResult> {
  const user = await requireUser();
  const order = await ownedOrder(orderId, user.id);
  if (!order) return { ok: false, error: "Order not found." };
  await retryOrder(order.id, paymentConfig().provider);
  redirect(`/app/checkout/${order.id}`);
}

export async function cancelPendingOrder(orderId: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await cancelOrder(orderId, user.id);
  } catch (e) {
    return orderError(e);
  }
  redirect("/app/orders");
}

// ─── Membership management ──────────────────────────────────────────────────

export async function setMembershipCancellation(cancel: boolean): Promise<ActionResult> {
  const user = await requireUser("/app/membership");
  const membership = await getMembership(user.id);
  if (!membership.isPremium || !membership.subscription) return { ok: false, error: "You don't have an active membership." };
  await db.membershipSubscription.update({
    where: { id: membership.subscription.id },
    data: { cancelAtPeriodEnd: cancel, cancelledAt: cancel ? new Date() : null },
  });
  await audit({ actorId: user.id, action: cancel ? "membership.cancel_scheduled" : "membership.resumed", entityType: "MembershipSubscription", entityId: membership.subscription.id });
  await db.notification.create({
    data: {
      userId: user.id,
      title: cancel ? "Membership will end" : "Membership resumed",
      body: cancel ? "Premium stays active until the end of your current period." : "Your Premium membership will continue.",
      href: "/app/membership",
    },
  });
  refresh();
  return { ok: true, message: cancel ? "Your membership will end at the close of this billing period." : "Your membership will continue." };
}
