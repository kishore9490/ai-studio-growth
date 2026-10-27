"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/core/db";
import { DASHBOARD_WIDGETS, INTERESTS } from "@/lib/preferences";
import { requireUser } from "@/lib/server/auth";

const schema = z.object({
  interests: z.array(z.enum(INTERESTS.map((i) => i.key) as [string, ...string[]])).max(6),
  widgets: z.array(z.enum(DASHBOARD_WIDGETS.map((w) => w.key) as [string, ...string[]])).min(1, "Keep at least one section."),
});

export async function completeOnboarding(input: { interests: string[]; widgets: string[] }) {
  const user = await requireUser("/onboarding");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.$transaction([
    db.userPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, interests: parsed.data.interests, dashboardWidgets: parsed.data.widgets },
      update: { interests: parsed.data.interests, dashboardWidgets: parsed.data.widgets },
    }),
    db.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } }),
    db.notification.create({
      data: { userId: user.id, title: "Welcome to LifeOS", body: "Your dashboard is ready. Try the AI Writing Workspace to get started.", href: "/app/tools" },
    }),
  ]);
  redirect("/app?welcome=1");
}
