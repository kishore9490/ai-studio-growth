import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { FilterBar, JsonDetails, Pagination, param, parsePage, qs } from "@/components/admin/bits";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TableWrap, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/core/db";
import { requireAdmin } from "@/lib/server/auth";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log · Admin" };
const PAGE_SIZE = 50;

const ENTITY_LINKS: Record<string, (id: string) => string> = {
  Order: (id) => `/admin/orders/${id}`,
  User: (id) => `/admin/members/${id}`,
  Product: (id) => `/admin/products/${id}`,
};

export default async function AdminAuditPage(props: PageProps<"/admin/audit">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const entity = param(sp.entity);
  const action = param(sp.action);
  const page = parsePage(sp.page);

  const entityTypes = await db.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } });
  const where = {
    ...(entity ? { entityType: entity } : {}),
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
  };
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { actor: { select: { id: true, name: true } } } }),
    db.auditLog.count({ where }),
  ]);

  return (
    <div>
      <PageHeader title="Audit log" description="Append-only record of sign-ins, purchases, refunds, commission decisions and every admin change." />
      <FilterBar
        action="/admin/audit"
        search={{ name: "action", value: action, placeholder: "Filter by action, e.g. refund or commission" }}
        selects={[{ name: "entity", label: "Entity", value: entity, options: [{ value: "", label: "All entities" }, ...entityTypes.map((e) => ({ value: e.entityType, label: e.entityType }))] }]}
      />
      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No matching events" description="Try a broader filter." />
      ) : (
        <TableWrap>
          <Table className="min-w-[900px]">
            <THead>
              <tr>
                <TH>When</TH>
                <TH>Action</TH>
                <TH>Actor</TH>
                <TH>Entity</TH>
                <TH>Details</TH>
              </tr>
            </THead>
            <tbody>
              {logs.map((l) => {
                const link = l.entityId && ENTITY_LINKS[l.entityType]?.(l.entityId);
                return (
                  <TR key={l.id} className="align-top">
                    <TD className="whitespace-nowrap text-ink-3">{formatDateTime(l.createdAt)}</TD>
                    <TD className="font-mono text-[12.5px]">{l.action}</TD>
                    <TD>
                      {l.actor ? (
                        <Link href={`/admin/members/${l.actor.id}`} className="hover:underline">
                          {l.actor.name}
                        </Link>
                      ) : (
                        <span className="text-ink-3">System</span>
                      )}
                    </TD>
                    <TD className="text-ink-2">
                      {l.entityType}
                      {l.entityId &&
                        (link ? (
                          <Link href={link} className="ml-1 font-mono text-[11.5px] text-ink-3 hover:underline">
                            {l.entityId.slice(-8)}
                          </Link>
                        ) : (
                          <span className="ml-1 font-mono text-[11.5px] text-ink-3">{l.entityId.slice(-8)}</span>
                        ))}
                    </TD>
                    <TD>
                      <JsonDetails value={l.metadata} />
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} href={(p) => qs("/admin/audit", { entity, action, page: p })} />
    </div>
  );
}
