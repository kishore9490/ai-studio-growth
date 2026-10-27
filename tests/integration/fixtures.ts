import { db } from "@/lib/core/db";

let counter = 0;
const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

export async function resetData() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
  await db.platformSettings.create({ data: { id: 1, taxRateBps: 1800, taxLabel: "GST (test)" } });
  await db.affiliateSettings.create({ data: { id: 1, programEnabled: true, commissionMode: "TEST", holdPeriodDays: 14, minPayoutInPaise: 10000 } });
  await db.commissionLevel.createMany({
    data: [
      { level: 1, rateBps: 1500, enabled: true },
      { level: 2, rateBps: 500, enabled: true },
      { level: 3, rateBps: 200, enabled: true },
    ],
  });
}

export async function makeUser(opts: { affiliate?: boolean; email?: string; status?: "ACTIVE" | "SUSPENDED"; role?: "USER" | "ADMIN" } = {}) {
  const id = uid();
  return db.user.create({
    data: {
      email: opts.email ?? `user-${id}@example.com`,
      name: `User ${id}`,
      passwordHash: "x",
      referralCode: `T${id.toUpperCase()}`.slice(0, 16),
      affiliateOptIn: opts.affiliate ?? true,
      status: opts.status ?? "ACTIVE",
      role: opts.role ?? "USER",
    },
  });
}

export async function refer(referrerId: string, referredUserId: string) {
  return db.referralRelationship.create({ data: { referrerId, referredUserId, source: "CODE", codeUsed: "TEST" } });
}

export async function makeProduct(opts: { priceInPaise?: number; commissionEligible?: boolean; status?: "PUBLISHED" | "DRAFT" } = {}) {
  const id = uid();
  const category =
    (await db.productCategory.findFirst()) ?? (await db.productCategory.create({ data: { slug: "cat", name: "Category", description: "" } }));
  return db.product.create({
    data: {
      slug: `product-${id}`,
      name: `Product ${id}`,
      tagline: "t",
      description: "d",
      categoryId: category.id,
      priceInPaise: opts.priceInPaise ?? 100000,
      status: opts.status ?? "PUBLISHED",
      format: "Template",
      licenceSummary: "Personal use",
      artwork: "kit",
      commissionEligible: opts.commissionEligible ?? true,
    },
  });
}

export async function makePlan(interval: "MONTH" | "YEAR" = "MONTH") {
  return db.membershipPlan.create({
    data: {
      code: `PLAN_${uid()}`,
      name: "Premium",
      description: "",
      priceInPaise: interval === "MONTH" ? 49900 : 499000,
      interval,
      benefits: [],
      billingTerms: "",
    },
  });
}
