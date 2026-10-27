import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Cpu, Crown, HardDrive, Hourglass } from "lucide-react";
import { AccessBadge, ToolCard } from "@/components/catalog/tool-card";
import { ToolIcon } from "@/components/tool-icon";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/misc";
import { TOOLS, getTool, getToolCategory } from "@/lib/tools";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const tool = getTool((await params).slug);
  if (!tool) return { title: "Tool not found" };
  return { title: tool.name, description: tool.tagline };
}

export default async function ToolDetailPage({ params }: PageProps<"/tools/[slug]">) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  const category = getToolCategory(tool.category);
  const planned = tool.status === "planned";
  const openHref = tool.opens ?? `/app/tools/${tool.slug}`;
  const related = TOOLS.filter((t) => t.slug !== tool.slug && t.status === "available" && (t.category === tool.category || t.access === tool.access)).slice(0, 3);
  const isWriting = tool.slug === "ai-writing-workspace" || tool.opens?.includes("ai-writing-workspace");

  return (
    <>
      <section className="mx-auto max-w-[1240px] px-4 pb-16 pt-10 sm:px-6">
        <Link href="/tools" className="inline-flex items-center gap-1 text-[13px] text-ink-3 transition-colors hover:text-ink">
          <ArrowLeft className="size-3.5" /> All tools
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <ToolIcon icon={tool.icon} hue={tool.hue} size="lg" />
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-ink-3">{category?.name}</span>
              <AccessBadge access={tool.access} status={tool.status} />
            </div>
            <h1 className="text-headline mt-3">{tool.name}</h1>
            <p className="mt-3 text-[19px] leading-snug tracking-[-0.01em] text-ink">{tool.tagline}</p>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink-2">{tool.description}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {planned ? (
                <ButtonLink href="/tools" variant="secondary" size="lg">
                  Browse available tools <ArrowRight />
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href={openHref} size="lg">
                    Open tool <ArrowRight />
                  </ButtonLink>
                  {tool.access === "premium" && (
                    <ButtonLink href="/membership" variant="secondary" size="lg">
                      <Crown /> About Premium
                    </ButtonLink>
                  )}
                </>
              )}
            </div>
            {!planned && (
              <p className="mt-3 text-[13px] text-ink-3">
                {tool.access === "premium"
                  ? "Requires a free account and an active Premium membership."
                  : "Free with any LifeOS account. You'll be asked to sign in."}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <Panel className="p-6">
              <p className="text-[13px] font-medium">{planned ? "Status" : "What it does"}</p>
              {planned ? (
                <div className="mt-3 flex gap-3 text-[14.5px] text-ink-2">
                  <Hourglass className="mt-0.5 size-4 shrink-0 text-ink-3" />
                  <p>
                    Planned for a future release. It isn&apos;t available yet and no launch date is promised — we list it so you know
                    what&apos;s coming.
                  </p>
                </div>
              ) : (
                <ul className="mt-3 space-y-3">
                  {tool.highlights.map((h) => (
                    <li key={h} className="flex gap-2.5 text-[14.5px] text-ink-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {h}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            {!planned && (
              <Panel className="divide-y divide-line">
                <div className="flex gap-3 p-5">
                  <HardDrive className="mt-0.5 size-4 shrink-0 text-ink-3" />
                  <div>
                    <p className="text-[14px] font-medium">Saved in your browser</p>
                    <p className="mt-0.5 text-[13.5px] text-ink-2">Your work stays on this device. Clearing browser data removes it.</p>
                  </div>
                </div>
                {isWriting && (
                  <div className="flex gap-3 p-5">
                    <Cpu className="mt-0.5 size-4 shrink-0 text-ink-3" />
                    <div>
                      <p className="text-[14px] font-medium">Honest about AI</p>
                      <p className="mt-0.5 text-[13.5px] text-ink-2">
                        When an AI service is connected, drafts come from Claude. Otherwise a clearly labelled local formatter restructures
                        your notes.
                      </p>
                    </div>
                  </div>
                )}
              </Panel>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6">
            <h2 className="text-title">Related tools</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((t) => (
                <ToolCard key={t.slug} tool={t} href={`/tools/${t.slug}`} cta="Learn more" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
