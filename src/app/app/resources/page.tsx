import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Crown, Lock } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui/misc";
import { getMembership } from "@/lib/core/membership";
import { requireUser } from "@/lib/server/auth";
import { getResourceCollections } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const user = await requireUser("/app/resources");
  const [collections, membership] = await Promise.all([getResourceCollections(), getMembership(user.id)]);
  const total = collections.reduce((n, c) => n + c.items.length, 0);
  const premium = collections.reduce((n, c) => n + c.items.filter((i) => i.access === "PREMIUM").length, 0);

  return (
    <div>
      <PageHeader
        title="Resources"
        description={`${total} guides, checklists and playbooks. ${premium} are part of the Premium library.`}
        actions={!membership.isPremium ? <Badge tone="neutral">Free plan</Badge> : <Badge tone="accent" icon={Crown}>Full library unlocked</Badge>}
      />
      <div className="space-y-12">
        {collections.map((c) => (
          <section key={c.id} aria-labelledby={`col-${c.slug}`}>
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-3">
              <div>
                <h2 id={`col-${c.slug}`} className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.025em]">
                  <span className="size-2.5 rounded-full" style={{ background: `hsl(${c.accentHue} 65% 62%)` }} />
                  {c.title}
                </h2>
                <p className="mt-1 text-[14px] text-ink-2">{c.description}</p>
              </div>
              <span className="shrink-0 text-[12.5px] text-ink-3">{c.items.length} items</span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {c.items.map((item) => {
                const locked = item.access === "PREMIUM" && !membership.isPremium;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/app/resources/${item.slug}`}
                      className="group flex h-full flex-col rounded-[16px] border border-line bg-surface p-4 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-lift"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] text-ink-3">
                          {item.kind} · {item.readingMinutes} min
                        </span>
                        {item.access === "PREMIUM" ? (
                          <Badge tone="accent" icon={locked ? Lock : Crown}>
                            Premium
                          </Badge>
                        ) : (
                          <Badge tone="success">Free</Badge>
                        )}
                      </div>
                      <p className="mt-3 font-medium tracking-[-0.01em]">{item.title}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{item.summary}</p>
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] text-ink-3 group-hover:text-ink">
                        {locked ? "Preview" : "Read"} <ArrowUpRight className="size-3.5" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
