import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Crown, Download, Library, Share2, ShoppingBag, Sparkles, Wrench } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductArt } from "@/components/product-art";
import { ToolIcon } from "@/components/tool-icon";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Callout, DemoLabel, EmptyState, Panel } from "@/components/ui/misc";
import { commissionSummary } from "@/lib/core/affiliate";
import { db } from "@/lib/core/db";
import { getMembership } from "@/lib/core/membership";
import { formatINR } from "@/lib/domain/money";
import { DEFAULT_WIDGETS, INTEREST_TO_CATEGORIES } from "@/lib/preferences";
import { requireUser } from "@/lib/server/auth";
import { getPublishedProducts } from "@/lib/server/catalog";
import { TOOLS, getTool } from "@/lib/tools";
import { formatDate, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function SectionTitle({ title, href, cta }: { title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-semibold tracking-[-0.015em]">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
          {cta ?? "View all"} <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

export default async function DashboardPage(props: PageProps<"/app">) {
  const user = await requireUser("/app");
  if (!user.onboardedAt) redirect("/onboarding");
  const sp = await props.searchParams;

  const [prefs, membership, entitlements, views, products] = await Promise.all([
    db.userPreference.findUnique({ where: { userId: user.id } }),
    getMembership(user.id),
    db.digitalEntitlement.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: { grantedAt: "desc" },
      include: { product: { select: { slug: true, name: true, artwork: true, accentHue: true, format: true, _count: { select: { assets: true } } } } },
    }),
    db.recentView.findMany({ where: { userId: user.id }, orderBy: { viewedAt: "desc" }, take: 6 }),
    getPublishedProducts(),
  ]);

  const widgets = new Set(prefs?.dashboardWidgets.length ? prefs.dashboardWidgets : DEFAULT_WIDGETS);
  const interests = prefs?.interests ?? [];
  const ownedIds = new Set(entitlements.map((e) => e.productId));

  // Quick tools: recently used first, then ones matching interests, then defaults.
  const toolCats = new Set(interests.flatMap((i) => INTEREST_TO_CATEGORIES[i]?.tools ?? []));
  const recentTools = views.filter((v) => v.kind === "TOOL").map((v) => v.refId);
  const quickTools = [
    ...recentTools.map(getTool).filter((t) => t !== null),
    ...TOOLS.filter((t) => toolCats.has(t.category)),
    ...TOOLS,
  ]
    .filter((t, i, arr) => t.status === "available" && !t.opens && arr.findIndex((x) => x.slug === t.slug) === i)
    .slice(0, 4);

  // Recommendations: matching interests, not owned, paid products first.
  const productCats = new Set(interests.flatMap((i) => INTEREST_TO_CATEGORIES[i]?.products ?? []));
  const recommended = products
    .filter((p) => !ownedIds.has(p.id))
    .sort((a, b) => Number(productCats.has(b.category.slug)) - Number(productCats.has(a.category.slug)))
    .slice(0, 3);

  // Resolve recently viewed items.
  const resourceViews = views.filter((v) => v.kind === "RESOURCE").map((v) => v.refId);
  const viewedResources = await db.resourceItem.findMany({ where: { id: { in: resourceViews } }, select: { id: true, slug: true, title: true, kind: true, readingMinutes: true, collection: { select: { accentHue: true, title: true } } } });
  const recent = views
    .map((v) => {
      if (v.kind === "PRODUCT") {
        const p = products.find((x) => x.id === v.refId);
        return p && { key: v.id, title: p.name, meta: `Product · ${p.category.name}`, href: `/app/marketplace/${p.slug}`, hue: p.accentHue, icon: ShoppingBag, at: v.viewedAt };
      }
      if (v.kind === "RESOURCE") {
        const r = viewedResources.find((x) => x.id === v.refId);
        return r && { key: v.id, title: r.title, meta: `${r.kind} · ${r.readingMinutes} min read`, href: `/app/resources/${r.slug}`, hue: r.collection.accentHue, icon: BookOpen, at: v.viewedAt };
      }
      const t = getTool(v.refId);
      return t && { key: v.id, title: t.name, meta: "Tool", href: `/app/tools/${t.slug}`, hue: t.hue, icon: Wrench, at: v.viewedAt };
    })
    .filter((x) => !!x);

  const referral = widgets.has("referrals") && user.affiliateOptIn
    ? await Promise.all([db.referralRelationship.count({ where: { referrerId: user.id } }), commissionSummary(user.id)])
    : null;

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] text-ink-3">{sp.welcome ? "Your dashboard is ready" : "Dashboard"}</p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-[-0.035em]">
            {sp.welcome ? "Welcome" : "Welcome back"}, <span className="serif-accent text-[1.08em] text-accent-ink">{firstName}.</span>
          </h1>
          <p className="mt-1.5 text-[15px] text-ink-2">
            {entitlements.length
              ? `You have ${entitlements.length} product${entitlements.length === 1 ? "" : "s"} in your library${membership.isPremium ? " and full Premium access" : ""}.`
              : "Start with a free tool or browse the marketplace."}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/app/tools" variant="secondary">
            <Wrench /> Open a tool
          </ButtonLink>
          <ButtonLink href="/app/marketplace">
            <ShoppingBag /> Marketplace
          </ButtonLink>
        </div>
      </div>

      {user.isSampleData && (
        <Callout tone="warning" icon={Sparkles} title="You're exploring a sample account">
          Orders, referrals and commissions on this account are demo data created by the seed script.
        </Callout>
      )}

      {widgets.has("quick-tools") && (
        <section>
          <SectionTitle title="Quick access" href="/app/tools" cta="All tools" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickTools.map((t) => (
              <Link
                key={t.slug}
                href={`/app/tools/${t.slug}`}
                className="group flex items-center gap-3 rounded-[14px] border border-line bg-surface p-3.5 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-lift"
              >
                <ToolIcon icon={t.icon} hue={t.hue} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 truncate text-[14px] font-medium">
                    {t.name}
                    {t.access === "premium" && <Crown className="size-3 shrink-0 text-accent" aria-label="Premium" />}
                  </span>
                  <span className="block truncate text-[12.5px] text-ink-3">{t.tagline}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-10">
          {widgets.has("recent") && (
            <section>
              <SectionTitle title="Recently viewed" />
              {recent.length === 0 ? (
                <EmptyState icon={BookOpen} title="Nothing here yet" description="Tools, products and resources you open will appear here so you can pick up where you left off." />
              ) : (
                <Panel className="divide-y divide-line">
                  {recent.map((r) => (
                    <Link key={r.key} href={r.href} className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-[var(--radius-panel)] last:rounded-b-[var(--radius-panel)] hover:bg-[#fcfbf9]">
                      <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={{ background: `hsl(${r.hue} 70% 95%)`, color: `hsl(${r.hue} 45% 35%)` }}>
                        <r.icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{r.title}</span>
                        <span className="block truncate text-[12.5px] text-ink-3">{r.meta}</span>
                      </span>
                      <span className="shrink-0 text-[12px] text-ink-3">{relativeTime(r.at)}</span>
                    </Link>
                  ))}
                </Panel>
              )}
            </section>
          )}

          {widgets.has("recommended") && recommended.length > 0 && (
            <section>
              <SectionTitle title={interests.length ? "Recommended for you" : "Popular in the marketplace"} href="/app/marketplace" cta="Browse" />
              <div className="grid gap-4 sm:grid-cols-3">
                {recommended.map((p) => (
                  <ProductCard key={p.slug} product={p} href={`/app/marketplace/${p.slug}`} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-10">
          {widgets.has("membership") && (
            <section>
              <SectionTitle title="Membership" href="/app/membership" cta="Manage" />
              {membership.isPremium && membership.subscription ? (
                <Panel className="relative overflow-hidden p-5">
                  <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[radial-gradient(circle,rgb(117_87_246/0.18),transparent_70%)]" />
                  <div className="flex items-center gap-2">
                    <Badge tone="accent" icon={Crown}>{membership.subscription.planName}</Badge>
                    {membership.subscription.isTest && <DemoLabel>Test billing</DemoLabel>}
                  </div>
                  <p className="mt-4 text-[22px] font-semibold tracking-[-0.03em]">Premium is active</p>
                  <p className="mt-1 text-[13.5px] text-ink-2">
                    {membership.subscription.cancelAtPeriodEnd ? "Access ends" : "Renews"} on {formatDate(membership.subscription.currentPeriodEnd)}
                  </p>
                </Panel>
              ) : (
                <Panel className="p-5">
                  <Badge tone="neutral">Free plan</Badge>
                  <p className="mt-4 text-[17px] font-semibold tracking-[-0.02em]">Unlock the full library</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">Premium adds premium tools, the expanded resource library and monthly releases.</p>
                  <ButtonLink href="/app/membership" size="sm" className="mt-4">
                    See Premium
                  </ButtonLink>
                </Panel>
              )}
            </section>
          )}

          {widgets.has("purchases") && (
            <section>
              <SectionTitle title="Recently added to your library" href="/app/library" cta="Library" />
              {entitlements.length === 0 ? (
                <EmptyState icon={Library} title="Your library is empty" description="Products you buy or claim for free appear here, ready to download." action={<ButtonLink href="/app/marketplace" size="sm" variant="secondary">Browse products</ButtonLink>} />
              ) : (
                <Panel className="divide-y divide-line">
                  {entitlements.slice(0, 4).map((e) => (
                    <Link key={e.id} href={`/app/library#${e.product.slug}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-[#fcfbf9]">
                      <ProductArt artwork={e.product.artwork} hue={e.product.accentHue} className="aspect-[4/3] w-14 shrink-0 rounded-[8px] border border-line" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium">{e.product.name}</span>
                        <span className="block text-[12px] text-ink-3">
                          {e.product._count.assets} file{e.product._count.assets === 1 ? "" : "s"} · added {formatDate(e.grantedAt)}
                        </span>
                      </span>
                      <Download className="size-4 shrink-0 text-ink-3" />
                    </Link>
                  ))}
                </Panel>
              )}
            </section>
          )}

          {widgets.has("referrals") && (
            <section>
              <SectionTitle title="Referral Centre" href="/app/referrals" cta="Open" />
              {referral ? (
                <Panel className="p-5">
                  <div className="flex items-center justify-between">
                    <DemoLabel>Test mode</DemoLabel>
                    <span className="text-[12px] text-ink-3">No real payouts</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <dt className="text-[12px] text-ink-3">Referrals</dt>
                      <dd className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-[-0.03em]">{referral[0]}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-ink-3">Pending</dt>
                      <dd className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-[-0.03em]">{formatINR(referral[1].pending, { exact: true })}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-ink-3">Approved</dt>
                      <dd className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-[-0.03em]">{formatINR(referral[1].approved, { exact: true })}</dd>
                    </div>
                  </dl>
                </Panel>
              ) : (
                <Panel className="p-5">
                  <Share2 className="size-[18px] text-ink-2" strokeWidth={1.75} />
                  <p className="mt-3 text-[14.5px] font-medium">Share LifeOS with others</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
                    The affiliate programme is optional and free to join. It is currently in test mode.
                  </p>
                  <ButtonLink href="/app/referrals" size="sm" variant="secondary" className="mt-4">
                    Learn more
                  </ButtonLink>
                </Panel>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
