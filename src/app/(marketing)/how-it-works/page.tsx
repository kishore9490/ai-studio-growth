import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Crown, Download, FileCheck2, Lock, Receipt, RefreshCw, ShieldCheck } from "lucide-react";
import { FaqList, PageIntro } from "@/components/site/prose";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Create a free account, discover tools and resources, then buy individual products or upgrade to Premium.",
};

const STEPS = [
  {
    n: "01",
    t: "Create your free account",
    d: "Sign up with your name and email. There's no payment step, no trial countdown and no card on file.",
    points: ["Takes under a minute", "Choose your interests to personalise the dashboard"],
  },
  {
    n: "02",
    t: "Discover tools and resources",
    d: "Use free tools like the AI Writing Workspace and Resume Builder, read free guides, and browse every product in the marketplace.",
    points: ["Tools run in your browser", "Free guides in the resource library"],
  },
  {
    n: "03",
    t: "Buy individually or upgrade",
    d: "Buy a single product and keep it, or choose Premium for the expanded library and premium tools. Or do neither — that's fine too.",
    points: ["One-time purchases are yours to keep", "Premium can be cancelled any time"],
  },
];

const FAQ = [
  {
    q: "Do I need to pay to use LifeOS?",
    a: <p>No. A free account includes selected tools, free resources, full marketplace browsing and the optional affiliate programme.</p>,
  },
  {
    q: "What's the difference between buying a product and Premium?",
    a: (
      <>
        <p>
          A one-time purchase adds a product to your library permanently. Premium is a subscription that unlocks premium tools,
          the expanded resource library and products marked &ldquo;Included with Premium&rdquo; for as long as it&apos;s active.
        </p>
        <p>Products you buy individually stay in your library even if you later cancel Premium.</p>
      </>
    ),
  },
  {
    q: "When do I get access after paying?",
    a: (
      <p>
        As soon as our server receives confirmation from the payment provider. We never unlock paid content based on a browser
        redirect alone, so if a payment is still processing you&apos;ll see that clearly rather than a premature success message.
      </p>
    ),
  },
  {
    q: "Can I get a refund?",
    a: (
      <p>
        Yes, within the windows described in our <Link href="/legal/refund-policy">Refund Policy</Link>. Refunded products are removed
        from your library.
      </p>
    ),
  },
  {
    q: "Do I have to join the affiliate programme?",
    a: (
      <p>
        No. It&apos;s optional, free, and has no effect on what you can use. See the <Link href="/affiliate-programme">Affiliate Programme</Link>{" "}
        page for how it works.
      </p>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="mx-auto max-w-[1240px] px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <PageIntro
          eyebrow="How it works"
          title={
            <>
              Start free. <span className="serif-accent text-accent-ink">Add only what you need.</span>
            </>
          }
          description="LifeOS is built so you can get real value before spending anything — and so you always know exactly what a purchase includes."
        />
        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s) => (
            <li key={s.n} className="border-t border-ink pt-6">
              <span className="font-mono text-[13px] text-ink-3">{s.n}</span>
              <h2 className="mt-6 text-[21px] font-semibold tracking-[-0.025em]">{s.t}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.d}</p>
              <ul className="mt-5 space-y-2">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[14px] text-ink-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-ink" /> {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* One-time vs subscription */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="eyebrow">Two ways to buy</p>
            <h2 className="text-headline mt-3">One-time purchase or subscription — never ambiguous.</h2>
          </div>
          <div className="mt-12 grid overflow-hidden rounded-[22px] border border-line md:grid-cols-2">
            <div className="bg-canvas p-8">
              <Receipt className="size-5" strokeWidth={1.75} />
              <h3 className="mt-5 text-[18px] font-semibold tracking-[-0.02em]">One-time purchase</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">Pay once for a single marketplace product.</p>
              <ul className="mt-6 space-y-3 text-[14.5px] text-ink-2">
                {[
                  "The product is added to your library permanently",
                  "Download the files whenever you need them",
                  "No renewal, no recurring charge",
                  "Licence terms shown on every product page",
                ].map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-ink" /> {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-line bg-surface p-8 md:border-l md:border-t-0">
              <Crown className="size-5 text-accent" strokeWidth={1.75} />
              <h3 className="mt-5 text-[18px] font-semibold tracking-[-0.02em]">Premium membership</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">A monthly or annual subscription.</p>
              <ul className="mt-6 space-y-3 text-[14.5px] text-ink-2">
                {[
                  "Premium tools and the expanded resource library",
                  "Products marked “Included with Premium” while active",
                  "Renews each period until you cancel",
                  "Cancel any time; access runs to the end of the paid period",
                ].map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-ink" /> {x}
                  </li>
                ))}
              </ul>
              <Link href="/membership" className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium">
                Compare plans <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust details */}
      <section className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Under the hood</p>
            <h2 className="text-headline mt-3">How payments, access and licences work.</h2>
          </div>
          <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, t: "Payments are verified on our server", d: "Access is granted only after the payment provider confirms the payment directly to us — never from a browser redirect." },
              { icon: RefreshCw, t: "Each payment is processed once", d: "If a confirmation arrives twice, the second is ignored, so you can't be charged or credited twice for one order." },
              { icon: Lock, t: "Paid files stay private", d: "Product files live in private storage. Downloads use short-lived links tied to your account." },
              { icon: FileCheck2, t: "Licences in plain language", d: "Every product states whether it's for personal or commercial use, and what you may not do." },
              { icon: Download, t: "Your library, any time", d: "Purchased products stay in My Library with download buttons for each file." },
              { icon: Receipt, t: "Clear totals", d: "Checkout shows the price, tax and total before you pay. Prices are in INR." },
            ].map((x) => (
              <div key={x.t}>
                <dt>
                  <x.icon className="size-5" strokeWidth={1.75} />
                  <span className="mt-4 block text-[15px] font-semibold">{x.t}</span>
                </dt>
                <dd className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{x.d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="text-headline mt-3">Common questions</h2>
            <p className="mt-4 text-[15px] text-ink-2">
              More answers in the <Link href="/help" className="text-ink underline underline-offset-[3px]">Help Centre</Link>.
            </p>
          </div>
          <FaqList items={FAQ} />
        </div>
        <div className="mt-20 flex flex-col items-start justify-between gap-6 rounded-[24px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.03em]">Ready when you are.</h2>
            <p className="mt-1.5 text-[15px] text-ink-2">Create a free account and open your first tool in a minute.</p>
          </div>
          <div className="flex gap-2.5">
            <ButtonLink href="/sign-up" size="lg">
              Create Free Account
            </ButtonLink>
            <ButtonLink href="/explore" size="lg" variant="secondary">
              Explore
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
