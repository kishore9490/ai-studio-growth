import type { AccessContext, BidPlatform, Decision, Industry, RelationshipType } from '@bid/core';
import { apiRequest } from './client';

/**
 * Everything the application can change.
 *
 * There is exactly one of these interfaces and two implementations: one that
 * posts to the API, one that calls the domain services in the browser. Screens
 * depend on the interface, so the same button works whether the app is signed
 * into a real workspace or exploring the demo network, and neither case is a
 * mock of the other — the local implementation is the same engine the server
 * runs.
 *
 * Commands return nothing useful on purpose. After a change the caller reloads
 * its view of the world rather than patching a local copy, which is what keeps
 * a connected client from drifting away from what the server actually stored.
 */
export interface Commands {
  /** True when changes are being written to the API rather than held in memory. */
  readonly connected: boolean;

  acceptInvitation(invitationId: string): Promise<void>;
  declineInvitation(invitationId: string): Promise<void>;

  createRelationship(input: {
    counterpartyBidId: string;
    type: RelationshipType;
    riskLevel?: string;
    policyId?: string;
    label?: string;
    contractReference?: string;
  }): Promise<void>;
  transitionRelationship(relationshipId: string, lifecycle: string, note?: string): Promise<void>;

  inviteCounterparty(input: {
    counterpartyName: string;
    counterpartyEmail: string;
    relationshipType: RelationshipType;
    policyId: string;
    industry?: Industry;
    campaignId?: string;
    counterpartyOrganizationBidId?: string;
  }): Promise<{ verificationId: string }>;

  createVerification(input: {
    subjectBidId?: string;
    subjectName: string;
    relationshipType: RelationshipType;
    policyId: string;
    relationshipId?: string;
    campaignId?: string;
  }): Promise<string>;
  runVerification(verificationId: string, mode?: 'ALL' | 'NEXT'): Promise<void>;
  decideVerification(verificationId: string, decision: Exclude<Decision, 'PENDING'>, note: string): Promise<void>;
  finalizeVerification(verificationId: string): Promise<void>;

  provideDocument(input: {
    verificationId: string;
    documentId: string;
    fileName: string;
    sizeBytes?: number;
    note?: string;
  }): Promise<void>;
  provideAllDocuments(verificationId: string): Promise<void>;
  reviewDocument(input: {
    verificationId: string;
    documentId: string;
    accept: boolean;
    note: string;
  }): Promise<void>;

  grantConsent(consentId: string): Promise<void>;
  revokeConsent(consentId: string): Promise<void>;

  /** Returns how many relationships were put under monitoring. */
  enableMonitoring(): Promise<number>;
  enableMonitoringForRelationship(input: { subjectBidId: string; relationshipId?: string }): Promise<void>;
  disableMonitoringRule(ruleId: string): Promise<void>;
  setAlertStatus(alertId: string, status: string, note?: string): Promise<void>;
  /** Returns how many new signals the sweep raised. */
  runMonitoringSweep(cycle?: number): Promise<number>;

  createCampaign(input: { name: string; policyId: string; relationshipType: RelationshipType; slaDays?: number }): Promise<void>;
  inviteCampaignMember(campaignId: string, memberId: string): Promise<void>;
  addCampaignMember(input: {
    campaignId: string;
    name: string;
    email: string;
    organizationBidId?: string;
    invite?: boolean;
  }): Promise<void>;

  createBgvRequest(input: { fullName: string; email: string; phone: string; policyId: string }): Promise<void>;
  createApiKey(name: string): Promise<void>;
  createPolicy(spec: Record<string, unknown>): Promise<void>;
  createPolicyFromTemplate(templateKey: string, name?: string): Promise<void>;
  createPolicyVersion(policyId: string, changes: Record<string, unknown>): Promise<void>;

  updateOrganization(bidId: string, patch: Record<string, unknown>): Promise<void>;
  activateRequester(planId: string, seats?: number): Promise<void>;
  changePlan(planId: string, seats?: number): Promise<void>;
  cancelSubscription(): Promise<void>;
  issueInvoice(): Promise<void>;
  recordPayment(invoiceId: string): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Connected: every change goes to the API                             */
/* ------------------------------------------------------------------ */

const post = <T = unknown>(path: string, body?: unknown) =>
  apiRequest<{ data: T }>(path, { method: 'POST', body: body ?? {} }).then((response) => response?.data);

const patch = <T = unknown>(path: string, body: unknown) =>
  apiRequest<{ data: T }>(path, { method: 'PATCH', body }).then((response) => response?.data);

export function httpCommands(): Commands {
  return {
    connected: true,

    async acceptInvitation(invitationId) {
      await post(`/v1/invitations/${invitationId}/accept`);
    },
    async declineInvitation(invitationId) {
      await post(`/v1/invitations/${invitationId}/decline`);
    },

    async createRelationship(input) {
      await post('/v1/relationships', input);
    },
    async transitionRelationship(relationshipId, lifecycle, note) {
      await patch(`/v1/relationships/${relationshipId}`, { lifecycle, note });
    },

    async inviteCounterparty(input) {
      const result = await post<{ verificationId: string }>('/v1/invitations', {
        organizationName: input.counterpartyName,
        email: input.counterpartyEmail,
        relationshipType: input.relationshipType,
        policyId: input.policyId,
        industry: input.industry,
        campaignId: input.campaignId,
        organizationBidId: input.counterpartyOrganizationBidId,
      });
      return { verificationId: result.verificationId };
    },

    async createVerification(input) {
      const created = await post<{ id: string }>('/v1/verification-requests', input);
      return created.id;
    },
    async runVerification(verificationId, mode = 'ALL') {
      await post(`/v1/verification-requests/${verificationId}/run`, { mode });
    },
    async decideVerification(verificationId, decision, note) {
      await post(`/v1/verification-requests/${verificationId}/decision`, { decision, note });
    },
    async finalizeVerification(verificationId) {
      await post(`/v1/verification-requests/${verificationId}/finalize`);
    },

    async provideDocument(input) {
      await post(`/v1/verification-requests/${input.verificationId}/documents/${input.documentId}`, {
        fileName: input.fileName,
        sizeBytes: input.sizeBytes,
        note: input.note,
      });
    },
    async provideAllDocuments(verificationId) {
      const { data } = await apiRequest<{ data: { id: string; code: string; status: string }[] }>(
        `/v1/verification-requests/${verificationId}/documents`,
      );
      for (const document of data) {
        if (document.status !== 'REQUESTED') continue;
        await post(`/v1/verification-requests/${verificationId}/documents/${document.id}`, {
          fileName: `${document.code.toLowerCase()}.pdf`,
          sizeBytes: 184_320,
        });
      }
    },
    async reviewDocument(input) {
      await post(
        `/v1/verification-requests/${input.verificationId}/documents/${input.documentId}/review`,
        { accept: input.accept, note: input.note },
      );
    },

    async grantConsent(consentId) {
      await post(`/v1/consents/${consentId}/grant`);
    },
    async revokeConsent(consentId) {
      await post(`/v1/consents/${consentId}/revoke`);
    },

    async enableMonitoring() {
      const result = await post<{ enabled: number }>('/v1/monitoring/enable-all');
      return result.enabled;
    },
    async enableMonitoringForRelationship(input) {
      await post('/v1/monitoring', { subjectBidId: input.subjectBidId, relationshipId: input.relationshipId });
    },
    async disableMonitoringRule(ruleId) {
      await post(`/v1/monitoring/${ruleId}/disable`);
    },
    async setAlertStatus(alertId, status, note) {
      await post(`/v1/monitoring/alerts/${alertId}/status`, { status, note });
    },
    async runMonitoringSweep() {
      const result = await post<{ raised: number } | unknown[]>('/v1/monitoring/sweep');
      return Array.isArray(result) ? result.length : (result as { raised: number }).raised;
    },

    async createCampaign(input) {
      await post('/v1/campaigns', input);
    },
    async inviteCampaignMember(campaignId, memberId) {
      await post(`/v1/campaigns/${campaignId}/members/${memberId}/invite`);
    },
    async addCampaignMember(input) {
      await post(`/v1/campaigns/${input.campaignId}/members`, {
        members: [{ name: input.name, email: input.email, organizationBidId: input.organizationBidId }],
        invite: input.invite ?? false,
      });
    },

    async createBgvRequest(input) {
      await post('/v1/bgv/requests', input);
    },
    async createApiKey(name) {
      await post('/v1/api-keys', { name });
    },
    async createPolicy(spec) {
      await post('/v1/policies', spec);
    },
    async createPolicyFromTemplate(templateKey, name) {
      await post('/v1/policies/adopt', { templateKey, name });
    },
    async createPolicyVersion(policyId, changes) {
      await post(`/v1/policies/${policyId}/versions`, changes);
    },

    async updateOrganization(bidId, patchBody) {
      await patch(`/v1/organizations/${bidId}`, patchBody);
    },
    async activateRequester(planId, seats) {
      await post('/v1/billing/activate-requester', { planId, seats });
    },
    async changePlan(planId, seats) {
      await post('/v1/billing/subscription', { planId, seats });
    },
    async cancelSubscription() {
      await post('/v1/billing/subscription/cancel');
    },
    async issueInvoice() {
      await post('/v1/billing/invoices');
    },
    async recordPayment(invoiceId) {
      await post(`/v1/billing/invoices/${invoiceId}/pay`);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Local: the same engine, in the browser                              */
/* ------------------------------------------------------------------ */

export function localCommands(platform: BidPlatform, access: () => AccessContext): Commands {
  const ctx = () => access();

  return {
    connected: false,

    async acceptInvitation(invitationId) {
      platform.acceptInvitation(invitationId);
    },
    async declineInvitation(invitationId) {
      platform.relationships.declineInvitation(invitationId);
    },

    async createRelationship(input) {
      const counterparty = platform.organizations.byBidId(input.counterpartyBidId);
      if (!counterparty) throw new Error(`No organization with BID ID ${input.counterpartyBidId}`);
      const actor = ctx();
      platform.relationships.create({
        workspaceId: actor.workspaceId,
        sourceOrganizationId: actor.organizationId,
        targetOrganizationId: counterparty.id,
        type: input.type,
        riskLevel: input.riskLevel as never,
        policyId: input.policyId,
        label: input.label,
        contractReference: input.contractReference,
        actor,
      });
    },
    async transitionRelationship(relationshipId, lifecycle, note) {
      platform.relationships.transition(relationshipId, lifecycle as never, note ?? '', ctx());
    },

    async inviteCounterparty(input) {
      const counterparty = input.counterpartyOrganizationBidId
        ? platform.organizations.byBidId(input.counterpartyOrganizationBidId)
        : undefined;
      const result = platform.inviteCounterparty({
        requesterOrganizationId: ctx().organizationId,
        counterpartyName: input.counterpartyName,
        counterpartyEmail: input.counterpartyEmail,
        counterpartyOrganizationId: counterparty?.id,
        relationshipType: input.relationshipType,
        policyId: input.policyId,
        industry: input.industry,
        campaignId: input.campaignId,
        actor: ctx(),
      });
      return { verificationId: result.verification.id };
    },

    async createVerification(input) {
      const actor = ctx();
      const subject = input.subjectBidId ? platform.organizations.byBidId(input.subjectBidId) : undefined;
      const created = platform.verifications.create({
        workspaceId: actor.workspaceId,
        requesterOrganizationId: actor.organizationId,
        subjectOrganizationId: subject?.id,
        subjectName: subject?.displayName ?? input.subjectName,
        relationshipId: input.relationshipId,
        relationshipType: input.relationshipType,
        policyId: input.policyId,
        campaignId: input.campaignId,
        actor,
      });
      return created.id;
    },
    async runVerification(verificationId, mode = 'ALL') {
      if (mode === 'NEXT') await platform.verifications.runNextCheck(verificationId);
      else await platform.runVerification(verificationId);
    },
    async decideVerification(verificationId, decision, note) {
      platform.verifications.decide(verificationId, decision, note, ctx());
    },
    async finalizeVerification(verificationId) {
      platform.verifications.finalize(verificationId, ctx());
    },

    async provideDocument(input) {
      platform.verifications.provideDocument({
        documentId: input.documentId,
        fileName: input.fileName,
        sizeBytes: input.sizeBytes,
        note: input.note,
        providedByOrganizationId: ctx().organizationId,
      });
    },
    async provideAllDocuments(verificationId) {
      platform.provideAllDocuments(verificationId);
    },
    async reviewDocument(input) {
      platform.verifications.reviewDocument(input.documentId, input.accept, input.note, ctx());
    },

    async grantConsent(consentId) {
      platform.verifications.grantConsent(consentId);
    },
    async revokeConsent(consentId) {
      platform.verifications.revokeConsent(consentId);
    },

    async enableMonitoring() {
      return platform.enableMonitoringForWorkspace(ctx().workspaceId, ctx()).length;
    },
    async enableMonitoringForRelationship(input) {
      platform.monitoring.enable({
        workspaceId: ctx().workspaceId,
        subjectRef: input.subjectBidId,
        relationshipId: input.relationshipId,
        actor: ctx(),
      });
    },
    async disableMonitoringRule(ruleId) {
      platform.monitoring.disable(ruleId);
    },
    async setAlertStatus(alertId, status, note) {
      // The local service takes no note; the reason lives in the audit entry it writes.
      platform.monitoring.setAlertStatus(alertId, status as never, ctx());
    },
    async runMonitoringSweep(cycle = 1) {
      return platform.monitoring.runSweep(ctx().workspaceId, cycle).length;
    },

    async createCampaign(input) {
      const actor = ctx();
      platform.campaigns.create({
        workspaceId: actor.workspaceId,
        requesterOrganizationId: actor.organizationId,
        name: input.name,
        policyId: input.policyId,
        relationshipType: input.relationshipType,
        slaDays: input.slaDays,
        actor,
      });
    },
    async inviteCampaignMember(_campaignId, memberId) {
      platform.campaigns.inviteMember(memberId, ctx());
    },
    async addCampaignMember(input) {
      const member = platform.campaigns.addMember({
        campaignId: input.campaignId,
        targetName: input.name,
        targetEmail: input.email,
        targetOrganizationId: input.organizationBidId
          ? platform.organizations.byBidId(input.organizationBidId)?.id
          : undefined,
      });
      if (input.invite) platform.campaigns.inviteMember(member.id, ctx());
    },

    async createBgvRequest(input) {
      const actor = ctx();
      const person = platform.organizations.createPerson({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
      });
      const relationship = platform.relationships.create({
        workspaceId: actor.workspaceId,
        sourceOrganizationId: actor.organizationId,
        targetType: 'PERSON',
        targetPersonId: person.id,
        type: 'CANDIDATE',
        policyId: input.policyId,
        lifecycle: 'VERIFICATION',
        actor,
      });
      const verification = platform.verifications.create({
        workspaceId: actor.workspaceId,
        requesterOrganizationId: actor.organizationId,
        subjectType: 'PERSON',
        subjectPersonId: person.id,
        subjectName: person.fullName,
        relationshipId: relationship.id,
        relationshipType: 'CANDIDATE',
        policyId: input.policyId,
        actor,
      });
      platform.verifications.requestConsent({ verificationRequestId: verification.id });
    },
    async createApiKey(name) {
      const actor = ctx();
      platform.store.apiKeys.insert({
        id: `key_${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 12)}`,
        workspaceId: actor.workspaceId,
        name,
        prefix: 'bid_live_demo',
        hashedSecret: 'demo-only',
        scopes: ['organizations:read', 'verification-requests:write'],
        createdAt: new Date().toISOString(),
      });
    },
    async createPolicy(spec) {
      // The API takes the check requirements flat; the service takes them
      // nested under the first version. Same policy, two shapes.
      const {
        name,
        description,
        subjectType,
        relationshipType,
        industry,
        riskLevel,
        ...version
      } = spec as Record<string, unknown>;
      platform.policies.create({
        name,
        description,
        subjectType,
        relationshipType,
        industry,
        riskLevel,
        workspaceId: ctx().workspaceId,
        createdBy: ctx().userName,
        version: { documents: [], ...version },
      } as unknown as Parameters<typeof platform.policies.create>[0]);
    },
    async createPolicyFromTemplate(templateKey, name) {
      const template = platform.policies.templates().find((candidate) => candidate.key === templateKey);
      if (!template) throw new Error(`No policy template named ${templateKey}`);
      platform.policies.createFromTemplate(template, { workspaceId: ctx().workspaceId, createdBy: ctx().userName, name });
    },
    async createPolicyVersion(policyId, changes) {
      platform.policies.createVersion(policyId, changes as never, ctx());
    },

    async updateOrganization(_bidId, patchBody) {
      platform.organizations.update(ctx().organizationId, patchBody as never);
    },
    async activateRequester(planId, seats) {
      platform.activateRequester({ organizationId: ctx().organizationId, planId, seats, actor: ctx() });
    },
    async changePlan(planId, seats) {
      const actor = ctx();
      platform.billing.subscribe({
        workspaceId: actor.workspaceId,
        organizationId: actor.organizationId,
        planId,
        seats,
        actor,
      });
    },
    async cancelSubscription() {
      platform.billing.cancel(ctx().workspaceId, ctx());
    },
    async issueInvoice() {
      platform.billing.issueInvoice(ctx().workspaceId, ctx().organizationId);
    },
    async recordPayment(invoiceId) {
      platform.billing.recordPayment(invoiceId);
    },
  };
}
