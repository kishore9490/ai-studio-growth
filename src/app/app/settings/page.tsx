import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Callout, PageHeader, Panel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { DEFAULT_WIDGETS } from "@/lib/preferences";
import { SESSION_COOKIE, hashToken, requireUser } from "@/lib/server/auth";
import { formatDateTime } from "@/lib/utils";
import { PasswordForm, PreferencesForm, ProfileForm, SessionsList } from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid grid-cols-1 scroll-mt-24 gap-6 border-t border-line pt-10 lg:grid-cols-[260px_1fr]">
      <div>
        <h2 id={`${id}-title`} className="text-[16px] font-semibold tracking-[-0.015em]">
          {title}
        </h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser("/app/settings");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const currentHash = token ? hashToken(token) : null;
  const [profile, prefs, sessions] = await Promise.all([
    db.profile.findUnique({ where: { userId: user.id } }),
    db.userPreference.findUnique({ where: { userId: user.id } }),
    db.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, tokenHash: true, userAgent: true, createdAt: true },
      take: 20,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, preferences and account security." />
      <nav aria-label="Settings sections" className="-mt-2 mb-10 flex flex-wrap gap-1.5">
        {[
          ["profile", "Profile"],
          ["preferences", "Preferences"],
          ["security", "Security"],
          ["account", "Account"],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
            {label}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        <Section id="profile" title="Profile" description="How you appear across LifeOS.">
          <Panel className="p-5 sm:p-6">
            <ProfileForm
              initial={{
                name: user.name,
                email: user.email,
                headline: profile?.headline ?? "",
                bio: profile?.bio ?? "",
                avatarHue: profile?.avatarHue ?? user.avatarHue,
              }}
            />
          </Panel>
        </Section>

        <Section id="preferences" title="Preferences" description="Tune recommendations, your dashboard and emails.">
          <Panel className="p-5 sm:p-6">
            <PreferencesForm
              initial={{
                interests: prefs?.interests ?? [],
                widgets: prefs?.dashboardWidgets.length ? prefs.dashboardWidgets : DEFAULT_WIDGETS,
                productUpdates: prefs?.productUpdates ?? true,
              }}
            />
          </Panel>
        </Section>

        <Section id="security" title="Security" description="Change your password and review where you're signed in.">
          <div className="space-y-6">
            <Panel className="p-5 sm:p-6">
              <h3 className="mb-5 text-[14.5px] font-semibold">Change password</h3>
              <PasswordForm />
            </Panel>
            <Panel className="p-5 sm:p-6">
              <h3 className="mb-4 text-[14.5px] font-semibold">Active sessions</h3>
              <SessionsList
                sessions={sessions.map((s) => ({
                  id: s.id,
                  userAgent: s.userAgent,
                  // Formatted on the server so the client renders identical text (no clock drift).
                  signedInLabel: formatDateTime(s.createdAt),
                  current: s.tokenHash === currentHash,
                }))}
              />
            </Panel>
          </div>
        </Section>

        <Section id="account" title="Delete account" description="Permanently remove your account and data.">
          <Callout icon={Info} title="Handled by our support team">
            <p>
              Account deletion isn&apos;t self-service yet, because purchase, tax and affiliate records need to be handled correctly.
              To request deletion, <Link href="/contact" className="font-medium text-ink underline underline-offset-[3px]">contact support</Link>{" "}
              from {user.email}. We&apos;ll confirm before anything is removed.
            </p>
          </Callout>
        </Section>
      </div>
    </div>
  );
}
