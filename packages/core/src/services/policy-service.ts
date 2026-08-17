import type { Industry, RelationshipType, RiskLevel, SubjectType } from '../domain/enums.js';
import type { Policy, PolicyVersion } from '../domain/types.js';
import { assertPermission, type AccessContext } from '../security/access.js';
import { compilePlan, type VerificationPlan } from '../policy/plan.js';
import { POLICY_TEMPLATES, type PolicyTemplate } from '../policy/policy-templates.js';
import type { PlatformContext } from './context.js';

/**
 * Policy engine (Section 9, ADR-004).
 *
 * Industry behaviour is configuration, never a code branch. A policy version is
 * immutable once it has been used to reach a completed decision — editing then
 * produces a new version so historical decisions stay reconstructible.
 */
export class PolicyService {
  constructor(private readonly ctx: PlatformContext) {}

  /** Policies visible to a workspace: its own plus BID-published templates. */
  listForWorkspace(workspaceId?: string): Policy[] {
    return this.ctx.store.policies.find((p) => !p.workspaceId || p.workspaceId === workspaceId);
  }

  listAll(): Policy[] {
    return this.ctx.store.policies.all();
  }

  get(id: string): Policy | undefined {
    return this.ctx.store.policies.get(id);
  }

  require(id: string): Policy {
    return this.ctx.store.policies.require(id);
  }

  versions(policyId: string): PolicyVersion[] {
    return this.ctx.store.policyVersions.find((v) => v.policyId === policyId).sort((a, b) => a.version - b.version);
  }

  version(policyId: string, version: number): PolicyVersion {
    const found = this.ctx.store.policyVersions.first((v) => v.policyId === policyId && v.version === version);
    if (!found) throw new Error(`Policy version not found: ${policyId} v${version}`);
    return found;
  }

  currentVersion(policyId: string): PolicyVersion {
    const policy = this.require(policyId);
    return this.version(policyId, policy.currentVersion);
  }

  plan(policyId: string, version?: number): VerificationPlan {
    const policyVersion = version ? this.version(policyId, version) : this.currentVersion(policyId);
    return compilePlan(policyVersion);
  }

  createFromTemplate(template: PolicyTemplate, options: { workspaceId?: string; createdBy?: string; system?: boolean; name?: string }): Policy {
    return this.create({
      name: options.name ?? template.name,
      description: template.description,
      subjectType: template.subjectType,
      relationshipType: template.relationshipType,
      industry: template.industry,
      riskLevel: template.riskLevel,
      workspaceId: options.workspaceId,
      createdBy: options.createdBy ?? 'BID',
      system: options.system ?? false,
      version: {
        requiredChecks: template.requiredChecks,
        optionalChecks: template.optionalChecks,
        documents: template.documents,
        thresholds: template.thresholds,
        validityDays: template.validityDays,
        reverificationDays: template.reverificationDays,
        monitoringFrequency: template.monitoringFrequency,
        approvalRule: template.approvalRule,
        requiresConsent: template.requiresConsent,
      },
    });
  }

  create(input: {
    name: string;
    description: string;
    subjectType: SubjectType;
    relationshipType: RelationshipType;
    industry: Industry;
    riskLevel: RiskLevel;
    workspaceId?: string;
    createdBy: string;
    system?: boolean;
    version: Omit<PolicyVersion, 'id' | 'policyId' | 'version' | 'createdAt' | 'sealedAt'>;
    actor?: AccessContext;
  }): Policy {
    if (input.actor) assertPermission(input.actor, 'policy:write');
    const now = this.ctx.now();
    const policy: Policy = {
      id: this.ctx.ids.next('pol'),
      bidId: this.ctx.bidIds.next('POL'),
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description,
      subjectType: input.subjectType,
      relationshipType: input.relationshipType,
      industry: input.industry,
      riskLevel: input.riskLevel,
      currentVersion: 1,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      system: input.system ?? false,
    };
    this.ctx.store.policies.insert(policy);
    this.ctx.store.policyVersions.insert({
      ...input.version,
      id: this.ctx.ids.next('pver'),
      policyId: policy.id,
      version: 1,
      createdAt: now,
    });
    this.ctx.audit({
      ctx: input.actor,
      workspaceId: input.workspaceId,
      action: 'policy.created',
      resourceType: 'policy',
      resourceId: policy.id,
      summary: `Policy "${policy.name}" created (v1, ${input.riskLevel} risk).`,
      metadata: { riskLevel: input.riskLevel, checks: input.version.requiredChecks.length },
    });
    this.ctx.emit('PolicyCreated', { policyId: policy.id, name: policy.name }, { workspaceId: input.workspaceId });
    return policy;
  }

  /**
   * Creates a new immutable version. Never mutates an existing version — a
   * sealed version has already justified a decision somewhere.
   */
  createVersion(
    policyId: string,
    changes: Partial<Omit<PolicyVersion, 'id' | 'policyId' | 'version' | 'createdAt' | 'sealedAt'>>,
    actor?: AccessContext,
  ): PolicyVersion {
    if (actor) assertPermission(actor, 'policy:write');
    const policy = this.require(policyId);
    const current = this.currentVersion(policyId);
    const now = this.ctx.now();
    const next: PolicyVersion = {
      ...current,
      ...changes,
      id: this.ctx.ids.next('pver'),
      policyId,
      version: policy.currentVersion + 1,
      createdAt: now,
      sealedAt: undefined,
    };
    this.ctx.store.policyVersions.insert(next);
    this.ctx.store.policies.update(policyId, { currentVersion: next.version, updatedAt: now });
    this.ctx.audit({
      ctx: actor,
      workspaceId: policy.workspaceId,
      action: 'policy.version_created',
      resourceType: 'policy',
      resourceId: policyId,
      summary: `Policy "${policy.name}" v${next.version} created. Earlier versions remain immutable.`,
      metadata: { version: next.version },
    });
    return next;
  }

  /** Marks a version immutable because a decision now depends on it. */
  seal(policyId: string, version: number): PolicyVersion {
    const policyVersion = this.version(policyId, version);
    if (policyVersion.sealedAt) return policyVersion;
    const sealed = this.ctx.store.policyVersions.update(policyVersion.id, { sealedAt: this.ctx.now() });
    this.ctx.emit('PolicyVersionSealed', { policyId, version });
    return sealed;
  }

  isSealed(policyId: string, version: number): boolean {
    return Boolean(this.version(policyId, version).sealedAt);
  }

  templates(): PolicyTemplate[] {
    return POLICY_TEMPLATES;
  }

  /** Templates that make sense for a relationship type, best match first. */
  suggestFor(relationshipType: RelationshipType, industry?: Industry): Policy[] {
    return this.listAll()
      .filter((p) => p.relationshipType === relationshipType || !industry)
      .sort((a, b) => {
        const score = (p: Policy) => (p.relationshipType === relationshipType ? 2 : 0) + (industry && p.industry === industry ? 1 : 0);
        return score(b) - score(a);
      })
      .slice(0, 6);
  }
}
