import type { Attribution, CommercialState, Freshness, Industry, OrganizationLifecycle } from '../domain/enums.js';
import type {
  Credential,
  Organization,
  OrganizationIdentifier,
  Person,
  Workspace,
} from '../domain/types.js';
import { getCheckDefinition } from '../domain/check-catalog.js';
import { maskValue, type AccessContext, assertPermission } from '../security/access.js';
import { freshnessFor } from '../verification/assessment.js';
import type { PlatformContext } from './context.js';

/** Projection of an organization that is safe to serve publicly (Section 17/36). */
export interface PublicProfile {
  bidId: string;
  displayName: string;
  legalName: string;
  logoText: string;
  logoColor: string;
  industry: Industry;
  country: string;
  city?: string;
  website?: string;
  description?: string;
  lifecycle: OrganizationLifecycle;
  commercialState: CommercialState;
  memberSince?: string;
  /** Company-provided facts, clearly labelled as such. */
  companyProvided: { label: string; value: string }[];
  /** BID/provider-verified attribute summaries — never raw evidence. */
  verifiedAttributes: {
    label: string;
    state: 'VERIFIED' | 'ATTENTION' | 'NOT_VERIFIED';
    attribution: Attribution;
    source: string;
    checkedAt: string;
    freshness: Freshness;
  }[];
  credentials: {
    bidId: string;
    title: string;
    issuedAt: string;
    expiresAt: string;
    status: Credential['status'];
    policyName: string;
  }[];
  verificationSummary: {
    verified: boolean;
    lastVerifiedAt?: string;
    freshness?: Freshness;
    policyName?: string;
    verifiedByOrganization?: string;
  };
  disclaimer: string;
  profileUrl: string;
}

/** Compact card representation — deliberately free of sensitive detail. */
export interface DigitalCard {
  bidId: string;
  displayName: string;
  logoText: string;
  logoColor: string;
  status: 'BID VERIFIED' | 'BID MEMBER' | 'VERIFICATION IN PROGRESS' | 'NOT VERIFIED';
  attributes: { label: string; state: 'VERIFIED' | 'ATTENTION' | 'NOT_VERIFIED' }[];
  issuedAt?: string;
  expiresAt?: string;
  qrPayload: string;
  profileUrl: string;
  footnote: string;
}

export const PUBLIC_DISCLAIMER =
  'BID Trust is an independent private verification platform. Verification statuses reflect evidence obtained from named sources and providers at the time stated. BID Trust is not a government authority, does not certify businesses, and does not guarantee outcomes.';

export class OrganizationService {
  constructor(private readonly ctx: PlatformContext, private readonly publicBaseUrl = 'https://bidtrust.in') {}

  list(): Organization[] {
    return this.ctx.store.organizations.all();
  }

  get(id: string): Organization | undefined {
    return this.ctx.store.organizations.get(id);
  }

  require(id: string): Organization {
    return this.ctx.store.organizations.require(id);
  }

  byBidId(bidId: string): Organization | undefined {
    return this.ctx.store.organizations.first((o) => o.bidId.toUpperCase() === bidId.trim().toUpperCase());
  }

  byName(name: string): Organization | undefined {
    const needle = name.trim().toLowerCase();
    return this.ctx.store.organizations.first(
      (o) => o.displayName.toLowerCase() === needle || o.legalName.toLowerCase() === needle,
    );
  }

  /**
   * An organization with this name that nobody has claimed yet.
   *
   * Sign-up uses this: an organization is routinely in the network — invited or
   * merely referenced by a counterparty — before anyone from it registers, and
   * that identity should be claimed rather than duplicated. A claimed match is
   * deliberately not returned; joining someone else's existing workspace is an
   * invitation flow, not a sign-up.
   */
  findUnclaimedByName(name: string): Organization | undefined {
    const match = this.byName(name);
    return match && !match.primaryWorkspaceId ? match : undefined;
  }

  identifiers(organizationId: string): OrganizationIdentifier[] {
    return this.ctx.store.organizationIdentifiers.find((i) => i.organizationId === organizationId);
  }

  /**
   * Creates an organization identity. An identity may exist before anyone from
   * that organization has ever logged in (DISCOVERED / INVITED states).
   */
  create(input: {
    legalName: string;
    displayName?: string;
    industry: Industry;
    country?: string;
    city?: string;
    website?: string;
    description?: string;
    lifecycle?: OrganizationLifecycle;
    commercialState?: CommercialState;
    introducedByOrgId?: string;
    logoColor?: string;
    bidId?: string;
    tags?: string[];
    actor?: AccessContext;
  }): Organization {
    const now = this.ctx.now();
    const bidId = input.bidId ?? this.ctx.bidIds.next('BUS');
    if (input.bidId) this.ctx.bidIds.reserve(input.bidId);
    const displayName = input.displayName ?? input.legalName;

    const organization: Organization = {
      id: this.ctx.ids.next('org'),
      bidId,
      legalName: input.legalName,
      displayName,
      description: input.description,
      website: input.website,
      logoText: initialsOf(displayName),
      logoColor: input.logoColor ?? pickColor(displayName),
      industry: input.industry,
      country: input.country ?? 'IN',
      city: input.city,
      lifecycle: input.lifecycle ?? 'DISCOVERED',
      commercialState: input.commercialState ?? 'NON_MEMBER',
      introducedByOrgId: input.introducedByOrgId,
      createdAt: now,
      updatedAt: now,
      tags: input.tags ?? [],
    };

    this.ctx.store.organizations.insert(organization);
    this.ctx.audit({
      ctx: input.actor,
      action: 'organization.created',
      resourceType: 'organization',
      resourceId: organization.id,
      summary: `Organization identity created for ${organization.displayName} (${organization.bidId}).`,
      metadata: { bidId: organization.bidId, lifecycle: organization.lifecycle },
    });
    this.ctx.emit('OrganizationCreated', { organizationId: organization.id, bidId: organization.bidId, name: displayName });
    return organization;
  }

  update(id: string, patch: Partial<Organization>, actor?: AccessContext): Organization {
    if (actor) assertPermission(actor, 'org:write');
    const next = this.ctx.store.organizations.update(id, { ...patch, updatedAt: this.ctx.now() });
    this.ctx.audit({
      ctx: actor,
      action: 'organization.updated',
      resourceType: 'organization',
      resourceId: id,
      summary: `Organization profile updated for ${next.displayName}.`,
      metadata: { fields: Object.keys(patch).join(',') },
    });
    return next;
  }

  addIdentifier(input: {
    organizationId: string;
    kind: OrganizationIdentifier['kind'];
    value: string;
    attribution?: Attribution;
    actor?: AccessContext;
  }): OrganizationIdentifier {
    const identifier: OrganizationIdentifier = {
      id: this.ctx.ids.next('oid'),
      organizationId: input.organizationId,
      kind: input.kind,
      value: maskValue(input.value, 2, 2),
      attribution: input.attribution ?? 'COMPANY_PROVIDED',
      visibility: input.kind === 'GSTIN' || input.kind === 'CIN' ? 'RELATIONSHIP_ONLY' : 'AUTHORIZED_ONLY',
      createdAt: this.ctx.now(),
    };
    this.ctx.store.organizationIdentifiers.insert(identifier);
    return identifier;
  }

  /**
   * Claiming converts a discovered/invited identity into a registered one and
   * provisions the organization's own private workspace (tenant).
   */
  claim(input: { organizationId: string; workspaceName?: string; requesterEnabled?: boolean }): Workspace {
    const organization = this.require(input.organizationId);
    const now = this.ctx.now();
    const workspace: Workspace = {
      id: this.ctx.ids.next('ws'),
      tenantId: this.ctx.ids.next('tnt'),
      organizationId: organization.id,
      name: input.workspaceName ?? `${organization.displayName} workspace`,
      createdAt: now,
      requesterEnabled: input.requesterEnabled ?? false,
    };
    this.ctx.store.workspaces.insert(workspace);
    this.ctx.store.organizations.update(organization.id, {
      lifecycle: 'REGISTERED',
      commercialState: organization.commercialState === 'NON_MEMBER' ? 'MEMBER' : organization.commercialState,
      primaryWorkspaceId: workspace.id,
      claimedAt: now,
      updatedAt: now,
    });
    this.ctx.audit({
      action: 'organization.claimed',
      resourceType: 'organization',
      resourceId: organization.id,
      organizationId: organization.id,
      workspaceId: workspace.id,
      summary: `${organization.displayName} claimed its BID identity and became a BID Member.`,
      metadata: { bidId: organization.bidId },
    });
    this.ctx.emit(
      'OrganizationClaimed',
      { organizationId: organization.id, workspaceId: workspace.id, bidId: organization.bidId },
      { organizationId: organization.id, workspaceId: workspace.id },
    );
    return workspace;
  }

  setCommercialState(organizationId: string, state: CommercialState, note?: string): Organization {
    const organization = this.require(organizationId);
    if (organization.commercialState === state) return organization;
    const next = this.ctx.store.organizations.update(organizationId, {
      commercialState: state,
      updatedAt: this.ctx.now(),
    });
    this.ctx.audit({
      action: 'organization.commercial_state_changed',
      resourceType: 'organization',
      resourceId: organizationId,
      organizationId,
      summary: `${organization.displayName}: ${organization.commercialState} → ${state}${note ? ` (${note})` : ''}.`,
      metadata: { from: organization.commercialState, to: state },
    });
    return next;
  }

  workspaceFor(organizationId: string): Workspace | undefined {
    return this.ctx.store.workspaces.first((w) => w.organizationId === organizationId);
  }

  persons(): Person[] {
    return this.ctx.store.persons.all();
  }

  createPerson(input: { fullName: string; email: string; phone: string; city?: string; country?: string; bidId?: string }): Person {
    const bidId = input.bidId ?? this.ctx.bidIds.next('PER');
    if (input.bidId) this.ctx.bidIds.reserve(input.bidId);
    const now = this.ctx.now();
    const person: Person = {
      id: this.ctx.ids.next('per'),
      bidId,
      fullName: input.fullName,
      emailMasked: maskEmail(input.email),
      phoneMasked: maskValue(input.phone, 2, 2),
      city: input.city,
      country: input.country ?? 'IN',
      createdAt: now,
      updatedAt: now,
    };
    this.ctx.store.persons.insert(person);
    return person;
  }

  /* ---------------- public projections ---------------- */

  /**
   * Builds the public profile. This method is the ONLY path used by public
   * routes; it derives everything from credentials and public-safe summaries so
   * that raw evidence can never leak (Business Rule 13).
   */
  publicProfile(bidId: string): PublicProfile | undefined {
    const organization = this.byBidId(bidId);
    if (!organization) return undefined;
    const now = this.ctx.now();

    const credentials = this.ctx.store.credentials
      .find((c) => c.subjectOrganizationId === organization.id && c.status !== 'REVOKED')
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

    const latest = credentials[0];
    const latestRequest = latest ? this.ctx.store.verificationRequests.get(latest.verificationRequestId) : undefined;
    const policy = latest ? this.ctx.store.policies.get(latest.policyId) : undefined;
    const issuer = latest?.issuedByOrganizationId ? this.ctx.store.organizations.get(latest.issuedByOrganizationId) : undefined;

    // Public attributes are derived ONLY from checks whose catalog entry marks a
    // summary as publicly shareable. Raw evidence never reaches this projection.
    const verifiedAttributes: PublicProfile['verifiedAttributes'] = [];
    if (latest && latestRequest) {
      const evidence = this.ctx.store.evidence.find((e) => e.verificationRequestId === latestRequest.id);
      for (const item of evidence) {
        const definition = getCheckDefinition(item.checkCode);
        if (!definition?.publicSummaryAllowed) continue;
        if (item.result === 'UNAVAILABLE') continue;
        verifiedAttributes.push({
          label: definition.label,
          state: item.result === 'PASS' ? 'VERIFIED' : item.result === 'ATTENTION' ? 'ATTENTION' : 'NOT_VERIFIED',
          attribution: item.attribution,
          source: item.source,
          checkedAt: item.checkedAt,
          freshness: freshnessFor(item.checkedAt, definition.defaultValidityDays, now),
        });
      }
    }

    const identifiers = this.identifiers(organization.id).filter((i) => i.visibility === 'PUBLIC');

    return {
      bidId: organization.bidId,
      displayName: organization.displayName,
      legalName: organization.legalName,
      logoText: organization.logoText,
      logoColor: organization.logoColor,
      industry: organization.industry,
      country: organization.country,
      city: organization.city,
      website: organization.website,
      description: organization.description,
      lifecycle: organization.lifecycle,
      commercialState: organization.commercialState,
      memberSince: organization.claimedAt,
      companyProvided: [
        { label: 'Legal name', value: organization.legalName },
        { label: 'Industry', value: organization.industry },
        { label: 'Country', value: organization.country },
        ...(organization.city ? [{ label: 'City', value: organization.city }] : []),
        ...(organization.website ? [{ label: 'Website', value: organization.website }] : []),
        ...identifiers.map((i) => ({ label: i.kind, value: i.value })),
      ],
      verifiedAttributes,
      credentials: credentials.map((c) => ({
        bidId: c.bidId,
        title: c.title,
        issuedAt: c.issuedAt,
        expiresAt: c.expiresAt,
        status: c.status,
        policyName: this.ctx.store.policies.get(c.policyId)?.name ?? 'Policy',
      })),
      verificationSummary: {
        verified: Boolean(latest && latest.status === 'ACTIVE'),
        lastVerifiedAt: latest?.issuedAt,
        freshness: latest ? freshnessFor(latest.issuedAt, 365, now) : undefined,
        policyName: policy?.name,
        verifiedByOrganization: issuer?.displayName,
      },
      disclaimer: PUBLIC_DISCLAIMER,
      profileUrl: `${this.publicBaseUrl}/profile/${organization.bidId}`,
    };
  }

  digitalCard(bidId: string): DigitalCard | undefined {
    const profile = this.publicProfile(bidId);
    if (!profile) return undefined;
    const organization = this.byBidId(bidId);
    if (!organization) return undefined;

    const activeCredential = this.ctx.store.credentials
      .find((c) => c.subjectOrganizationId === organization.id && c.status === 'ACTIVE')
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0];

    const runningRequest = this.ctx.store.verificationRequests.first(
      (r) => r.subjectOrganizationId === organization.id && ['IN_PROGRESS', 'CHECKS_RUNNING', 'ASSESSMENT', 'REVIEW'].includes(r.status),
    );

    const status: DigitalCard['status'] = activeCredential
      ? 'BID VERIFIED'
      : runningRequest
        ? 'VERIFICATION IN PROGRESS'
        : organization.commercialState === 'NON_MEMBER'
          ? 'NOT VERIFIED'
          : 'BID MEMBER';

    return {
      bidId: organization.bidId,
      displayName: organization.displayName,
      logoText: organization.logoText,
      logoColor: organization.logoColor,
      status,
      attributes: activeCredential
        ? activeCredential.publicAttributes.map((a) => ({ label: a.label, state: a.state }))
        : [
            { label: 'Identity', state: 'NOT_VERIFIED' },
            { label: 'Business status', state: 'NOT_VERIFIED' },
            { label: 'Required compliance', state: 'NOT_VERIFIED' },
            { label: 'Risk checks', state: 'NOT_VERIFIED' },
          ],
      issuedAt: activeCredential?.issuedAt,
      expiresAt: activeCredential?.expiresAt,
      qrPayload: profile.profileUrl,
      profileUrl: profile.profileUrl,
      footnote: 'Scan to view the BID profile and the evidence summary behind this card.',
    };
  }
}

function initialsOf(name: string): string {
  const words = name.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'BID';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return (words[0][0] + words[1][0] + (words[2]?.[0] ?? '')).toUpperCase();
}

const COLORS = ['#1e3a8a', '#0f766e', '#7c2d12', '#4c1d95', '#155e75', '#374151', '#7f1d1d'];

function pickColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % COLORS.length;
  return COLORS[hash];
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return maskValue(email);
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(3, user.length - 2))}@${domain}`;
}
