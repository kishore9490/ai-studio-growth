import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MONITORING_SIGNALS } from '@bid/core';
import { badRequest, forbidden, notFound, resolveAccess, type ApiContext } from '../context.js';

export async function registerMonitoringRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  app.post('/v1/monitoring', async (request, reply) => {
    const access = resolveAccess(context, request);
    if (!access.entitlements.canUseMonitoring) throw forbidden('Your plan does not include monitoring.');

    const body = z
      .object({
        subjectBidId: z.string(),
        relationshipId: z.string().optional(),
        signals: z.array(z.string()).optional(),
        frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'EVENT_DRIVEN']).default('QUARTERLY'),
      })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid monitoring payload', body.error.flatten());

    const organization = platform.organizations.byBidId(body.data.subjectBidId);
    if (!organization) throw notFound('Subject organization');

    const rule = platform.monitoring.enable({
      workspaceId: access.workspaceId,
      subjectRef: organization.bidId,
      relationshipId: body.data.relationshipId,
      signals: body.data.signals,
      frequency: body.data.frequency,
      actor: access,
    });
    reply.code(201);
    return { data: rule, availableSignals: MONITORING_SIGNALS };
  });

  app.get('/v1/monitoring', async (request) => {
    const access = resolveAccess(context, request);
    const rules = platform.monitoring.rules(access.workspaceId);
    return { data: rules, count: rules.length };
  });

  app.get('/v1/monitoring/alerts', async (request) => {
    const access = resolveAccess(context, request);
    const query = z.object({ status: z.string().optional() }).parse(request.query);
    const alerts = platform.monitoring
      .alerts(access.workspaceId)
      .filter((alert) => (query.status ? alert.status === query.status : true));
    return { data: alerts, count: alerts.length };
  });

  app.post('/v1/monitoring/alerts/:id/status', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const alert = platform.store.monitoringEvents.get(id);
    if (!alert || alert.workspaceId !== access.workspaceId) throw notFound('Alert');

    const body = z
      .object({ status: z.enum(['OPEN', 'ACKNOWLEDGED', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']) })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid status payload', body.error.flatten());

    return { data: platform.monitoring.setAlertStatus(id, body.data.status, access) };
  });

  /** Demo affordance: runs a sweep against the mock signal feed. */
  app.post('/v1/monitoring/sweep', async (request) => {
    const access = resolveAccess(context, request);
    if (!access.entitlements.canUseMonitoring) throw forbidden('Your plan does not include monitoring.');
    const raised = platform.monitoring.runSweep(access.workspaceId, Math.floor(Date.now() / 60000) % 1000);
    return { data: raised, count: raised.length, note: 'Signals in this build come from a mock feed and are labelled with their source.' };
  });
}
