import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { Ban, Check, FlaskConical, Info } from "lucide-react";
import { FaqList, PageIntro } from "@/components/site/prose";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Callout, Skeleton } from "@/components/ui/misc";
import { db } from "@/lib/core/db";
import { formatBps } from "@/lib/domain/money";

export const metadata: Metadata = {
  title: "Affiliate Programme",
  description: "An optional, free referral programme. Commissions apply only to verified product sales, and are currently in test mode.",
};

async function getProgramme() {
  "use cache";
  cacheTag("affiliate-settings");
  cacheLife("minutes");
  const [settings, levels] = await Promise.all([
    db.affiliateSettings.findUnique({ where: { id: 1 } }),
    db.commissionLevel.findMany({ orderBy: { level: "asc" } }),
  ]);
  return { settings, levels };
}

const LEVEL_COPY: Record<number, string> = {
  1: "A product sale by someone who joined with your link.",
  2: "A product sale by someone referred by your level 1 referral.",
  3: "A product sale one step further along.",
};

async function LevelTable() {
  const { settings, levels } = await getProgramme();
  const mode = settings?.programEnabled ? settings.commissionMode : "DISABLED";
  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <p className="text-[14px] font-medium">Current configuration</p>
        <Badge tone={mode === "TEST" ? "warning" : "neutral"} icon={FlaskConical}>
          {mode === "TEST" ? "Test mode · no payouts" : "Commissions disabled"}
        </Badge>
      </div>
      <ul className="divide-y divide-line">
        {levels.map((l) => (
          <li key={l.level} className="flex items-center gap-5 px-5 py-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line font-mono text-[13px] text-ink-2">
              L{l.level}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-medium">Level {l.level}</span>
              <span className="block text-[13.5px] text-ink-2">{LEVEL_COPY[l.level]}</span>
            </span>
            <span className="text-right">
              <span className={l.enabled ? "block text-[18px] font-semibold tabular-nums tracking-[-0.02em]" : "block text-[15px] text-ink-3 line-through"}>
                {formatBps(l.rateBps)}
              </span>
              <span className="block text-[11.5px] text-ink-3">{l.enabled ? "placeholder rate" : "disabled"}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t border-line bg-canvas px-5 py-3.5 text-[13px] leading-relaxed text-ink-2">
        Rates are development placeholders, calculated on the product price before tax, and can be changed or disabled by LifeOS
        at any time. {settings ? `Commissions stay pending for a ${settings.holdPeriodDays}-day hold period so refunds can be reversed.` : null}
      </p>
    </div>
  );
}

function LevelTableSkeleton() {
  return (
    <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-5" aria-busy="true">
      <Skeleton className="h-4 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mt-6 flex items-center gap-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  );
}

export default function AffiliateProgrammePage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
      <PageIntro
        eyebrow="Affiliate Programme"
        title={
          <>
            Recommend what helps. <span className="serif-accent text-accent-ink">Nothing more.</span>
          </>
        }
        description="The Referral Centre is an optional way for members to share LifeOS. It's free to join, needs no purchase, and rewards only genuine product sales."
      />

      <Callout tone="warning" icon={FlaskConical} title="The programme is in test mode" className="mt-10 max-w-3xl">
        Commission records are calculated for testing only. Payouts are disabled and will stay disabled until the compensation
        structure has received legal and financial approval.
      </Callout>

      <section className="mt-20 grid gap-12 border-t border-line pt-12 lg:grid-cols-2">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.025em]">What can earn a commission</h2>
          <ul className="mt-6 space-y-3.5 text-[15px] text-ink-2">
            {[
              "A verified, paid purchase of an eligible marketplace product",
              "Made by someone who joined through your referral link or code",
              "That isn't refunded during the hold period",
            ].map((x) => (
              <li key={x} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-success" /> {x}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.025em]">What never earns a commission</h2>
          <ul className="mt-6 space-y-3.5 text-[15px] text-ink-2">
            {[
              "Someone signing up for an account",
              "Recruiting members or building a team",
              "Premium membership purchases",
              "Your own purchases — self-referrals are blocked",
              "Free products",
            ].map((x) => (
              <li key={x} className="flex gap-3">
                <Ban className="mt-0.5 size-4 shrink-0 text-danger" /> {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-20 grid grid-cols-1 gap-12 border-t border-line pt-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.025em]">Three configurable levels</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            The programme can attribute a sale up to three referral steps away. Each level has its own rate, and each can be
            switched off entirely. The current test configuration is shown here, live.
          </p>
        </div>
        <Suspense fallback={<LevelTableSkeleton />}>
          <LevelTable />
        </Suspense>
      </section>

      <section className="mt-20 grid grid-cols-1 gap-12 border-t border-line pt-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.025em]">Good to know</h2>
          <p className="mt-3 flex gap-2 text-[14px] text-ink-2">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              Read the full <Link href="/legal/affiliate-disclosure" className="text-ink underline underline-offset-[3px]">Affiliate Disclosure</Link>.
            </span>
          </p>
        </div>
        <FaqList
          items={[
            {
              q: "Will I earn money?",
              a: (
                <p>
                  There is no guarantee of income, and most people should expect to earn little or nothing. Please don&apos;t join,
                  spend money or make plans based on expected earnings. During the test phase, nothing is paid out at all.
                </p>
              ),
            },
            { q: "Does joining cost anything?", a: <p>No. Joining is free, and you never need to buy a product or membership to participate.</p> },
            {
              q: "Do I have to join to use LifeOS?",
              a: <p>No. Every tool, resource and product works exactly the same whether or not you join.</p>,
            },
            {
              q: "How are commissions protected against abuse?",
              a: (
                <p>
                  Commissions are calculated on the server from verified payments only, can&apos;t be edited by members, are
                  recorded once per sale and level, and are reversed if a sale is refunded. Accounts that abuse the programme can be
                  suspended.
                </p>
              ),
            },
            {
              q: "What must I disclose when sharing my link?",
              a: <p>That you may earn a commission. Be accurate about what LifeOS offers and never make claims about earnings.</p>,
            },
          ]}
        />
      </section>

      <div className="mt-20 flex flex-col items-start justify-between gap-6 rounded-[24px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:p-10">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Join from your Referral Centre</h2>
          <p className="mt-1.5 text-[15px] text-ink-2">Create a free account, then opt in whenever you like.</p>
        </div>
        <div className="flex gap-2.5">
          <ButtonLink href="/app/referrals" size="lg">
            Open Referral Centre
          </ButtonLink>
          <ButtonLink href="/legal/affiliate-disclosure" size="lg" variant="secondary">
            Disclosure
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
