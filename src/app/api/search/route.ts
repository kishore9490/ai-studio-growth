import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/core/db";
import { getCurrentUser } from "@/lib/server/auth";
import { getPublishedProducts, getResourceCollections } from "@/lib/server/catalog";
import { TOOLS, getToolCategory } from "@/lib/tools";
import { ADMIN_NAV, APP_NAV } from "@/components/app/nav-config";
import type { SearchResult } from "@/components/app/command-palette";

const norm = (s: string) => s.toLowerCase();

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ results: [] }, { status: 401 });

  const q = norm(request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "");
  const scope = request.nextUrl.searchParams.get("scope") === "admin" && user.role === "ADMIN" ? "admin" : "app";
  const matches = (...fields: (string | undefined)[]) => !q || fields.some((f) => f && norm(f).includes(q));

  const nav = (scope === "admin" ? ADMIN_NAV : APP_NAV).flatMap((g) => g.items);
  const pages: SearchResult[] = nav
    .filter((n) => matches(n.label))
    .map((n) => ({ id: `page-${n.href}`, type: "page", title: n.label, subtitle: n.href, href: n.href }));

  if (scope === "admin") {
    const [users, orders] = q
      ? await Promise.all([
          db.user.findMany({ where: { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] }, take: 5 }),
          db.order.findMany({ where: { number: { contains: q, mode: "insensitive" } }, take: 5 }),
        ])
      : [[], []];
    return NextResponse.json({
      results: [
        ...pages,
        ...users.map((u) => ({ id: `u-${u.id}`, type: "page", title: u.name, subtitle: `Member · ${u.email}`, href: `/admin/members/${u.id}` })),
        ...orders.map((o) => ({ id: `o-${o.id}`, type: "page", title: o.number, subtitle: `Order · ${o.status}`, href: `/admin/orders/${o.id}` })),
      ],
    });
  }

  const [products, collections] = await Promise.all([getPublishedProducts(), getResourceCollections()]);
  const tools: SearchResult[] = TOOLS.filter((t) => matches(t.name, t.tagline, getToolCategory(t.category)?.name)).map((t) => ({
    id: `tool-${t.slug}`,
    type: "tool",
    title: t.name,
    subtitle: `${getToolCategory(t.category)?.name} · ${t.status === "planned" ? "Planned" : t.access === "premium" ? "Premium" : "Free"}`,
    href: `/app/tools/${t.slug}`,
  }));
  const prods: SearchResult[] = products
    .filter((p) => matches(p.name, p.tagline, p.category.name, p.format))
    .map((p) => ({ id: `p-${p.id}`, type: "product", title: p.name, subtitle: `${p.category.name} · ${p.format}`, href: `/app/marketplace/${p.slug}` }));
  const resources: SearchResult[] = collections.flatMap((c) =>
    c.items
      .filter((i) => matches(i.title, i.summary, c.title, i.kind))
      .map((i) => ({ id: `r-${i.id}`, type: "resource" as const, title: i.title, subtitle: `${c.title} · ${i.kind}`, href: `/app/resources/${i.slug}` })),
  );

  const limit = q ? 6 : 4;
  return NextResponse.json({
    results: [...pages.slice(0, q ? 6 : 3), ...tools.slice(0, limit), ...prods.slice(0, limit), ...resources.slice(0, limit)],
  });
}
