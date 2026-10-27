import type { Metadata } from "next";
import { Info } from "lucide-react";
import { paiseToRupeeString } from "@/actions/admin/utils";
import { PlanForm } from "@/components/admin/plan-form";
import { Badge, Callout, PageHeader, Panel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { annualSavings } from "@/lib/domain/pricing";
import { requireAdmin } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Membership plans · Admin" };

export default async function AdminPlansPage() {
  await requireAdmin();
  const now = new Date();
  const [plans, active] = await Promise.all([
    db.membershipPlan.findMany({ orderBy: { sortOrder: "asc" } }),
    db.membershipSubscription.groupBy({ by: ["planId"], where: { status: "ACTIVE", currentPeriodEnd: { gt: now } }, _count: true }),
  ]);
  const monthly = plans.find((p) => p.code === "PREMIUM_MONTHLY");
  const annual = plans.find((p) => p.code === "PREMIUM_ANNUAL");
  const savings = monthly && annual ? annualSavings(monthly.priceInPaise, annual.priceInPaise) : null;

  return (
    <div>
      <PageHeader title="Membership plans" description="Configure plan names, illustrative prices, benefits and billing terms." />
      <Callout tone="accent" icon={Info} className="mb-6" title="Prices are illustrative until a recurring-payment provider is configured">
        Premium is activated only after a verified payment. In this MVP payments are mocked, so subscriptions created here are test subscriptions.{" "}
        {savings
          ? `With current prices, annual billing is ${formatINR(savings.savingsInPaise)} (${savings.percent}%) less than 12 monthly payments — the membership page shows exactly this figure.`
          : "With current prices, annual billing is not cheaper than 12 monthly payments, so no discount is shown to customers."}
      </Callout>
      <div className="space-y-6">
        {plans.map((plan) => (
          <Panel key={plan.id} className="p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{plan.name}</h2>
              <Badge tone="outline">{plan.code}</Badge>
              <Badge tone={plan.isActive ? "success" : "neutral"}>{plan.isActive ? "Active" : "Hidden"}</Badge>
              <span className="ml-auto text-[13px] text-ink-3">
                {plan.interval === "NONE" ? "No billing" : `Billed ${plan.interval === "YEAR" ? "yearly" : "monthly"}`} ·{" "}
                {active.find((a) => a.planId === plan.id)?._count ?? 0} active subscriptions
              </span>
            </div>
            <PlanForm
              plan={{
                id: plan.id,
                code: plan.code,
                name: plan.name,
                description: plan.description,
                price: paiseToRupeeString(plan.priceInPaise),
                interval: plan.interval,
                benefits: plan.benefits.join("\n"),
                billingTerms: plan.billingTerms,
                isActive: plan.isActive,
              }}
            />
          </Panel>
        ))}
      </div>
    </div>
  );
}
