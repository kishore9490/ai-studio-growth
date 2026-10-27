import { describe, expect, it } from "vitest";
import {
  canTransition,
  computeCommissions,
  isPastHoldPeriod,
  resolveUpline,
  validateLevelRates,
  type CommissionContext,
  type UplineMember,
} from "@/lib/domain/commissions";

const levels = [
  { level: 1, rateBps: 1500, enabled: true },
  { level: 2, rateBps: 500, enabled: true },
  { level: 3, rateBps: 200, enabled: true },
];

const member = (userId: string, level: number, extra: Partial<UplineMember> = {}): UplineMember => ({
  userId,
  level,
  affiliateOptIn: true,
  status: "ACTIVE",
  ...extra,
});

const base = (overrides: Partial<CommissionContext> = {}): CommissionContext => ({
  mode: "TEST",
  programEnabled: true,
  buyerId: "buyer",
  levels,
  upline: [member("l1", 1), member("l2", 2), member("l3", 3)],
  items: [{ orderItemId: "item-1", type: "PRODUCT", totalInPaise: 199900, commissionEligible: true }],
  ...overrides,
});

describe("computeCommissions", () => {
  it("creates one record per level for an eligible product sale", () => {
    const { drafts } = computeCommissions(base());
    expect(drafts.map((d) => [d.beneficiaryId, d.level, d.amountInPaise])).toEqual([
      ["l1", 1, 29985], // 15% of ₹1,999
      ["l2", 2, 9995], // 5%
      ["l3", 3, 3998], // 2%
    ]);
  });

  it("floors fractional paise so commission is never rounded up", () => {
    const { drafts } = computeCommissions(base({ items: [{ orderItemId: "i", type: "PRODUCT", totalInPaise: 333, commissionEligible: true }] }));
    expect(drafts.map((d) => d.amountInPaise)).toEqual([49, 16, 6]);
  });

  it("accrues nothing when commissions are disabled", () => {
    expect(computeCommissions(base({ mode: "DISABLED" }))).toEqual({ drafts: [], skipped: "commissions-disabled" });
  });

  it("accrues nothing when the programme is switched off", () => {
    expect(computeCommissions(base({ programEnabled: false })).drafts).toHaveLength(0);
  });

  it("never pays commission on memberships", () => {
    const result = computeCommissions(base({ items: [{ orderItemId: "m", type: "MEMBERSHIP", totalInPaise: 49900, commissionEligible: true }] }));
    expect(result).toEqual({ drafts: [], skipped: "no-eligible-items" });
  });

  it("skips products that are not commission-eligible or free", () => {
    const result = computeCommissions(
      base({
        items: [
          { orderItemId: "a", type: "PRODUCT", totalInPaise: 49900, commissionEligible: false },
          { orderItemId: "b", type: "PRODUCT", totalInPaise: 0, commissionEligible: true },
        ],
      }),
    );
    expect(result.drafts).toHaveLength(0);
  });

  it("respects disabled levels and zero rates", () => {
    const { drafts } = computeCommissions(
      base({ levels: [levels[0], { level: 2, rateBps: 500, enabled: false }, { level: 3, rateBps: 0, enabled: true }] }),
    );
    expect(drafts.map((d) => d.level)).toEqual([1]);
  });

  it("skips suspended and non-opted-in affiliates but continues up the chain", () => {
    const { drafts } = computeCommissions(
      base({ upline: [member("l1", 1, { status: "SUSPENDED" }), member("l2", 2, { affiliateOptIn: false }), member("l3", 3)] }),
    );
    expect(drafts.map((d) => d.beneficiaryId)).toEqual(["l3"]);
  });

  it("never credits the buyer, even if they appear in their own upline", () => {
    const { drafts } = computeCommissions(base({ upline: [member("buyer", 1), member("l2", 2)] }));
    expect(drafts.map((d) => d.beneficiaryId)).toEqual(["l2"]);
  });

  it("credits a beneficiary at most once per item", () => {
    const { drafts } = computeCommissions(base({ upline: [member("x", 1), member("x", 2), member("y", 3)] }));
    expect(drafts.map((d) => [d.beneficiaryId, d.level])).toEqual([
      ["x", 1],
      ["y", 3],
    ]);
  });

  it("ignores levels beyond three", () => {
    const { drafts } = computeCommissions(base({ upline: [member("l1", 1), member("l4", 4)] }));
    expect(drafts.map((d) => d.beneficiaryId)).toEqual(["l1"]);
  });

  it("handles multiple items independently", () => {
    const { drafts } = computeCommissions(
      base({
        upline: [member("l1", 1)],
        items: [
          { orderItemId: "a", type: "PRODUCT", totalInPaise: 10000, commissionEligible: true },
          { orderItemId: "b", type: "PRODUCT", totalInPaise: 20000, commissionEligible: true },
        ],
      }),
    );
    expect(drafts.map((d) => [d.orderItemId, d.amountInPaise])).toEqual([
      ["a", 1500],
      ["b", 3000],
    ]);
  });
});

describe("resolveUpline", () => {
  it("walks at most three levels", async () => {
    const chain: Record<string, string> = { buyer: "a", a: "b", b: "c", c: "d" };
    const upline = await resolveUpline("buyer", async (id) =>
      chain[id] ? { userId: chain[id], affiliateOptIn: true, status: "ACTIVE" } : null,
    );
    expect(upline.map((u) => [u.userId, u.level])).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });

  it("stops at a cycle instead of looping", async () => {
    const chain: Record<string, string> = { buyer: "a", a: "buyer" };
    const upline = await resolveUpline("buyer", async (id) => ({ userId: chain[id], affiliateOptIn: true, status: "ACTIVE" }));
    expect(upline.map((u) => u.userId)).toEqual(["a"]);
  });

  it("returns an empty chain for unreferred buyers", async () => {
    expect(await resolveUpline("buyer", async () => null)).toEqual([]);
  });
});

describe("commission state machine", () => {
  it("allows only forward transitions", () => {
    expect(canTransition("PENDING", "APPROVED")).toBe(true);
    expect(canTransition("PENDING", "REVERSED")).toBe(true);
    expect(canTransition("APPROVED", "REVERSED")).toBe(true);
    expect(canTransition("REVERSED", "APPROVED")).toBe(false);
    expect(canTransition("PAID", "REVERSED")).toBe(false);
    expect(canTransition("PENDING", "PAID")).toBe(false);
  });

  it("enforces the refund hold period", () => {
    const now = new Date("2026-10-27T00:00:00Z");
    expect(isPastHoldPeriod(new Date("2026-10-20T00:00:00Z"), 14, now)).toBe(false);
    expect(isPastHoldPeriod(new Date("2026-10-13T00:00:00Z"), 14, now)).toBe(true);
  });
});

describe("validateLevelRates", () => {
  it("accepts the default test configuration", () => {
    expect(validateLevelRates(levels)).toBeNull();
  });
  it("rejects rates above 50% per level or combined", () => {
    expect(validateLevelRates([{ level: 1, rateBps: 6000, enabled: true }])).toMatch(/between 0% and 50%/);
    expect(
      validateLevelRates([
        { level: 1, rateBps: 3000, enabled: true },
        { level: 2, rateBps: 2500, enabled: true },
      ]),
    ).toMatch(/Combined/);
  });
  it("ignores disabled levels in the combined total", () => {
    expect(
      validateLevelRates([
        { level: 1, rateBps: 3000, enabled: true },
        { level: 2, rateBps: 2500, enabled: false },
      ]),
    ).toBeNull();
  });
  it("rejects non-integer basis points", () => {
    expect(validateLevelRates([{ level: 1, rateBps: 12.5, enabled: true }])).not.toBeNull();
  });
});
