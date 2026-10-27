import type { Prisma } from "@prisma/client";
import { db, type Tx } from "./db";

export async function audit(
  entry: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
  tx: Tx | typeof db = db,
) {
  await tx.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata,
    },
  });
}

export async function notify(
  userId: string,
  n: { title: string; body: string; href?: string },
  tx: Tx | typeof db = db,
) {
  await tx.notification.create({ data: { userId, ...n } });
}
