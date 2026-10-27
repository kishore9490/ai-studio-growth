import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/core/db";
import { approveCommission, attributeReferral, requestPayout, reviewPayout } from "@/lib/core/affiliate";
import { getMembership, productAccess } from "@/lib/core/membership";
import { createOrder, failOrder, fulfilOrder, refundOrder } from "@/lib/core/orders";
import { makePlan, makeProduct, makeUser, refer, resetData } from "./fixtures";

const pay = (orderId: string, amountInPaise: number) => fulfilOrder(orderId, { provider: "mock", providerRef: `ref_${orderId}`, amountInPaise });

beforeEach(resetData);
afterAll(() => db.$disconnect());

describe("order fulfilment", () => {
  it("prices the order on the server and grants an entitlement only after payment", async () => {
    const buyer = await makeUser();
    const product = await makeProduct({ priceInPaise: 59900 });
    const order = await createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true });
    expect(order).toMatchObject({ status: "PENDING", subtotalInPaise: 59900, taxInPaise: 10782, totalInPaise: 70682 });
    expect((await productAccess(buyer.id, product.id)).allowed).toBe(false);

    await pay(order.id, order.totalInPaise);
    expect((await productAccess(buyer.id, product.id)).allowed).toBe(true);
    expect((await db.payment.findFirstOrThrow({ where: { orderId: order.id } })).status).toBe("SUCCEEDED");
  });

  it("rejects a payment whose amount does not match the order total", async () => {
    const buyer = await makeUser();
    const product = await makeProduct();
    const order = await createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true });
    await expect(pay(order.id, order.totalInPaise - 1)).rejects.toMatchObject({ code: "amount-mismatch" });
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING");
    expect(await db.digitalEntitlement.count()).toBe(0);
  });

  it("is idempotent under repeated and concurrent fulfilment", async () => {
    const [a, buyer] = [await makeUser(), await makeUser()];
    await refer(a.id, buyer.id);
    const product = await makeProduct();
    const order = await createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true });

    const results = await Promise.all([pay(order.id, order.totalInPaise), pay(order.id, order.totalInPaise), pay(order.id, order.totalInPaise)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await pay(order.id, order.totalInPaise)).toEqual({ status: "already-fulfilled", commissionsCreated: 0 });
    expect(await db.commissionRecord.count()).toBe(1);
    expect(await db.commissionLedgerEntry.count()).toBe(1);
    expect(await db.digitalEntitlement.count()).toBe(1);
  });

  it("does not fulfil failed or cancelled orders", async () => {
    const buyer = await makeUser();
    const product = await makeProduct();
    const order = await createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true });
    await failOrder(order.id, "declined");
    await expect(pay(order.id, order.totalInPaise)).rejects.toMatchObject({ code: "invalid-state" });
  });

  it("refuses to sell a product the buyer already owns, or an unpublished one", async () => {
    const buyer = await makeUser();
    const product = await makeProduct();
    const order = await createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true });
    await pay(order.id, order.totalInPaise);
    await expect(createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true })).rejects.toMatchObject({ code: "already-owned" });
    const draft = await makeProduct({ status: "DRAFT" });
    await expect(createOrder(buyer.id, [{ type: "PRODUCT", productId: draft.id }], { provider: "mock", isTest: true })).rejects.toMatchObject({ code: "unavailable" });
  });
});

describe("commissions", () => {
  async function chain() {
    const l3 = await makeUser();
    const l2 = await makeUser();
    const l1 = await makeUser();
    const buyer = await makeUser();
    await refer(l3.id, l2.id);
    await refer(l2.id, l1.id);
    await refer(l1.id, buyer.id);
    return { l1, l2, l3, buyer };
  }

  it("records three test-mode levels on the pre-tax item price", async () => {
    const { l1, l2, l3, buyer } = await chain();
    const product = await makeProduct({ priceInPaise: 199900 });
    const order = await createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true });
    await pay(order.id, order.totalInPaise);
    const records = await db.commissionRecord.findMany({ orderBy: { level: "asc" } });
    expect(records.map((r) => [r.beneficiaryId, r.level, r.amountInPaise, r.status, r.isTest])).toEqual([
      [l1.id, 1, 29985, "PENDING", true],
      [l2.id, 2, 9995, "PENDING", true],
      [l3.id, 3, 3998, "PENDING", true],
    ]);
  });

  it("records nothing when commissions are disabled", async () => {
    const { buyer } = await chain();
    await db.affiliateSettings.update({ where: { id: 1 }, data: { commissionMode: "DISABLED" } });
    const product = await makeProduct();
    const order = await createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true });
    await pay(order.id, order.totalInPaise);
    expect(await db.commissionRecord.count()).toBe(0);
  });

  it("never pays commission on memberships", async () => {
    const { buyer } = await chain();
    const plan = await makePlan();
    const order = await createOrder(buyer.id, [{ type: "MEMBERSHIP", planId: plan.id }], { provider: "mock", isTest: true });
    await pay(order.id, order.totalInPaise);
    expect(await db.commissionRecord.count()).toBe(0);
    expect((await getMembership(buyer.id)).isPremium).toBe(true);
  });

  it("reverses unpaid commissions and revokes access on refund", async () => {
    const { l1, buyer } = await chain();
    const product = await makeProduct();
    const order = await createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true });
    await pay(order.id, order.totalInPaise);
    const first = await db.commissionRecord.findFirstOrThrow({ where: { beneficiaryId: l1.id } });
    await approveCommission(first.id, l1.id, { overrideHold: true });

    const res = await refundOrder(order.id, { reason: "test", actorId: null });
    expect(res).toEqual({ status: "refunded", reversed: 3 });
    expect(await db.commissionRecord.count({ where: { status: "REVERSED" } })).toBe(3);
    const reversals = await db.commissionLedgerEntry.findMany({ where: { type: "REVERSED" } });
    expect(reversals.every((e) => e.amountInPaise < 0)).toBe(true);
    expect((await productAccess(buyer.id, product.id)).allowed).toBe(false);
    expect(await refundOrder(order.id, { reason: "again", actorId: null })).toEqual({ status: "already-refunded", reversed: 0 });
  });

  it("enforces the hold period unless explicitly overridden", async () => {
    const { l1, buyer } = await chain();
    const product = await makeProduct();
    const order = await createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true });
    await pay(order.id, order.totalInPaise);
    const c = await db.commissionRecord.findFirstOrThrow({ where: { beneficiaryId: l1.id } });
    await expect(approveCommission(c.id, l1.id)).rejects.toThrow(/hold period/);
    await approveCommission(c.id, l1.id, { overrideHold: true });
    await expect(approveCommission(c.id, l1.id, { overrideHold: true })).rejects.toThrow(/cannot be approved/);
  });

  it("blocks self-referrals at the database level", async () => {
    const u = await makeUser();
    await expect(db.referralRelationship.create({ data: { referrerId: u.id, referredUserId: u.id, source: "CODE", codeUsed: "X" } })).rejects.toThrow();
  });

  it("refuses referral codes that belong to the same mailbox", async () => {
    const referrer = await makeUser({ email: "meera.iyer@gmail.com" });
    const newcomer = await makeUser({ email: "meeraiyer+alt@gmail.com" });
    const result = await db.$transaction((tx) =>
      attributeReferral(tx, { newUserId: newcomer.id, newUserEmail: newcomer.email, code: referrer.referralCode, source: "CODE" }),
    );
    expect(result).toEqual({ attributed: false, reason: "self-referral" });
    expect(await db.referralRelationship.count()).toBe(0);
  });

  it("only allows a user to be referred once", async () => {
    const [a, b, c] = [await makeUser(), await makeUser(), await makeUser()];
    await refer(a.id, c.id);
    await expect(refer(b.id, c.id)).rejects.toThrow();
  });
});

describe("payout requests", () => {
  it("records test requests from approved commissions and never marks them paid", async () => {
    const referrer = await makeUser();
    const buyer = await makeUser();
    await refer(referrer.id, buyer.id);
    const product = await makeProduct({ priceInPaise: 100000 });
    const order = await createOrder(buyer.id, [{ type: "PRODUCT", productId: product.id }], { provider: "mock", isTest: true });
    await pay(order.id, order.totalInPaise);
    const c = await db.commissionRecord.findFirstOrThrow();

    await expect(requestPayout(referrer.id)).rejects.toThrow(/minimum/);
    await approveCommission(c.id, referrer.id, { overrideHold: true });
    const req = await requestPayout(referrer.id);
    expect(req).toMatchObject({ amountInPaise: 15000, status: "REQUESTED", isTest: true });
    await expect(requestPayout(referrer.id)).rejects.toThrow(/already have/);

    const admin = await makeUser({ role: "ADMIN" });
    await reviewPayout(req.id, "APPROVED", admin.id);
    expect((await db.payoutRequest.findUniqueOrThrow({ where: { id: req.id } })).status).toBe("APPROVED");
    expect(await db.commissionRecord.count({ where: { status: "PAID" } })).toBe(0);
  });
});
