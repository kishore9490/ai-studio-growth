import { describe, expect, it } from "vitest";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/domain/passwords";
import { RateLimiter } from "@/lib/domain/rate-limit";
import {
  canonicalEmail,
  checkReferralEligibility,
  generateReferralCode,
  normaliseReferralCode,
  referralUrl,
} from "@/lib/domain/referrals";
import { hmacSha256Hex, signDownloadToken, verifyDownloadToken, verifyWebhookSignature } from "@/lib/domain/signing";
import { safeNext } from "@/lib/utils";

describe("webhook signatures", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ id: "evt_1", type: "payment.succeeded" });

  it("accepts a correctly signed body", () => {
    expect(verifyWebhookSignature(secret, body, hmacSha256Hex(secret, body))).toBe(true);
  });
  it("rejects tampered bodies, wrong secrets and missing signatures", () => {
    const sig = hmacSha256Hex(secret, body);
    expect(verifyWebhookSignature(secret, body.replace("evt_1", "evt_2"), sig)).toBe(false);
    expect(verifyWebhookSignature("other", body, sig)).toBe(false);
    expect(verifyWebhookSignature(secret, body, null)).toBe(false);
    expect(verifyWebhookSignature(secret, body, "not-hex")).toBe(false);
    expect(verifyWebhookSignature("", body, sig)).toBe(false);
  });
});

describe("download tokens", () => {
  const secret = "dl_secret";
  const now = Date.UTC(2026, 9, 27);
  const token = signDownloadToken(secret, { assetId: "a1", userId: "u1", exp: now / 1000 + 300 });

  it("round-trips valid tokens", () => {
    const r = verifyDownloadToken(secret, token, now);
    expect(r).toEqual({ ok: true, claims: { assetId: "a1", userId: "u1", exp: now / 1000 + 300 } });
  });
  it("expires", () => {
    expect(verifyDownloadToken(secret, token, now + 301_000)).toEqual({ ok: false, reason: "expired" });
  });
  it("rejects forged or altered tokens", () => {
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ assetId: "a2", userId: "u1", exp: now / 1000 + 300 })).toString("base64url");
    expect(verifyDownloadToken(secret, `${forged}.${sig}`, now)).toEqual({ ok: false, reason: "bad-signature" });
    expect(verifyDownloadToken("wrong", token, now)).toEqual({ ok: false, reason: "bad-signature" });
    expect(verifyDownloadToken(secret, body, now)).toEqual({ ok: false, reason: "malformed" });
  });
});

describe("referral rules", () => {
  it("canonicalises emails for self-referral detection", () => {
    expect(canonicalEmail("Meera.Iyer+work@Gmail.com")).toBe("meeraiyer@gmail.com");
    expect(canonicalEmail("meera.iyer@googlemail.com")).toBe("meeraiyer@gmail.com");
    expect(canonicalEmail("a.b+x@example.com")).toBe("a.b@example.com");
  });

  it("blocks self-referrals, unknown codes and suspended referrers", () => {
    const referrer = { email: "meera@gmail.com", status: "ACTIVE" as const };
    expect(checkReferralEligibility({ programEnabled: true, newUserEmail: "m.eera+2@gmail.com", referrer })).toEqual({ ok: false, reason: "self-referral" });
    expect(checkReferralEligibility({ programEnabled: true, newUserEmail: "x@y.com", referrer: null })).toEqual({ ok: false, reason: "unknown-code" });
    expect(checkReferralEligibility({ programEnabled: true, newUserEmail: "x@y.com", referrer: { ...referrer, status: "SUSPENDED" } })).toEqual({ ok: false, reason: "referrer-suspended" });
    expect(checkReferralEligibility({ programEnabled: false, newUserEmail: "x@y.com", referrer })).toEqual({ ok: false, reason: "programme-disabled" });
    expect(checkReferralEligibility({ programEnabled: true, newUserEmail: "friend@example.com", referrer })).toEqual({ ok: true });
  });

  it("normalises and generates codes", () => {
    expect(normaliseReferralCode(" meera7q2 ")).toBe("MEERA7Q2");
    expect(normaliseReferralCode("bad code!")).toBeNull();
    expect(normaliseReferralCode("")).toBeNull();
    const code = generateReferralCode("Ana", () => 0);
    expect(code).toBe("ANAXAAAA");
    expect(generateReferralCode("Śrī Devi")).toMatch(/^SRID[A-Z2-9]{4}$/);
  });

  it("builds referral URLs", () => {
    expect(referralUrl("https://lifeos.example/", "ABCD1234")).toBe("https://lifeos.example/r/ABCD1234");
  });
});

describe("passwords", () => {
  it("hashes and verifies with scrypt", async () => {
    const hash = await hashPassword("correct horse 1");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse 1", hash)).toBe(true);
    expect(await verifyPassword("wrong horse 1", hash)).toBe(false);
    expect(await verifyPassword("anything", "plain-text")).toBe(false);
  });
  it("enforces a basic policy", () => {
    expect(passwordProblem("short1")).toMatch(/8 characters/);
    expect(passwordProblem("lettersonly")).toMatch(/letter and one number/);
    expect(passwordProblem("demo1234")).toBeNull();
  });
});

describe("rate limiter", () => {
  it("allows up to the limit per window, then blocks until reset", () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.check("k", 0).allowed).toBe(true);
    expect(rl.check("k", 10).allowed).toBe(true);
    const blocked = rl.check("k", 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(980);
    expect(rl.check("other", 20).allowed).toBe(true);
    expect(rl.check("k", 1001).allowed).toBe(true);
  });
});

describe("safeNext", () => {
  it("only allows same-origin relative paths", () => {
    expect(safeNext("/app/library")).toBe("/app/library");
    expect(safeNext("//evil.com")).toBe("/app");
    expect(safeNext("https://evil.com")).toBe("/app");
    expect(safeNext("/\\evil.com")).toBe("/app");
    expect(safeNext(undefined)).toBe("/app");
  });
});
