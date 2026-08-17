import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { INDUSTRY, RELATIONSHIP_TYPE, RISK_LEVEL, SUBJECT_TYPE, VERIFICATION_TARGET, generatePolicy } from '@bid/core';
import { badRequest, forbidden, notFound, resolveAccess, type ApiContext } from '../context.js';

const checkRequirementSchema = z.object({
  checkCode: z.string(),
  required: z.boolean().default(true),
  blocking: z.boolean().default(false),
  validityDays: z.number().optional(),
  notes: z.string().optional(),
});

const createPolicySchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  subjectType: z.enum(SUBJECT_TYPE).default('ORGANIZATION'),
  relationshipType: z.enum(RELATIONSHIP_TYPE),
  industry: z.enum(INDUSTRY).default('GENERIC'),
  riskLevel: z.enum(RISK_LEVEL).default('STANDARD'),
  requiredChecks: z.array(checkRequirementSchema).min(1),
  optionalChecks: z.array(checkRequirementSchema).default([]),
  validityDays: z.number().min(1).default(365),
  reverificationDays: z.number().min(1).default(335),
  monitoringFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'EVENT_DRIVEN']).default('QUARTERLY'),
  approvalRule: z.enum(['AUTO', 'MANUAL', 'DUAL_CONTROL']).default('MANUAL'),
  requiresConsent: z.boolean().default(false),
  thresholds: z
    .object({ autoApproveScore: z.number(), reviewScore: z.number(), maxBlockingFailures: z.number() })
    .default({ autoApproveScore: 75, reviewScore: 55, maxBlockingFailures: 0 }),
});

export async function registerPolicyRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  app.get('/v1/policies', async (request) => {
    const access = resolveAccess(context, request);
    const policies = platform.policies.listForWorkspace(access.workspaceId).map((policy) => ({
      id: policy.id,
      bidId: policy.bidId,
      name: policy.name,
      description: policy.description,
      subjectType: policy.subjectType,
      relationshipType: policy.relationshipType,
      industry: policy.industry,
      riskLevel: policy.riskLevel,
      currentVersion: policy.currentVersion,
      system: policy.system,
    }));
    return { data: policies, count: policies.length };
  });

  app.get('/v1/policies/:id', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const policy = platform.policies.get(id);
    if (!policy) throw notFound('Policy');
    if (policy.workspaceId && policy.workspaceId !== access.workspaceId) throw notFound('Policy');
    return {
      data: {
        ...policy,
        versions: platform.policies.versions(policy.id),
      },
    };
  });

  app.get('/v1/policies/:id/plan', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const policy = platform.policies.get(id);
    if (!policy) throw notFound('Policy');
    if (policy.workspaceId && policy.workspaceId !== access.workspaceId) throw notFound('Policy');

    const plan = platform.policies.plan(policy.id);
    return {
      data: {
        policyId: plan.policyId,
        policyVersion: plan.policyVersion,
        requiresConsent: plan.requiresConsent,
        consentScope: plan.consentScope,
        estimatedCostPaise: plan.estimatedCostPaise,
        estimatedSlaHours: plan.estimatedSlaHours,
        checks: plan.checks.map((check) => ({
          checkCode: check.checkCode,
          label: check.definition.label,
          category: check.definition.category,
          source: check.definition.sourceLabel,
          method: check.definition.method,
          required: check.required,
          blocking: check.blocking,
          validityDays: check.validityDays,
        })),
      },
    };
  });

  app.post('/v1/policies', async (request, reply) => {
    const access = resolveAccess(context, request);
    if (!access.entitlements.canCreatePolicies) {
      throw forbidden('Your plan does not include custom policies.');
    }
    const body = createPolicySchema.safeParse(request.body);
    if (!body.success) throw badRequest('Invalid policy payload', body.error.flatten());

    const policy = platform.policies.create({
      name: body.data.name,
      description: body.data.description,
      subjectType: body.data.subjectType,
      relationshipType: body.data.relationshipType,
      industry: body.data.industry,
      riskLevel: body.data.riskLevel,
      workspaceId: access.workspaceId,
      createdBy: access.userName,
      version: {
        requiredChecks: body.data.requiredChecks,
        optionalChecks: body.data.optionalChecks,
        documents: [],
        thresholds: body.data.thresholds,
        validityDays: body.data.validityDays,
        reverificationDays: body.data.reverificationDays,
        monitoringFrequency: body.data.monitoringFrequency,
        approvalRule: body.data.approvalRule,
        requiresConsent: body.data.requiresConsent,
      },
      actor: access,
    });
    reply.code(201);
    return { data: policy };
  });

  /** Editing a policy always produces a new version — never a mutation. */
  app.post('/v1/policies/:id/versions', async (request, reply) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const policy = platform.policies.get(id);
    if (!policy) throw notFound('Policy');
    if (policy.workspaceId !== access.workspaceId) throw forbidden('Only the owning workspace can version this policy.');

    const body = z
      .object({
        requiredChecks: z.array(checkRequirementSchema).optional(),
        optionalChecks: z.array(checkRequirementSchema).optional(),
        validityDays: z.number().optional(),
        approvalRule: z.enum(['AUTO', 'MANUAL', 'DUAL_CONTROL']).optional(),
        thresholds: z
          .object({ autoApproveScore: z.number(), reviewScore: z.number(), maxBlockingFailures: z.number() })
          .optional(),
      })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid version payload', body.error.flatten());

    const version = platform.policies.createVersion(policy.id, body.data, access);
    reply.code(201);
    return { data: version };
  });

  /** Policy generator — the domain-agnosticism demo, exposed as an API. */
  app.post('/v1/policies/generate', async (request) => {
    resolveAccess(context, request);
    const body = z
      .object({
        target: z.enum(VERIFICATION_TARGET),
        industry: z.enum(INDUSTRY),
        riskLevel: z.enum(RISK_LEVEL),
      })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid generation payload', body.error.flatten());
    return { data: generatePolicy(body.data) };
  });
}
