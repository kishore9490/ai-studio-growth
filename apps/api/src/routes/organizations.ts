import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { INDUSTRY } from '@bid/core';
import { badRequest, notFound, resolveAccess, type ApiContext } from '../context.js';

const createOrganizationSchema = z.object({
  legalName: z.string().min(2),
  displayName: z.string().min(2).optional(),
  industry: z.enum(INDUSTRY).default('GENERIC'),
  country: z.string().length(2).default('IN'),
  city: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

const patchOrganizationSchema = createOrganizationSchema.partial();

export async function registerOrganizationRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  app.post('/v1/organizations', async (request, reply) => {
    const access = resolveAccess(context, request);
    const body = createOrganizationSchema.safeParse(request.body);
    if (!body.success) throw badRequest('Invalid organization payload', body.error.flatten());

    const organization = platform.organizations.create({ ...body.data, introducedByOrgId: access.organizationId });
    reply.code(201);
    return { data: organization };
  });

  app.get('/v1/organizations', async (request) => {
    resolveAccess(context, request);
    const query = z.object({ q: z.string().optional(), limit: z.coerce.number().min(1).max(200).default(50) }).parse(request.query);
    const organizations = platform.organizations
      .list()
      .filter((organization) =>
        query.q ? `${organization.displayName} ${organization.bidId}`.toLowerCase().includes(query.q.toLowerCase()) : true,
      )
      .slice(0, query.limit)
      // Network-level listing exposes identity only — never commercial detail
      // of another tenant.
      .map((organization) => ({
        bidId: organization.bidId,
        displayName: organization.displayName,
        legalName: organization.legalName,
        industry: organization.industry,
        country: organization.country,
        lifecycle: organization.lifecycle,
      }));
    return { data: organizations, count: organizations.length };
  });

  app.get('/v1/organizations/:bidId', async (request) => {
    const access = resolveAccess(context, request);
    const { bidId } = request.params as { bidId: string };
    const organization = platform.organizations.byBidId(bidId);
    if (!organization) throw notFound('Organization');

    const isSelf = organization.id === access.organizationId;
    const relationship = platform.relationships.relationshipBetween(access.organizationId, organization.id);

    return {
      data: {
        bidId: organization.bidId,
        displayName: organization.displayName,
        legalName: organization.legalName,
        industry: organization.industry,
        country: organization.country,
        city: organization.city,
        website: organization.website,
        description: organization.description,
        lifecycle: organization.lifecycle,
        // Commercial state and relationship context are only meaningful — and
        // only visible — to the organization itself or an active counterparty.
        commercialState: isSelf || relationship ? organization.commercialState : undefined,
        relationship: relationship
          ? { id: relationship.bidId, type: relationship.type, lifecycle: relationship.lifecycle }
          : undefined,
        credentials: platform.verifications
          .credentialsForOrganization(organization.id)
          .filter((credential) => credential.status === 'ACTIVE')
          .map((credential) => ({ bidId: credential.bidId, title: credential.title, expiresAt: credential.expiresAt })),
      },
    };
  });

  app.patch('/v1/organizations/:bidId', async (request) => {
    const access = resolveAccess(context, request);
    const { bidId } = request.params as { bidId: string };
    const organization = platform.organizations.byBidId(bidId);
    if (!organization) throw notFound('Organization');
    if (organization.id !== access.organizationId) throw notFound('Organization');

    const body = patchOrganizationSchema.safeParse(request.body);
    if (!body.success) throw badRequest('Invalid organization payload', body.error.flatten());

    return { data: platform.organizations.update(organization.id, body.data, access) };
  });
}
