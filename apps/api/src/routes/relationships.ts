import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RELATIONSHIP_TYPE, RISK_LEVEL } from '@bid/core';
import { badRequest, forbidden, notFound, resolveAccess, type ApiContext } from '../context.js';

const invitationSchema = z.object({
  organizationName: z.string().min(2),
  email: z.string().email(),
  organizationBidId: z.string().optional(),
  relationshipType: z.enum(RELATIONSHIP_TYPE),
  policyId: z.string(),
  campaignId: z.string().optional(),
  message: z.string().max(500).optional(),
});

const relationshipSchema = z.object({
  counterpartyBidId: z.string(),
  type: z.enum(RELATIONSHIP_TYPE),
  riskLevel: z.enum(RISK_LEVEL).default('STANDARD'),
  policyId: z.string().optional(),
  contractReference: z.string().optional(),
  label: z.string().optional(),
});

export async function registerRelationshipRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  /* ---------------- invitations ---------------- */

  app.post('/v1/invitations', async (request, reply) => {
    const access = resolveAccess(context, request);
    const body = invitationSchema.safeParse(request.body);
    if (!body.success) throw badRequest('Invalid invitation payload', body.error.flatten());

    const counterparty = body.data.organizationBidId ? platform.organizations.byBidId(body.data.organizationBidId) : undefined;
    const result = platform.inviteCounterparty({
      requesterOrganizationId: access.organizationId,
      counterpartyName: body.data.organizationName,
      counterpartyEmail: body.data.email,
      counterpartyOrganizationId: counterparty?.id,
      relationshipType: body.data.relationshipType,
      policyId: body.data.policyId,
      campaignId: body.data.campaignId,
      actor: access,
    });

    reply.code(201);
    return {
      data: {
        invitationId: result.invitation.id,
        status: result.invitation.status,
        counterparty: { bidId: result.counterparty.bidId, displayName: result.counterparty.displayName },
        relationshipId: result.relationship.bidId,
        verificationRequestId: result.verification.bidId,
        verificationId: result.verification.id,
      },
    };
  });

  app.get('/v1/invitations', async (request) => {
    const access = resolveAccess(context, request);
    const invitations = platform.relationships.invitationsForWorkspace(access.workspaceId);
    return { data: invitations, count: invitations.length };
  });

  app.get('/v1/invitations/:id', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const invitation = platform.store.invitations.get(id);
    if (!invitation) throw notFound('Invitation');
    if (invitation.workspaceId !== access.workspaceId && invitation.toOrganizationId !== access.organizationId) {
      throw notFound('Invitation');
    }
    return { data: invitation };
  });

  /** Accepting is performed by the invited organization, not the sender. */
  app.post('/v1/invitations/:id/accept', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const invitation = platform.store.invitations.get(id);
    if (!invitation) throw notFound('Invitation');
    if (invitation.toOrganizationId && invitation.toOrganizationId !== access.organizationId) {
      throw forbidden('Only the invited organization can accept this invitation.');
    }
    const result = platform.acceptInvitation(id);
    return {
      data: {
        organizationBidId: result.organization.bidId,
        commercialState: result.organization.commercialState,
        workspaceId: result.workspace?.id,
        verificationId: result.verification?.id,
      },
    };
  });

  app.post('/v1/invitations/:id/decline', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const invitation = platform.store.invitations.get(id);
    if (!invitation) throw notFound('Invitation');
    if (invitation.toOrganizationId && invitation.toOrganizationId !== access.organizationId) {
      throw forbidden('Only the invited organization can decline this invitation.');
    }
    return { data: platform.relationships.declineInvitation(id) };
  });

  /* ---------------- relationships ---------------- */

  app.post('/v1/relationships', async (request, reply) => {
    const access = resolveAccess(context, request);
    const body = relationshipSchema.safeParse(request.body);
    if (!body.success) throw badRequest('Invalid relationship payload', body.error.flatten());

    const counterparty = platform.organizations.byBidId(body.data.counterpartyBidId);
    if (!counterparty) throw notFound('Counterparty organization');

    const relationship = platform.relationships.create({
      workspaceId: access.workspaceId,
      sourceOrganizationId: access.organizationId,
      targetOrganizationId: counterparty.id,
      type: body.data.type,
      riskLevel: body.data.riskLevel,
      policyId: body.data.policyId,
      contractReference: body.data.contractReference,
      label: body.data.label,
      actor: access,
    });
    reply.code(201);
    return { data: relationship };
  });

  app.get('/v1/relationships', async (request) => {
    const access = resolveAccess(context, request);
    const relationships = platform.relationships.listForWorkspace(access.workspaceId);
    return { data: relationships, count: relationships.length };
  });

  app.get('/v1/relationships/:id', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const relationship =
      platform.store.relationships.get(id) ?? platform.store.relationships.first((candidate) => candidate.bidId === id);
    if (!relationship || relationship.workspaceId !== access.workspaceId) throw notFound('Relationship');
    return { data: relationship };
  });

  app.patch('/v1/relationships/:id', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const relationship = platform.store.relationships.get(id);
    if (!relationship || relationship.workspaceId !== access.workspaceId) throw notFound('Relationship');

    const body = z
      .object({
        lifecycle: z.string().optional(),
        riskLevel: z.enum(RISK_LEVEL).optional(),
        contractReference: z.string().optional(),
        endDate: z.string().optional(),
      })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid relationship payload', body.error.flatten());

    const updated = body.data.lifecycle
      ? platform.relationships.transition(relationship.id, body.data.lifecycle as never, 'updated via API', access)
      : platform.relationships.update(relationship.id, body.data as never, access);
    return { data: updated };
  });

  /* ---------------- authorizations ---------------- */

  app.post('/v1/authorizations', async (request, reply) => {
    const access = resolveAccess(context, request);
    const body = z
      .object({
        granteeBidId: z.string(),
        operation: z.enum(['RUN_VERIFICATION', 'VIEW_VERIFICATION_RESULT', 'RUN_BGV_ON_BEHALF', 'VIEW_RELATIONSHIP', 'MANAGE_MONITORING']),
        scope: z.array(z.string()).default([]),
        days: z.number().min(1).max(1095).default(365),
        relationshipId: z.string().optional(),
      })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid authorization payload', body.error.flatten());

    const grantee = platform.organizations.byBidId(body.data.granteeBidId);
    if (!grantee) throw notFound('Grantee organization');

    const authorization = platform.verifications.grantAuthorization({
      grantorOrganizationId: access.organizationId,
      granteeOrganizationId: grantee.id,
      operation: body.data.operation,
      scope: body.data.scope,
      days: body.data.days,
      relationshipId: body.data.relationshipId,
    });
    reply.code(201);
    return { data: authorization };
  });
}
