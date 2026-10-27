import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Crown, Lock } from "lucide-react";
import { ResourceBody } from "@/components/resources/resource-body";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { getMembership } from "@/lib/core/membership";
import { recordView } from "@/lib/server/activity";
import { requireUser } from "@/lib/server/auth";
import { getResourceBySlug } from "@/lib/server/catalog";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/app/resources/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const item = await getResourceBySlug(slug);
  return { title: item?.title ?? "Resource not found" };
}

export default async function ResourcePage(props: PageProps<"/app/resources/[slug]">) {
  const { slug } = await props.params;
  const user = await requireUser(`/app/resources/${slug}`);
  const item = await getResourceBySlug(slug);
  if (!item) notFound();
  const membership = await getMembership(user.id);
  const locked = item.access === "PREMIUM" && !membership.isPremium;
  if (!locked) recordView(user.id, "RESOURCE", item.id);

  // Premium content is withheld on the server: locked readers only receive the first paragraph.
  const body = locked ? item.body.split(/\n\s*\n/)[0] : item.body;

  return (
    <article className="mx-auto max-w-[680px]">
      <Link href="/app/resources" className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
        <ChevronLeft className="size-4" /> Resources
      </Link>
      <div className="mt-8 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: `hsl(${item.collection.accentHue} 65% 62%)` }} />
          {item.collection.title}
        </span>
        <span>·</span>
        <span>{item.kind}</span>
        <span>·</span>
        <span>{item.readingMinutes} min read</span>
        {item.access === "PREMIUM" && (
          <Badge tone="accent" icon={Crown} className="ml-1">
            Premium
          </Badge>
        )}
      </div>
      <h1 className="mt-4 text-[38px] font-semibold leading-[1.08] tracking-[-0.04em]">{item.title}</h1>
      <p className="mt-3 text-[18px] leading-relaxed text-ink-2">{item.summary}</p>
      <p className="mt-4 text-[12.5px] text-ink-3">Published {formatDate(item.publishedAt)}</p>
      <div className="mt-10 border-t border-line pt-10">
        <ResourceBody body={body} />
        {locked && (
          <div className="relative mt-2">
            <div className="pointer-events-none absolute -top-24 inset-x-0 h-24 bg-gradient-to-t from-canvas to-transparent" />
            <div className="rounded-[18px] border border-line bg-surface p-6 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-xl bg-lavender text-accent-ink">
                <Lock className="size-5" />
              </span>
              <p className="mt-4 text-[17px] font-semibold tracking-[-0.02em]">Continue reading with Premium</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-ink-2">
                This {item.kind.toLowerCase()} is part of the Premium library, along with premium tools and monthly releases.
              </p>
              <ButtonLink href="/app/membership" className="mt-5">
                See Premium
              </ButtonLink>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
