import { Check, Crown } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/misc";
import { formatINR } from "@/lib/domain/money";
import { annualSavings, monthlyEquivalent } from "@/lib/domain/pricing";
import { cn } from "@/lib/utils";

export type Plan = {
  id: string;
  code: string;
  name: string;
  description: string;
  priceInPaise: number;
  interval: "NONE" | "MONTH" | "YEAR";
  benefits: string[];
  billingTerms: string;
};

/**
 * Three access tiers. Prices come from the configurable plans table; the
 * annual saving is derived from those prices and hidden if it isn't positive.
 */
export function PlanCards({ plans, renderAction }: { plans: Plan[]; renderAction: (plan: Plan) => ReactNode }) {
  const monthly = plans.find((p) => p.code === "PREMIUM_MONTHLY");
  const annual = plans.find((p) => p.code === "PREMIUM_ANNUAL");
  const savings = monthly && annual ? annualSavings(monthly.priceInPaise, annual.priceInPaise) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map((plan) => {
        const highlighted = plan.code === "PREMIUM_MONTHLY";
        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-[22px] border bg-surface p-6",
              highlighted ? "border-ink shadow-lift" : "border-line",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[15px] font-semibold">
                {plan.interval !== "NONE" && <Crown className="size-4 text-accent" />}
                {plan.name}
              </p>
              {plan.code === "PREMIUM_ANNUAL" && savings && <Badge tone="success">Save {savings.percent}%</Badge>}
              {highlighted && <Badge tone="dark">Most flexible</Badge>}
            </div>
            <p className="mt-1.5 text-[13.5px] text-ink-2">{plan.description}</p>
            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="text-[38px] font-semibold tracking-[-0.04em] tabular-nums">{formatINR(plan.priceInPaise)}</span>
              <span className="text-[14px] text-ink-3">{plan.interval === "MONTH" ? "/ month" : plan.interval === "YEAR" ? "/ year" : "forever"}</span>
            </div>
            <p className="mt-1 min-h-10 text-[12.5px] text-ink-3">
              {plan.interval === "YEAR"
                ? `≈ ${formatINR(monthlyEquivalent(plan.priceInPaise), { exact: true })} per month${savings ? ` · ${formatINR(savings.savingsInPaise)} less than 12 monthly payments` : ""}`
                : plan.interval === "MONTH"
                  ? "Illustrative price · billed monthly"
                  : "No payment details required"}
            </p>
            <div className="mt-6">{renderAction(plan)}</div>
            <ul className="mt-6 space-y-3 border-t border-line pt-6">
              {plan.benefits.map((b) => (
                <li key={b} className="flex gap-2.5 text-[14px] text-ink-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-ink" />
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-6 text-[12px] leading-relaxed text-ink-3">{plan.billingTerms}</p>
          </div>
        );
      })}
    </div>
  );
}
