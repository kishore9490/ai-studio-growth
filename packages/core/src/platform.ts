import { DEFAULT_PLANS } from './billing/pricing.js';
import type { Industry, PlatformRole, RelationshipType, WorkspaceRole } from './domain/enums.js';
import type { Notification, Organization, Plan, User } from './domain/types.js';
import { InMemoryEventBus, type DomainEvent, type EventBus } from './events/events.js';
import { createDefaultProviders, providerRecords, type ScriptedOutcomes } from './providers/mock-providers.js';
import { ProviderRegistry } from './providers/provider.js';
import { ProviderRouter, type RoutingStrategy } from './providers/router.js';
import { BidStore } from './store/store.js';
import { BillingService } from './services/billing-service.js';
import { CampaignService } from './services/campaign-service.js';
import { PlatformContext } from './services/context.js';
import { CustomerLifecycleService } from './services/lifecycle-service.js';
import { MonitoringService } from './services/monitoring-service.js';
import { OrganizationService } from './services/organization-service.js';
import { PolicyService } from './services/policy-service.js';
import { RelationshipService } from './services/relationship-service.js';
import { SearchService } from './services/search-service.js';
import { VerificationService } from './services/verification-service.js';
import type { AccessContext } from './security/access.js';
import { SystemClock, type Clock } from './util/clock.js';
import { BidIdAllocator, SurrogateIdFactory } from './util/id.js';

export interface PlatformOptions {
  clock?: Clock;
  bus?: EventBus;
  routingStrategy?: RoutingStrategy;
  scriptedProviderOutcomes?: ScriptedOutcomes;
  publicBaseUrl?: string;
}

export interface GraphNode {
  id: string;
  kind: 'ORGANIZATION' | 'PERSON' | 'CREDENTIAL';
  label: string;
  bidId: string;
  commercialState?: Organization['commercialState'];
  lifecycle?: string;
  verified: boolean;
  monitored: boolean;
  isCustomer: boolean;
  color: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType | 'VERIFIED_BY' | 'ISSUED';
  label: string;
  lifecycle: string;
  verificationStatus: string;
  monitored: boolean;
}

export interface NetworkGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Composition root.
 *
 * The same object graph runs in three places: the browser demo, the API process
 * and tests. Nothing below knows about HTTP, React or a database — swapping the
 * in-memory store for Prisma is a constructor change.
 */
export class BidPlatform {
  readonly store: BidStore;
  readonly bus: EventBus;
  readonly context: PlatformContext;

  readonly organizations: OrganizationService;
  readonly relationships: RelationshipService;
  readonly policies: PolicyService;
  readonly verifications: VerificationService;
  readonly campaigns: CampaignService;
  readonly monitoring: MonitoringService;
  readonly billing: BillingService;
  readonly lifecycle: CustomerLifecycleService;
  readonly search: SearchService;

  private readonly changeListeners = new Set<() => void>();

  constructor(options: PlatformOptions = {}) {
    this.store = new BidStore();
    this.bus = options.bus ?? new InMemoryEventBus();

    const registry = new ProviderRegistry();
    for (const provider of createDefaultProviders(options.scriptedProviderOutcomes)) {
      registry.register(provider);
    }
    for (const record of providerRecords(createDefaultProviders(options.scriptedProviderOutcomes))) {
      this.store.providers.insert(record);
    }
    for (const plan of DEFAULT_PLANS) this.store.plans.insert({ ...plan });

    const router = new ProviderRouter(registry, () => this.store.providers.all(), options.routingStrategy ?? 'PRIORITY');

    this.context = new PlatformContext({
      store: this.store,
      bus: this.bus,
      clock: options.clock ?? new SystemClock(),
      ids: new SurrogateIdFactory(),
      bidIds: new BidIdAllocator(),
      registry,
      router,
    });

    this.organizations = new OrganizationService(this.context, options.publicBaseUrl);
    this.relationships = new RelationshipService(this.context, this.organizations);
    this.policies = new PolicyService(this.context);
    this.verifications = new VerificationService(this.context, this.policies, this.organizations);
    this.campaigns = new CampaignService(this.context, this.relationships, this.verifications);
    this.monitoring = new MonitoringService(this.context);
    this.billing = new BillingService(this.context);
    this.lifecycle = new CustomerLifecycleService(this.context, this.billing);
    this.search = new SearchService(this.context);

    this.wireEventConsumers();
  }

  /* ---------------- change notification (UI binding) ---------------- */

  onChange(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  notifyChange(): void {
    for (const listener of this.changeListeners) listener();
  }

  /* ---------------- event consumers (ADR-012) ---------------- */

  private wireEventConsumers(): void {
    // Billing consumes verification events — the verification engine has no
    // knowledge of pricing.
    this.bus.subscribe('VerificationCheckCompleted', (event) => {
      const payload = event.payload as { verificationRequestId: string; checkCode: string; costPaise: number };
      if (!event.workspaceId) return;
      const isPeopleCheck = payload.checkCode.startsWith('PER_');
      this.billing.recordUsage({
        workspaceId: event.workspaceId,
        metric: isPeopleCheck ? 'BGV' : 'CHECK',
        quantity: 1,
        amountPaise: isPeopleCheck
          ? this.billing.priceBook().bgvFromPaise
          : this.billing.priceBook().businessVerificationFromPaise,
        reference: payload.verificationRequestId,
      });
    });

    this.bus.subscribe('VerificationCompleted', (event) => {
      const payload = event.payload as { verificationRequestId: string; subjectOrganizationId?: string; requesterOrganizationId: string };
      const request = this.verifications.get(payload.verificationRequestId);
      if (request?.campaignId) this.campaigns.syncFromVerifications(request.campaignId);

      const requester = this.organizations.get(payload.requesterOrganizationId);
      if (requester) {
        const record = this.lifecycle.forOrganization(requester.id);
        const completed = this.store.verificationRequests.count(
          (r) => r.requesterOrganizationId === requester.id && Boolean(r.completedAt),
        );
        this.lifecycle.updateSignals(requester.id, { verificationsLast30d: completed });
        if (record.state === 'REQUESTER_ACTIVATION') {
          this.lifecycle.transition(requester.id, 'FIRST_VERIFICATION', 'first verification completed');
        }
      }
    });

    this.bus.subscribe('OrganizationClaimed', (event) => {
      const payload = event.payload as { organizationId: string };
      this.lifecycle.transition(payload.organizationId, 'BID_MEMBER', 'claimed BID identity');
    });

    this.bus.subscribe('OrganizationVerified', (event) => {
      const payload = event.payload as { organizationId: string };
      this.lifecycle.transition(payload.organizationId, 'VERIFIED_MEMBER', 'verification approved by counterparty');
    });

    this.bus.subscribe('InvitationCreated', (event) => {
      const payload = event.payload as { to: string };
      const organization = this.organizations.byName(payload.to);
      if (organization) this.lifecycle.transition(organization.id, 'INVITED', 'invited to the BID network');
    });

    this.bus.subscribe('InvitationAccepted', (event) => {
      const payload = event.payload as { organizationId: string };
      this.lifecycle.transition(payload.organizationId, 'REGISTERED', 'accepted invitation');
    });

    this.bus.subscribe('SubscriptionCreated', (event) => {
      const payload = event.payload as { organizationId: string; planId: string };
      const plan = this.billing.plan(payload.planId);
      this.organizations.setCommercialState(
        payload.organizationId,
        plan?.tier === 'ENTERPRISE' ? 'ENTERPRISE' : 'CUSTOMER',
        'subscription activated',
      );
      this.lifecycle.transition(payload.organizationId, 'PAID_CUSTOMER', `subscribed to ${plan?.name ?? 'plan'}`);
    });

    this.bus.subscribe('MonitoringEnabled', (event) => {
      if (!event.workspaceId) return;
      const subscription = this.billing.subscriptionFor(event.workspaceId);
      if (subscription) {
        const count = this.store.monitoringRules.count((r) => r.workspaceId === event.workspaceId && r.active);
        this.store.subscriptions.update(subscription.id, { monitoredEntities: count });
        this.lifecycle.updateSignals(subscription.organizationId, { monitoredEntities: count });
      }
    });

    this.bus.subscribe('PolicyCreated', (event) => {
      if (!event.workspaceId) return;
      const workspace = this.store.workspaces.get(event.workspaceId);
      if (!workspace) return;
      const record = this.lifecycle.forOrganization(workspace.organizationId);
      this.lifecycle.updateSignals(workspace.organizationId, { policiesCreated: record.signals.policiesCreated + 1 });
    });
  }

  /* ---------------- access contexts ---------------- */

  /** Builds the access context for a user acting inside an organization. */
  accessContextFor(organizationId: string, options?: { userId?: string; roles?: WorkspaceRole[]; platformRoles?: PlatformRole[] }): AccessContext {
    const organization = this.organizations.require(organizationId);
    const workspace = this.organizations.workspaceFor(organizationId);
    const workspaceId = workspace?.id ?? 'ws_none';
    const user = options?.userId
      ? this.store.users.get(options.userId)
      : this.store.users.first((u) => u.id.length > 0);

    return {
      userId: user?.id ?? 'usr_demo',
      userName: user?.name ?? 'Demo user',
      workspaceId,
      tenantId: workspace?.tenantId ?? 'tnt_none',
      organizationId,
      roles: options?.roles ?? ['OWNER'],
      platformRoles: options?.platformRoles ?? [],
      entitlements: this.billing.entitlementsFor(workspaceId),
    };
  }

  adminContext(): AccessContext {
    const admin = this.store.users.first((u) => u.platformRoles.includes('BID_ADMIN'));
    return {
      userId: admin?.id ?? 'usr_admin',
      userName: admin?.name ?? 'BID admin',
      workspaceId: 'ws_platform',
      tenantId: 'tnt_platform',
      organizationId: 'org_bid',
      roles: ['OWNER'],
      platformRoles: ['BID_ADMIN'],
      entitlements: this.billing.entitlementsFor('ws_platform'),
    };
  }

  users(): User[] {
    return this.store.users.all();
  }

  /* ---------------- notifications & audit ---------------- */

  notifications(workspaceId?: string, organizationId?: string): Notification[] {
    return this.store.notifications
      .find(
        (n) =>
          Boolean(workspaceId && n.workspaceId === workspaceId) ||
          Boolean(organizationId && n.organizationId === organizationId),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  markNotificationRead(id: string): void {
    this.store.notifications.update(id, { read: true });
  }

  markAllNotificationsRead(workspaceId?: string, organizationId?: string): void {
    for (const notification of this.notifications(workspaceId, organizationId)) {
      if (!notification.read) this.store.notifications.update(notification.id, { read: true });
    }
  }

  auditLog(filter?: { workspaceId?: string; organizationId?: string; resourceId?: string; limit?: number }) {
    return this.store.auditLogs
      .all()
      .filter((entry) => {
        if (filter?.workspaceId && entry.workspaceId !== filter.workspaceId) return false;
        if (filter?.organizationId && entry.organizationId !== filter.organizationId) return false;
        if (filter?.resourceId && entry.resourceId !== filter.resourceId) return false;
        return true;
      })
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, filter?.limit ?? 200);
  }

  events(limit = 50): DomainEvent[] {
    return this.bus.recent(limit);
  }

  plans(): Plan[] {
    return this.billing.plans();
  }

  /* ---------------- network graph (Section 19) ---------------- */

  graph(options?: { workspaceId?: string; includePeople?: boolean; includeCredentials?: boolean }): NetworkGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const relationships = options?.workspaceId
      ? this.store.relationships.find((r) => r.workspaceId === options.workspaceId)
      : this.store.relationships.all();

    const organizationIds = new Set<string>();
    for (const relationship of relationships) {
      organizationIds.add(relationship.sourceOrganizationId);
      if (relationship.targetOrganizationId) organizationIds.add(relationship.targetOrganizationId);
    }
    if (!options?.workspaceId) {
      for (const organization of this.store.organizations.all()) organizationIds.add(organization.id);
    }

    for (const id of organizationIds) {
      const organization = this.store.organizations.get(id);
      if (!organization) continue;
      const verified = ['VERIFIED_MEMBER', 'REQUESTER', 'CUSTOMER', 'ENTERPRISE'].includes(organization.commercialState) &&
        this.verifications.credentialsForOrganization(id).some((c) => c.status === 'ACTIVE');
      const monitored = this.store.monitoringRules.all().some((r) => r.subjectRef === organization.bidId && r.active);
      nodes.push({
        id: organization.id,
        kind: 'ORGANIZATION',
        label: organization.displayName,
        bidId: organization.bidId,
        commercialState: organization.commercialState,
        lifecycle: organization.lifecycle,
        verified,
        monitored,
        isCustomer: ['CUSTOMER', 'ENTERPRISE'].includes(organization.commercialState),
        color: organization.logoColor,
      });
    }

    for (const relationship of relationships) {
      if (relationship.targetOrganizationId) {
        edges.push({
          id: relationship.id,
          source: relationship.sourceOrganizationId,
          target: relationship.targetOrganizationId,
          type: relationship.type,
          label: relationship.type.replace('_', ' ').toLowerCase(),
          lifecycle: relationship.lifecycle,
          verificationStatus: relationship.verificationStatus,
          monitored: relationship.monitoringEnabled,
        });
      } else if (relationship.targetPersonId && options?.includePeople !== false) {
        const person = this.store.persons.get(relationship.targetPersonId);
        if (!person) continue;
        if (!nodes.some((n) => n.id === person.id)) {
          nodes.push({
            id: person.id,
            kind: 'PERSON',
            label: person.fullName,
            bidId: person.bidId,
            verified: this.store.credentials.all().some((c) => c.subjectPersonId === person.id && c.status === 'ACTIVE'),
            monitored: false,
            isCustomer: false,
            color: '#475569',
          });
        }
        edges.push({
          id: relationship.id,
          source: relationship.sourceOrganizationId,
          target: person.id,
          type: relationship.type,
          label: relationship.type.replace('_', ' ').toLowerCase(),
          lifecycle: relationship.lifecycle,
          verificationStatus: relationship.verificationStatus,
          monitored: relationship.monitoringEnabled,
        });
      }
    }

    if (options?.includeCredentials) {
      for (const credential of this.store.credentials.all()) {
        if (credential.status !== 'ACTIVE') continue;
        const subjectId = credential.subjectOrganizationId ?? credential.subjectPersonId;
        if (!subjectId || !nodes.some((n) => n.id === subjectId)) continue;
        nodes.push({
          id: credential.id,
          kind: 'CREDENTIAL',
          label: credential.title,
          bidId: credential.bidId,
          verified: true,
          monitored: false,
          isCustomer: false,
          color: '#047857',
        });
        edges.push({
          id: `edge_${credential.id}`,
          source: subjectId,
          target: credential.id,
          type: 'ISSUED',
          label: 'holds credential',
          lifecycle: 'ACTIVE',
          verificationStatus: 'CREDENTIAL_ISSUED',
          monitored: false,
        });
      }
    }

    return { nodes, edges };
  }

  /* ---------------- high-level journeys ---------------- */

  /**
   * Requester invites a counterparty and opens the verification in one step —
   * the ABC → XYZ move at the heart of the network story.
   */
  inviteCounterparty(input: {
    requesterOrganizationId: string;
    counterpartyName: string;
    counterpartyEmail: string;
    counterpartyOrganizationId?: string;
    relationshipType: RelationshipType;
    policyId: string;
    campaignId?: string;
    industry?: Industry;
    actor?: AccessContext;
  }) {
    const requester = this.organizations.require(input.requesterOrganizationId);
    const workspace = this.organizations.workspaceFor(requester.id);
    if (!workspace) throw new Error(`${requester.displayName} has no workspace; claim the organization first.`);

    let counterparty = input.counterpartyOrganizationId
      ? this.organizations.require(input.counterpartyOrganizationId)
      : this.organizations.byName(input.counterpartyName);

    if (!counterparty) {
      counterparty = this.organizations.create({
        legalName: input.counterpartyName,
        industry: input.industry ?? 'GENERIC',
        lifecycle: 'DISCOVERED',
        introducedByOrgId: requester.id,
        actor: input.actor,
      });
    }

    const relationship = this.relationships.create({
      workspaceId: workspace.id,
      sourceOrganizationId: requester.id,
      targetOrganizationId: counterparty.id,
      type: input.relationshipType,
      policyId: input.policyId,
      lifecycle: 'INVITED',
      actor: input.actor,
    });

    const invitation = this.relationships.invite({
      workspaceId: workspace.id,
      fromOrganizationId: requester.id,
      toOrganizationName: counterparty.displayName,
      toOrganizationId: counterparty.id,
      toEmail: input.counterpartyEmail,
      relationshipType: input.relationshipType,
      policyId: input.policyId,
      campaignId: input.campaignId,
      actor: input.actor,
    });

    const verification = this.verifications.create({
      workspaceId: workspace.id,
      requesterOrganizationId: requester.id,
      subjectOrganizationId: counterparty.id,
      subjectName: counterparty.displayName,
      relationshipId: relationship.id,
      relationshipType: input.relationshipType,
      policyId: input.policyId,
      campaignId: input.campaignId,
      actor: input.actor,
    });
    this.verifications.transition(verification.id, 'INVITED', 'invitation sent to subject');

    this.notifyChange();
    return { counterparty, relationship, invitation, verification };
  }

  /**
   * Subject accepts: claims its BID identity, becomes a MEMBER (not a customer),
   * and the verification moves to ACCEPTED.
   */
  acceptInvitation(invitationId: string) {
    const invitation = this.store.invitations.require(invitationId);
    const organization = invitation.toOrganizationId
      ? this.organizations.require(invitation.toOrganizationId)
      : this.organizations.create({ legalName: invitation.toOrganizationName, industry: 'GENERIC' });

    let workspace = this.organizations.workspaceFor(organization.id);
    if (!workspace) {
      workspace = this.organizations.claim({ organizationId: organization.id });
    }
    this.relationships.acceptInvitation(invitationId, organization.id);

    const verification = this.store.verificationRequests.first(
      (r) => r.subjectOrganizationId === organization.id && ['REQUESTED', 'INVITED'].includes(r.status),
    );
    if (verification) {
      this.verifications.accept(verification.id);
      const plan = this.policies.plan(verification.policyId, verification.policyVersion);
      if (plan.requiresConsent) this.verifications.requestConsent({ verificationRequestId: verification.id });
    }

    const relationship = this.store.relationships.first(
      (r) => r.targetOrganizationId === organization.id && r.workspaceId === invitation.workspaceId,
    );
    if (relationship) this.relationships.transition(relationship.id, 'VERIFICATION', 'subject accepted invitation');

    this.notifyChange();
    // Re-read: claiming mutated lifecycle and commercial state.
    return { organization: this.organizations.require(organization.id), workspace, verification };
  }

  /** Runs every planned check and produces the assessment. */
  async runVerification(verificationRequestId: string) {
    const request = await this.verifications.runAllChecks(verificationRequestId);
    const campaignMember = this.store.campaignMembers.first((m) => m.verificationRequestId === verificationRequestId);
    if (campaignMember) this.campaigns.syncFromVerifications(campaignMember.campaignId);
    this.notifyChange();
    return request;
  }

  /**
   * Requester activation: an organization that was only a subject becomes a
   * requester and (on subscribing) a paying customer. This is the flywheel.
   */
  activateRequester(input: { organizationId: string; planId: string; seats?: number; actor?: AccessContext }) {
    const organization = this.organizations.require(input.organizationId);
    let workspace = this.organizations.workspaceFor(organization.id);
    if (!workspace) workspace = this.organizations.claim({ organizationId: organization.id, requesterEnabled: true });

    this.lifecycle.transition(organization.id, 'REQUESTER_ACTIVATION', 'started requester activation');
    this.organizations.setCommercialState(organization.id, 'REQUESTER', 'requester activation');

    const subscription = this.billing.subscribe({
      workspaceId: workspace.id,
      organizationId: organization.id,
      planId: input.planId,
      seats: input.seats,
      actor: input.actor,
    });
    this.store.workspaces.update(workspace.id, { requesterEnabled: true });
    this.billing.addCredits(workspace.id, this.billing.plan(input.planId)?.includedChecks ?? 0, 'Included plan credits');

    this.notifyChange();
    return { workspace, subscription };
  }

  /** Convenience for the demo: enable monitoring on every active relationship. */
  enableMonitoringForWorkspace(workspaceId: string, actor?: AccessContext) {
    const created = [];
    for (const relationship of this.relationships.listForWorkspace(workspaceId)) {
      if (!relationship.targetOrganizationId) continue;
      if (relationship.lifecycle !== 'ACTIVE' && relationship.lifecycle !== 'MONITORED') continue;
      const organization = this.organizations.get(relationship.targetOrganizationId);
      if (!organization) continue;
      created.push(
        this.monitoring.enable({
          workspaceId,
          subjectRef: organization.bidId,
          relationshipId: relationship.id,
          actor,
        }),
      );
    }
    this.notifyChange();
    return created;
  }
}
