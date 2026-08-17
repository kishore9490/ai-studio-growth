import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RELATIONSHIP_TYPE } from '@bid/core';
import { badRequest, forbidden, notFound, resolveAccess, type ApiContext } from '../context.js';

export async function registerCampaignRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  app.post('/v1/campaigns', async (request, reply) => {
    const access = resolveAccess(context, request);
    if (!access.entitlements.canCreateCampaigns) throw forbidden('Your plan does not include campaigns.');

    const body = z
      .object({
        name: z.string().min(3),
        policyId: z.string(),
        relationshipType: z.enum(RELATIONSHIP_TYPE),
        slaDays: z.number().min(1).max(180).default(14),
      })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid campaign payload', body.error.flatten());

    const campaign = platform.campaigns.create({
      workspaceId: access.workspaceId,
      requesterOrganizationId: access.organizationId,
      ...body.data,
      actor: access,
    });
    reply.code(201);
    return { data: campaign };
  });

  app.get('/v1/campaigns', async (request) => {
    const access = resolveAccess(context, request);
    const campaigns = platform.campaigns.listForWorkspace(access.workspaceId);
    return {
      data: campaigns.map((campaign) => {
        const progress = platform.campaigns.progress(campaign.id);
        return {
          id: campaign.id,
          bidId: campaign.bidId,
          name: campaign.name,
          status: campaign.status,
          invited: progress.invited,
          registered: progress.registered,
          completed: progress.completed,
          exceptions: progress.exceptions,
          completionRate: progress.completionRate,
        };
      }),
      count: campaigns.length,
    };
  });

  app.get('/v1/campaigns/:id', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const campaign = platform.campaigns.get(id);
    if (!campaign || campaign.workspaceId !== access.workspaceId) throw notFound('Campaign');
    const progress = platform.campaigns.progress(campaign.id);
    return { data: { campaign, progress: { ...progress, campaign: undefined } } };
  });

  app.post('/v1/campaigns/:id/members', async (request, reply) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const campaign = platform.campaigns.get(id);
    if (!campaign || campaign.workspaceId !== access.workspaceId) throw notFound('Campaign');

    const body = z
      .object({
        members: z
          .array(z.object({ name: z.string().min(2), email: z.string().email(), organizationBidId: z.string().optional() }))
          .min(1)
          .max(200),
        invite: z.boolean().default(false),
      })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid member payload', body.error.flatten());

    const created = body.data.members.map((member) => {
      const organization = member.organizationBidId ? platform.organizations.byBidId(member.organizationBidId) : undefined;
      const record = platform.campaigns.addMember({
        campaignId: campaign.id,
        targetName: member.name,
        targetEmail: member.email,
        targetOrganizationId: organization?.id,
      });
      return body.data.invite ? platform.campaigns.inviteMember(record.id, access) : record;
    });

    reply.code(201);
    return { data: created, count: created.length };
  });
}
