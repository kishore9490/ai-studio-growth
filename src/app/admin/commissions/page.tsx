import type { Metadata } from "next";
import Link from "next/link";
import { CircleDollarSign } from "lucide-react";
import { FilterBar, Pagination, param, parsePage, qs, StatTile } from "@/components/admin/bits";
import { CommissionActions } from "@/components/admin/commission-actions";
import { CommissionStatusBadge } from "@/components/status-badges";
import { buttonClasses } from "@/components/ui/button";
import { Badge, Callout, EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/core/db";
import { isPastHoldPeriod } from "@/lib/domain/commissions";
import { formatBps, formatINR } from "@/lib/domain/money";
import { requireAdmin } from "@/lib/server/auth";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Commission ledger · Admin" };

const STATUSES = ["PENDING", "APPROVED", "REVERSED", "PAID"] as const;
const PAGE_SIZE = 50;

export default async function AdminCommissionsPage(props: PageProps<"/admin/commissions">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const view = param(sp.view) === "ledger" ? "ledger" : "records";
  const status = STATUSES.find((s) => s === param(sp.status));
  const page = parsePage(sp.page);
  const now = new Date();

  const [settings, totals] = await Promise.all([
    db.affiliateSettings.findUniqueOrThrow({ where: { id: 1 } }),
    db.commissionRecord.groupBy({ by: ["status"], _sum: { amountInPaise: true }, _count: true }),
  ]);
  const t = (s: string) => totals.find((x) => x.status === s);

  return (
    <div>
      <PageHeader
        title="Commission ledger"
        description="Commissions are calculated on the server from verified product sales. Users cannot edit their own records or balances."
        eyebrow={<Badge tone="warning">Test mode — no payouts</Badge>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUSES.map((s) => (
          <StatTile key={s} label={s[0] + s.slice(1).toLowerCase()} tone="test" value={formatINR(t(s)?._sum.amountInPaise ?? 0, { exact: true })} hint={`${t(s)?._count ?? 0} records`} />
        ))}
      </div>

      <div className="mb-5 flex gap-1 rounded-[12px] border border-line bg-surface p-1 sm:w-fit" role="tablist" aria-label="Ledger view">
        {(
          [
            ["records", "Commission records"],
            ["ledger", "Append-only ledger"],
          ] as const
        ).map(([v, label]) => (
          <Link key={v} role="tab" aria-selected={view === v} href={qs("/admin/commissions", { view: v === "records" ? undefined : v })} className={cn(buttonClasses(view === v ? "primary" : "ghost", "sm"), "flex-1")}>
            {label}
          </Link>
        ))}
      </div>

      {view === "records" ? (
        <Records status={status} page={page} now={now} holdDays={settings.holdPeriodDays} />
      ) : (
        <Ledger page={page} />
      )}
    </div>
  );
}

async function Records({ status, page, now, holdDays }: { status?: (typeof STATUSES)[number]; page: number; now: Date; holdDays: number }) {
  const where = status ? { status } : {};
  const [records, total] = await Promise.all([
    db.commissionRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        beneficiary: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
        order: { select: { id: true, number: true } },
      },
    }),
    db.commissionRecord.count({ where }),
  ]);
  return (
    <>
      <FilterBar
        action="/admin/commissions"
        selects={[{ name: "status", label: "Status", value: status, options: [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase() }))] }]}
      />
      <Callout className="mb-4">
        Pending commissions become approvable after the {holdDays}-day refund hold. Refunds reverse pending and approved commissions automatically.
      </Callout>
      {records.length === 0 ? (
        <EmptyState icon={CircleDollarSign} title="No commission records" description="Records are created when a referred member's eligible product purchase is verified." />
      ) : (
        <TableWrap>
          <Table className="min-w-[960px]">
            <THead>
              <tr>
                <TH>Beneficiary</TH>
                <TH>Buyer</TH>
                <TH>Order</TH>
                <TH>Level</TH>
                <TH className="text-right">Rate</TH>
                <TH className="text-right">Base</TH>
                <TH className="text-right">Amount</TH>
                <TH>Status</TH>
                <TH>Created</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {records.map((c) => {
                const inHold = c.status === "PENDING" && !isPastHoldPeriod(c.createdAt, holdDays, now);
                return (
                  <TR key={c.id}>
                    <TD>
                      <Link href={`/admin/members/${c.beneficiary.id}`} className="font-medium hover:underline">
                        {c.beneficiary.name}
                      </Link>
                    </TD>
                    <TD>
                      <Link href={`/admin/members/${c.buyer.id}`} className="text-ink-2 hover:underline">
                        {c.buyer.name}
                      </Link>
                    </TD>
                    <TD>
                      <Link href={`/admin/orders/${c.order.id}`} className="font-mono text-[12.5px] hover:underline">
                        {c.order.number}
                      </Link>
                    </TD>
                    <TD>L{c.level}</TD>
                    <TD className="text-right tabular-nums">{formatBps(c.rateBps)}</TD>
                    <TD className="text-right tabular-nums text-ink-2">{formatINR(c.baseAmountInPaise, { exact: true })}</TD>
                    <TD className="text-right font-medium tabular-nums">{formatINR(c.amountInPaise, { exact: true })}</TD>
                    <TD>
                      <span className="flex flex-col items-start gap-1">
                        <CommissionStatusBadge status={c.status} />
                        {inHold && <span className="text-[11.5px] text-ink-3">In hold</span>}
                        {c.payoutRequestId && <span className="text-[11.5px] text-ink-3">In payout request</span>}
                        {c.reversalReason && <span className="max-w-[180px] text-[11.5px] text-ink-3">{c.reversalReason}</span>}
                      </span>
                    </TD>
                    <TD className="whitespace-nowrap text-ink-3">{formatDate(c.createdAt)}</TD>
                    <TD>
                      <CommissionActions id={c.id} status={c.status} inHold={inHold} />
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} href={(p) => qs("/admin/commissions", { status, page: p })} />
    </>
  );
}

async function Ledger({ page }: { page: number }) {
  const [entries, total] = await Promise.all([
    db.commissionLedgerEntry.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { beneficiary: { select: { id: true, name: true } }, commission: { select: { level: true, order: { select: { id: true, number: true } } } } },
    }),
    db.commissionLedgerEntry.count(),
  ]);
  const actorIds = [...new Set(entries.map((e) => e.actorId).filter((x): x is string => !!x))];
  const actors = await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } });
  const tones = { ACCRUED: "success", APPROVED: "accent", REVERSED: "danger", PAID_OUT: "dark" } as const;
  return (
    <>
      <Callout className="mb-4">
        Every change to a commission appends a row here; rows are never edited or deleted. Accruals are positive, reversals negative, approvals carry no amount.
      </Callout>
      <TableWrap>
        <Table>
          <THead>
            <tr>
              <TH>When</TH>
              <TH>Type</TH>
              <TH>Beneficiary</TH>
              <TH>Order</TH>
              <TH className="text-right">Amount</TH>
              <TH>Note</TH>
              <TH>Actor</TH>
            </tr>
          </THead>
          <tbody>
            {entries.map((e) => (
              <TR key={e.id}>
                <TD className="whitespace-nowrap text-ink-3">{formatDateTime(e.createdAt)}</TD>
                <TD>
                  <Badge tone={tones[e.type]}>{e.type.replace("_", " ").toLowerCase()}</Badge>
                </TD>
                <TD>
                  <Link href={`/admin/members/${e.beneficiary.id}`} className="hover:underline">
                    {e.beneficiary.name}
                  </Link>
                </TD>
                <TD>
                  <Link href={`/admin/orders/${e.commission.order.id}`} className="font-mono text-[12.5px] hover:underline">
                    {e.commission.order.number}
                  </Link>{" "}
                  <span className="text-ink-3">L{e.commission.level}</span>
                </TD>
                <TD className={cn("text-right tabular-nums", e.amountInPaise < 0 && "text-danger")}>
                  {e.amountInPaise === 0 ? "—" : `${e.amountInPaise > 0 ? "+" : "−"}${formatINR(Math.abs(e.amountInPaise), { exact: true })}`}
                </TD>
                <TD className="max-w-[260px] text-ink-2">{e.note ?? "—"}</TD>
                <TD className="text-ink-2">{actors.find((a) => a.id === e.actorId)?.name ?? "System"}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </TableWrap>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} href={(p) => qs("/admin/commissions", { view: "ledger", page: p })} />
    </>
  );
}
