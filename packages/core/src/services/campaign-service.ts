import type { RelationshipType } from '../domain/enums.js';
import type { Campaign, CampaignMember } from '../domain/types.js';
import { assertPermission, type AccessContext } from '../security/access.js';
import type { PlatformContext } from './context.js';
import type { RelationshipService } from './relationship-service.js';
import type { VerificationService } from './verification-service.js';

export interface CampaignProgress {
  campaign: Campaign;
  members: CampaignMember[];
  invited: number;
  registered: number;
  inProgress: number;
  completed: number;
  exceptions: number;
  completionRate: number;
  slaBreaches: number;
}

/**
 * Campaigns batch the same policy across many counterparties — the shape most
 * procurement and compliance teams actually work in ("verify 10 suppliers").
 */
export class CampaignService {
  constructor(
    private readonly ctx: PlatformContext,
    private readonly relationships: RelationshipService,
    private readonly verifications: VerificationService,
  ) {}

  listForWorkspace(workspaceId: string): Campaign[] {
    return this.ctx.store.campaigns.find((c) => c.workspaceId === workspaceId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): Campaign | undefined {
    return this.ctx.store.campaigns.get(id);
  }

  members(campaignId: string): CampaignMember[] {
    return this.ctx.store.campaignMembers.find((m) => m.campaignId === campaignId);
  }

  create(input: {
    workspaceId: string;
    requesterOrganizationId: string;
    name: string;
    policyId: string;
    relationshipType: RelationshipType;
    slaDays?: number;
    actor?: AccessContext;
  }): Campaign {
    if (input.actor) assertPermission(input.actor, 'campaign:write');
    const campaign: Campaign = {
      id: this.ctx.ids.next('cmp'),
      bidId: this.ctx.bidIds.next('CMP'),
      workspaceId: input.workspaceId,
      requesterOrganizationId: input.requesterOrganizationId,
      name: input.name,
      policyId: input.policyId,
      relationshipType: input.relationshipType,
      status: 'ACTIVE',
      slaDays: input.slaDays ?? 14,
      createdAt: this.ctx.now(),
    };
    this.ctx.store.campaigns.insert(campaign);
    this.ctx.audit({
      ctx: input.actor,
      workspaceId: input.workspaceId,
      organizationId: input.requesterOrganizationId,
      action: 'campaign.created',
      resourceType: 'campaign',
      resourceId: campaign.id,
      summary: `Campaign "${campaign.name}" created (${campaign.bidId}).`,
      metadata: { policyId: input.policyId, relationshipType: input.relationshipType },
    });
    this.ctx.emit('CampaignCreated', { campaignId: campaign.id, name: campaign.name }, { workspaceId: input.workspaceId });
    return campaign;
  }

  addMember(input: {
    campaignId: string;
    targetName: string;
    targetEmail: string;
    targetOrganizationId?: string;
  }): CampaignMember {
    const member: CampaignMember = {
      id: this.ctx.ids.next('cmb'),
      campaignId: input.campaignId,
      targetName: input.targetName,
      targetEmail: input.targetEmail,
      targetOrganizationId: input.targetOrganizationId,
      state: 'PENDING_INVITE',
      createdAt: this.ctx.now(),
    };
    this.ctx.store.campaignMembers.insert(member);
    return member;
  }

  /** Sends the invitation for one campaign member and advances their state. */
  inviteMember(memberId: string, actor?: AccessContext): CampaignMember {
    const member = this.ctx.store.campaignMembers.require(memberId);
    const campaign = this.ctx.store.campaigns.require(member.campaignId);
    const invitation = this.relationships.invite({
      workspaceId: campaign.workspaceId,
      fromOrganizationId: campaign.requesterOrganizationId,
      toOrganizationName: member.targetName,
      toOrganizationId: member.targetOrganizationId,
      toEmail: member.targetEmail,
      relationshipType: campaign.relationshipType,
      policyId: campaign.policyId,
      campaignId: campaign.id,
      actor,
    });
    return this.ctx.store.campaignMembers.update(memberId, { state: 'INVITED', invitationId: invitation.id });
  }

  setMemberState(memberId: string, state: CampaignMember['state'], verificationRequestId?: string): CampaignMember {
    const patch: Partial<CampaignMember> = { state };
    if (verificationRequestId) patch.verificationRequestId = verificationRequestId;
    const member = this.ctx.store.campaignMembers.update(memberId, patch);
    this.recomputeStatus(member.campaignId);
    return member;
  }

  /** Keeps member states in step with the verification lifecycle. */
  syncFromVerifications(campaignId: string): void {
    for (const member of this.members(campaignId)) {
      if (!member.verificationRequestId) continue;
      const request = this.verifications.get(member.verificationRequestId);
      if (!request) continue;
      // Member state mirrors where the counterparty actually is, not merely
      // "not finished": an organization that has not accepted yet is INVITED,
      // not IN_PROGRESS.
      const state: CampaignMember['state'] = ['COMPLETED', 'CREDENTIAL_ISSUED', 'MONITORING'].includes(request.status)
        ? 'COMPLETED'
        : ['FAILED', 'REQUIRES_REVIEW', 'PARTIAL', 'EXPIRED', 'REVOKED'].includes(request.status)
          ? 'EXCEPTION'
          : ['REQUESTED', 'INVITED'].includes(request.status)
            ? 'INVITED'
            : ['ACCEPTED', 'CONSENT_PENDING'].includes(request.status)
              ? 'REGISTERED'
              : 'IN_PROGRESS';
      if (state !== member.state) this.ctx.store.campaignMembers.update(member.id, { state });
    }
    this.recomputeStatus(campaignId);
  }

  progress(campaignId: string): CampaignProgress {
    const campaign = this.ctx.store.campaigns.require(campaignId);
    const members = this.members(campaignId);
    const count = (state: CampaignMember['state']) => members.filter((m) => m.state === state).length;
    const completed = count('COMPLETED');
    const now = this.ctx.now();

    const slaBreaches = members.filter((m) => {
      if (!m.verificationRequestId) return false;
      const request = this.verifications.get(m.verificationRequestId);
      return Boolean(request && request.slaDueAt < now && m.state !== 'COMPLETED');
    }).length;

    return {
      campaign,
      members,
      invited: members.filter((m) => m.state !== 'PENDING_INVITE').length,
      registered: members.filter((m) => ['REGISTERED', 'IN_PROGRESS', 'COMPLETED', 'EXCEPTION'].includes(m.state)).length,
      inProgress: count('IN_PROGRESS'),
      completed,
      exceptions: count('EXCEPTION'),
      completionRate: members.length ? Math.round((completed / members.length) * 100) : 0,
      slaBreaches,
    };
  }

  private recomputeStatus(campaignId: string): void {
    const campaign = this.ctx.store.campaigns.require(campaignId);
    const members = this.members(campaignId);
    if (members.length === 0) return;
    const settled = members.every((m) => m.state === 'COMPLETED' || m.state === 'EXCEPTION');
    if (settled && campaign.status === 'ACTIVE') {
      this.ctx.store.campaigns.update(campaignId, { status: 'COMPLETED', completedAt: this.ctx.now() });
      this.ctx.emit('CampaignCompleted', { campaignId }, { workspaceId: campaign.workspaceId });
    }
  }
}
