import type { Metadata } from "next";
import Link from "next/link";
import { CircleDollarSign, FlaskConical, Info, Link2, ShieldCheck, UserPlus, Users } from "lucide-react";
import { CommissionStatusBadge, PayoutStatusBadge } from "@/components/status-badges";
import { JoinProgrammeForm, LeaveProgrammeButton, PayoutRequestButton, ShareButton } from "@/components/referrals/referral-actions";
import { CopyButton } from "@/components/ui/copy-button";
import { Callout, DemoLabel, EmptyState, PageHeader, Panel, Stat } from "@/components/ui/misc";
import { TD, TH, THead, TR, Table, TableWrap } from "@/components/ui/table";
import { PAYOUTS_ENABLED, commissionSummary } from "@/lib/core/affiliate";
import { db } from "@/lib/core/db";
import { formatBps, formatINR } from "@/lib/domain/money";
import { referralUrl } from "@/lib/domain/referrals";
import { requireUser } from "@/lib/server/auth";
import { env } from "@/lib/server/env";
import { formatDate, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Referral Centre" };

/** Referrers see first name + initial only. */
function maskName(name: string) {
  const [first, ...rest] = name.split(" ");
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
}

export default async function ReferralCentrePage() {
  const user = await requireUser("/app/referrals");
  const [settings, levels] = await Promise.all([
    db.affiliateSettings.findUniqueOrThrow({ where: { id: 1 } }),
    db.commissionLevel.findMany({ orderBy: { level: "asc" } }),
  ]);

  const levelsTable = (
    <div className="grid grid-cols-3 divide-x divide-line rounded-[14px] border border-line bg-surface">
      {levels.map((l) => (
        <div key={l.level} className="p-4">
          <p className="text-[12px] text-ink-3">Level {l.level}{l.level === 1 ? " · direct" : ""}</p>
          <p className="mt-1 text-[20px] font-semibold tabular-nums tracking-[-0.03em]">{l.enabled ? formatBps(l.rateBps) : "Off"}</p>
          <p className="text-[12px] text-ink-3">of eligible product sales</p>
        </div>
      ))}
    </div>
  );

  if (!user.affiliateOptIn) {
    return (
      <div>
        <PageHeader title="Referral Centre" description="Optional. Share LifeOS and, once the programme is approved, earn a share of eligible product sales." />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
          <Panel className="p-6">
            <h2 className="text-[20px] font-semibold tracking-[-0.025em]">How the affiliate programme works</h2>
            <ul className="mt-5 space-y-4 text-[14.5px] text-ink-2">
              {[
                { icon: UserPlus, t: "Free to join", d: "No purchase or membership is required to take part — and taking part is never required to use LifeOS." },
                { icon: CircleDollarSign, t: "Rewards product sales only", d: "Commissions are recorded only when someone you referred buys an eligible product and payment is verified. Nothing is earned for sign-ups, memberships or recruiting." },
                { icon: ShieldCheck, t: "Refunds reverse commissions", d: "Commissions are held for a review period and reversed if the order is refunded." },
                { icon: FlaskConical, t: "Currently in test mode", d: "The compensation plan is awaiting legal and financial approval. Records are for testing and payouts are disabled." },
              ].map((x) => (
                <li key={x.t} className="flex gap-3">
                  <x.icon className="mt-0.5 size-[18px] shrink-0 text-ink" strokeWidth={1.75} />
                  <span>
                    <span className="block font-medium text-ink">{x.t}</span>
                    {x.d}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-line pt-6">
              {settings.programEnabled ? <JoinProgrammeForm /> : <p className="text-[14px] text-ink-2">The programme isn&apos;t accepting new members right now.</p>}
            </div>
          </Panel>
          <div className="space-y-4">
            <p className="text-[13px] font-medium text-ink-2">Configured test rates</p>
            {levelsTable}
            <p className="text-[12.5px] leading-relaxed text-ink-3">
              These are development placeholders and may change. Earnings are not guaranteed and depend entirely on genuine customer purchases.{" "}
              <Link href="/affiliate-programme" className="underline underline-offset-2">Read more</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const link = referralUrl(env.appUrl, user.referralCode);
  const direct = await db.referralRelationship.findMany({
    where: { referrerId: user.id },
    orderBy: { attributedAt: "desc" },
    include: { referredUser: { select: { id: true, name: true } } },
  });
  const directIds = direct.map((d) => d.referredUserId);
  const level2 = directIds.length ? await db.referralRelationship.findMany({ where: { referrerId: { in: directIds } }, select: { referredUserId: true, attributedAt: true } }) : [];
  const level2Ids = level2.map((d) => d.referredUserId);
  const level3Count = level2Ids.length ? await db.referralRelationship.count({ where: { referrerId: { in: level2Ids } } }) : 0;

  const [summary, commissions, payouts, ledger] = await Promise.all([
    commissionSummary(user.id),
    db.commissionRecord.findMany({
      where: { beneficiaryId: user.id },
      orderBy: { createdAt: "desc" },
      include: { orderItem: { select: { name: true } }, buyer: { select: { name: true } }, order: { select: { number: true } } },
    }),
    db.payoutRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.commissionLedgerEntry.findMany({ where: { beneficiaryId: user.id }, orderBy: { createdAt: "desc" }, take: 8, include: { commission: { select: { level: true } } } }),
  ]);
  const eligibleSales = new Set(commissions.filter((c) => c.status !== "REVERSED").map((c) => c.orderId)).size;
  const openRequest = payouts.some((p) => p.status === "REQUESTED");
  const payoutBlocked = openRequest
    ? "You already have a request under review."
    : summary.availableForRequest < settings.minPayoutInPaise
      ? `Approved, unrequested balance ${formatINR(summary.availableForRequest, { exact: true })} — minimum ${formatINR(settings.minPayoutInPaise)}.`
      : undefined;

  const activity = [
    ...direct.slice(0, 8).map((d) => ({ at: d.attributedAt, title: `${maskName(d.referredUser.name)} joined with your link`, meta: "Direct referral" })),
    ...ledger.map((e) => ({
      at: e.createdAt,
      title:
        e.type === "ACCRUED"
          ? `Test commission recorded · ${formatINR(e.amountInPaise, { exact: true })}`
          : e.type === "REVERSED"
            ? `Commission reversed · ${formatINR(Math.abs(e.amountInPaise), { exact: true })}`
            : e.type === "APPROVED"
              ? "Commission approved after review"
              : "Commission paid out",
      meta: e.note?.startsWith("Level") ? e.note : `Level ${e.commission.level}${e.note ? ` · ${e.note}` : ""}`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Referral Centre"
        description="Share LifeOS and track eligible product sales from your network."
        eyebrow={<DemoLabel>{settings.commissionMode === "TEST" ? "Test mode · no real payouts" : "Commissions disabled"}</DemoLabel>}
      />

      {settings.commissionMode === "DISABLED" && (
        <Callout tone="warning" className="mb-6" title="Commission recording is switched off">
          Referral links still work, but no commissions are being recorded at the moment.
        </Callout>
      )}
      {user.isSampleData && (
        <Callout tone="warning" icon={Info} className="mb-6">
          The referrals, commissions and payouts below are demo records created by the seed script.
        </Callout>
      )}

      <Panel className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[13px] text-ink-3">
              <Link2 className="size-3.5" /> Your referral link
            </p>
            <p className="mt-1 truncate font-mono text-[15px]">{link}</p>
            <p className="mt-1 text-[12.5px] text-ink-3">
              Code <span className="font-mono text-ink-2">{user.referralCode}</span> · remembered for {settings.attributionWindowDays} days after a visit
            </p>
          </div>
          <div className="flex gap-2">
            <CopyButton text={link} label="Copy link" toastMessage="Referral link copied" />
            <ShareButton url={link} />
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-5">
          <Stat label="Direct referrals" value={direct.length} hint={`${level2.length} at level 2 · ${level3Count} at level 3`} />
        </Panel>
        <Panel className="p-5">
          <Stat label="Eligible product sales" value={eligibleSales} hint="Verified, not refunded" />
        </Panel>
        <Panel className="p-5">
          <Stat label="Pending (test)" value={formatINR(summary.pending, { exact: true })} hint={`In ${settings.holdPeriodDays}-day review hold`} />
        </Panel>
        <Panel className="p-5">
          <Stat label="Approved (test)" value={formatINR(summary.approved, { exact: true })} hint={`Reversed ${formatINR(summary.reversed, { exact: true })}`} />
        </Panel>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="mb-4 text-[15px] font-semibold">Commission records</h2>
          {commissions.length === 0 ? (
            <EmptyState icon={CircleDollarSign} title="No commissions yet" description="When someone you referred buys an eligible product and the payment is verified, a test record appears here." />
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <tr>
                    <TH>Date</TH>
                    <TH>Sale</TH>
                    <TH>Level</TH>
                    <TH className="text-right">Amount</TH>
                    <TH>Status</TH>
                  </tr>
                </THead>
                <tbody>
                  {commissions.map((c) => (
                    <TR key={c.id}>
                      <TD className="whitespace-nowrap text-ink-2">{formatDate(c.createdAt)}</TD>
                      <TD>
                        <p className="font-medium">{c.orderItem.name}</p>
                        <p className="text-[12px] text-ink-3">
                          {maskName(c.buyer.name)} · {formatINR(c.baseAmountInPaise)} × {formatBps(c.rateBps)}
                        </p>
                        {c.reversalReason && <p className="text-[12px] text-danger">{c.reversalReason}</p>}
                      </TD>
                      <TD className="text-ink-2">L{c.level}</TD>
                      <TD className="text-right font-medium tabular-nums">{formatINR(c.amountInPaise, { exact: true })}</TD>
                      <TD>
                        <CommissionStatusBadge status={c.status} />
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}

          <h2 className="mb-4 mt-10 text-[15px] font-semibold">Payout history</h2>
          <Panel className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-md text-[13.5px] text-ink-2">
                <p className="font-medium text-ink">Payouts are disabled</p>
                <p className="mt-1">
                  {PAYOUTS_ENABLED
                    ? "Approved commissions can be requested once they reach the minimum."
                    : "While the programme awaits legal and financial approval you can submit test requests, which are reviewed but never paid."}
                </p>
              </div>
              <PayoutRequestButton disabled={!!payoutBlocked} reason={payoutBlocked} />
            </div>
            {payouts.length > 0 && (
              <ul className="mt-5 divide-y divide-line border-t border-line">
                {payouts.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[14px]">
                    <span>
                      {formatINR(p.amountInPaise, { exact: true })} <span className="text-ink-3">· requested {formatDate(p.createdAt)}</span>
                      {p.reviewNote && <span className="block text-[12.5px] text-ink-3">{p.reviewNote}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      {p.isTest && <DemoLabel>Test</DemoLabel>}
                      <PayoutStatusBadge status={p.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>

        <aside className="space-y-8">
          <section>
            <h2 className="mb-4 text-[15px] font-semibold">Recent activity</h2>
            {activity.length === 0 ? (
              <EmptyState icon={Users} title="No activity yet" description="Share your link to get started." />
            ) : (
              <Panel>
                <ol className="divide-y divide-line">
                  {activity.map((a, i) => (
                    <li key={i} className="px-4 py-3">
                      <p className="text-[13.5px] font-medium">{a.title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-3">
                        {a.meta} · {relativeTime(a.at)}
                      </p>
                    </li>
                  ))}
                </ol>
              </Panel>
            )}
          </section>
          <section>
            <h2 className="mb-4 text-[15px] font-semibold">Your direct referrals</h2>
            {direct.length === 0 ? (
              <p className="text-[13.5px] text-ink-3">No one has joined with your link yet.</p>
            ) : (
              <Panel className="divide-y divide-line">
                {direct.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-4 py-2.5 text-[13.5px]">
                    <span>{maskName(d.referredUser.name)}</span>
                    <span className="text-ink-3">joined {formatDate(d.attributedAt)}</span>
                  </div>
                ))}
              </Panel>
            )}
          </section>
          <section>
            <h2 className="mb-4 text-[15px] font-semibold">Programme rates</h2>
            {levelsTable}
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
              Test placeholders. Commissions apply to eligible product sales only — never to sign-ups or memberships. Earnings are not guaranteed.
            </p>
          </section>
          <LeaveProgrammeButton />
        </aside>
      </div>
    </div>
  );
}
