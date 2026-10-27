import { createHmac, timingSafeEqual } from "node:crypto";

// HMAC helpers for webhook verification and expiring download links.

export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  if (!/^[0-9a-f]*$/i.test(a) || !/^[0-9a-f]*$/i.test(b)) return false;
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length === 0 || ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Verify a webhook body signed as hex(HMAC-SHA256(secret, rawBody)). */
export function verifyWebhookSignature(secret: string, rawBody: string, signature: string | null): boolean {
  if (!secret || !signature) return false;
  return safeEqualHex(hmacSha256Hex(secret, rawBody), signature.trim());
}

export type DownloadClaims = { assetId: string; userId: string; exp: number };

export function signDownloadToken(secret: string, claims: DownloadClaims): string {
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${body}.${hmacSha256Hex(secret, body)}`;
}

export function verifyDownloadToken(
  secret: string,
  token: string,
  now = Date.now(),
): { ok: true; claims: DownloadClaims } | { ok: false; reason: "malformed" | "bad-signature" | "expired" } {
  const [body, sig] = token.split(".");
  if (!body || !sig) return { ok: false, reason: "malformed" };
  if (!safeEqualHex(hmacSha256Hex(secret, body), sig)) return { ok: false, reason: "bad-signature" };
  let claims: DownloadClaims;
  try {
    claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof claims.exp !== "number" || typeof claims.assetId !== "string" || typeof claims.userId !== "string") {
    return { ok: false, reason: "malformed" };
  }
  if (claims.exp * 1000 < now) return { ok: false, reason: "expired" };
  return { ok: true, claims };
}
