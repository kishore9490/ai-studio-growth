import { describe, expect, it } from "vitest";
import { applyBps, formatBps, formatINR, rupeesToPaise } from "@/lib/domain/money";
import { addBillingPeriod, annualSavings, computeOrderTotals, monthlyEquivalent } from "@/lib/domain/pricing";

describe("money", () => {
  it("parses rupee strings into integer paise", () => {
    expect(rupeesToPaise("499")).toBe(49900);
    expect(rupeesToPaise("1,299.5")).toBe(129950);
    expect(rupeesToPaise("₹ 0.05")).toBe(5);
    expect(rupeesToPaise("12.345")).toBeNull();
    expect(rupeesToPaise("-1")).toBeNull();
    expect(rupeesToPaise("abc")).toBeNull();
  });

  it("formats INR with Indian grouping", () => {
    expect(formatINR(49900)).toBe("₹499");
    expect(formatINR(16900000)).toBe("₹1,69,000");
    expect(formatINR(70682)).toBe("₹706.82");
    expect(formatINR(49900, { exact: true })).toBe("₹499.00");
  });

  it("applies basis points with integer rounding", () => {
    expect(applyBps(59900, 1800)).toBe(10782);
    expect(applyBps(333, 1500, "floor")).toBe(49);
    expect(applyBps(5, 1000)).toBe(1); // 0.5 rounds half away from zero
    expect(() => applyBps(10.5, 100)).toThrow();
  });

  it("formats basis points as percentages", () => {
    expect(formatBps(1500)).toBe("15%");
    expect(formatBps(1250)).toBe("12.50%");
  });
});

describe("computeOrderTotals", () => {
  it("computes tax once on the subtotal", () => {
    expect(computeOrderTotals([{ unitPriceInPaise: 59900, quantity: 1 }, { unitPriceInPaise: 79900, quantity: 1 }], 1800)).toEqual({
      subtotalInPaise: 139800,
      taxInPaise: 25164,
      totalInPaise: 164964,
      taxRateBps: 1800,
    });
  });

  it("handles free orders and zero tax", () => {
    expect(computeOrderTotals([{ unitPriceInPaise: 0, quantity: 1 }], 1800).totalInPaise).toBe(0);
    expect(computeOrderTotals([{ unitPriceInPaise: 49900, quantity: 2 }], 0).totalInPaise).toBe(99800);
  });

  it("rejects invalid inputs", () => {
    expect(() => computeOrderTotals([{ unitPriceInPaise: 1.5, quantity: 1 }], 0)).toThrow();
    expect(() => computeOrderTotals([{ unitPriceInPaise: 100, quantity: 0 }], 0)).toThrow();
    expect(() => computeOrderTotals([], 20000)).toThrow();
  });
});

describe("membership pricing", () => {
  it("derives the annual saving from configured prices", () => {
    expect(annualSavings(49900, 499000)).toEqual({ savingsInPaise: 99800, percent: 16, twelveMonthsInPaise: 598800 });
  });

  it("never invents a discount when annual is not cheaper", () => {
    expect(annualSavings(49900, 598800)).toBeNull();
    expect(annualSavings(49900, 700000)).toBeNull();
    expect(annualSavings(0, 499000)).toBeNull();
  });

  it("computes the monthly equivalent", () => {
    expect(monthlyEquivalent(499000)).toBe(41583);
  });

  it("clamps month-end renewals", () => {
    expect(addBillingPeriod(new Date("2026-01-31T10:00:00Z"), "MONTH").toISOString()).toBe("2026-02-28T10:00:00.000Z");
    expect(addBillingPeriod(new Date("2026-10-27T00:00:00Z"), "YEAR").toISOString()).toBe("2027-10-27T00:00:00.000Z");
  });
});
