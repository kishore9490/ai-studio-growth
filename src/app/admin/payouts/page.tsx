import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, Lock } from "lucide-react";
import { FilterBar, param } from "@/components/admin/bits";
import { PayoutActions } from "@/components/admin/payout-actions";
import { PayoutStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Badge, Callout, EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/ui/table";
import { PAYOUTS_ENABLED } from "@/lib/core/affiliate";
import { db } from "@/lib/core/db";
import { formatINR } from "@/lib/domain/money";
import { requireAdmin } from "@/lib/server/auth";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Payout review · Admin" };

const STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "PAID"] as const;

export default async function AdminPayoutsPage(props: PageProps<"/admin/payouts">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const status = STATUSES.find((s) => s === param(sp.status));
  const requests = await db.payoutRequest.findMany({
    where: status ? { status } : {},
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, status: true } },
      reviewedBy: { select: { name: true } },
      _count: { select: { commissions: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Payout review"
        description="Review affiliate payout requests. Approval is recorded for testing only."
        actions={
          <Button variant="secondary" disabled title="Payouts are disabled">
            <Lock /> Send payouts
          </Button>
        }
      />
      <Callout tone="danger" icon={Lock} className="mb-6" title={`Payouts are ${PAYOUTS_ENABLED ? "enabled" : "disabled"}`}>
        No code path in this MVP transfers money. Enabling payouts requires an approved compensation plan, a KYC and tax-deduction process, a payout provider
        integration and a code change — it can&apos;t be switched on from the admin.
      </Callout>
      <FilterBar
        action="/admin/payouts"
        selects={[
          {
            name: "status",
            label: "Status",
            value: status,
            options: [{ value: "", label: "All requests" }, { value: "REQUESTED", label: "Under review" }, { value: "APPROVED", label: "Approved (test)" }, { value: "REJECTED", label: "Declined" }, { value: "PAID", label: "Paid" }],
          },
        ]}
      />
      {requests.length === 0 ? (
        <EmptyState icon={Banknote} title="No payout requests" description="Members can request a test payout once their approved balance passes the minimum." />
      ) : (
        <TableWrap>
          <Table className="min-w-[860px]">
            <THead>
              <tr>
                <TH>Member</TH>
                <TH className="text-right">Amount</TH>
                <TH className="text-right">Commissions</TH>
                <TH>Status</TH>
                <TH>Requested</TH>
                <TH>Review</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {requests.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/admin/members/${r.user.id}`} className="font-medium hover:underline">
                      {r.user.name}
                    </Link>
                    <p className="text-xs text-ink-3">{r.user.email}</p>
                    {r.user.status === "SUSPENDED" && <Badge tone="danger">Suspended</Badge>}
                  </TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatINR(r.amountInPaise, { exact: true })}
                    {r.isTest && (
                      <div className="mt-1">
                        <Badge tone="warning">Test</Badge>
                      </div>
                    )}
                  </TD>
                  <TD className="text-right tabular-nums">{r._count.commissions}</TD>
                  <TD>
                    <PayoutStatusBadge status={r.status} />
                  </TD>
                  <TD className="whitespace-nowrap text-ink-3">{formatDateTime(r.createdAt)}</TD>
                  <TD className="max-w-[220px] text-[12.5px] text-ink-2">
                    {r.reviewedAt ? (
                      <>
                        {r.reviewedBy?.name ?? "—"} · {formatDateTime(r.reviewedAt)}
                        {r.reviewNote && <p className="text-ink-3">{r.reviewNote}</p>}
                      </>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD>{r.status === "REQUESTED" ? <PayoutActions id={r.id} name={r.user.name} /> : <span className="block text-right text-ink-3">—</span>}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
