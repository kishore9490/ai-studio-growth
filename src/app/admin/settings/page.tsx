import type { Metadata } from "next";
import { bpsToPercentString } from "@/actions/admin/utils";
import { KeyValue } from "@/components/admin/bits";
import { SettingsForm } from "@/components/admin/settings-form";
import { Badge, PageHeader, Panel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { requireAdmin } from "@/lib/server/auth";
import { aiConfigured, env, paymentConfig } from "@/lib/server/env";

export const metadata: Metadata = { title: "Platform settings · Admin" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const s = await db.platformSettings.findUniqueOrThrow({ where: { id: 1 } });
  const payments = paymentConfig();
  return (
    <div>
      <PageHeader title="Platform settings" description="Business settings stored in the database. Secrets and infrastructure are configured through environment variables." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <SettingsForm
          initial={{
            taxRate: bpsToPercentString(s.taxRateBps),
            taxLabel: s.taxLabel,
            supportEmail: s.supportEmail,
            announcement: s.announcement ?? "",
            signupsEnabled: s.signupsEnabled,
          }}
        />
        <Panel className="h-fit p-5">
          <h2 className="text-[15px] font-semibold">Environment (read-only)</h2>
          <p className="mt-1 text-[12.5px] text-ink-3">Set in the server environment. Secret values are never displayed.</p>
          <dl className="mt-3 divide-y divide-line">
            <KeyValue label="Demo mode">
              <Badge tone={env.demoMode ? "warning" : "neutral"}>{env.demoMode ? "On" : "Off"}</Badge>
            </KeyValue>
            <KeyValue label="Payment provider">
              {payments.provider} · {payments.mockAllowed ? "allowed" : "blocked"}
            </KeyValue>
            <KeyValue label="Webhook secret">{env.paymentWebhookSecret ? "Configured" : "Missing"}</KeyValue>
            <KeyValue label="AI writing">{aiConfigured() ? `Configured (${env.aiModel})` : "Local fallback"}</KeyValue>
            <KeyValue label="App URL">
              <span className="font-mono text-[12px]">{env.appUrl}</span>
            </KeyValue>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
