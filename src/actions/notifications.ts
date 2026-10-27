"use server";

import { refresh } from "next/cache";
import { db } from "@/lib/core/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function markNotificationsRead(ids?: string[]) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null, ...(ids ? { id: { in: ids.slice(0, 50) } } : {}) },
    data: { readAt: new Date() },
  });
  refresh();
}
