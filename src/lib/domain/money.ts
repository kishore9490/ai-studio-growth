// Money helpers. All amounts are integer paise (1 INR = 100 paise).
// Never use floating point for stored or calculated money values.

export type Paise = number;

export function assertPaise(value: number, label = "amount"): asserts value is Paise {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be an integer number of paise, received ${value}`);
  }
}

/** Parse a rupee string typed by an admin ("499", "499.50", "1,299") into paise. */
export function rupeesToPaise(input: string): Paise | null {
  const cleaned = input.replace(/[,\s₹]/g, "");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

const formatterWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const formatterExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format paise as INR. Whole-rupee amounts drop the decimals unless `exact` is set. */
export function formatINR(paise: Paise, opts: { exact?: boolean } = {}): string {
  if (!opts.exact && paise % 100 === 0) return formatterWhole.format(paise / 100);
  return formatterExact.format(paise / 100);
}

/** Integer rounding of `amount * bps / 10000`, half away from zero. */
export function applyBps(amount: Paise, bps: number, mode: "round" | "floor" = "round"): Paise {
  assertPaise(amount);
  if (!Number.isInteger(bps)) throw new Error("bps must be an integer");
  const product = amount * bps;
  if (mode === "floor") return Math.floor(product / 10000);
  return Math.sign(product) * Math.floor((Math.abs(product) + 5000) / 10000);
}

export function formatBps(bps: number): string {
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2)}%`;
}
