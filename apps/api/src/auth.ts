import type { FastifyRequest } from 'fastify';
import type { AccessContext, WorkspaceRole } from '@bid/core';
import type { ApiContext } from './context.js';

/**
 * What the credential on a request turned out to be.
 *
 * Keeping the two apart matters downstream: an interactive session acts as a
 * named person with that person's roles, while an API key acts as a workspace
 * with a fixed set of scopes and no user behind it.
 */
export interface ResolvedIdentity {
  access: AccessContext;
  via: 'SESSION' | 'API_KEY' | 'DEMO_KEY';
  sessionId?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    identity?: ResolvedIdentity;
  }
}

/** Extracts a bearer credential from either accepted header. */
export function credentialFrom(request: FastifyRequest): string {
  const header = (request.headers['x-bid-api-key'] ?? '') as string;
  if (header) return header.trim();
  const authorization = (request.headers.authorization ?? '') as string;
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

/**
 * Resolves the caller.
 *
 * Three credentials are accepted, in order of precedence:
 *
 *  1. A session token (`bid_sess_…`) from an interactive login — a real user
 *     with real workspace roles.
 *  2. A workspace API key — machine access, scoped, no user.
 *  3. The demo master key, which exists so the documented examples are
 *     runnable. It is the only credential that honours `x-bid-act-as`, and it
 *     can be switched off entirely by setting BID_DEMO_API_KEY to an empty
 *     value.
 *
 * Returns undefined rather than throwing: whether a given route requires a
 * caller is the route's decision, not this function's.
 */
export async function resolveIdentity(
  context: ApiContext,
  request: FastifyRequest,
): Promise<ResolvedIdentity | undefined> {
  const credential = credentialFrom(request);
  if (!credential) return undefined;

  const { platform, config } = context;

  if (credential.startsWith('bid_sess_')) {
    const authenticated = await platform.identity.authenticate(credential);
    if (!authenticated) return undefined;

    const { session, user } = authenticated;
    const roles = platform.identity
      .membershipsFor(user.id)
      .find((membership) => membership.workspaceId === session.workspaceId)?.roles;

    const access = platform.accessContextFor(session.organizationId, {
      userId: user.id,
      roles: (roles ?? ['VIEWER']) as WorkspaceRole[],
      platformRoles: user.platformRoles,
    });
    return { access, via: 'SESSION', sessionId: session.id };
  }

  const stored = platform.store.apiKeys
    .all()
    .find((key) => credential.startsWith(key.prefix) && !key.revokedAt);

  if (stored) {
    const workspace = platform.store.workspaces.get(stored.workspaceId);
    if (!workspace) return undefined;
    platform.store.apiKeys.update(stored.id, { lastUsedAt: new Date().toISOString() });
    const access = platform.accessContextFor(workspace.organizationId, { roles: ['API_CLIENT'] });
    return { access: { ...access, viaApiKey: true, scopes: stored.scopes }, via: 'API_KEY' };
  }

  if (config.demoApiKey && credential === config.demoApiKey) {
    const actAs = (request.headers['x-bid-act-as'] ?? '') as string;
    const target = actAs ? platform.organizations.byBidId(actAs) : undefined;
    const organization = target ?? platform.organizations.byBidId('BID-BUS-00104');
    if (!organization) return undefined;
    const access = platform.accessContextFor(organization.id, { roles: ['API_CLIENT'] });
    return { access: { ...access, viaApiKey: true, scopes: ['*'] }, via: 'DEMO_KEY' };
  }

  return undefined;
}
