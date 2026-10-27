// Development seed. Wipes and recreates all data. Never run against production.
//
//   npm run db:seed
//
// Every row created here is flagged as sample data (isSampleData / isTest) and
// labelled as such in the interface.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/core/db";
import { approveCommission, reviewPayout } from "@/lib/core/affiliate";
import { createOrder, fulfilOrder, refundOrder } from "@/lib/core/orders";
import { hashPassword } from "@/lib/domain/passwords";
import { CATEGORIES, PLANS, PRODUCTS, RESOURCE_COLLECTIONS } from "./seed-data";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED_IN_PRODUCTION !== "true") {
  console.error("Refusing to seed a production database.");
  process.exit(1);
}

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const storageDir = process.env.PRIVATE_STORAGE_DIR ?? "./storage/private";

async function wipe() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length) {
    await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
  }
}

async function main() {
  console.log("→ Resetting database");
  await wipe();

  await db.platformSettings.create({ data: { id: 1, taxRateBps: 1800, taxLabel: "GST (placeholder rate)", supportEmail: "support@lifeos.example" } });
  await db.affiliateSettings.create({
    data: { id: 1, programEnabled: true, commissionMode: "TEST", attributionWindowDays: 30, holdPeriodDays: 14, minPayoutInPaise: 25000 },
  });
  await db.commissionLevel.createMany({
    data: [
      { level: 1, rateBps: 1500, enabled: true },
      { level: 2, rateBps: 500, enabled: true },
      { level: 3, rateBps: 200, enabled: true },
    ],
  });

  console.log("→ Plans, categories, products");
  const plans = Object.fromEntries(
    await Promise.all(PLANS.map(async (p) => [p.code, await db.membershipPlan.create({ data: p })] as const)),
  );

  const categories = Object.fromEntries(
    await Promise.all(CATEGORIES.map(async (c, i) => [c.slug, await db.productCategory.create({ data: { ...c, sortOrder: i } })] as const)),
  );

  const products: Record<string, { id: string }> = {};
  for (const [i, p] of PRODUCTS.entries()) {
    const { assets, category, ...rest } = p;
    const product = await db.product.create({
      data: {
        ...rest,
        categoryId: categories[category].id,
        status: "PUBLISHED",
        publishedAt: daysAgo(60 - i * 3),
        isSampleData: true,
      },
    });
    products[p.slug] = product;
    const dir = path.join(storageDir, p.slug);
    await mkdir(dir, { recursive: true });
    for (const a of assets) {
      const header = `<!-- LifeOS Digital sample product file: ${p.name}. Provisional content for development. -->\n\n`;
      const body = a.mimeType === "text/markdown" ? header + a.content : a.content;
      await writeFile(path.join(dir, a.fileName), body, "utf8");
      await db.productAsset.create({
        data: {
          productId: product.id,
          label: a.label,
          fileName: a.fileName,
          storageKey: `${p.slug}/${a.fileName}`,
          mimeType: a.mimeType,
          sizeBytes: Buffer.byteLength(body),
        },
      });
    }
  }

  console.log("→ Resource library");
  for (const [i, c] of RESOURCE_COLLECTIONS.entries()) {
    const { items, ...rest } = c;
    await db.resourceCollection.create({
      data: { ...rest, sortOrder: i, items: { create: items.map((it, j) => ({ ...it, publishedAt: daysAgo(40 - i * 6 - j * 2) })) } },
    });
  }

  console.log("→ Sample users");
  const demoPassword = await hashPassword("demo1234");
  const adminPassword = await hashPassword("admin1234");
  const mk = async (u: {
    email: string;
    name: string;
    code: string;
    role?: "ADMIN" | "USER";
    affiliate?: boolean;
    hue: number;
    createdDaysAgo: number;
    interests?: string[];
    headline?: string;
  }) =>
    db.user.create({
      data: {
        email: u.email,
        name: u.name,
        passwordHash: u.role === "ADMIN" ? adminPassword : demoPassword,
        role: u.role ?? "USER",
        referralCode: u.code,
        affiliateOptIn: u.affiliate ?? false,
        affiliateOptInAt: u.affiliate ? daysAgo(u.createdDaysAgo - 1) : null,
        onboardedAt: daysAgo(u.createdDaysAgo),
        isSampleData: true,
        createdAt: daysAgo(u.createdDaysAgo),
        profile: { create: { avatarHue: u.hue, headline: u.headline } },
        preferences: {
          create: {
            interests: u.interests ?? ["productivity"],
            dashboardWidgets: ["quick-tools", "recent", "recommended", "purchases", "membership", "referrals"],
          },
        },
      },
    });

  const admin = await mk({ email: "admin@lifeos.demo", name: "Asha Raman", code: "ASHAADMN", role: "ADMIN", hue: 18, createdDaysAgo: 90, headline: "Platform administrator" });
  const meera = await mk({ email: "demo@lifeos.demo", name: "Meera Iyer", code: "MEERA7Q2", affiliate: true, hue: 258, createdDaysAgo: 75, interests: ["productivity", "career", "content"], headline: "Product designer & freelance consultant" });
  const kabir = await mk({ email: "free@lifeos.demo", name: "Kabir Shah", code: "KABIR4XM", hue: 200, createdDaysAgo: 30, interests: ["career", "ai"] });
  const rahul = await mk({ email: "rahul.verma@example.com", name: "Rahul Verma", code: "RAHULK8P", affiliate: true, hue: 28, createdDaysAgo: 60 });
  const priya = await mk({ email: "priya.nair@example.com", name: "Priya Nair", code: "PRIYAB3T", hue: 330, createdDaysAgo: 55 });
  const arjun = await mk({ email: "arjun.mehta@example.com", name: "Arjun Mehta", code: "ARJUNN6W", hue: 150, createdDaysAgo: 48 });
  const sneha = await mk({ email: "sneha.kapoor@example.com", name: "Sneha Kapoor", code: "SNEHAR2D", affiliate: true, hue: 290, createdDaysAgo: 40 });
  const vikram = await mk({ email: "vikram.singh@example.com", name: "Vikram Singh", code: "VIKRAM9H", hue: 205, createdDaysAgo: 36 });
  const ananya = await mk({ email: "ananya.rao@example.com", name: "Ananya Rao", code: "ANANYC5L", hue: 168, createdDaysAgo: 12 });

  console.log("→ Referral relationships");
  const refer = (referrerId: string, referredUserId: string, code: string, at: number) =>
    db.referralRelationship.create({ data: { referrerId, referredUserId, source: "SAMPLE", codeUsed: code, attributedAt: daysAgo(at) } });
  await refer(meera.id, rahul.id, meera.referralCode, 60); // L1 of Meera
  await refer(meera.id, priya.id, meera.referralCode, 55); // L1
  await refer(meera.id, arjun.id, meera.referralCode, 48); // L1
  await refer(rahul.id, sneha.id, rahul.referralCode, 40); // L2 of Meera
  await refer(rahul.id, vikram.id, rahul.referralCode, 36); // L2
  await refer(sneha.id, ananya.id, sneha.referralCode, 12); // L3 of Meera

  console.log("→ Sample orders (mock provider, test mode)");
  async function buy(userId: string, lines: Parameters<typeof createOrder>[1], when: number) {
    const order = await createOrder(userId, lines, { provider: "mock", isTest: true, isSampleData: true });
    await fulfilOrder(order.id, { provider: "mock", providerRef: `mock_seed_${order.id.slice(-8)}`, amountInPaise: order.totalInPaise });
    const at = daysAgo(when);
    await db.order.update({ where: { id: order.id }, data: { createdAt: at, paidAt: at } });
    await db.commissionRecord.updateMany({ where: { orderId: order.id }, data: { createdAt: at } });
    await db.commissionLedgerEntry.updateMany({ where: { commission: { orderId: order.id } }, data: { createdAt: at } });
    await db.digitalEntitlement.updateMany({ where: { orderItem: { orderId: order.id } }, data: { grantedAt: at } });
    return order;
  }
  const P = (slug: string) => ({ type: "PRODUCT" as const, productId: products[slug].id });

  await buy(meera.id, [P("ultimate-resume-toolkit"), P("business-proposal-templates")], 50);
  const meeraSub = await buy(meera.id, [{ type: "MEMBERSHIP", planId: plans.PREMIUM_MONTHLY.id }], 9);
  await db.membershipSubscription.updateMany({
    where: { orderItem: { orderId: meeraSub.id } },
    data: { currentPeriodStart: daysAgo(9), currentPeriodEnd: new Date(daysAgo(9).getTime() + 30 * DAY) },
  });
  await buy(kabir.id, [P("personal-productivity-planner")], 20);
  await buy(rahul.id, [P("freelance-business-starter-kit")], 40);
  await buy(priya.id, [P("creator-content-calendar")], 35);
  await buy(arjun.id, [{ type: "MEMBERSHIP", planId: plans.PREMIUM_ANNUAL.id }], 30); // memberships never earn commission
  await buy(sneha.id, [P("small-business-operations-toolkit")], 22);
  await buy(ananya.id, [P("social-media-design-pack")], 5);
  const vikramOrder = await buy(vikram.id, [P("ai-prompt-collection")], 18);
  await refundOrder(vikramOrder.id, { reason: "Customer request within cooling-off period (sample)", actorId: admin.id });

  // A pending checkout that was never paid, and one that failed.
  const pending = await createOrder(kabir.id, [P("interview-preparation-workbook")], { provider: "mock", isTest: true, isSampleData: true });
  await db.order.update({ where: { id: pending.id }, data: { createdAt: daysAgo(2) } });

  console.log("→ Commission review & sample payout");
  const matured = await db.commissionRecord.findMany({ where: { status: "PENDING", createdAt: { lt: daysAgo(14) } } });
  for (const c of matured) await approveCommission(c.id, admin.id);
  // Historic sample payout for Meera covering her two oldest approved commissions.
  const oldest = await db.commissionRecord.findMany({
    where: { beneficiaryId: meera.id, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    take: 2,
  });
  const payout = await db.payoutRequest.create({
    data: {
      userId: meera.id,
      amountInPaise: oldest.reduce((s, c) => s + c.amountInPaise, 0),
      isTest: true,
      note: "Sample payout request",
      createdAt: daysAgo(13),
    },
  });
  await db.commissionRecord.updateMany({ where: { id: { in: oldest.map((c) => c.id) } }, data: { payoutRequestId: payout.id } });
  await reviewPayout(payout.id, "APPROVED", admin.id, "Test approval only — payouts are disabled until the programme is approved.");
  await db.payoutRequest.update({ where: { id: payout.id }, data: { reviewedAt: daysAgo(11) } });

  console.log("→ Activity");
  const resources = await db.resourceItem.findMany({ take: 3, orderBy: { publishedAt: "desc" } });
  const views: { kind: "PRODUCT" | "RESOURCE" | "TOOL"; refId: string; at: number }[] = [
    { kind: "PRODUCT", refId: products["small-business-operations-toolkit"].id, at: 1 },
    { kind: "PRODUCT", refId: products["ai-prompt-collection"].id, at: 2 },
    { kind: "TOOL", refId: "proposal-builder", at: 0.2 },
    { kind: "TOOL", refId: "resume-builder", at: 1.5 },
    ...resources.map((r, i) => ({ kind: "RESOURCE" as const, refId: r.id, at: 0.5 + i })),
  ];
  for (const v of views) {
    await db.recentView.create({ data: { userId: meera.id, kind: v.kind, refId: v.refId, viewedAt: daysAgo(v.at) } });
  }
  await db.notification.create({
    data: { userId: meera.id, title: "Welcome to the demo", body: "This account is populated with sample data so you can explore every feature.", href: "/app" },
  });
  await db.auditLog.create({ data: { actorId: admin.id, action: "seed.completed", entityType: "System", metadata: { note: "Sample data loaded" } } });

  console.log("\n✓ Seed complete\n");
  console.log("  Demo member  demo@lifeos.demo  / demo1234   (Premium, affiliate)");
  console.log("  Free member  free@lifeos.demo  / demo1234");
  console.log("  Admin        admin@lifeos.demo / admin1234\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
