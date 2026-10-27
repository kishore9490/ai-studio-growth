import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Check, Crown, CreditCard, Info } from "lucide-react";
import { CancelMembershipButton, ResumeMembershipButton, UpgradeButton } from "@/components/membership/membership-actions";
import { PlanCards } from "@/components/membership/plan-cards";
import { Badge, Callout, DemoLabel, PageHeader, Panel } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { getMembership } from "@/lib/core/membership";
import { formatINR } from "@/lib/domain/money";
import { requireUser } from "@/lib/server/auth";
import { getPlans } from "@/lib/server/catalog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Membership" };

export default async function MembershipManagementPage() {
  const user = await requireUser("/app/membership");
  const [membership, plans, history] = await Promise.all([
    getMembership(user.id),
    getPlans(),
    db.membershipSubscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { plan: true }, take: 6 }),
  ]);
  const sub = membership.subscription;
  const currentPlan = sub ? plans.find((p) => p.code === sub.planCode) : plans.find((p) => p.code === "FREE");
  const pendingOrder = await db.order.findFirst({
    where: { userId: user.id, status: "PENDING", items: { some: { type: "MEMBERSHIP" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Membership" description="Your plan, billing status and benefits." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="relative overflow-hidden p-6">
          {sub && <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-[radial-gradient(circle,rgb(117_87_246/0.16),transparent_70%)]" />}
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] text-ink-3">Current plan</p>
            {sub?.isTest && <DemoLabel>Test billing</DemoLabel>}
          </div>
          <p className="mt-2 flex items-center gap-2 text-[28px] font-semibold tracking-[-0.035em]">
            {sub && <Crown className="size-6 text-accent" />}
            {currentPlan?.name ?? "Free"}
          </p>
          {sub ? (
            <dl className="mt-6 grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-1.5 text-[12.5px] text-ink-3"><CreditCard className="size-3.5" /> Billing</dt>
                <dd className="mt-1 text-[14.5px] font-medium">
                  {formatINR(sub.priceInPaise)} / {sub.interval === "YEAR" ? "year" : "month"}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[12.5px] text-ink-3"><CalendarClock className="size-3.5" /> {sub.cancelAtPeriodEnd ? "Access ends" : "Renewal date"}</dt>
                <dd className="mt-1 text-[14.5px] font-medium">{formatDate(sub.currentPeriodEnd)}</dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-ink-3">Status</dt>
                <dd className="mt-1">
                  {sub.cancelAtPeriodEnd ? <Badge tone="warning">Cancels at period end</Badge> : <Badge tone="success">Active</Badge>}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-2">
              You&apos;re on the Free plan. Everything essential is included; upgrade only if Premium&apos;s extras are useful to you.
            </p>
          )}
          {sub && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
              {sub.cancelAtPeriodEnd ? <ResumeMembershipButton /> : <CancelMembershipButton endsOn={formatDate(sub.currentPeriodEnd)} />}
            </div>
          )}
        </Panel>

        <Panel className="p-6">
          <p className="text-[13px] text-ink-3">Included in your plan</p>
          <ul className="mt-4 space-y-2.5">
            {(currentPlan?.benefits ?? []).map((b) => (
              <li key={b} className="flex gap-2.5 text-[14px] text-ink-2">
                <Check className="mt-0.5 size-4 shrink-0 text-ink" /> {b}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {sub && (
        <Callout tone="neutral" icon={Info} className="mt-6">
          Recurring billing is not configured in this environment. Your renewal date is shown for reference — no automatic charge will
          be made, and the membership ends on that date unless renewed.
        </Callout>
      )}
      {pendingOrder && (
        <Callout tone="warning" className="mt-6" title="You have an unfinished membership checkout">
          Order {pendingOrder.number} is awaiting payment. <Link href={`/app/checkout/${pendingOrder.id}`} className="font-medium underline">Continue checkout</Link>
        </Callout>
      )}

      {!sub && (
        <section className="mt-12">
          <h2 className="mb-5 text-[17px] font-semibold tracking-[-0.02em]">Compare plans</h2>
          <PlanCards
            plans={plans}
            renderAction={(plan) =>
              plan.interval === "NONE" ? (
                <div className="flex h-12 items-center justify-center rounded-[12px] border border-line text-[14px] text-ink-2">Your current plan</div>
              ) : (
                <UpgradeButton planId={plan.id} label={`Upgrade to ${plan.name}`} variant={plan.code === "PREMIUM_MONTHLY" ? "primary" : "secondary"} />
              )
            }
          />
        </section>
      )}

      {history.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-[15px] font-semibold">Membership history</h2>
          <Panel className="divide-y divide-line">
            {history.map((h) => (
              <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[14px]">
                <span>
                  {h.plan.name} <span className="text-ink-3">· {formatDate(h.currentPeriodStart)} – {formatDate(h.currentPeriodEnd)}</span>
                </span>
                <span className="flex items-center gap-2">
                  {h.isTest && <DemoLabel>Test</DemoLabel>}
                  <Badge tone={h.status === "ACTIVE" ? "success" : "neutral"}>{h.status.toLowerCase()}</Badge>
                </span>
              </div>
            ))}
          </Panel>
        </section>
      )}
    </div>
  );
}
