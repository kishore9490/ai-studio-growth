import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRight, Cpu, HardDrive, ShieldCheck } from "lucide-react";
import { ToolDirectory, ToolDirectorySkeleton } from "@/components/tools/tool-directory";
import { ButtonLink } from "@/components/ui/button";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Digital Tools",
  description: "Interactive tools for writing, careers, business and personal organisation — free and Premium.",
};

export default function ToolsPage() {
  const available = TOOLS.filter((t) => t.status === "available");
  const free = available.filter((t) => t.access === "free").length;
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-[1240px] px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
          <p className="eyebrow">Digital tools</p>
          <h1 className="text-headline mt-3 max-w-2xl">
            Tools that do <span className="serif-accent text-accent-ink">real</span> work.
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-2">
            {available.length} interactive tools that run in your browser. {free} are free with any account; the rest come with
            Premium.
          </p>
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[13.5px] text-ink-2">
            <li className="flex items-center gap-2">
              <HardDrive className="size-4 text-ink-3" /> Your work is saved in your browser
            </li>
            <li className="flex items-center gap-2">
              <Cpu className="size-4 text-ink-3" /> AI features are clearly labelled
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-ink-3" /> No payment details to start
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6">
        <Suspense fallback={<ToolDirectorySkeleton />}>
          <ToolDirectory hrefBase="/tools" cta="Learn more" />
        </Suspense>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[24px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.03em]">Try the free tools today</h2>
            <p className="mt-1.5 text-[15px] text-ink-2">Create a free account — no card, no trial countdown.</p>
          </div>
          <ButtonLink href="/sign-up" size="lg">
            Create Free Account <ArrowRight />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
