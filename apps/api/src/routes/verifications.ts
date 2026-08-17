import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RELATIONSHIP_TYPE, maxVisibilityFor } from '@bid/core';
import { badRequest, forbidden, notFound, resolveAccess, type ApiContext } from '../context.js';

const createVerificationSchema = z.object({
  subjectBidId: z.string().optional(),
  subjectName: z.string().min(2),
  relationshipType: z.enum(RELATIONSHIP_TYPE),
  policyId: z.string(),
  relationshipId: z.string().optional(),
  campaignId: z.string().optional(),
});

const bgvSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  policyId: z.string(),
});

export async function registerVerificationRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  app.post('/v1/verification-requests', async (request, reply) => {
    const access = resolveAccess(context, request);
    const body = createVerificationSchema.safeParse(request.body);
    if (!body.success) throw badRequest('Invalid verification payload', body.error.flatten());

    const subject = body.data.subjectBidId ? platform.organizations.byBidId(body.data.subjectBidId) : undefined;
    if (body.data.subjectBidId && !subject) throw notFound('Subject organization');

    const verification = platform.verifications.create({
      workspaceId: access.workspaceId,
      requesterOrganizationId: access.organizationId,
      subjectOrganizationId: subject?.id,
      subjectName: subject?.displayName ?? body.data.subjectName,
      relationshipId: body.data.relationshipId,
      relationshipType: body.data.relationshipType,
      policyId: body.data.policyId,
      campaignId: body.data.campaignId,
      actor: access,
    });

    reply.code(201);
    return { data: serializeRequest(context, verification.id) };
  });

  app.get('/v1/verification-requests', async (request) => {
    const access = resolveAccess(context, request);
    const requests = platform.verifications.listForWorkspace(access.workspaceId);
    return {
      data: requests.map((verification) => ({
        id: verification.id,
        bidId: verification.bidId,
        subjectName: verification.subjectName,
        status: verification.status,
        decision: verification.decision,
        policyId: verification.policyId,
        policyVersion: verification.policyVersion,
        createdAt: verification.createdAt,
        completedAt: verification.completedAt,
      })),
      count: requests.length,
    };
  });

  app.get('/v1/verification-requests/:id', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const verification = platform.verifications.get(id);
    if (!verification) throw notFound('Verification request');
    if (verification.workspaceId !== access.workspaceId && verification.subjectOrganizationId !== access.organizationId) {
      throw notFound('Verification request');
    }
    return { data: serializeRequest(context, id, access.workspaceId === verification.workspaceId) };
  });

  /** Executes the plan. Long-running in production; queued behind the same contract. */
  app.post('/v1/verification-requests/:id/run', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const verification = platform.verifications.get(id);
    if (!verification) throw notFound('Verification request');
    if (verification.workspaceId !== access.workspaceId) throw forbidden('Only the requesting workspace can run this verification.');

    const body = z.object({ mode: z.enum(['ALL', 'NEXT']).default('ALL') }).parse(request.body ?? {});
    if (body.mode === 'NEXT') {
      const check = await platform.verifications.runNextCheck(id);
      return { data: { executed: check?.checkCode ?? null, status: platform.verifications.get(id)?.status } };
    }
    await platform.runVerification(id);
    return { data: serializeRequest(context, id, true) };
  });

  app.post('/v1/verification-requests/:id/decision', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const verification = platform.verifications.get(id);
    if (!verification) throw notFound('Verification request');
    if (verification.workspaceId !== access.workspaceId) throw forbidden('Only the requesting workspace can decide.');

    const body = z
      .object({
        decision: z.enum(['APPROVED', 'APPROVED_WITH_CONDITIONS', 'REJECTED']),
        note: z.string().min(3),
      })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid decision payload', body.error.flatten());

    // Recording a decision is a controlled action: an API client may read and
    // initiate, but deciding acceptability stays with a human role.
    if (access.viaApiKey && !(access.scopes ?? []).includes('*') && !(access.scopes ?? []).includes('verification:decide')) {
      throw forbidden('This API key is not scoped to record verification decisions.');
    }

    platform.verifications.decide(id, body.data.decision, body.data.note, { ...access, roles: ['COMPLIANCE_MANAGER'] });
    return { data: serializeRequest(context, id, true) };
  });

  app.get('/v1/verification-requests/:id/evidence', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const verification = platform.verifications.get(id);
    if (!verification) throw notFound('Verification request');

    const isOwner = verification.workspaceId === access.workspaceId;
    const isSubject = verification.subjectOrganizationId === access.organizationId;
    if (!isOwner && !isSubject) throw notFound('Verification request');

    const relationship = verification.relationshipId ? platform.store.relationships.get(verification.relationshipId) : undefined;
    const maxVisibility = isOwner
      ? 'RESTRICTED'
      : maxVisibilityFor({
          ctx: access,
          subjectOrganizationId: verification.subjectOrganizationId,
          relationship,
        });

    const evidence = platform.verifications.evidence(id, maxVisibility);
    return {
      data: evidence.map((item) => ({
        what: item.what,
        source: item.source,
        attribution: item.attribution,
        provider: item.providerName,
        method: item.method,
        checkedAt: item.checkedAt,
        result: item.result,
        confidence: item.confidence,
        scope: item.scope,
        reference: item.reference,
        freshness: item.freshness,
        expiresAt: item.expiresAt,
        policyVersion: item.policyVersion,
        visibility: item.visibility,
      })),
      count: evidence.length,
      redacted: !isOwner,
    };
  });

  /* ---------------- documents ---------------- */

  app.get('/v1/verification-requests/:id/documents', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const verification = platform.verifications.get(id);
    if (!verification) throw notFound('Verification request');
    // Both sides of the request need this list: the subject to know what to
    // send, the requester to know what is still missing.
    if (verification.workspaceId !== access.workspaceId && verification.subjectOrganizationId !== access.organizationId) {
      throw notFound('Verification request');
    }
    const documents = platform.verifications.documents(id);
    return {
      data: documents.map((document) => ({
        id: document.id,
        code: document.code,
        label: document.label,
        required: document.required,
        visibility: document.visibility,
        status: document.status,
        fileName: document.fileName,
        providedAt: document.providedAt,
        reviewNote: document.reviewNote,
      })),
      outstanding: platform.verifications.outstandingDocuments(id).length,
    };
  });

  /** Supplied by the subject organization, not by the requester. */
  app.post('/v1/verification-requests/:id/documents/:documentId', async (request) => {
    const access = resolveAccess(context, request);
    const { id, documentId } = request.params as { id: string; documentId: string };
    const verification = platform.verifications.get(id);
    if (!verification) throw notFound('Verification request');
    if (verification.subjectOrganizationId !== access.organizationId) {
      throw forbidden('Only the subject organization can provide documents for this verification.');
    }

    const body = z
      .object({ fileName: z.string().min(1), sizeBytes: z.number().min(0).optional(), note: z.string().max(500).optional() })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid document payload', body.error.flatten());

    const document = platform.verifications.provideDocument({
      documentId,
      fileName: body.data.fileName,
      sizeBytes: body.data.sizeBytes,
      note: body.data.note,
      providedByOrganizationId: access.organizationId,
    });
    return {
      data: document,
      outstanding: platform.verifications.outstandingDocuments(id).length,
      note: 'Metadata only in this build. Production issues a signed upload URL and stores the object in encrypted storage.',
    };
  });

  app.post('/v1/verification-requests/:id/documents/:documentId/review', async (request) => {
    const access = resolveAccess(context, request);
    const { id, documentId } = request.params as { id: string; documentId: string };
    const verification = platform.verifications.get(id);
    if (!verification) throw notFound('Verification request');
    if (verification.workspaceId !== access.workspaceId) {
      throw forbidden('Only the requesting workspace can review documents.');
    }

    const body = z.object({ accept: z.boolean(), note: z.string().min(3) }).safeParse(request.body);
    if (!body.success) throw badRequest('Invalid review payload', body.error.flatten());

    return { data: platform.verifications.reviewDocument(documentId, body.data.accept, body.data.note, access) };
  });

  /** Quick status lookup for an organization the caller has a relationship with. */
  app.get('/v1/verification-status/:bidId', async (request) => {
    const access = resolveAccess(context, request);
    const { bidId } = request.params as { bidId: string };
    const organization = platform.organizations.byBidId(bidId);
    if (!organization) throw notFound('Organization');

    const relationship = platform.relationships.relationshipBetween(access.organizationId, organization.id);
    const credential = platform.verifications
      .credentialsForOrganization(organization.id)
      .find((candidate) => candidate.status === 'ACTIVE');

    return {
      data: {
        bidId: organization.bidId,
        displayName: organization.displayName,
        verified: Boolean(credential),
        credential: credential ? { bidId: credential.bidId, issuedAt: credential.issuedAt, expiresAt: credential.expiresAt } : null,
        relationship: relationship
          ? { type: relationship.type, lifecycle: relationship.lifecycle, verificationStatus: relationship.verificationStatus }
          : null,
        disclaimer:
          'Verification status reflects evidence obtained from named sources at the time stated. BID Trust is not a government authority and does not certify organizations.',
      },
    };
  });

  /* ---------------- people / BGV ---------------- */

  app.post('/v1/bgv/requests', async (request, reply) => {
    const access = resolveAccess(context, request);
    if (!access.entitlements.canRunBgv) throw forbidden('Your plan does not include background verification.');

    const body = bgvSchema.safeParse(request.body);
    if (!body.success) throw badRequest('Invalid BGV payload', body.error.flatten());

    const person = platform.organizations.createPerson({
      fullName: body.data.fullName,
      email: body.data.email,
      phone: body.data.phone,
    });
    const relationship = platform.relationships.create({
      workspaceId: access.workspaceId,
      sourceOrganizationId: access.organizationId,
      targetType: 'PERSON',
      targetPersonId: person.id,
      type: 'CANDIDATE',
      policyId: body.data.policyId,
      lifecycle: 'VERIFICATION',
      actor: access,
    });
    const verification = platform.verifications.create({
      workspaceId: access.workspaceId,
      requesterOrganizationId: access.organizationId,
      subjectType: 'PERSON',
      subjectPersonId: person.id,
      subjectName: person.fullName,
      relationshipId: relationship.id,
      relationshipType: 'CANDIDATE',
      policyId: body.data.policyId,
      actor: access,
    });
    const consent = platform.verifications.requestConsent({ verificationRequestId: verification.id });

    reply.code(201);
    return {
      data: {
        verificationId: verification.id,
        verificationBidId: verification.bidId,
        personBidId: person.bidId,
        status: verification.status,
        consent: { id: consent.id, status: consent.status, scope: consent.scope, purpose: consent.purpose },
        note: 'No check will execute until the subject grants consent for the recorded scope.',
      },
    };
  });

  app.post('/v1/consents', async (request, reply) => {
    const access = resolveAccess(context, request);
    const body = z.object({ verificationRequestId: z.string(), purpose: z.string().optional() }).safeParse(request.body);
    if (!body.success) throw badRequest('Invalid consent payload', body.error.flatten());

    const verification = platform.verifications.get(body.data.verificationRequestId);
    if (!verification || verification.workspaceId !== access.workspaceId) throw notFound('Verification request');

    const consent = platform.verifications.requestConsent(body.data);
    reply.code(201);
    return { data: consent };
  });

  app.post('/v1/consents/:id/grant', async (request) => {
    resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const consent = platform.store.consents.get(id);
    if (!consent) throw notFound('Consent');
    // In production this endpoint is reached by the subject through a signed
    // consent link, not by the requesting workspace.
    return { data: platform.verifications.grantConsent(id) };
  });

  app.post('/v1/consents/:id/revoke', async (request) => {
    resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const consent = platform.store.consents.get(id);
    if (!consent) throw notFound('Consent');
    // Consent is withdrawable at any time. Nothing already collected is
    // deleted here; what stops is the authority to collect anything further.
    return { data: platform.verifications.revokeConsent(id) };
  });

  app.post('/v1/verification-requests/:id/finalize', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const verification = platform.verifications.get(id);
    if (!verification) throw notFound('Verification request');
    if (verification.workspaceId !== access.workspaceId) throw notFound('Verification request');
    return { data: platform.verifications.finalize(id, access) };
  });

  app.get('/v1/credentials', async (request) => {
    const access = resolveAccess(context, request);
    const held = platform.verifications.credentialsForOrganization(access.organizationId);
    const issued = platform.verifications.credentialsIssuedBy(access.organizationId);
    return {
      data: {
        held: held.map(serializeCredential),
        issued: issued.map(serializeCredential),
      },
    };
  });
}

function serializeCredential(credential: {
  bidId: string;
  title: string;
  status: string;
  issuedAt: string;
  expiresAt: string;
  policyVersion: number;
}) {
  return {
    bidId: credential.bidId,
    title: credential.title,
    status: credential.status,
    issuedAt: credential.issuedAt,
    expiresAt: credential.expiresAt,
    policyVersion: credential.policyVersion,
  };
}

function serializeRequest(context: ApiContext, id: string, includePrivate = true) {
  const detail = context.platform.verifications.detail(id, includePrivate ? 'RESTRICTED' : 'RELATIONSHIP_ONLY');
  if (!detail) throw notFound('Verification request');
  const { request, checks, documents, assessment, credential } = detail;
  return {
    id: request.id,
    bidId: request.bidId,
    subjectName: request.subjectName,
    subjectType: request.subjectType,
    status: request.status,
    decision: request.decision,
    policyId: request.policyId,
    policyVersion: request.policyVersion,
    policyName: detail.policyName,
    slaDueAt: request.slaDueAt,
    createdAt: request.createdAt,
    completedAt: request.completedAt,
    expiresAt: request.expiresAt,
    costPaise: includePrivate ? request.costPaise : undefined,
    documents: documents.map((document) => ({
      id: document.id,
      label: document.label,
      required: document.required,
      status: document.status,
    })),
    outstandingDocuments: context.platform.verifications.outstandingDocuments(id).length,
    checks: checks.map((check) => ({
      checkCode: check.checkCode,
      category: check.category,
      required: check.required,
      blocking: check.blocking,
      status: check.status,
      providerId: includePrivate ? check.providerId : undefined,
    })),
    assessment: assessment
      ? {
          band: assessment.band,
          score: assessment.score,
          freshness: assessment.freshness,
          categories: assessment.categories.filter((category) => category.total > 0),
          missingChecks: assessment.missingChecks,
          failedChecks: assessment.failedChecks,
          explanation: assessment.explanation,
          disclaimer: assessment.disclaimer,
          expiresAt: assessment.expiresAt,
        }
      : null,
    credential: credential ? { bidId: credential.bidId, status: credential.status, expiresAt: credential.expiresAt } : null,
  };
}
