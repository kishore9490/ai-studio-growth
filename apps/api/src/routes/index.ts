import type { FastifyInstance } from 'fastify';
import type { ApiContext } from '../context.js';
import { registerOrganizationRoutes } from './organizations.js';
import { registerRelationshipRoutes } from './relationships.js';
import { registerPolicyRoutes } from './policies.js';
import { registerVerificationRoutes } from './verifications.js';
import { registerCampaignRoutes } from './campaigns.js';
import { registerMonitoringRoutes } from './monitoring.js';
import { registerPublicRoutes } from './public.js';
import { registerBillingRoutes } from './billing.js';

export const API_INDEX = {
  service: 'BID Trust API',
  version: 'v1',
  documentation: 'docs/API.md',
  authentication: 'Send x-bid-api-key (or Authorization: Bearer <key>). Keys are workspace-scoped.',
  resources: [
    'POST   /v1/organizations',
    'GET    /v1/organizations',
    'GET    /v1/organizations/{bidId}',
    'PATCH  /v1/organizations/{bidId}',
    'POST   /v1/invitations',
    'GET    /v1/invitations',
    'GET    /v1/invitations/{id}',
    'POST   /v1/invitations/{id}/accept',
    'POST   /v1/relationships',
    'GET    /v1/relationships',
    'GET    /v1/relationships/{id}',
    'PATCH  /v1/relationships/{id}',
    'GET    /v1/policies',
    'POST   /v1/policies',
    'GET    /v1/policies/{id}',
    'POST   /v1/policies/{id}/versions',
    'GET    /v1/policies/{id}/plan',
    'POST   /v1/verification-requests',
    'GET    /v1/verification-requests',
    'GET    /v1/verification-requests/{id}',
    'POST   /v1/verification-requests/{id}/run',
    'POST   /v1/verification-requests/{id}/decision',
    'GET    /v1/verification-requests/{id}/evidence',
    'GET    /v1/verification-status/{bidId}',
    'POST   /v1/bgv/requests',
    'POST   /v1/consents',
    'POST   /v1/consents/{id}/grant',
    'POST   /v1/authorizations',
    'GET    /v1/credentials',
    'POST   /v1/campaigns',
    'GET    /v1/campaigns',
    'GET    /v1/campaigns/{id}',
    'POST   /v1/campaigns/{id}/members',
    'POST   /v1/monitoring',
    'GET    /v1/monitoring/alerts',
    'GET    /v1/billing/subscription',
    'GET    /v1/billing/usage',
    'GET    /v1/plans',
    'GET    /v1/public/profiles/{bidId}',
    'GET    /v1/public/cards/{bidId}',
  ],
  notes: [
    'Every authenticated route is tenant-scoped: records outside the caller workspace are invisible, not merely filtered.',
    'Public routes serve the published projection only and never expose evidence.',
  ],
};

export async function registerRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  app.get('/', async () => API_INDEX);
  app.get('/v1', async () => API_INDEX);
  app.get('/health', async () => ({
    status: 'ok',
    organizations: context.platform.store.organizations.count(),
    verifications: context.platform.store.verificationRequests.count(),
    uptimeSeconds: Math.round(process.uptime()),
  }));

  await registerPublicRoutes(app, context);
  await registerOrganizationRoutes(app, context);
  await registerRelationshipRoutes(app, context);
  await registerPolicyRoutes(app, context);
  await registerVerificationRoutes(app, context);
  await registerCampaignRoutes(app, context);
  await registerMonitoringRoutes(app, context);
  await registerBillingRoutes(app, context);
}
