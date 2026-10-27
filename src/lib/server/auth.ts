import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/core/db";

// Data Access Layer for authentication. Every page, server action and route
// handler that needs a user calls one of these helpers; the user's role is
// always read from the database, never from the browser.

export const SESSION_COOKIE = "lifeos_session";
const SESSION_TTL_DAYS = 30;

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  referralCode: string;
  affiliateOptIn: boolean;
  onboardedAt: Date | null;
  avatarHue: number;
  isSampleData: boolean;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 255) ?? null;
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt, userAgent } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

/** Resolve the signed-in user for this request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Session validity depends on the current time, so this is always request-time work.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { profile: { select: { avatarHue: true } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (u.status === "SUSPENDED") return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    referralCode: u.referralCode,
    affiliateOptIn: u.affiliateOptIn,
    onboardedAt: u.onboardedAt,
    avatarHue: u.profile?.avatarHue ?? 258,
    isSampleData: u.isSampleData,
  };
});

export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`);
  return user;
}

/** For pages: unauthenticated → sign-in, authenticated non-admin → 404 (the admin area is not advertised). */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") notFound();
  return user;
}

/** For server actions: throws instead of redirecting so the caller can surface an error. */
export async function assertAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not authorised");
  return user;
}

export async function clientKey(scope: string, extra = ""): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return `${scope}:${ip}:${extra.toLowerCase()}`;
}
