import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Crown, Lock, Share2 } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { ToolCard } from "@/components/catalog/tool-card";
import { PageIntro } from "@/components/site/prose";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { getPublishedProducts, getResourceCollections } from "@/lib/server/catalog";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Explore the platform",
  description: "Digital tools, a marketplace of digital products, a resource library and an optional affiliate programme.",
};

const CHAPTERS = [
  { id: "tools", n: "01", label: "Digital Tools" },
  { id: "marketplace", n: "02", label: "Marketplace" },
  { id: "library", n: "03", label: "Resource Library" },
  { id: "affiliate", n: "04", label: "Affiliate Programme" },
];

function Chapter({ n, title, description, children, id, action }: { n: string; title: React.ReactNode; description: string; children: React.ReactNode; id: string; action?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 border-t border-line py-20">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="font-mono text-[13px] text-ink-3">{n}</span>
          <h2 id={`${id}-title`} className="mt-4 text-[30px] font-semibold leading-[1.05] tracking-[-0.035em]">
            {title}
          </h2>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-2">{description}</p>
          {action && <div className="mt-6">{action}</div>}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

export default async function ExplorePage() {
  const [products, collections] = await Promise.all([getPublishedProducts(), getResourceCollections()]);
  const tools = TOOLS.filter((t) => t.status === "available" && !t.opens).slice(0, 4);
  const showcase = products.filter((p) => p.priceInPaise > 0).slice(0, 3);
  const freeCount = TOOLS.filter((t) => t.status === "available" && t.access === "free").length;

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-16 sm:px-6 sm:pt-24">
      <PageIntro
        eyebrow="Explore"
        title={
          <>
            One platform, <span className="serif-accent text-accent-ink">four ways</span> to get more done.
          </>
        }
        description="Use the tools for free, learn from the library, buy only the products you need — and, if you like, share LifeOS with others."
      />
      <nav aria-label="Sections" className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-4">
        {CHAPTERS.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="group flex items-center justify-between bg-surface px-4 py-4 text-[14px] transition-colors hover:bg-[#fcfbf9]">
            <span>
              <span className="mr-2 font-mono text-[12px] text-ink-3">{c.n}</span>
              {c.label}
            </span>
            <ArrowRight className="size-3.5 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
          </a>
        ))}
      </nav>

      <div className="mt-20">
        <Chapter
          id="tools"
          n="01"
          title="Digital Tools"
          description={`Interactive tools that run in your browser. ${freeCount} are free on every account; a few more come with Premium.`}
          action={
            <ButtonLink href="/tools" variant="secondary">
              All tools <ArrowRight />
            </ButtonLink>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {tools.map((t) => (
              <ToolCard key={t.slug} tool={t} href={`/tools/${t.slug}`} cta="Learn more" />
            ))}
          </div>
        </Chapter>

        <Chapter
          id="marketplace"
          n="02"
          title="Marketplace"
          description="Templates, toolkits and guides you buy once and keep. Every listing states what's inside, the file formats and the licence."
          action={
            <ButtonLink href="/marketplace" variant="secondary">
              Browse products <ArrowRight />
            </ButtonLink>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {showcase.map((p) => (
              <ProductCard key={p.slug} product={p} href={`/marketplace/${p.slug}`} />
            ))}
          </div>
          <p className="mt-5 text-[13.5px] text-ink-3">
            {products.length} products across {new Set(products.map((p) => p.category.slug)).size} categories. Sample catalogue for this demo.
          </p>
        </Chapter>

        <Chapter
          id="library"
          n="03"
          title="Resource Library"
          description="Short, practical guides, checklists and playbooks. Free guides are open to every account; premium items are part of Premium."
          action={
            <ButtonLink href="/sign-up" variant="secondary">
              Read free guides <ArrowRight />
            </ButtonLink>
          }
        >
          <div className="divide-y divide-line rounded-[var(--radius-panel)] border border-line bg-surface">
            {collections.map((c) => (
              <div key={c.id} className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="mt-1 h-10 w-1 shrink-0 rounded-full" style={{ background: `hsl(${c.accentHue} 65% 68%)` }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] font-semibold tracking-[-0.015em]">{c.title}</h3>
                    <p className="mt-0.5 text-[14px] text-ink-2">{c.description}</p>
                    <ul className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {c.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={`/app/resources/${item.slug}`}
                            className="group flex items-center gap-2 rounded-lg py-1.5 text-[14px] text-ink-2 transition-colors hover:text-ink"
                          >
                            {item.access === "PREMIUM" ? (
                              <Crown className="size-3.5 shrink-0 text-accent" aria-label="Premium" />
                            ) : (
                              <BookOpen className="size-3.5 shrink-0 text-ink-3" aria-hidden />
                            )}
                            <span className="truncate">{item.title}</span>
                            <span className="shrink-0 text-[12px] text-ink-3">
                              {item.kind} · {item.readingMinutes} min
                            </span>
                            <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-transparent transition-colors group-hover:text-ink-3" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[13px] text-ink-3">
            <Lock className="size-3.5" /> Reading requires a free account.
          </p>
        </Chapter>

        <Chapter
          id="affiliate"
          n="04"
          title="Affiliate Programme"
          description="An optional Referral Centre for members who want to recommend LifeOS. Free to join, and never required."
          action={
            <ButtonLink href="/affiliate-programme" variant="secondary">
              How it works <ArrowRight />
            </ButtonLink>
          }
        >
          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
            <div className="grid sm:grid-cols-3">
              {[
                { t: "Free and optional", d: "No purchase or membership needed to take part." },
                { t: "Product sales only", d: "Commission applies only to verified, eligible product sales — never to sign-ups or memberships." },
                { t: "Currently in test mode", d: "Commission records are calculated for testing. Payouts are disabled pending legal approval." },
              ].map((x, i) => (
                <div key={x.t} className={i ? "border-t border-line p-6 sm:border-l sm:border-t-0" : "p-6"}>
                  <h3 className="text-[15px] font-semibold">{x.t}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{x.d}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-line bg-canvas px-6 py-4 text-[13.5px] text-ink-2">
              <Share2 className="size-4" strokeWidth={1.75} />
              Earnings are not guaranteed.
              <Badge tone="warning" className="ml-auto">
                Test mode
              </Badge>
            </div>
          </div>
        </Chapter>
      </div>

      <section className="border-t border-line py-20 text-center">
        <h2 className="text-headline mx-auto max-w-xl">Start with a free account.</h2>
        <p className="mx-auto mt-3 max-w-md text-[16px] text-ink-2">Everything above is open to explore. Sign up in under a minute.</p>
        <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
          <ButtonLink href="/sign-up" size="lg">
            Create Free Account
          </ButtonLink>
          <ButtonLink href="/how-it-works" size="lg" variant="secondary">
            How it works
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
