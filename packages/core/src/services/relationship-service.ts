import type { RelationshipLifecycle, RelationshipType, RiskLevel, SubjectType } from '../domain/enums.js';
import type { Invitation, Relationship } from '../domain/types.js';
import { assertPermission, assertTenant, type AccessContext } from '../security/access.js';
import { addDays } from '../util/clock.js';
import type { PlatformContext } from './context.js';
import type { OrganizationService } from './organization-service.js';

/**
 * Relationships are first-class (ADR-002). An organization is never "a vendor";
 * it has a vendor relationship with a specific counterparty, owned by a specific
 * workspace, governed by a specific policy.
 */
export class RelationshipService {
  constructor(private readonly ctx: PlatformContext, private readonly organizations: OrganizationService) {}

  listForWorkspace(workspaceId: string): Relationship[] {
    return this.ctx.store.relationships.find((r) => r.workspaceId === workspaceId);
  }

  /** Relationships in which this organization is the counterparty (inbound). */
  listInbound(organizationId: string): Relationship[] {
    return this.ctx.store.relationships.find((r) => r.targetOrganizationId === organizationId);
  }

  get(id: string, ctx?: AccessContext): Relationship | undefined {
    const relationship = this.ctx.store.relationships.get(id);
    if (!relationship) return undefined;
    if (ctx && relationship.workspaceId !== ctx.workspaceId && relationship.targetOrganizationId !== ctx.organizationId) {
      assertTenant(ctx, relationship);
    }
    return relationship;
  }

  create(input: {
    workspaceId: string;
    sourceOrganizationId: string;
    targetType?: SubjectType;
    targetOrganizationId?: string;
    targetPersonId?: string;
    type: RelationshipType;
    label?: string;
    riskLevel?: RiskLevel;
    policyId?: string;
    lifecycle?: RelationshipLifecycle;
    contractReference?: string;
    criticality?: Relationship['criticality'];
    startDate?: string;
    actor?: AccessContext;
  }): Relationship {
    if (input.actor) assertPermission(input.actor, 'relationship:write');
    const now = this.ctx.now();
    const relationship: Relationship = {
      id: this.ctx.ids.next('rel'),
      bidId: this.ctx.bidIds.next('REL'),
      workspaceId: input.workspaceId,
      sourceOrganizationId: input.sourceOrganizationId,
      targetType: input.targetType ?? 'ORGANIZATION',
      targetOrganizationId: input.targetOrganizationId,
      targetPersonId: input.targetPersonId,
      type: input.type,
      label: input.label,
      startDate: input.startDate ?? now,
      lifecycle: input.lifecycle ?? 'DISCOVERED',
      riskLevel: input.riskLevel ?? 'STANDARD',
      policyId: input.policyId,
      verificationStatus: 'NONE',
      contractReference: input.contractReference,
      monitoringEnabled: false,
      criticality: input.criticality ?? 'ROUTINE',
      createdAt: now,
      updatedAt: now,
    };
    this.ctx.store.relationships.insert(relationship);
    this.ctx.audit({
      ctx: input.actor,
      workspaceId: input.workspaceId,
      organizationId: input.sourceOrganizationId,
      action: 'relationship.created',
      resourceType: 'relationship',
      resourceId: relationship.id,
      summary: `${input.type} relationship created (${relationship.bidId}).`,
      metadata: { type: input.type, target: input.targetOrganizationId ?? input.targetPersonId ?? 'unknown' },
    });
    this.ctx.emit(
      'RelationshipCreated',
      { relationshipId: relationship.id, type: relationship.type, sourceOrganizationId: input.sourceOrganizationId },
      { workspaceId: input.workspaceId, organizationId: input.sourceOrganizationId },
    );
    return relationship;
  }

  transition(id: string, lifecycle: RelationshipLifecycle, note?: string, actor?: AccessContext): Relationship {
    const existing = this.ctx.store.relationships.require(id);
    const next = this.ctx.store.relationships.update(id, { lifecycle, updatedAt: this.ctx.now() });
    this.ctx.audit({
      ctx: actor,
      workspaceId: existing.workspaceId,
      action: 'relationship.state_changed',
      resourceType: 'relationship',
      resourceId: id,
      summary: `Relationship ${existing.bidId}: ${existing.lifecycle} → ${lifecycle}${note ? ` (${note})` : ''}.`,
      metadata: { from: existing.lifecycle, to: lifecycle },
    });
    this.ctx.emit(
      'RelationshipStateChanged',
      { relationshipId: id, from: existing.lifecycle, to: lifecycle },
      { workspaceId: existing.workspaceId },
    );
    return next;
  }

  update(id: string, patch: Partial<Relationship>, actor?: AccessContext): Relationship {
    if (actor) assertPermission(actor, 'relationship:write');
    return this.ctx.store.relationships.update(id, { ...patch, updatedAt: this.ctx.now() });
  }

  /** The relationship (if any) that lets `viewerOrgId` see `subjectOrgId` data. */
  relationshipBetween(viewerOrgId: string, subjectOrgId: string): Relationship | undefined {
    return this.ctx.store.relationships.first(
      (r) => r.sourceOrganizationId === viewerOrgId && r.targetOrganizationId === subjectOrgId,
    );
  }

  /* ---------------- invitations ---------------- */

  invitationsForWorkspace(workspaceId: string): Invitation[] {
    return this.ctx.store.invitations.find((i) => i.workspaceId === workspaceId);
  }

  invitationsForOrganization(organizationId: string): Invitation[] {
    return this.ctx.store.invitations.find((i) => i.toOrganizationId === organizationId);
  }

  invitationByToken(token: string): Invitation | undefined {
    return this.ctx.store.invitations.first((i) => i.token === token);
  }

  /**
   * Invitation is the entry point of the network flywheel: the invitee becomes a
   * MEMBER, never automatically a paying customer (Section 3).
   */
  invite(input: {
    workspaceId: string;
    fromOrganizationId: string;
    toOrganizationName: string;
    toOrganizationId?: string;
    toEmail: string;
    relationshipType: RelationshipType;
    policyId: string;
    campaignId?: string;
    message?: string;
    actor?: AccessContext;
  }): Invitation {
    if (input.actor) assertPermission(input.actor, 'invitation:send');
    const now = this.ctx.now();
    const invitation: Invitation = {
      id: this.ctx.ids.next('inv'),
      workspaceId: input.workspaceId,
      fromOrganizationId: input.fromOrganizationId,
      toOrganizationName: input.toOrganizationName,
      toOrganizationId: input.toOrganizationId,
      toEmail: input.toEmail,
      relationshipType: input.relationshipType,
      policyId: input.policyId,
      campaignId: input.campaignId,
      status: 'SENT',
      token: `inv_${Math.abs(hash(`${input.toOrganizationName}${now}`)).toString(36)}`,
      message: input.message,
      createdAt: now,
      sentAt: now,
      expiresAt: addDays(now, 30),
    };
    this.ctx.store.invitations.insert(invitation);

    const from = this.organizations.require(input.fromOrganizationId);
    this.ctx.audit({
      ctx: input.actor,
      workspaceId: input.workspaceId,
      organizationId: input.fromOrganizationId,
      action: 'invitation.sent',
      resourceType: 'invitation',
      resourceId: invitation.id,
      summary: `${from.displayName} invited ${input.toOrganizationName} to complete BID verification.`,
      metadata: { relationshipType: input.relationshipType, policyId: input.policyId },
    });
    this.ctx.emit(
      'InvitationCreated',
      { invitationId: invitation.id, to: input.toOrganizationName, from: from.displayName },
      { workspaceId: input.workspaceId, organizationId: input.fromOrganizationId },
    );
    this.ctx.emit('InvitationSent', { invitationId: invitation.id }, { workspaceId: input.workspaceId });

    if (input.toOrganizationId) {
      const target = this.organizations.require(input.toOrganizationId);
      this.ctx.notify({
        organizationId: target.id,
        workspaceId: target.primaryWorkspaceId,
        kind: 'invitation.received',
        title: `${from.displayName} invited your organization to complete BID verification`,
        body: `Relationship: ${input.relationshipType}. Accept to begin — becoming a BID Member is free.`,
        severity: 'INFO',
        link: '/app/requests-received',
      });
      if (target.lifecycle === 'DISCOVERED') {
        this.ctx.store.organizations.update(target.id, { lifecycle: 'INVITED', updatedAt: now });
      }
    }
    return invitation;
  }

  markInvitationOpened(id: string): Invitation {
    const invitation = this.ctx.store.invitations.require(id);
    if (invitation.status === 'SENT') {
      return this.ctx.store.invitations.update(id, { status: 'OPENED' });
    }
    return invitation;
  }

  acceptInvitation(id: string, acceptingOrganizationId: string): Invitation {
    const invitation = this.ctx.store.invitations.require(id);
    const now = this.ctx.now();
    const next = this.ctx.store.invitations.update(id, {
      status: 'ACCEPTED',
      acceptedAt: now,
      toOrganizationId: acceptingOrganizationId,
    });
    this.ctx.audit({
      workspaceId: invitation.workspaceId,
      organizationId: acceptingOrganizationId,
      action: 'invitation.accepted',
      resourceType: 'invitation',
      resourceId: id,
      summary: `${invitation.toOrganizationName} accepted the verification invitation.`,
      metadata: {},
    });
    this.ctx.emit(
      'InvitationAccepted',
      { invitationId: id, organizationId: acceptingOrganizationId },
      { workspaceId: invitation.workspaceId, organizationId: acceptingOrganizationId },
    );
    this.ctx.notify({
      workspaceId: invitation.workspaceId,
      organizationId: invitation.fromOrganizationId,
      kind: 'invitation.accepted',
      title: `${invitation.toOrganizationName} accepted your invitation`,
      body: 'Verification can now proceed under the selected policy.',
      severity: 'SUCCESS',
      link: '/app/requests-sent',
    });
    return next;
  }

  declineInvitation(id: string): Invitation {
    return this.ctx.store.invitations.update(id, { status: 'DECLINED' });
  }
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  return h;
}
