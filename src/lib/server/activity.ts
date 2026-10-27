import "server-only";
import { after } from "next/server";
import { db } from "@/lib/core/db";

/** Record a "recently viewed" entry after the response has been sent. */
export function recordView(userId: string, kind: "PRODUCT" | "RESOURCE" | "TOOL", refId: string) {
  after(async () => {
    await db.recentView.upsert({
      where: { userId_kind_refId: { userId, kind, refId } },
      create: { userId, kind, refId },
      update: { viewedAt: new Date() },
    });
  });
}
