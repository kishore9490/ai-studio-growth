import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { PageIntro, Prose } from "@/components/site/prose";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description: "LifeOS Digital builds practical tools and resources for everyday work and life.",
};

const PRINCIPLES = [
  { t: "Useful on its own", d: "Every tool and resource should solve a real problem for someone who never pays us anything." },
  { t: "Say exactly what's included", d: "Each product lists its contents, file formats and licence before you buy. No surprises after checkout." },
  { t: "Optional, always", d: "Membership and the affiliate programme are choices. Nothing on the platform depends on either." },
  { t: "No hype", d: "We don't publish income claims, invented reviews or countdown timers. If something isn't ready, we label it." },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-[1240px] px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <PageIntro
          eyebrow="About LifeOS"
          title={
            <>
              Practical tools for <span className="serif-accent text-accent-ink">everyday</span> work and life.
            </>
          }
          description="LifeOS Digital brings together interactive tools, a resource library and well-made digital products for students, professionals, freelancers, creators and small business owners."
        />
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-12 border-t border-line pt-12 lg:grid-cols-[1fr_1.4fr]">
          <h2 className="text-[22px] font-semibold tracking-[-0.025em]">Why we&apos;re building this</h2>
          <Prose className="[&>p:first-child]:mt-0">
            <p>
              Most people juggle a dozen apps, half-finished templates and browser bookmarks just to write a resume, plan a week or
              send a proposal. The tools are scattered, and the good resources are often buried behind sales funnels.
            </p>
            <p>
              LifeOS is an attempt to put the essentials in one calm place: tools that run in your browser, guides written to be
              used rather than skimmed, and digital products that are honest about what they contain.
            </p>
            <p>
              We&apos;re early. This is the first version of the platform, and parts of it — like the affiliate programme — are
              deliberately running in test mode until they&apos;ve been reviewed properly.
            </p>
          </Prose>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
          <p className="eyebrow">Principles</p>
          <h2 className="text-headline mt-3 max-w-xl">What you can expect from us.</h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p, i) => (
              <li key={p.t} className="border-t border-ink pt-5">
                <span className="font-mono text-[13px] text-ink-3">0{i + 1}</span>
                <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em]">{p.t}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.03em]">Have feedback or an idea for a tool?</h2>
            <p className="mt-1.5 text-[15px] text-ink-2">We read every message.</p>
          </div>
          <div className="flex gap-2.5">
            <ButtonLink href="/contact" size="lg">
              Contact us
            </ButtonLink>
            <ButtonLink href="/explore" size="lg" variant="secondary">
              Explore the platform <ArrowRight />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
