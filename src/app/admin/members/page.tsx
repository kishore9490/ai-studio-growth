import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Users } from "lucide-react";
import { FilterBar, Pagination, param, parsePage, qs, SampleBadge } from "@/components/admin/bits";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/core/db";
import { requireAdmin } from "@/lib/server/auth";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Members · Admin" };
const PAGE_SIZE = 25;

export default async function AdminMembersPage(props: PageProps<"/admin/members">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = param(sp.q);
  const role = (["USER", "ADMIN"] as const).find((r) => r === param(sp.role));
  const status = (["ACTIVE", "SUSPENDED"] as const).find((s) => s === param(sp.status));
  const page = parsePage(sp.page);
  const now = new Date();
  const where = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
            { referralCode: { contains: q.toUpperCase() } },
          ],
        }
      : {}),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        profile: { select: { avatarHue: true } },
        subscriptions: { where: { status: "ACTIVE", currentPeriodEnd: { gt: now } }, select: { id: true } },
        _count: { select: { orders: { where: { status: "PAID" } }, referrals: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  return (
    <div>
      <PageHeader title="Members" description="Look up accounts, review their activity and suspend accounts involved in fraud or abuse." />
      <FilterBar
        action="/admin/members"
        search={{ name: "q", value: q, placeholder: "Name, email or referral code" }}
        selects={[
          { name: "role", label: "Role", value: role, options: [{ value: "", label: "All roles" }, { value: "USER", label: "Members" }, { value: "ADMIN", label: "Admins" }] },
          { name: "status", label: "Status", value: status, options: [{ value: "", label: "Any status" }, { value: "ACTIVE", label: "Active" }, { value: "SUSPENDED", label: "Suspended" }] },
        ]}
      />
      {users.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="Try a different search or filter." />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <tr>
                <TH>Member</TH>
                <TH>Plan</TH>
                <TH>Status</TH>
                <TH className="text-right">Paid orders</TH>
                <TH className="text-right">Referrals</TH>
                <TH>Affiliate</TH>
                <TH>Joined</TH>
              </tr>
            </THead>
            <tbody>
              {users.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <Link href={`/admin/members/${u.id}`} className="flex items-center gap-3">
                      <Avatar name={u.name} hue={u.profile?.avatarHue} size={30} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-medium hover:underline">
                          {u.name}
                          {u.role === "ADMIN" && <Badge tone="dark">Admin</Badge>}
                          <SampleBadge sample={u.isSampleData} />
                        </span>
                        <span className="block text-xs text-ink-3">{u.email}</span>
                      </span>
                    </Link>
                  </TD>
                  <TD>{u.subscriptions.length ? <Badge tone="accent" icon={Crown}>Premium</Badge> : <span className="text-ink-3">Free</span>}</TD>
                  <TD>
                    <Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status === "ACTIVE" ? "Active" : "Suspended"}</Badge>
                  </TD>
                  <TD className="text-right tabular-nums">{u._count.orders}</TD>
                  <TD className="text-right tabular-nums">{u._count.referrals}</TD>
                  <TD className="text-ink-2">{u.affiliateOptIn ? "Opted in" : "—"}</TD>
                  <TD className="whitespace-nowrap text-ink-3">{formatDate(u.createdAt)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} href={(p) => qs("/admin/members", { q, role, status, page: p })} />
    </div>
  );
}
