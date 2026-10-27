import { applyBps, assertPaise, type Paise } from "./money";

export type PricedLine = { unitPriceInPaise: Paise; quantity: number };

export type OrderTotals = {
  subtotalInPaise: Paise;
  taxInPaise: Paise;
  totalInPaise: Paise;
  taxRateBps: number;
};

/**
 * Prices are listed exclusive of tax. Tax is computed once on the order
 * subtotal (not per line) to avoid accumulated rounding differences.
 */
export function computeOrderTotals(lines: PricedLine[], taxRateBps: number): OrderTotals {
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 10000) {
    throw new Error("taxRateBps must be an integer between 0 and 10000");
  }
  let subtotal = 0;
  for (const line of lines) {
    assertPaise(line.unitPriceInPaise, "unitPriceInPaise");
    if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error("quantity must be >= 1");
    if (line.unitPriceInPaise < 0) throw new Error("unitPriceInPaise must be >= 0");
    subtotal += line.unitPriceInPaise * line.quantity;
  }
  const tax = applyBps(subtotal, taxRateBps);
  return { subtotalInPaise: subtotal, taxInPaise: tax, totalInPaise: subtotal + tax, taxRateBps };
}

/**
 * Compare an annual plan against twelve months of the monthly plan, using only
 * the configured prices. Returns null when the annual plan is not cheaper, so the
 * UI never advertises a discount that does not exist.
 */
export function annualSavings(monthlyInPaise: Paise, annualInPaise: Paise) {
  assertPaise(monthlyInPaise);
  assertPaise(annualInPaise);
  const twelveMonths = monthlyInPaise * 12;
  const savings = twelveMonths - annualInPaise;
  if (monthlyInPaise <= 0 || annualInPaise <= 0 || savings <= 0) return null;
  // Whole-percent figure, rounded down so we never overstate the saving.
  const percent = Math.floor((savings * 100) / twelveMonths);
  return { savingsInPaise: savings, percent, twelveMonthsInPaise: twelveMonths };
}

/** Effective monthly cost of an annual plan, rounded to the nearest paisa. */
export function monthlyEquivalent(annualInPaise: Paise): Paise {
  assertPaise(annualInPaise);
  return Math.round(annualInPaise / 12);
}

export function addBillingPeriod(start: Date, interval: "MONTH" | "YEAR"): Date {
  const end = new Date(start);
  if (interval === "MONTH") {
    const day = end.getUTCDate();
    end.setUTCMonth(end.getUTCMonth() + 1);
    // Clamp e.g. 31 Jan -> 28/29 Feb instead of overflowing into March.
    if (end.getUTCDate() < day) end.setUTCDate(0);
  } else {
    end.setUTCFullYear(end.getUTCFullYear() + 1);
  }
  return end;
}
