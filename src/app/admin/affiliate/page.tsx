import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { bpsToPercentString, paiseToRupeeString } from "@/actions/admin/utils";
import { AffiliateForm } from "@/components/admin/affiliate-form";
import { Callout, PageHeader } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { requireAdmin } from "@/lib/server/auth";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Affiliate settings · Admin" };

export default async function AdminAffiliatePage() {
  await requireAdmin();
  const [settings, levels, lastChange] = await Promise.all([
    db.affiliateSettings.findUniqueOrThrow({ where: { id: 1 } }),
    db.commissionLevel.findMany({ orderBy: { level: "asc" } }),
    db.auditLog.findFirst({ where: { action: "affiliate.settings_updated" }, orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } }),
  ]);
  const byLevel = (n: number) => levels.find((l) => l.level === n);

  return (
    <div>
      <PageHeader
        title="Affiliate programme"
        description={lastChange ? `Last changed by ${lastChange.actor?.name ?? "system"} on ${formatDateTime(lastChange.createdAt)}. Every change is recorded in the audit log with before/after values.` : "Every change is recorded in the audit log with before/after values."}
      />
      <Callout tone="warning" icon={Scale} className="mb-6" title="Development placeholders — pending legal and financial approval">
        The three-level rates below are test configuration only. Commissions must be based on verified product sales and must never be paid for sign-ups,
        recruitment or membership purchases.
      </Callout>
      <AffiliateForm
        initial={{
          programEnabled: settings.programEnabled,
          commissionMode: settings.commissionMode,
          attributionWindowDays: settings.attributionWindowDays,
          holdPeriodDays: settings.holdPeriodDays,
          minPayout: paiseToRupeeString(settings.minPayoutInPaise),
          levels: [1, 2, 3].map((n) => ({ level: n, rate: bpsToPercentString(byLevel(n)?.rateBps ?? 0), enabled: byLevel(n)?.enabled ?? false })),
        }}
      />
    </div>
  );
}
