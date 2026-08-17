import { requireCheckDefinition } from '../domain/check-catalog.js';
import type { CheckStatus, Decision, RelationshipType, SubjectType, Visibility } from '../domain/enums.js';
import type {
  Assessment,
  Authorization,
  Consent,
  Credential,
  Evidence,
  VerificationCheck,
  VerificationRequest,
  VerificationResult,
} from '../domain/types.js';
import { assertPermission, isVisible, type AccessContext } from '../security/access.js';
import { addDays } from '../util/clock.js';
import { stableHash } from '../util/id.js';
import { buildAssessment, freshnessFor } from '../verification/assessment.js';
import type { PlatformContext } from './context.js';
import type { OrganizationService } from './organization-service.js';
import type { PolicyService } from './policy-service.js';

export interface CreateVerificationInput {
  workspaceId: string;
  requesterOrganizationId: string;
  subjectType?: SubjectType;
  subjectOrganizationId?: string;
  subjectPersonId?: string;
  subjectName: string;
  relationshipId?: string;
  relationshipType: RelationshipType;
  policyId: string;
  campaignId?: string;
  actor?: AccessContext;
}

export interface VerificationDetail {
  request: VerificationRequest;
  checks: VerificationCheck[];
  results: VerificationResult[];
  evidence: Evidence[];
  assessment?: Assessment;
  credential?: Credential;
  consent?: Consent;
  policyName: string;
  policyVersionSealed: boolean;
}

/**
 * Verification engine (Section 10).
 *
 * Request → Policy → Plan → Consent/Authorization → Provider router → Provider
 * → Normalized result → Evidence → Assessment → Decision → Credential →
 * Monitoring. No provider-specific logic appears anywhere in this file.
 */
export class VerificationService {
  constructor(
    private readonly ctx: PlatformContext,
    private readonly policies: PolicyService,
    private readonly organizations: OrganizationService,
  ) {}

  /* ---------------- reads ---------------- */

  listForWorkspace(workspaceId: string): VerificationRequest[] {
    return this.ctx.store.verificationRequests
      .find((r) => r.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Requests where this organization is the subject ("requests received"). */
  listForSubject(organizationId: string): VerificationRequest[] {
    return this.ctx.store.verificationRequests
      .find((r) => r.subjectOrganizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): VerificationRequest | undefined {
    return this.ctx.store.verificationRequests.get(id);
  }

  checks(requestId: string): VerificationCheck[] {
    return this.ctx.store.verificationChecks.find((c) => c.verificationRequestId === requestId);
  }

  results(requestId: string): VerificationResult[] {
    return this.ctx.store.verificationResults.find((r) => r.verificationRequestId === requestId);
  }

  /** Evidence, redacted to what the viewer's clearance permits (Rule 13). */
  evidence(requestId: string, maxVisibility: Visibility = 'RESTRICTED'): Evidence[] {
    return this.ctx.store.evidence
      .find((e) => e.verificationRequestId === requestId)
      .filter((e) => isVisible(e.visibility, maxVisibility));
  }

  assessment(requestId: string): Assessment | undefined {
    return this.ctx.store.assessments.first((a) => a.verificationRequestId === requestId);
  }

  detail(requestId: string, maxVisibility: Visibility = 'RESTRICTED'): VerificationDetail | undefined {
    const request = this.get(requestId);
    if (!request) return undefined;
    const policy = this.policies.get(request.policyId);
    return {
      request,
      checks: this.checks(requestId),
      results: this.results(requestId),
      evidence: this.evidence(requestId, maxVisibility),
      assessment: this.assessment(requestId),
      credential: request.credentialId ? this.ctx.store.credentials.get(request.credentialId) : undefined,
      consent: request.consentId ? this.ctx.store.consents.get(request.consentId) : undefined,
      policyName: policy?.name ?? 'Policy',
      policyVersionSealed: policy ? this.policies.isSealed(request.policyId, request.policyVersion) : false,
    };
  }

  /* ---------------- lifecycle ---------------- */

  create(input: CreateVerificationInput): VerificationRequest {
    if (input.actor) assertPermission(input.actor, 'verification:initiate');
    const now = this.ctx.now();
    const policy = this.policies.require(input.policyId);
    const policyVersion = this.policies.currentVersion(input.policyId);
    const plan = this.policies.plan(input.policyId);

    const request: VerificationRequest = {
      id: this.ctx.ids.next('vr'),
      bidId: this.ctx.bidIds.next('VER'),
      workspaceId: input.workspaceId,
      requesterOrganizationId: input.requesterOrganizationId,
      subjectType: input.subjectType ?? policy.subjectType,
      subjectOrganizationId: input.subjectOrganizationId,
      subjectPersonId: input.subjectPersonId,
      subjectName: input.subjectName,
      relationshipId: input.relationshipId,
      relationshipType: input.relationshipType,
      campaignId: input.campaignId,
      policyId: input.policyId,
      policyVersion: policyVersion.version,
      status: 'REQUESTED',
      decision: 'PENDING',
      slaDueAt: addDays(now, Math.max(1, Math.ceil(plan.estimatedSlaHours / 24))),
      createdAt: now,
      updatedAt: now,
      costPaise: 0,
    };
    this.ctx.store.verificationRequests.insert(request);

    for (const planned of plan.checks) {
      const check: VerificationCheck = {
        id: this.ctx.ids.next('vc'),
        verificationRequestId: request.id,
        checkCode: planned.checkCode,
        category: planned.definition.category,
        required: planned.required,
        blocking: planned.blocking,
        status: planned.definition.requiresConsent ? 'BLOCKED_ON_CONSENT' : 'PLANNED',
        attempts: 0,
        costPaise: 0,
      };
      this.ctx.store.verificationChecks.insert(check);
    }

    this.ctx.audit({
      ctx: input.actor,
      workspaceId: input.workspaceId,
      organizationId: input.requesterOrganizationId,
      action: 'verification.requested',
      resourceType: 'verification_request',
      resourceId: request.id,
      summary: `Verification ${request.bidId} requested for ${input.subjectName} under policy "${policy.name}" v${policyVersion.version}.`,
      metadata: { policy: policy.name, version: policyVersion.version, checks: plan.checks.length },
    });
    this.ctx.emit(
      'VerificationRequested',
      {
        verificationRequestId: request.id,
        subjectName: input.subjectName,
        policyId: input.policyId,
        checks: plan.checks.length,
      },
      { workspaceId: input.workspaceId, organizationId: input.requesterOrganizationId },
    );

    if (input.relationshipId) {
      this.ctx.store.relationships.update(input.relationshipId, {
        latestVerificationId: request.id,
        verificationStatus: 'REQUESTED',
        policyId: input.policyId,
        updatedAt: now,
      });
    }
    return request;
  }

  transition(id: string, status: VerificationRequest['status'], note?: string, actor?: AccessContext): VerificationRequest {
    const existing = this.ctx.store.verificationRequests.require(id);
    const next = this.ctx.store.verificationRequests.update(id, { status, updatedAt: this.ctx.now() });
    if (existing.relationshipId) {
      this.ctx.store.relationships.update(existing.relationshipId, { verificationStatus: status, updatedAt: this.ctx.now() });
    }
    this.ctx.audit({
      ctx: actor,
      workspaceId: existing.workspaceId,
      action: 'verification.state_changed',
      resourceType: 'verification_request',
      resourceId: id,
      summary: `Verification ${existing.bidId}: ${existing.status} → ${status}${note ? ` (${note})` : ''}.`,
      metadata: { from: existing.status, to: status },
    });
    return next;
  }

  /** Records the subject's acceptance of the verification invitation. */
  accept(id: string, actor?: AccessContext): VerificationRequest {
    return this.transition(id, 'ACCEPTED', 'subject accepted', actor);
  }

  /* ---------------- consent & authorization ---------------- */

  /**
   * Consent is the SUBJECT permitting processing (a person, where applicable).
   * Authorization is one ORGANIZATION permitting another to act. They are
   * different objects with different lifecycles (ADR-007).
   */
  requestConsent(input: { verificationRequestId: string; purpose?: string }): Consent {
    const request = this.ctx.store.verificationRequests.require(input.verificationRequestId);
    const plan = this.policies.plan(request.policyId, request.policyVersion);
    const now = this.ctx.now();
    const consent: Consent = {
      id: this.ctx.ids.next('cns'),
      subjectType: request.subjectType,
      subjectRef: request.subjectPersonId ?? request.subjectOrganizationId ?? request.id,
      subjectName: request.subjectName,
      purpose: input.purpose ?? `Verification under policy version ${request.policyVersion} requested by ${this.requesterName(request)}`,
      scope: plan.consentScope,
      version: 'consent-v1',
      status: 'REQUESTED',
      requestedByOrganizationId: request.requesterOrganizationId,
      requestedAt: now,
      expiresAt: addDays(now, 180),
    };
    this.ctx.store.consents.insert(consent);
    this.ctx.store.verificationRequests.update(request.id, { consentId: consent.id, status: 'CONSENT_PENDING', updatedAt: now });
    this.ctx.emit('ConsentRequested', { consentId: consent.id, verificationRequestId: request.id }, { workspaceId: request.workspaceId });
    this.ctx.audit({
      workspaceId: request.workspaceId,
      action: 'consent.requested',
      resourceType: 'consent',
      resourceId: consent.id,
      summary: `Consent requested from ${request.subjectName} for ${consent.scope.length} scoped check(s).`,
      metadata: { scope: consent.scope.join(', ') },
    });
    return consent;
  }

  grantConsent(consentId: string): Consent {
    const consent = this.ctx.store.consents.require(consentId);
    const now = this.ctx.now();
    const next = this.ctx.store.consents.update(consentId, {
      status: 'GRANTED',
      grantedAt: now,
      evidenceReference: `consent-receipt-${stableHash(consentId).toString(16)}`,
    });
    const request = this.ctx.store.verificationRequests.first((r) => r.consentId === consentId);
    if (request) {
      for (const check of this.checks(request.id)) {
        if (check.status === 'BLOCKED_ON_CONSENT') {
          this.ctx.store.verificationChecks.update(check.id, { status: 'PLANNED' });
        }
      }
      this.ctx.store.verificationRequests.update(request.id, { status: 'ACCEPTED', updatedAt: now });
    }
    this.ctx.emit('ConsentGranted', { consentId, subject: consent.subjectName });
    this.ctx.audit({
      action: 'consent.granted',
      resourceType: 'consent',
      resourceId: consentId,
      summary: `${consent.subjectName} granted consent for: ${consent.scope.join(', ')}.`,
      metadata: { version: consent.version },
    });
    return next;
  }

  revokeConsent(consentId: string): Consent {
    const next = this.ctx.store.consents.update(consentId, { status: 'REVOKED', revokedAt: this.ctx.now() });
    this.ctx.emit('ConsentRevoked', { consentId });
    return next;
  }

  grantAuthorization(input: {
    grantorOrganizationId: string;
    granteeOrganizationId: string;
    operation: Authorization['operation'];
    scope: string[];
    relationshipId?: string;
    days?: number;
  }): Authorization {
    const now = this.ctx.now();
    const authorization: Authorization = {
      id: this.ctx.ids.next('auth'),
      grantorOrganizationId: input.grantorOrganizationId,
      granteeOrganizationId: input.granteeOrganizationId,
      operation: input.operation,
      scope: input.scope,
      relationshipId: input.relationshipId,
      status: 'GRANTED',
      startAt: now,
      endAt: addDays(now, input.days ?? 365),
      createdAt: now,
    };
    this.ctx.store.authorizations.insert(authorization);
    this.ctx.emit('AuthorizationGranted', { authorizationId: authorization.id, operation: input.operation });
    this.ctx.audit({
      organizationId: input.grantorOrganizationId,
      action: 'authorization.granted',
      resourceType: 'authorization',
      resourceId: authorization.id,
      summary: `Authorization "${input.operation}" granted to organization ${input.granteeOrganizationId}.`,
      metadata: { scope: input.scope.join(', ') },
    });
    return authorization;
  }

  authorizationsFor(organizationId: string): Authorization[] {
    return this.ctx.store.authorizations.find(
      (a) => a.grantorOrganizationId === organizationId || a.granteeOrganizationId === organizationId,
    );
  }

  hasAuthorization(granteeOrgId: string, grantorOrgId: string, operation: Authorization['operation']): boolean {
    const now = this.ctx.now();
    return this.ctx.store.authorizations.all().some(
      (a) =>
        a.granteeOrganizationId === granteeOrgId &&
        a.grantorOrganizationId === grantorOrgId &&
        a.operation === operation &&
        a.status === 'GRANTED' &&
        a.startAt <= now &&
        a.endAt >= now,
    );
  }

  /* ---------------- execution ---------------- */

  start(id: string, actor?: AccessContext): VerificationRequest {
    const request = this.ctx.store.verificationRequests.require(id);
    const blocked = this.checks(id).filter((c) => c.status === 'BLOCKED_ON_CONSENT');
    if (blocked.length > 0) {
      throw new Error(
        `Verification ${request.bidId} cannot start: ${blocked.length} check(s) require a recorded consent from ${request.subjectName}.`,
      );
    }
    const next = this.transition(id, 'IN_PROGRESS', undefined, actor);
    this.ctx.emit(
      'VerificationStarted',
      { verificationRequestId: id, subjectName: request.subjectName },
      { workspaceId: request.workspaceId, organizationId: request.requesterOrganizationId },
    );
    return next;
  }

  pendingChecks(id: string): VerificationCheck[] {
    return this.checks(id).filter((c) => c.status === 'PLANNED');
  }

  /**
   * Executes exactly one planned check through the provider router and writes
   * the normalized result, provider transaction and evidence record.
   */
  async runNextCheck(id: string): Promise<VerificationCheck | undefined> {
    const request = this.ctx.store.verificationRequests.require(id);
    const pending = this.pendingChecks(id);
    if (pending.length === 0) return undefined;
    if (request.status === 'REQUESTED' || request.status === 'ACCEPTED' || request.status === 'INVITED') {
      this.transition(id, 'IN_PROGRESS');
    }
    if (request.status !== 'CHECKS_RUNNING') {
      this.ctx.store.verificationRequests.update(id, { status: 'CHECKS_RUNNING', updatedAt: this.ctx.now() });
    }

    const check = pending[0];
    const definition = requireCheckDefinition(check.checkCode);
    const startedAt = this.ctx.now();
    this.ctx.store.verificationChecks.update(check.id, { status: 'RUNNING', startedAt, attempts: check.attempts + 1 });

    const subjectOrg = request.subjectOrganizationId ? this.organizations.get(request.subjectOrganizationId) : undefined;
    const subjectRef = subjectOrg?.bidId ?? request.subjectPersonId ?? request.subjectName;

    const execution = await this.ctx.router.execute({
      verificationRequestId: request.id,
      checkId: check.id,
      checkCode: check.checkCode,
      definition,
      subjectType: request.subjectType,
      subjectRef,
      subjectName: request.subjectName,
      attributes: { legalName: request.subjectName },
      country: subjectOrg?.country ?? 'IN',
      correlationId: request.id,
    });

    const completedAt = this.ctx.now();
    const status: CheckStatus =
      execution.response.outcome === 'PASS'
        ? 'PASSED'
        : execution.response.outcome === 'ATTENTION'
          ? 'ATTENTION'
          : execution.response.outcome === 'FAIL'
            ? 'FAILED'
            : 'UNAVAILABLE';

    const transaction = {
      id: this.ctx.ids.next('ptx'),
      providerId: execution.decision.provider.id,
      verificationRequestId: request.id,
      checkId: check.id,
      checkCode: check.checkCode,
      requestedAt: startedAt,
      completedAt,
      latencyMs: execution.response.latencyMs,
      outcome: execution.response.outcome,
      costPaise: execution.costPaise,
      reference: execution.response.reference,
      fallbackFrom: execution.fallbackFrom,
    };
    this.ctx.store.providerTransactions.insert(transaction);

    const auditEntry = this.ctx.audit({
      actorType: 'PROVIDER',
      actorId: execution.decision.provider.id,
      actorName: execution.decision.provider.name,
      workspaceId: request.workspaceId,
      action: 'verification.check_executed',
      resourceType: 'verification_check',
      resourceId: check.id,
      summary: `${definition.label} executed via ${execution.decision.provider.name}: ${execution.response.outcome}. ${execution.decision.reason}`,
      metadata: {
        reference: execution.response.reference,
        latencyMs: execution.response.latencyMs,
        routed: execution.decision.strategy,
        ...(execution.fallbackFrom ? { fallbackFrom: execution.fallbackFrom } : {}),
      },
    });

    const evidence: Evidence = {
      id: this.ctx.ids.next('evd'),
      verificationRequestId: request.id,
      checkId: check.id,
      checkCode: check.checkCode,
      subjectType: request.subjectType,
      subjectRef,
      what: definition.label,
      source: execution.response.sourceLabel ?? definition.sourceLabel,
      attribution: definition.method === 'DOCUMENT' ? 'PROVIDER_VERIFIED' : definition.method === 'API' ? 'OFFICIAL_SOURCE_DERIVED' : 'PROVIDER_VERIFIED',
      providerId: execution.decision.provider.id,
      providerName: execution.decision.provider.name,
      method: definition.method,
      checkedAt: completedAt,
      result: execution.response.outcome,
      confidence: Math.round(execution.response.confidence * 100) / 100,
      scope: definition.description,
      reference: execution.response.reference,
      payloadHash: stableHash(JSON.stringify(execution.response.normalized)).toString(16),
      expiresAt: addDays(completedAt, definition.defaultValidityDays),
      freshness: 'CURRENT',
      policyId: request.policyId,
      policyVersion: request.policyVersion,
      visibility: definition.evidenceVisibility,
      auditLogId: auditEntry.id,
      createdAt: completedAt,
    };
    this.ctx.store.evidence.insert(evidence);

    const result: VerificationResult = {
      id: this.ctx.ids.next('vres'),
      verificationRequestId: request.id,
      checkId: check.id,
      checkCode: check.checkCode,
      outcome: execution.response.outcome,
      confidence: evidence.confidence,
      summary: execution.response.summary,
      normalized: execution.response.normalized,
      evidenceId: evidence.id,
      createdAt: completedAt,
    };
    this.ctx.store.verificationResults.insert(result);

    const updated = this.ctx.store.verificationChecks.update(check.id, {
      status,
      completedAt,
      providerId: execution.decision.provider.id,
      providerTransactionId: transaction.id,
      resultId: result.id,
      costPaise: execution.costPaise,
    });

    this.ctx.store.verificationRequests.update(request.id, {
      costPaise: request.costPaise + execution.costPaise,
      updatedAt: completedAt,
    });

    this.ctx.emit(
      'VerificationCheckCompleted',
      {
        verificationRequestId: request.id,
        checkId: check.id,
        checkCode: check.checkCode,
        outcome: execution.response.outcome,
        providerId: execution.decision.provider.id,
        costPaise: execution.costPaise,
      },
      { workspaceId: request.workspaceId, organizationId: request.requesterOrganizationId },
    );

    return updated;
  }

  async runAllChecks(id: string): Promise<VerificationRequest> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const next = await this.runNextCheck(id);
      if (!next) break;
    }
    return this.finalize(id);
  }

  /** Builds the assessment and applies the policy's approval rule. */
  finalize(id: string, actor?: AccessContext): VerificationRequest {
    const request = this.ctx.store.verificationRequests.require(id);
    const policyVersion = this.policies.version(request.policyId, request.policyVersion);
    const checks = this.checks(id);
    const now = this.ctx.now();

    this.ctx.store.verificationRequests.update(id, { status: 'EVIDENCE_COLLECTED', updatedAt: now });

    const expiresAt = addDays(now, policyVersion.validityDays);
    const assessment = buildAssessment({
      id: this.ctx.ids.next('asm'),
      verificationRequestId: id,
      policyId: request.policyId,
      policyVersion,
      checks,
      now,
      expiresAt,
    });
    this.ctx.store.assessments.insert(assessment);
    this.policies.seal(request.policyId, request.policyVersion);

    this.ctx.emit(
      'AssessmentCreated',
      { verificationRequestId: id, band: assessment.band, score: assessment.score },
      { workspaceId: request.workspaceId },
    );

    const blockingFailures = checks.filter((c) => c.blocking && (c.status === 'FAILED' || c.status === 'UNAVAILABLE')).length;
    const hasExceptions = checks.some((c) => c.status === 'FAILED' || c.status === 'UNAVAILABLE' || c.status === 'ATTENTION');

    let status: VerificationRequest['status'];
    let decision: Decision = 'PENDING';

    if (blockingFailures > policyVersion.thresholds.maxBlockingFailures) {
      status = 'REQUIRES_REVIEW';
    } else if (policyVersion.approvalRule === 'AUTO' && assessment.score >= policyVersion.thresholds.autoApproveScore) {
      status = 'COMPLETED';
      decision = hasExceptions ? 'APPROVED_WITH_CONDITIONS' : 'APPROVED';
    } else if (assessment.score < policyVersion.thresholds.reviewScore) {
      status = 'REQUIRES_REVIEW';
    } else {
      status = 'REVIEW';
    }

    const updated = this.ctx.store.verificationRequests.update(id, {
      status,
      decision,
      assessmentId: assessment.id,
      completedAt: status === 'COMPLETED' ? now : undefined,
      expiresAt,
      updatedAt: now,
    });

    this.ctx.audit({
      ctx: actor,
      workspaceId: request.workspaceId,
      action: 'verification.assessed',
      resourceType: 'verification_request',
      resourceId: id,
      summary: `Assessment for ${request.bidId}: ${assessment.band} (score ${assessment.score}/100) under policy v${request.policyVersion}. Outcome: ${status}.`,
      metadata: { band: assessment.band, score: assessment.score, blockingFailures },
    });

    this.ctx.emit(
      status === 'REQUIRES_REVIEW' ? 'VerificationFailed' : 'VerificationCompleted',
      {
        verificationRequestId: id,
        subjectName: request.subjectName,
        band: assessment.band,
        score: assessment.score,
        status,
        subjectOrganizationId: request.subjectOrganizationId,
        requesterOrganizationId: request.requesterOrganizationId,
      },
      { workspaceId: request.workspaceId, organizationId: request.requesterOrganizationId },
    );

    this.ctx.notify({
      workspaceId: request.workspaceId,
      organizationId: request.requesterOrganizationId,
      kind: 'verification.completed',
      title: `Verification ${status === 'COMPLETED' ? 'completed' : 'needs your review'}: ${request.subjectName}`,
      body: `${assessment.band.replace('_', ' ').toLowerCase()} · score ${assessment.score}/100 · policy v${request.policyVersion}.`,
      severity: status === 'COMPLETED' ? 'SUCCESS' : 'WARNING',
      link: `/app/verifications/${id}`,
    });

    if (decision === 'APPROVED' || decision === 'APPROVED_WITH_CONDITIONS') {
      this.applyApproval(id, actor);
    }
    return updated;
  }

  /** Human decision on a verification that required review (Rule 14). */
  decide(id: string, decision: Decision, note: string, actor?: AccessContext): VerificationRequest {
    if (actor) assertPermission(actor, 'verification:decide');
    const request = this.ctx.store.verificationRequests.require(id);
    const now = this.ctx.now();
    const status: VerificationRequest['status'] = decision === 'REJECTED' ? 'FAILED' : 'COMPLETED';

    this.ctx.store.verificationRequests.update(id, {
      decision,
      decisionBy: actor?.userName ?? 'Reviewer',
      decisionAt: now,
      decisionNote: note,
      status,
      completedAt: now,
      updatedAt: now,
    });

    this.ctx.audit({
      ctx: actor,
      workspaceId: request.workspaceId,
      action: 'verification.decided',
      resourceType: 'verification_request',
      resourceId: id,
      summary: `${actor?.userName ?? 'Reviewer'} recorded decision ${decision} for ${request.bidId}: ${note}`,
      metadata: { decision },
    });

    if (decision === 'APPROVED' || decision === 'APPROVED_WITH_CONDITIONS') {
      this.applyApproval(id, actor);
    } else if (request.relationshipId) {
      this.ctx.store.relationships.update(request.relationshipId, { lifecycle: 'SUSPENDED', updatedAt: now });
    }
    return this.ctx.store.verificationRequests.require(id);
  }

  /**
   * Approval side effects: issue credential, promote the subject to VERIFIED
   * MEMBER (never to customer — Business Rule 1), activate the relationship.
   */
  private applyApproval(id: string, actor?: AccessContext): void {
    const request = this.ctx.store.verificationRequests.require(id);
    const credential = this.issueCredential(id);
    const now = this.ctx.now();

    this.ctx.store.verificationRequests.update(id, {
      credentialId: credential.id,
      status: 'CREDENTIAL_ISSUED',
      updatedAt: now,
    });

    if (request.subjectOrganizationId) {
      const subject = this.organizations.require(request.subjectOrganizationId);
      this.organizations.update(subject.id, { lifecycle: 'VERIFIED' });
      if (subject.commercialState === 'MEMBER' || subject.commercialState === 'NON_MEMBER') {
        this.organizations.setCommercialState(subject.id, 'VERIFIED_MEMBER', 'verification approved');
      }
      this.ctx.emit(
        'OrganizationVerified',
        { organizationId: subject.id, bidId: subject.bidId, verificationRequestId: id },
        { organizationId: subject.id },
      );
      this.ctx.notify({
        organizationId: subject.id,
        workspaceId: subject.primaryWorkspaceId,
        kind: 'verification.approved',
        title: 'Your organization is now a Verified BID Member',
        body: `${this.requesterName(request)} approved your verification. Your BID profile and digital card are live.`,
        severity: 'SUCCESS',
        link: '/app/credentials',
      });
    }

    if (request.relationshipId) {
      this.ctx.store.relationships.update(request.relationshipId, {
        lifecycle: 'ACTIVE',
        verificationStatus: 'CREDENTIAL_ISSUED',
        updatedAt: now,
      });
    }

    this.ctx.audit({
      ctx: actor,
      workspaceId: request.workspaceId,
      action: 'credential.issued',
      resourceType: 'credential',
      resourceId: credential.id,
      summary: `Credential ${credential.bidId} issued to ${request.subjectName}, valid until ${credential.expiresAt.slice(0, 10)}.`,
      metadata: { policyVersion: request.policyVersion },
    });
  }

  issueCredential(verificationRequestId: string): Credential {
    const request = this.ctx.store.verificationRequests.require(verificationRequestId);
    const policyVersion = this.policies.version(request.policyId, request.policyVersion);
    const policy = this.policies.require(request.policyId);
    const checks = this.checks(verificationRequestId);
    const now = this.ctx.now();

    const categoryState = (categories: VerificationCheck['category'][]): 'VERIFIED' | 'ATTENTION' | 'NOT_VERIFIED' => {
      const relevant = checks.filter((c) => categories.includes(c.category));
      if (relevant.length === 0) return 'NOT_VERIFIED';
      if (relevant.some((c) => c.status === 'FAILED')) return 'NOT_VERIFIED';
      if (relevant.some((c) => c.status !== 'PASSED')) return 'ATTENTION';
      return 'VERIFIED';
    };

    const credential: Credential = {
      id: this.ctx.ids.next('crd'),
      bidId: this.ctx.bidIds.next('CRD'),
      subjectType: request.subjectType,
      subjectOrganizationId: request.subjectOrganizationId,
      subjectPersonId: request.subjectPersonId,
      verificationRequestId,
      policyId: request.policyId,
      policyVersion: request.policyVersion,
      title: `${policy.name} — verified`,
      publicAttributes: [
        { label: 'Identity', state: categoryState(['IDENTITY']), attribution: 'OFFICIAL_SOURCE_DERIVED' },
        { label: 'Business status', state: categoryState(['IDENTITY', 'FINANCIAL']), attribution: 'PROVIDER_VERIFIED' },
        { label: 'Required compliance', state: categoryState(['COMPLIANCE']), attribution: 'PROVIDER_VERIFIED' },
        { label: 'Risk checks', state: categoryState(['RISK']), attribution: 'PROVIDER_VERIFIED' },
      ],
      issuedByOrganizationId: request.requesterOrganizationId,
      status: 'ACTIVE',
      issuedAt: now,
      expiresAt: addDays(now, policyVersion.validityDays),
    };
    this.ctx.store.credentials.insert(credential);
    this.ctx.emit(
      'CredentialIssued',
      { credentialId: credential.id, subjectOrganizationId: request.subjectOrganizationId, verificationRequestId },
      { workspaceId: request.workspaceId },
    );
    return credential;
  }

  revokeCredential(credentialId: string, reason: string, actor?: AccessContext): Credential {
    const now = this.ctx.now();
    const credential = this.ctx.store.credentials.update(credentialId, {
      status: 'REVOKED',
      revokedAt: now,
      revocationReason: reason,
    });
    this.ctx.emit('CredentialRevoked', { credentialId, reason });
    this.ctx.audit({
      ctx: actor,
      action: 'credential.revoked',
      resourceType: 'credential',
      resourceId: credentialId,
      summary: `Credential ${credential.bidId} revoked: ${reason}`,
      metadata: { reason },
    });
    return credential;
  }

  credentialsForOrganization(organizationId: string): Credential[] {
    return this.ctx.store.credentials
      .find((c) => c.subjectOrganizationId === organizationId)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }

  credentialsIssuedBy(organizationId: string): Credential[] {
    return this.ctx.store.credentials.find((c) => c.issuedByOrganizationId === organizationId);
  }

  /** Recomputes freshness for stored evidence — surfaced by the UI. */
  refreshFreshness(): void {
    const now = this.ctx.now();
    for (const evidence of this.ctx.store.evidence.all()) {
      const definition = requireCheckDefinition(evidence.checkCode);
      const freshness = freshnessFor(evidence.checkedAt, definition.defaultValidityDays, now);
      if (freshness !== evidence.freshness) {
        this.ctx.store.evidence.update(evidence.id, { freshness });
      }
    }
  }

  private requesterName(request: VerificationRequest): string {
    return this.organizations.get(request.requesterOrganizationId)?.displayName ?? 'The requesting organization';
  }
}
