import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/core/db";
import { OrderError, failOrder, fulfilOrder, refundOrder } from "@/lib/core/orders";
import { verifyWebhookSignature } from "@/lib/domain/signing";
import { env, paymentConfig } from "@/lib/server/env";
import { limiters } from "@/lib/server/rate-limits";

// Payment provider webhook.
//
// Contract: the body is JSON, signed as hex(HMAC-SHA256(PAYMENT_WEBHOOK_SECRET,
// rawBody)) in the `x-lifeos-signature` header. A real provider adapter (e.g.
// Razorpay or Stripe) should verify that provider's own signature scheme and
// translate its payload into this shape before calling the same functions.
//
// Guarantees:
// - Unsigned or mis-signed requests are rejected before any parsing.
// - The paid amount must equal the order total.
// - Each event id is processed at most once (PaymentEvent unique constraint),
//   and fulfilment itself is idempotent under concurrent deliveries.

const eventSchema = z.object({
  id: z.string().min(1).max(128),
  provider: z.string().min(1).max(32),
  type: z.enum(["payment.succeeded", "payment.failed", "refund.succeeded"]),
  data: z.object({
    orderId: z.string().min(1).max(64),
    providerRef: z.string().min(1).max(128),
    amountInPaise: z.number().int().nonnegative(),
    reason: z.string().max(300).optional(),
  }),
});

export async function POST(request: NextRequest) {
  const secret = env.paymentWebhookSecret;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!limiters.webhook.check(`webhook:${ip}`).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const raw = await request.text();
  if (raw.length > 64 * 1024) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (!verifyWebhookSignature(secret, raw, request.headers.get("x-lifeos-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: z.infer<typeof eventSchema>;
  try {
    event = eventSchema.parse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  }

  const seen = await db.paymentEvent.findUnique({ where: { provider_eventId: { provider: event.provider, eventId: event.id } } });
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  const order = await db.order.findUnique({ where: { id: event.data.orderId } });
  if (!order) return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  // Events for mock (test) orders are only accepted where mock payments are allowed.
  if (order.isTest !== (event.provider === "mock")) {
    return NextResponse.json({ error: "Provider does not match order" }, { status: 409 });
  }
  if (event.provider === "mock" && !paymentConfig().mockAllowed) {
    return NextResponse.json({ error: "Mock payments are disabled in this environment" }, { status: 403 });
  }

  try {
    let result: unknown;
    if (event.type === "payment.succeeded") {
      result = await fulfilOrder(order.id, { provider: event.provider, providerRef: event.data.providerRef, amountInPaise: event.data.amountInPaise });
    } else if (event.type === "payment.failed") {
      result = await failOrder(order.id, event.data.reason ?? "Declined by provider");
    } else {
      result = await refundOrder(order.id, { reason: event.data.reason ?? "Refunded by provider", actorId: null });
    }
    // Record only after successful processing so a failed attempt can be retried by the provider.
    await db.paymentEvent
      .create({ data: { provider: event.provider, eventId: event.id, type: event.type, payload: JSON.parse(raw) } })
      .catch(() => undefined); // a concurrent duplicate already recorded it
    return NextResponse.json({ received: true, result });
  } catch (e) {
    if (e instanceof OrderError) {
      const status = e.code === "amount-mismatch" ? 422 : 409;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("[webhook] processing failed", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
