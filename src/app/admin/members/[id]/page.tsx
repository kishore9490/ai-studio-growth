import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUp, Crown } from "lucide-react";
import { JsonDetails, KeyValue, SampleBadge, StatTile } from "@/components/admin/bits";
import { MemberActions } from "@/components/admin/member-actions";
import { CommissionStatusBadge, OrderStatusBadge } from "@/components/status-badges";
import { Avatar, Badge, Callout, PageHeader, Panel } from "@/components/ui/misc";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/ui/table";
import { commissionSummary } from "@/lib/core/affiliate";
import { db } from "@/lib/core/db";
import { getMembership } from "@/lib/core/membership";
import { formatINR } from "@/lib/domain/money";
import { requireAdmin } from "@/lib/server/auth";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Member · Admin" };

async function upline(userId: string) {
  const chain: { id: string; name: string; email: string; level: number }[] = [];
  const seen = new Set([userId]);
  let current = userId;
  for (let level = 1; level <= 3; level++) {
    const rel = await db.referralRelationship.findUnique({ where: { referredUserId: current }, include: { referrer: { select: { id: true, name: true, email: true } } } });
    if (!rel || seen.has(rel.referrer.id)) break;
    seen.add(rel.referrer.id);
    chain.push({ ...rel.referrer, level });
    current = rel.referrer.id;
  }
  return chain;
}

export default async function AdminMemberPage(props: PageProps<"/admin/members/[id]">) {
  const admin = await requireAdmin();
  const { id } = await props.params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      profile: true,
      preferences: true,
      referredBy: true,
      orders: { orderBy: { createdAt: "desc" }, take: 20, include: { _count: { select: { items: true } } } },
      entitlements: { orderBy: { grantedAt: "desc" }, include: { product: { select: { id: true, name: true } } } },
      referrals: { orderBy: { attributedAt: "desc" }, include: { referredUser: { select: { id: true, name: true, email: true, _count: { select: { referrals: true } } } } } },
      commissionsEarned: { orderBy: { createdAt: "desc" }, take: 30, include: { order: { select: { id: true, number: true } }, buyer: { select: { name: true } } } },
    },
  });
  if (!user) notFound();

  const [membership, summary, ups, audits, products, sessions] = await Promise.all([
    getMembership(user.id),
    commissionSummary(user.id),
    upline(user.id),
    db.auditLog.findMany({ where: { OR: [{ entityType: "User", entityId: user.id }, { actorId: user.id }] }, orderBy: { createdAt: "desc" }, take: 12 }),
    db.product.findMany({ where: { status: "PUBLISHED" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } }),
  ]);
  const owned = new Set(user.entitlements.filter((e) => !e.revokedAt).map((e) => e.productId));
  const isSelf = user.id === admin.id;

  return (
    <div>
      <Link href="/admin/members" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
        <ArrowLeft className="size-3.5" /> Members
      </Link>
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>{user.status === "ACTIVE" ? "Active" : "Suspended"}</Badge>
            {user.role === "ADMIN" && <Badge tone="dark">Admin</Badge>}
            {membership.isPremium && (
              <Badge tone="accent" icon={Crown}>
                {membership.subscription?.planName}
              </Badge>
            )}
            <SampleBadge sample={user.isSampleData} />
          </span>
        }
        title={
          <span className="flex items-center gap-3">
            <Avatar name={user.name} hue={user.profile?.avatarHue} size={40} />
            {user.name}
          </span>
        }
        description={`${user.email} · joined ${formatDate(user.createdAt)} · ${sessions} active session${sessions === 1 ? "" : "s"}`}
        actions={
          <MemberActions
            userId={user.id}
            name={user.name}
            status={user.status}
            canSuspend={!isSelf && user.role !== "ADMIN"}
            suspendBlockedReason={isSelf ? "Can't suspend yourself" : user.role === "ADMIN" ? "Admins can't be suspended" : undefined}
            grantable={products.filter((p) => !owned.has(p.id))}
          />
        }
      />

      {user.status === "SUSPENDED" && (
        <Callout tone="danger" className="mb-6" title="Account suspended">
          {user.suspendedReason ?? "No reason recorded."}
        </Callout>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Paid orders" value={user.orders.filter((o) => o.status === "PAID").length} />
        <StatTile label="Products owned" value={owned.size} />
        <StatTile label="Direct referrals" value={user.referrals.length} />
        <StatTile label="Commissions (pending + approved)" tone="test" value={formatINR(summary.pending + summary.approved, { exact: true })} hint={`${formatINR(summary.reversed, { exact: true })} reversed`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-[15px] font-semibold">Orders</h2>
            {user.orders.length === 0 ? (
              <Panel className="p-4 text-[13.5px] text-ink-3">No orders.</Panel>
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <tr>
                      <TH>Order</TH>
                      <TH className="text-right">Total</TH>
                      <TH>Status</TH>
                      <TH>Date</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {user.orders.map((o) => (
                      <TR key={o.id}>
                        <TD>
                          <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                            {o.number}
                          </Link>{" "}
                          <SampleBadge test={o.isTest} />
                        </TD>
                        <TD className="text-right tabular-nums">{formatINR(o.totalInPaise, { exact: true })}</TD>
                        <TD>
                          <OrderStatusBadge status={o.status} />
                        </TD>
                        <TD className="whitespace-nowrap text-ink-3">{formatDate(o.createdAt)}</TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-semibold">Commissions earned</h2>
            {user.commissionsEarned.length === 0 ? (
              <Panel className="p-4 text-[13.5px] text-ink-3">{user.affiliateOptIn ? "No commissions yet." : "Not enrolled in the affiliate programme."}</Panel>
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <tr>
                      <TH>Order</TH>
                      <TH>Buyer</TH>
                      <TH>Level</TH>
                      <TH className="text-right">Amount</TH>
                      <TH>Status</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {user.commissionsEarned.map((c) => (
                      <TR key={c.id}>
                        <TD>
                          <Link href={`/admin/orders/${c.order.id}`} className="hover:underline">
                            {c.order.number}
                          </Link>
                        </TD>
                        <TD className="text-ink-2">{c.buyer.name}</TD>
                        <TD>L{c.level}</TD>
                        <TD className="text-right tabular-nums">{formatINR(c.amountInPaise, { exact: true })}</TD>
                        <TD>
                          <CommissionStatusBadge status={c.status} />
                        </TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-semibold">Recent audit events</h2>
            <TableWrap>
              <Table>
                <tbody>
                  {audits.map((a) => (
                    <TR key={a.id}>
                      <TD className="font-mono text-[12.5px]">{a.action}</TD>
                      <TD>
                        <JsonDetails value={a.metadata} />
                      </TD>
                      <TD className="whitespace-nowrap text-ink-3">{formatDateTime(a.createdAt)}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </section>
        </div>

        <div className="space-y-6">
          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold">Profile</h2>
            <dl className="mt-2 divide-y divide-line">
              <KeyValue label="Referral code">
                <span className="font-mono">{user.referralCode}</span>
              </KeyValue>
              <KeyValue label="Affiliate">{user.affiliateOptIn ? `Opted in ${user.affiliateOptInAt ? formatDate(user.affiliateOptInAt) : ""}` : "Not enrolled"}</KeyValue>
              <KeyValue label="Onboarded">{user.onboardedAt ? formatDate(user.onboardedAt) : "Not yet"}</KeyValue>
              <KeyValue label="Interests">{user.preferences?.interests.join(", ") || "—"}</KeyValue>
              <KeyValue label="Membership">
                {membership.subscription ? `${membership.subscription.planName} until ${formatDate(membership.subscription.currentPeriodEnd)}` : "Free"}
              </KeyValue>
            </dl>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold">Referral upline</h2>
            {ups.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-3">Not referred by anyone.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {ups.map((u) => (
                  <li key={u.id} className="flex items-center gap-2 text-[13px]">
                    <Badge tone="outline">
                      <ArrowUp className="size-3" /> L{u.level}
                    </Badge>
                    <Link href={`/admin/members/${u.id}`} className="font-medium hover:underline">
                      {u.name}
                    </Link>
                    <span className="truncate text-ink-3">{u.email}</span>
                  </li>
                ))}
              </ol>
            )}
            {user.referredBy && (
              <p className="mt-3 text-[12px] text-ink-3">
                Attributed {formatDateTime(user.referredBy.attributedAt)} via {user.referredBy.source.toLowerCase()} ({user.referredBy.codeUsed})
              </p>
            )}
          </Panel>

          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold">Direct referrals</h2>
            {user.referrals.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-3">None.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {user.referrals.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <Link href={`/admin/members/${r.referredUser.id}`} className="font-medium hover:underline">
                      {r.referredUser.name}
                    </Link>
                    <span className="text-ink-3">
                      {r.referredUser._count.referrals} referral{r.referredUser._count.referrals === 1 ? "" : "s"} · {formatDate(r.attributedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel className="p-5">
            <h2 className="text-[15px] font-semibold">Library</h2>
            {user.entitlements.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-3">No products.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {user.entitlements.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className={e.revokedAt ? "text-ink-3 line-through" : ""}>{e.product.name}</span>
                    <span className="flex gap-1">
                      {e.source === "ADMIN_GRANT" && <Badge tone="outline">Granted</Badge>}
                      {e.isTest && <Badge tone="warning">Test</Badge>}
                      {e.revokedAt && <Badge tone="neutral">Revoked</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
