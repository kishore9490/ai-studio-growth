import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PRICING_DISCLAIMER } from '@bid/core';
import { badRequest, notFound, resolveAccess, type ApiContext } from '../context.js';

export async function registerBillingRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  app.get('/v1/plans', async () => ({
    data: platform.billing.plans().map((plan) => ({
      id: plan.id,
      tier: plan.tier,
      name: plan.name,
      monthlyPricePaise: plan.monthlyPricePaise,
      includedChecks: plan.includedChecks,
      overagePerCheckPaise: plan.overagePerCheckPaise,
      quoteOnly: plan.quoteOnly,
      entitlements: plan.entitlements,
      highlights: plan.highlights,
    })),
    disclaimer: PRICING_DISCLAIMER,
  }));

  app.get('/v1/billing/subscription', async (request) => {
    const access = resolveAccess(context, request);
    const subscription = platform.billing.subscriptionFor(access.workspaceId);
    const plan = subscription ? platform.billing.plan(subscription.planId) : platform.billing.planByTier('MEMBER_FREE');
    return {
      data: {
        subscription: subscription ?? null,
        plan: plan ? { id: plan.id, tier: plan.tier, name: plan.name } : null,
        entitlements: access.entitlements,
        // A workspace with no subscription is a member, not a customer.
        commercialState: platform.organizations.get(access.organizationId)?.commercialState,
      },
      disclaimer: PRICING_DISCLAIMER,
    };
  });

  app.get('/v1/billing/usage', async (request) => {
    const access = resolveAccess(context, request);
    const query = z.object({ period: z.string().optional() }).parse(request.query);
    return { data: platform.billing.summary(access.workspaceId, query.period) };
  });

  app.get('/v1/billing/invoices', async (request) => {
    const access = resolveAccess(context, request);
    const invoices = platform.billing.invoices(access.workspaceId);
    return { data: invoices, count: invoices.length };
  });

  app.post('/v1/billing/subscription', async (request) => {
    const access = resolveAccess(context, request);
    const body = z.object({ planId: z.string(), seats: z.number().min(1).optional() }).safeParse(request.body);
    if (!body.success) throw badRequest('Invalid subscription payload', body.error.flatten());
    const plan = platform.billing.plan(body.data.planId);
    if (!plan) throw notFound('Plan');

    const subscription = platform.billing.subscribe({
      workspaceId: access.workspaceId,
      organizationId: access.organizationId,
      planId: plan.id,
      seats: body.data.seats,
      actor: { ...access, roles: ['OWNER'] },
    });
    return { data: subscription };
  });
  app.post('/v1/billing/activate-requester', async (request) => {
    const access = resolveAccess(context, request);
    const body = z.object({ planId: z.string(), seats: z.number().min(1).optional() }).safeParse(request.body);
    if (!body.success) throw badRequest('Invalid activation payload', body.error.flatten());
    const plan = platform.billing.plan(body.data.planId);
    if (!plan) throw notFound('Plan');
    if (plan.monthlyPricePaise <= 0) {
      throw badRequest('Requester activation needs a paid plan; free membership does not include it.');
    }

    // Becoming a requester is the transition the whole commercial model turns
    // on, so it is one call: claim the workspace if needed, subscribe, and
    // switch on the requester capability together.
    const result = platform.activateRequester({
      organizationId: access.organizationId,
      planId: plan.id,
      seats: body.data.seats,
      actor: { ...access, roles: ['OWNER'] },
    });
    return { data: { workspaceId: result.workspace.id, subscription: result.subscription } };
  });

  app.post('/v1/billing/subscription/cancel', async (request) => {
    const access = resolveAccess(context, request);
    const cancelled = platform.billing.cancel(access.workspaceId, { ...access, roles: ['OWNER'] });
    if (!cancelled) throw notFound('Subscription');
    return { data: cancelled };
  });
  app.post('/v1/billing/invoices', async (request, reply) => {
    const access = resolveAccess(context, request);
    const invoice = platform.billing.issueInvoice(access.workspaceId, access.organizationId);
    if (!invoice) throw badRequest('There is nothing to invoice for the current period.');
    reply.code(201);
    return { data: invoice };
  });

  app.post('/v1/billing/invoices/:id/pay', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const invoice = platform.store.invoices.get(id);
    if (!invoice || invoice.organizationId !== access.organizationId) throw notFound('Invoice');
    // Recording a payment here stands in for a payment-gateway webhook; the
    // gateway is the only thing that may assert this in a real deployment.
    return { data: platform.billing.recordPayment(id) };
  });
}
