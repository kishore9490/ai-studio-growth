import type { AccessContext } from '../security/access.js';
import type { PlatformContext } from './context.js';

export type SearchResultKind =
  | 'ORGANIZATION'
  | 'PERSON'
  | 'RELATIONSHIP'
  | 'VERIFICATION'
  | 'CAMPAIGN'
  | 'CREDENTIAL'
  | 'POLICY'
  | 'CUSTOMER';

export interface SearchResult {
  kind: SearchResultKind;
  id: string;
  title: string;
  subtitle: string;
  bidId?: string;
  href: string;
  /** Why the viewer is allowed to see this hit. */
  access: 'PUBLIC' | 'OWN_WORKSPACE' | 'RELATIONSHIP' | 'PLATFORM_ADMIN';
}

/**
 * Global search (Section 38). Search is permission-aware by construction: every
 * candidate is filtered through the same tenant rules as direct reads, so a
 * result set can never become a data-leak side channel.
 */
export class SearchService {
  constructor(private readonly ctx: PlatformContext) {}

  search(query: string, ctx: AccessContext, limit = 20): SearchResult[] {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    const results: SearchResult[] = [];
    const isPlatformAdmin = ctx.platformRoles.length > 0;

    const matches = (...values: (string | undefined)[]) =>
      values.some((value) => value?.toLowerCase().includes(needle));

    // Organizations: identity is network-visible, but only name/BID ID level.
    for (const organization of this.ctx.store.organizations.all()) {
      if (!matches(organization.displayName, organization.legalName, organization.bidId)) continue;
      const own = organization.id === ctx.organizationId;
      const related = this.ctx.store.relationships
        .find((r) => r.workspaceId === ctx.workspaceId)
        .some((r) => r.targetOrganizationId === organization.id);
      results.push({
        kind: 'ORGANIZATION',
        id: organization.id,
        title: organization.displayName,
        subtitle: `${organization.bidId} · ${organization.commercialState.replace('_', ' ').toLowerCase()}`,
        bidId: organization.bidId,
        href: `/profile/${organization.bidId}`,
        access: own ? 'OWN_WORKSPACE' : related ? 'RELATIONSHIP' : isPlatformAdmin ? 'PLATFORM_ADMIN' : 'PUBLIC',
      });
    }

    // Relationships: workspace-scoped only.
    for (const relationship of this.ctx.store.relationships.find((r) => r.workspaceId === ctx.workspaceId)) {
      const target = relationship.targetOrganizationId
        ? this.ctx.store.organizations.get(relationship.targetOrganizationId)
        : undefined;
      if (!matches(target?.displayName, relationship.bidId, relationship.type, relationship.label)) continue;
      results.push({
        kind: 'RELATIONSHIP',
        id: relationship.id,
        title: target?.displayName ?? relationship.label ?? 'Relationship',
        subtitle: `${relationship.type.replace('_', ' ').toLowerCase()} · ${relationship.lifecycle.toLowerCase()}`,
        bidId: relationship.bidId,
        href: `/app/relationships/${relationship.id}`,
        access: 'OWN_WORKSPACE',
      });
    }

    // Verifications: visible to the requesting workspace or the subject org.
    for (const request of this.ctx.store.verificationRequests.all()) {
      const visible = request.workspaceId === ctx.workspaceId || request.subjectOrganizationId === ctx.organizationId;
      if (!visible && !isPlatformAdmin) continue;
      if (!matches(request.subjectName, request.bidId)) continue;
      results.push({
        kind: 'VERIFICATION',
        id: request.id,
        title: `${request.subjectName}`,
        subtitle: `${request.bidId} · ${request.status.replace(/_/g, ' ').toLowerCase()}`,
        bidId: request.bidId,
        href: `/app/verifications/${request.id}`,
        access: request.workspaceId === ctx.workspaceId ? 'OWN_WORKSPACE' : isPlatformAdmin ? 'PLATFORM_ADMIN' : 'RELATIONSHIP',
      });
    }

    for (const campaign of this.ctx.store.campaigns.find((c) => c.workspaceId === ctx.workspaceId)) {
      if (!matches(campaign.name, campaign.bidId)) continue;
      results.push({
        kind: 'CAMPAIGN',
        id: campaign.id,
        title: campaign.name,
        subtitle: `${campaign.bidId} · ${campaign.status.toLowerCase()}`,
        bidId: campaign.bidId,
        href: `/app/campaigns/${campaign.id}`,
        access: 'OWN_WORKSPACE',
      });
    }

    for (const policy of this.ctx.store.policies.find((p) => !p.workspaceId || p.workspaceId === ctx.workspaceId)) {
      if (!matches(policy.name, policy.bidId)) continue;
      results.push({
        kind: 'POLICY',
        id: policy.id,
        title: policy.name,
        subtitle: `${policy.riskLevel.toLowerCase()} risk · ${policy.system ? 'BID template' : 'workspace policy'}`,
        bidId: policy.bidId,
        href: `/app/policies/${policy.id}`,
        access: policy.workspaceId ? 'OWN_WORKSPACE' : 'PUBLIC',
      });
    }

    for (const credential of this.ctx.store.credentials.all()) {
      const ownSubject = credential.subjectOrganizationId === ctx.organizationId;
      const issuedByViewer = credential.issuedByOrganizationId === ctx.organizationId;
      if (!ownSubject && !issuedByViewer && !isPlatformAdmin) continue;
      if (!matches(credential.title, credential.bidId)) continue;
      results.push({
        kind: 'CREDENTIAL',
        id: credential.id,
        title: credential.title,
        subtitle: `${credential.bidId} · ${credential.status.toLowerCase()}`,
        bidId: credential.bidId,
        href: '/app/credentials',
        access: ownSubject ? 'OWN_WORKSPACE' : issuedByViewer ? 'RELATIONSHIP' : 'PLATFORM_ADMIN',
      });
    }

    // People are never network-searchable: only the workspace that ran the BGV.
    for (const person of this.ctx.store.persons.all()) {
      const hasRequest = this.ctx.store.verificationRequests
        .find((r) => r.workspaceId === ctx.workspaceId)
        .some((r) => r.subjectPersonId === person.id);
      if (!hasRequest && !isPlatformAdmin) continue;
      if (!matches(person.fullName, person.bidId)) continue;
      results.push({
        kind: 'PERSON',
        id: person.id,
        title: person.fullName,
        subtitle: `${person.bidId} · person record (restricted)`,
        bidId: person.bidId,
        href: '/app/people',
        access: hasRequest ? 'OWN_WORKSPACE' : 'PLATFORM_ADMIN',
      });
    }

    return results.slice(0, limit);
  }
}
