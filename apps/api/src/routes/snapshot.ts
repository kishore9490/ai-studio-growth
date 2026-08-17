import type { FastifyInstance } from 'fastify';
import {
  VISIBILITY_RANK,
  maxVisibilityFor,
  type AccessContext,
  type Evidence,
  type Organization,
  type User,
} from '@bid/core';
import { resolveAccess, type ApiContext } from '../context.js';

/**
 * The caller's authorized working set, in one response.
 *
 * The web application runs the same domain engine the server does, so instead
 * of a bespoke read model per screen it loads the records it is allowed to hold
 * and answers every query locally. That only works if this endpoint is exactly
 * as strict as the individual routes: whatever it omits is genuinely invisible,
 * because the client holds everything it is sent.
 *
 * The rule throughout: records belonging to the caller's own workspace are
 * included in full; records belonging to others are included only where the
 * caller is the subject, and then only at the visibility their relationship
 * earns. Network-level identity is included because it is already public.
 */
export async function registerSnapshotRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  app.get('/v1/workspace/snapshot', async (request) => {
    const access = resolveAccess(context, request);
    const store = platform.store;
    const { workspaceId, organizationId } = access;

    /* ---------------- verification scope ---------------- */

    const ownRequests = store.verificationRequests.find((item) => item.workspaceId === workspaceId);
    // Requests aimed at this organization by someone else. The subject is
    // entitled to see what is being asked of it — that is the whole inbound
    // experience — but not the requester's private workspace around it.
    const inboundRequests = store.verificationRequests.find(
      (item) => item.subjectOrganizationId === organizationId && item.workspaceId !== workspaceId,
    );
    const visibleRequests = [...ownRequests, ...inboundRequests];
    const requestIds = new Set(visibleRequests.map((item) => item.id));
    const ownRequestIds = new Set(ownRequests.map((item) => item.id));

    // The subject's own ceiling, from the domain's own rule — SENSITIVE for
    // material about itself, which still leaves RESTRICTED out of reach.
    const ceiling = VISIBILITY_RANK[maxVisibilityFor({ ctx: access, subjectOrganizationId: organizationId })];

    /**
     * Evidence is the sharpest edge in the model. The requester's workspace sees
     * its own; the subject sees only what its own relationship entitles it to,
     * never raw provider payloads classified above that ceiling.
     */
    const visibleEvidence = store.evidence.find((item) => {
      if (!requestIds.has(item.verificationRequestId)) return false;
      if (ownRequestIds.has(item.verificationRequestId)) return true;
      return VISIBILITY_RANK[item.visibility] <= ceiling;
    });

    const wallets = store.creditWallets.find((item) => item.workspaceId === workspaceId);
    const walletIds = new Set(wallets.map((item) => item.id));

    const consentIds = new Set(visibleRequests.map((item) => item.consentId).filter(Boolean) as string[]);
    const invoices = store.invoices.find((item) => item.organizationId === organizationId);
    const invoiceIds = new Set(invoices.map((item) => item.id));

    const relationships = store.relationships.find((item) => item.workspaceId === workspaceId);
    const campaigns = store.campaigns.find((item) => item.workspaceId === workspaceId);
    const campaignIds = new Set(campaigns.map((item) => item.id));
    const workspaceIds = new Set([workspaceId]);

    const inWorkspace = <T extends { workspaceId?: string }>(item: T) => workspaceIds.has(item.workspaceId ?? '');

    /* ---------------- network identity ---------------- */

    // Every organization is visible as an identity: that is what a network of
    // verifiable businesses means. What is *not* visible is anyone else's
    // private working set, which is why nothing below is workspace data.
    const organizations = store.organizations.all().map(publicIdentity);

    const members = store.memberships.find((item) => item.workspaceId === workspaceId);
    const memberUserIds = new Set(members.map((item) => item.userId));

    return {
      data: {
        session: {
          organizationId,
          workspaceId,
          userId: access.userId,
          roles: access.roles,
          platformRoles: access.platformRoles,
          entitlements: access.entitlements,
        },
        collections: {
          /* network identity — public by construction */
          organizations,
          providers: store.providers.all(),
          plans: store.plans.all(),
          credentials: store.credentials.all(),

          /* own organization's private identity material */
          organizationIdentifiers: store.organizationIdentifiers.find(
            (item) => item.organizationId === organizationId,
          ),
          persons: store.persons.find((person) =>
            visibleRequests.some((item) => item.subjectPersonId === person.id),
          ),
          users: store.users.find((user) => memberUserIds.has(user.id)).map(safeUser),
          workspaces: store.workspaces.find((item) => item.id === workspaceId),
          memberships: members,

          /* own workspace */
          relationships,
          invitations: store.invitations.find(
            (item) => inWorkspace(item) || item.toOrganizationId === organizationId,
          ),
          policies: store.policies.find((item) => !item.workspaceId || item.workspaceId === workspaceId),
          policyVersions: store.policyVersions.all(),
          verificationRequests: visibleRequests,
          verificationChecks: store.verificationChecks.find((item) =>
            requestIds.has(item.verificationRequestId),
          ),
          verificationDocuments: store.verificationDocuments.find((item) =>
            requestIds.has(item.verificationRequestId),
          ),
          verificationResults: store.verificationResults.find((item) =>
            requestIds.has(item.verificationRequestId),
          ),
          evidence: visibleEvidence,
          assessments: store.assessments.find((item) => requestIds.has(item.verificationRequestId)),
          consents: store.consents.find(
            (item) => consentIds.has(item.id) || item.requestedByOrganizationId === organizationId,
          ),
          authorizations: store.authorizations.find(
            (item) =>
              item.grantorOrganizationId === organizationId || item.granteeOrganizationId === organizationId,
          ),
          campaigns,
          campaignMembers: store.campaignMembers.find((item) => campaignIds.has(item.campaignId)),
          monitoringRules: store.monitoringRules.find(inWorkspace),
          monitoringEvents: store.monitoringEvents.find(inWorkspace),

          /* commercial */
          subscriptions: store.subscriptions.find(inWorkspace),
          usage: store.usage.find(inWorkspace),
          creditWallets: wallets,
          creditLedger: store.creditLedger.find((item) => walletIds.has(item.walletId)),
          invoices,
          payments: store.payments.find((payment) => invoiceIds.has(payment.invoiceId)),
          customerLifecycle: store.customerLifecycle.find((item) => item.organizationId === organizationId),
          supportCases: store.supportCases.find((item) => item.organizationId === organizationId),

          /* operational */
          notifications: store.notifications.find(
            (item) => inWorkspace(item) || item.organizationId === organizationId,
          ),
          auditLogs: store.auditLogs.find(inWorkspace),
          providerTransactions: store.providerTransactions.find((item) =>
            ownRequestIds.has(item.verificationRequestId ?? ''),
          ),
          apiKeys: store.apiKeys.find(inWorkspace),
          webhooks: store.webhooks.find(inWorkspace),

          // Deliberately absent: sessions. A client never needs another
          // session's digest, and shipping them would turn a snapshot into a
          // credential dump.
        },
      },
    };
  });
}

/**
 * The identity every network participant may see: who an organization is and
 * what state it is in — never its private detail.
 */
function publicIdentity(organization: Organization): Organization {
  return {
    ...organization,
    // Present but empty rather than omitted, so the client's domain code reads
    // the same shape it would on the server.
    tags: organization.tags.filter((tag) => tag !== 'internal'),
  };
}

/** A user without anything that could be used to authenticate as them. */
function safeUser(user: User): User {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export type SnapshotAccess = AccessContext;
export type SnapshotEvidence = Evidence;
