import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Crown, FlaskConical, Share2, UserRound, Wrench } from "lucide-react";
import { FaqList, PageIntro } from "@/components/site/prose";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Help Centre", description: "Answers about accounts, tools, purchases, membership and the affiliate programme." };

const SECTIONS = [
  {
    id: "account",
    icon: UserRound,
    title: "Account",
    items: [
      { q: "How do I reset my password?", a: <p>Use <Link href="/forgot-password">Forgot password</Link> on the sign-in page. Reset links expire after 30 minutes and signing in with a new password signs you out of other devices.</p> },
      { q: "How do I change my name, interests or dashboard?", a: <p>Open <Link href="/app/settings">Settings</Link>. You can update your profile, interests and which dashboard sections you see.</p> },
      { q: "How do I delete my account?", a: <p>Account deletion is handled by our support team so that we can also remove purchase and affiliate records where the law allows. <Link href="/contact">Contact us</Link> from the email on your account.</p> },
    ],
  },
  {
    id: "tools",
    icon: Wrench,
    title: "Digital tools",
    items: [
      { q: "Where is my tool data saved?", a: <p>The Resume Builder, Proposal Builder, Budget Planner, Content Planner and Productivity Workspace save to your browser&apos;s local storage. Clearing browser data, or switching device, will reset them — export or print anything you want to keep.</p> },
      { q: "Is the AI Writing Workspace using real AI?", a: <p>When an AI provider is configured on the server, yes, and the tool says so. Otherwise it runs a clearly labelled local rewrite mode that restructures your text without any external AI service.</p> },
      { q: "Why can't I open a premium tool?", a: <p>Premium tools need an active Premium membership. Free tools are available on every account.</p> },
    ],
  },
  {
    id: "purchases",
    icon: CreditCard,
    title: "Purchases & payments",
    items: [
      { q: "When will I get access to a product?", a: <p>Immediately after our server receives confirmation of payment. If a payment fails or is still processing, the checkout page shows that status instead of a success message.</p> },
      { q: "Where do I download my products?", a: <p>In <Link href="/app/library">My Library</Link>. Each file has its own download button; links are generated fresh each time and expire after a few minutes.</p> },
      { q: "Can I get an invoice or a refund?", a: <p>Your <Link href="/app/orders">Orders</Link> page lists each order with its price breakdown. Refunds follow the <Link href="/legal/refund-policy">Refund Policy</Link>.</p> },
    ],
  },
  {
    id: "membership",
    icon: Crown,
    title: "Membership",
    items: [
      { q: "What does Premium include?", a: <p>Premium tools, the expanded resource library, monthly resource releases and products marked &ldquo;Included with Premium&rdquo;. See <Link href="/membership">Membership</Link>.</p> },
      { q: "How do I cancel?", a: <p>From <Link href="/app/membership">Membership</Link> in the app. Your access continues until the end of the period you&apos;ve paid for.</p> },
    ],
  },
  {
    id: "affiliate",
    icon: Share2,
    title: "Affiliate programme",
    items: [
      { q: "Do I need to buy anything to join?", a: <p>No. Joining is free and optional, and has no effect on what you can use.</p> },
      { q: "What earns a commission?", a: <p>Only verified, eligible product sales from people you referred. Sign-ups, recruitment and memberships never earn commission. The programme is currently in test mode and no payouts are made. See the <Link href="/affiliate-programme">programme overview</Link>.</p> },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
      <PageIntro eyebrow="Help Centre" title="How can we help?" description="Answers to common questions about LifeOS. Can't find what you need? Send us a message." />

      <nav aria-label="Help topics" className="mt-10 flex flex-wrap gap-2">
        {[...SECTIONS, { id: "demo", icon: FlaskConical, title: "Demo mode" }].map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[13.5px] text-ink-2 shadow-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            <s.icon className="size-3.5" strokeWidth={1.75} /> {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-16 space-y-16">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="grid grid-cols-1 scroll-mt-24 gap-8 lg:grid-cols-[1fr_2fr]">
            <div className="flex items-center gap-3 self-start">
              <span className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface text-ink-2">
                <s.icon className="size-4" strokeWidth={1.75} />
              </span>
              <h2 id={`${s.id}-title`} className="text-[20px] font-semibold tracking-[-0.025em]">
                {s.title}
              </h2>
            </div>
            <FaqList items={s.items} />
          </section>
        ))}

        <section id="demo" aria-labelledby="demo-title" className="scroll-mt-24 rounded-[22px] border border-warning/25 bg-warning-soft/60 p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-[10px] bg-surface text-warning">
              <FlaskConical className="size-4" strokeWidth={1.75} />
            </span>
            <h2 id="demo-title" className="text-[20px] font-semibold tracking-[-0.025em]">
              About demo mode
            </h2>
          </div>
          <p className="mt-5 max-w-3xl text-[15.5px] leading-relaxed text-[#5e4410]">
            This environment is a demonstration of the LifeOS MVP. <strong className="font-medium text-ink">No real money moves</strong>, and
            nothing you do here creates a real financial obligation.
          </p>
          <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {[
              { t: "Sample data", d: "Products, orders, members, referrals and commission records were created by the seed script and are labelled as sample or demo data." },
              { t: "Mock payments", d: "Checkout uses a development payment simulator. You choose whether a payment succeeds or fails; no card or UPI details are requested or charged." },
              { t: "Test-mode commissions", d: "Commission records are calculated in test mode only. Payouts are disabled and cannot be triggered until the programme receives legal and financial approval." },
              { t: "Demo accounts", d: "The sign-in page lists demo accounts (Premium member, free member and admin) while demo mode is on. These credentials are for this environment only." },
            ].map((x) => (
              <div key={x.t}>
                <dt className="text-[15px] font-semibold text-ink">{x.t}</dt>
                <dd className="mt-1 text-[14.5px] leading-relaxed text-[#5e4410]">{x.d}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-line pt-10 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.025em]">Still need help?</h2>
          <p className="mt-1 text-[15px] text-ink-2">Send us a message and we&apos;ll reply by email.</p>
        </div>
        <ButtonLink href="/contact" size="lg">
          Contact support
        </ButtonLink>
      </div>
    </div>
  );
}
