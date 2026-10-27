"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { attributeReferral } from "@/lib/core/affiliate";
import { audit } from "@/lib/core/audit";
import { db } from "@/lib/core/db";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/domain/passwords";
import { generateReferralCode, normaliseReferralCode } from "@/lib/domain/referrals";
import { clientKey, createSession, destroySession, getCurrentUser, hashToken } from "@/lib/server/auth";
import { env } from "@/lib/server/env";
import { limiters, retryMessage } from "@/lib/server/rate-limits";
import { safeNext } from "@/lib/utils";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  success?: string;
  devLink?: string;
};

const REF_COOKIE = "lifeos_ref";

// A real hash of a random value, so sign-in attempts for unknown emails cost the
// same as for known ones (no timing-based account enumeration).
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

// ─── Sign up ────────────────────────────────────────────────────────────────

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80, "Use 80 characters or fewer."),
  email,
  password: z.string().superRefine((v, ctx) => {
    const p = passwordProblem(v);
    if (p) ctx.addIssue({ code: "custom", message: p });
  }),
  referralCode: z
    .string()
    .trim()
    .max(16)
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => v === undefined || normaliseReferralCode(v) !== null, "Referral codes use letters and numbers only."),
  terms: z.literal("on", { error: "Please accept the Terms and Privacy Policy." }),
});

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { name: raw.name ?? "", email: raw.email ?? "", referralCode: raw.referralCode ?? "" };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const limit = limiters.signUp.check(await clientKey("signup"));
  if (!limit.allowed) return { error: retryMessage(limit.retryAfterMs), values };

  const settings = await db.platformSettings.findUnique({ where: { id: 1 } });
  if (settings && !settings.signupsEnabled) return { error: "New sign-ups are temporarily paused. Please try again later.", values };

  const { name, email: mail, password, referralCode } = parsed.data;
  if (await db.user.findUnique({ where: { email: mail }, select: { id: true } })) {
    return { fieldErrors: { email: "An account with this email already exists. Try signing in." }, values };
  }

  const cookieStore = await cookies();
  const cookieCode = cookieStore.get(REF_COOKIE)?.value ?? null;
  const code = referralCode ?? cookieCode;
  // A code pre-filled from a referral link still counts as link attribution.
  const source = referralCode && normaliseReferralCode(referralCode) !== normaliseReferralCode(cookieCode) ? "CODE" : "LINK";
  const passwordHash = await hashPassword(password);

  let referralNote: string | undefined;
  const user = await db.$transaction(async (tx) => {
    let created = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const referral = generateReferralCode(name);
      if (await tx.user.findUnique({ where: { referralCode: referral }, select: { id: true } })) continue;
      created = await tx.user.create({
        data: {
          email: mail,
          name,
          passwordHash,
          referralCode: referral,
          profile: { create: { avatarHue: Math.floor(Math.random() * 360) } },
          preferences: { create: { interests: [], dashboardWidgets: [] } },
        },
      });
    }
    if (!created) throw new Error("Could not allocate a referral code");
    const result = await attributeReferral(tx, { newUserId: created.id, newUserEmail: mail, code, source });
    if (!result.attributed && referralCode) {
      referralNote =
        result.reason === "self-referral"
          ? "That referral code belongs to your own email address, so it wasn't applied."
          : "That referral code wasn't recognised, so it wasn't applied.";
    }
    await audit({ actorId: created.id, action: "user.signed_up", entityType: "User", entityId: created.id, metadata: { referred: result.attributed, source: result.attributed ? source : null } }, tx);
    return created;
  });

  cookieStore.delete(REF_COOKIE);
  await createSession(user.id);
  redirect(referralNote ? `/onboarding?note=${encodeURIComponent(referralNote)}` : "/onboarding");
}

// ─── Sign in / out ──────────────────────────────────────────────────────────

const signInSchema = z.object({ email, password: z.string().min(1, "Enter your password."), next: z.string().optional() });

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { email: raw.email ?? "" };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const limit = limiters.signIn.check(await clientKey("signin", parsed.data.email));
  if (!limit.allowed) return { error: retryMessage(limit.retryAfterMs), values };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Always run a hash comparison so response time does not reveal whether the email exists.
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) return { error: "That email and password combination didn't match. Please try again.", values };
  if (user.status === "SUSPENDED") {
    return { error: "This account has been suspended. Please contact support if you think this is a mistake.", values };
  }

  await createSession(user.id);
  await audit({ actorId: user.id, action: "user.signed_in", entityType: "User", entityId: user.id });
  redirect(user.onboardedAt ? safeNext(parsed.data.next) : "/onboarding");
}

export async function signOut() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit({ actorId: user.id, action: "user.signed_out", entityType: "User", entityId: user.id });
  redirect("/");
}

// ─── Password reset ─────────────────────────────────────────────────────────

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = email.safeParse(formData.get("email"));
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues[0].message }, values };

  const limit = limiters.passwordReset.check(await clientKey("reset", parsed.data));
  if (!limit.allowed) return { error: retryMessage(limit.retryAfterMs), values };

  const generic = "If an account exists for that email, a reset link is on its way. The link expires in 30 minutes.";
  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (!user || user.status !== "ACTIVE") return { success: generic };

  const token = randomBytes(32).toString("base64url");
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
  });
  await audit({ actorId: user.id, action: "user.password_reset_requested", entityType: "User", entityId: user.id });

  const link = `${env.appUrl}/reset-password?token=${token}`;
  // No email provider is configured in this MVP. Outside production the link is
  // shown on screen (and logged) so the flow can be exercised end to end.
  if (!env.isProduction) {
    console.info(`[dev] Password reset link for ${user.email}: ${link}`);
    return { success: generic, devLink: link };
  }
  return { success: generic };
}

const resetSchema = z.object({
  token: z.string().min(20),
  password: z.string().superRefine((v, ctx) => {
    const p = passwordProblem(v);
    if (p) ctx.addIssue({ code: "custom", message: p });
  }),
});

export async function resetPassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Sign out everywhere after a password change.
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  await audit({ actorId: record.userId, action: "user.password_reset", entityType: "User", entityId: record.userId });
  redirect("/sign-in?reset=1");
}
