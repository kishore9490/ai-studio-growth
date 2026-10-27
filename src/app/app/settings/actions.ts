"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/core/audit";
import { db } from "@/lib/core/db";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/domain/passwords";
import { DASHBOARD_WIDGETS, INTERESTS } from "@/lib/preferences";
import { SESSION_COOKIE, clientKey, hashToken, requireUser } from "@/lib/server/auth";
import { limiters, retryMessage } from "@/lib/server/rate-limits";

export type SettingsState = { ok?: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> };

function issues(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}

async function currentSessionHash() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? hashToken(token) : null;
}

// ─── Profile ────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80, "Use 80 characters or fewer."),
  headline: z.string().trim().max(120, "Use 120 characters or fewer.").optional(),
  bio: z.string().trim().max(600, "Use 600 characters or fewer.").optional(),
  avatarHue: z.coerce.number().int().min(0).max(359),
});

export async function updateProfile(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser("/app/settings");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: issues(parsed.error) };
  const { name, headline, bio, avatarHue } = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      name,
      profile: {
        upsert: {
          create: { headline: headline || null, bio: bio || null, avatarHue },
          update: { headline: headline || null, bio: bio || null, avatarHue },
        },
      },
    },
  });
  await audit({ actorId: user.id, action: "user.profile_updated", entityType: "User", entityId: user.id });
  refresh();
  return { ok: true, message: "Profile saved." };
}

// ─── Preferences ────────────────────────────────────────────────────────────

const prefsSchema = z.object({
  interests: z.array(z.enum(INTERESTS.map((i) => i.key) as [string, ...string[]])).max(INTERESTS.length),
  widgets: z.array(z.enum(DASHBOARD_WIDGETS.map((w) => w.key) as [string, ...string[]])).min(1, "Keep at least one dashboard section."),
  productUpdates: z.boolean(),
});

export async function updatePreferences(input: z.input<typeof prefsSchema>): Promise<SettingsState> {
  const user = await requireUser("/app/settings");
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = { interests: parsed.data.interests, dashboardWidgets: parsed.data.widgets, productUpdates: parsed.data.productUpdates };
  await db.userPreference.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  refresh();
  return { ok: true, message: "Preferences saved." };
}

// ─── Security ───────────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().superRefine((v, ctx) => {
      const p = passwordProblem(v);
      if (p) ctx.addIssue({ code: "custom", message: p });
    }),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a password you haven't used here." });

export async function changePassword(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser("/app/settings");
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: issues(parsed.error) };

  const limit = limiters.signIn.check(await clientKey("change-password", user.id));
  if (!limit.allowed) return { error: retryMessage(limit.retryAfterMs) };

  const record = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return { fieldErrors: { currentPassword: "That isn't your current password." } };
  }

  const keep = await currentSessionHash();
  const passwordHash = await hashPassword(parsed.data.newPassword);
  const [, removed] = await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: user.id, ...(keep ? { NOT: { tokenHash: keep } } : {}) } }),
  ]);
  await audit({ actorId: user.id, action: "user.password_changed", entityType: "User", entityId: user.id, metadata: { otherSessionsSignedOut: removed.count } });
  refresh();
  return {
    ok: true,
    message: removed.count ? `Password updated. ${removed.count} other session${removed.count === 1 ? " was" : "s were"} signed out.` : "Password updated.",
  };
}

export async function signOutOtherSessions(): Promise<SettingsState> {
  const user = await requireUser("/app/settings");
  const keep = await currentSessionHash();
  const removed = await db.session.deleteMany({ where: { userId: user.id, ...(keep ? { NOT: { tokenHash: keep } } : {}) } });
  await audit({ actorId: user.id, action: "user.sessions_revoked", entityType: "User", entityId: user.id, metadata: { count: removed.count } });
  refresh();
  return { ok: true, message: removed.count ? `Signed out of ${removed.count} other session${removed.count === 1 ? "" : "s"}.` : "No other sessions were active." };
}
