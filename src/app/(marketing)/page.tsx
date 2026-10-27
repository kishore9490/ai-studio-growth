import Link from "next/link";
import { ArrowRight, Check, Crown, FileCheck2, Receipt, ShieldCheck, Users } from "lucide-react";
import { ProductCard, ProductRow, PriceTag } from "@/components/catalog/product-card";
import { ToolCard } from "@/components/catalog/tool-card";
import { ProductArt } from "@/components/product-art";
import { HeroPreview } from "@/components/site/hero-preview";
import { ButtonLink } from "@/components/ui/button";
import { Badge, SectionHeading } from "@/components/ui/misc";
import { formatINR } from "@/lib/domain/money";
import { getPlans, getPublishedProducts } from "@/lib/server/catalog";
import { FEATURED_TOOL_SLUGS, TOOLS } from "@/lib/tools";

export default async function HomePage() {
  const [products, plans] = await Promise.all([getPublishedProducts(), getPlans()]);
  const featured = products.filter((p) => p.featured && p.priceInPaise > 0);
  const lead = featured[0] ?? products[0];
  const rest = products.filter((p) => p.slug !== lead?.slug && p.priceInPaise > 0).slice(0, 4);
  const more = products.filter((p) => p.slug !== lead?.slug && !rest.includes(p)).slice(0, 4);
  const monthly = plans.find((p) => p.code === "PREMIUM_MONTHLY");
  const tools = FEATURED_TOOL_SLUGS.map((s) => TOOLS.find((t) => t.slug === s)!).filter(Boolean);

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="hairline-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-[1240px] px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href="/tools/ai-writing-workspace"
              className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-line bg-surface/80 py-1 pl-1 pr-3 text-[13px] text-ink-2 shadow-soft backdrop-blur transition-colors hover:text-ink"
            >
              <span className="rounded-full bg-lavender px-2 py-0.5 text-[11.5px] font-medium text-accent-ink">New</span>
              The AI Writing Workspace is live
              <ArrowRight className="size-3.5" />
            </Link>
            <h1 className="text-display mt-7 animate-fade-up [animation-delay:60ms]">
              Your Digital World.
              <br />
              <span className="serif-accent text-[1.08em] text-accent-ink">Simplified.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl animate-fade-up text-[18px] leading-relaxed text-ink-2 [animation-delay:120ms]">
              Discover powerful tools, practical resources, and intelligent workflows designed to help you create, learn, and get
              more done.
            </p>
            <div className="mt-9 flex animate-fade-up flex-col items-center justify-center gap-2.5 [animation-delay:180ms] sm:flex-row">
              <ButtonLink href="/explore" size="lg" className="w-full sm:w-auto">
                Explore the Platform <ArrowRight />
              </ButtonLink>
              <ButtonLink href="/sign-up" variant="secondary" size="lg" className="w-full sm:w-auto">
                Create Free Account
              </ButtonLink>
            </div>
            <p className="mt-4 animate-fade-up text-[13px] text-ink-3 [animation-delay:220ms]">Free to join. No card required.</p>
          </div>
          <div className="mt-16 animate-fade-up [animation-delay:260ms]">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ─── Featured tools ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="Digital tools"
          title={
            <>
              Tools that do <span className="serif-accent">real</span> work.
            </>
          }
          description="Interactive tools that run in your browser — write, plan, budget and pitch without juggling five apps."
          action={
            <ButtonLink href="/tools" variant="secondary">
              All tools <ArrowRight />
            </ButtonLink>
          }
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <ToolCard key={t.slug} tool={t} href={`/tools/${t.slug}`} cta="Learn more" />
          ))}
        </div>
      </section>

      {/* ─── Marketplace ──────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
          <SectionHeading
            eyebrow="Marketplace"
            title="Digital products, explained plainly."
            description="Templates, toolkits and guides you buy once and keep. Every listing says exactly what's inside and how you may use it."
            action={
              <ButtonLink href="/marketplace" variant="secondary">
                Browse the marketplace <ArrowRight />
              </ButtonLink>
            }
          />
          {lead && (
            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
              <Link
                href={`/marketplace/${lead.slug}`}
                className="group overflow-hidden rounded-[22px] border border-line bg-canvas transition-shadow hover:shadow-lift"
              >
                <ProductArt artwork={lead.artwork} hue={lead.accentHue} className="aspect-[16/10] w-full" />
                <div className="flex flex-col gap-4 border-t border-line p-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-md">
                    <Badge tone="outline">Featured · {lead.category.name}</Badge>
                    <h3 className="mt-3 text-[22px] font-semibold tracking-[-0.025em]">{lead.name}</h3>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{lead.tagline}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <PriceTag priceInPaise={lead.priceInPaise} className="text-[20px]" />
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium">
                      View product <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
              <div className="flex flex-col">
                <p className="eyebrow mb-2 px-2.5">More in the marketplace</p>
                <div className="flex flex-col gap-1">
                  {rest.map((p) => (
                    <ProductRow key={p.slug} product={p} href={`/marketplace/${p.slug}`} />
                  ))}
                </div>
              </div>
            </div>
          )}
          {more.length > 0 && (
            <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2 no-scrollbar lg:grid lg:grid-cols-4 lg:overflow-visible">
              {more.map((p) => (
                <ProductCard key={p.slug} product={p} href={`/marketplace/${p.slug}`} className="w-[260px] shrink-0 snap-start lg:w-auto" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="How it works" title="Start free. Add only what you need." />
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {[
            { n: "01", t: "Create your free account", d: "Sign up in under a minute. No payment details, no trial countdown." },
            { n: "02", t: "Discover tools and resources", d: "Use the free tools, read the guides, and browse the marketplace at your own pace." },
            { n: "03", t: "Buy individually or go Premium", d: "Purchase single products you keep forever, or upgrade to Premium for the full library." },
          ].map((s) => (
            <li key={s.n} className="border-t border-ink pt-6">
              <span className="font-mono text-[13px] text-ink-3">{s.n}</span>
              <h3 className="mt-6 text-[20px] font-semibold tracking-[-0.025em]">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── Membership preview ──────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
        <div className="grid grid-cols-1 overflow-hidden rounded-[24px] border border-line bg-surface lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-between gap-8 p-8 sm:p-10">
            <div>
              <p className="eyebrow">Membership</p>
              <h2 className="text-headline mt-3">
                Premium, <span className="serif-accent">if and when</span> it helps.
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-2">
                Everything on LifeOS works on a free account. Premium adds the expanded library, premium tools and monthly
                releases. Cancel any time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/membership">Compare plans</ButtonLink>
              {monthly && (
                <p className="text-sm text-ink-2">
                  Premium from <span className="font-medium text-ink">{formatINR(monthly.priceInPaise)}/month</span>{" "}
                  <span className="text-ink-3">(illustrative price)</span>
                </p>
              )}
            </div>
          </div>
          <div className="grid border-t border-line bg-canvas sm:grid-cols-2 lg:border-l lg:border-t-0">
            {[
              { name: "Free", icon: null, items: ["Selected digital tools", "Free resources and guides", "Marketplace browsing", "Optional affiliate programme"] },
              { name: "Premium", icon: Crown, items: ["Everything in Free", "Expanded resource library", "Premium productivity tools", "Monthly resource releases", "Premium-included products"] },
            ].map((tier, i) => (
              <div key={tier.name} className={i === 1 ? "border-t border-line bg-surface p-8 sm:border-l sm:border-t-0" : "p-8"}>
                <p className="flex items-center gap-1.5 text-[15px] font-semibold">
                  {tier.icon && <tier.icon className="size-4 text-accent" />}
                  {tier.name}
                </p>
                <ul className="mt-5 space-y-3">
                  {tier.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-[14px] text-ink-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-ink" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Principles ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
        <div className="grid gap-8 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileCheck2, t: "Clear licences", d: "Each product states what's included and how you may use it." },
            { icon: Receipt, t: "Pay once or subscribe", d: "One-time purchases are yours to keep. Membership is optional." },
            { icon: ShieldCheck, t: "Verified payments", d: "Access is granted only after payment is confirmed on our servers." },
            { icon: Users, t: "Honest referrals", d: "Our affiliate programme rewards product sales, never sign-ups. No income promises." },
          ].map((p) => (
            <div key={p.t}>
              <p.icon className="size-5 text-ink" strokeWidth={1.75} />
              <h3 className="mt-4 text-[15px] font-semibold">{p.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────── */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[28px] bg-ink px-6 py-20 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgb(117_87_246/0.45),transparent_70%)]" />
          <div className="relative">
            <h2 className="text-headline mx-auto max-w-2xl">
              Start with what you need <span className="serif-accent text-[#c9bcff]">today.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[16px] text-white/70">
              Open a free tool, read a guide, or pick a single template. Everything else can wait.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-2.5 sm:flex-row">
              <ButtonLink href="/sign-up" size="lg" className="bg-white text-ink hover:bg-white/90">
                Create Free Account
              </ButtonLink>
              <ButtonLink href="/explore" size="lg" variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white">
                Explore the Platform <ArrowRight />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
