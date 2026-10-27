// Referral code and attribution rules (pure).

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function generateReferralCode(name: string, random: () => number = Math.random): string {
  const prefix = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return `${prefix}${suffix}`;
}

export function normaliseReferralCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const code = input.trim().toUpperCase();
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : null;
}

/**
 * Canonical mailbox for self-referral detection: lower-cased, "+tag" removed,
 * and dots removed for Gmail addresses (which ignores them).
 */
export function canonicalEmail(email: string): string {
  const [rawLocal, rawDomain = ""] = email.trim().toLowerCase().split("@");
  const domain = rawDomain === "googlemail.com" ? "gmail.com" : rawDomain;
  let local = rawLocal.split("+")[0];
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

export type ReferralCheck =
  | { ok: true }
  | { ok: false; reason: "unknown-code" | "self-referral" | "referrer-suspended" | "programme-disabled" };

export function checkReferralEligibility(input: {
  programEnabled: boolean;
  newUserEmail: string;
  referrer: { email: string; status: "ACTIVE" | "SUSPENDED" } | null;
}): ReferralCheck {
  if (!input.programEnabled) return { ok: false, reason: "programme-disabled" };
  if (!input.referrer) return { ok: false, reason: "unknown-code" };
  if (input.referrer.status !== "ACTIVE") return { ok: false, reason: "referrer-suspended" };
  if (canonicalEmail(input.referrer.email) === canonicalEmail(input.newUserEmail)) {
    return { ok: false, reason: "self-referral" };
  }
  return { ok: true };
}

export function referralUrl(appUrl: string, code: string): string {
  return `${appUrl.replace(/\/$/, "")}/r/${encodeURIComponent(code)}`;
}
