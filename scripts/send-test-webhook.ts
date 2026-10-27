// Development helper: deliver a correctly signed payment webhook for an order.
//
//   npx tsx scripts/send-test-webhook.ts <orderId> [succeeded|failed|refunded]
//
// Uses PAYMENT_WEBHOOK_SECRET and APP_URL from .env. Only works for orders
// created with the mock provider, and only where mock payments are allowed.

import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hmacSha256Hex } from "../src/lib/domain/signing";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

async function main() {
  const [orderId, outcome = "succeeded"] = process.argv.slice(2);
  if (!orderId) throw new Error("Usage: npx tsx scripts/send-test-webhook.ts <orderId> [succeeded|failed|refunded]");
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) throw new Error("PAYMENT_WEBHOOK_SECRET is not set");
  const db = new PrismaClient();
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  await db.$disconnect();

  const type = outcome === "failed" ? "payment.failed" : outcome === "refunded" ? "refund.succeeded" : "payment.succeeded";
  const body = JSON.stringify({
    id: `evt_${randomUUID()}`,
    provider: "mock",
    type,
    data: { orderId: order.id, providerRef: `mock_wh_${randomUUID().slice(0, 8)}`, amountInPaise: order.totalInPaise, reason: "Sent by send-test-webhook" },
  });
  const res = await fetch(`${process.env.APP_URL ?? "http://localhost:3000"}/api/webhooks/payments`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-lifeos-signature": hmacSha256Hex(secret, body) },
    body,
  });
  console.log(res.status, await res.text());
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
