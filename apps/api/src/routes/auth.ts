import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { INDUSTRY, type AuthenticatedSession } from '@bid/core';
import { badRequest, resolveAccess, unauthorized, type ApiContext } from '../context.js';

const registerSchema = z.object({
  legalName: z.string().min(2).max(200),
  displayName: z.string().min(2).max(120).optional(),
  industry: z.enum(INDUSTRY).default('GENERIC'),
  country: z.string().length(2).default('IN'),
  city: z.string().max(120).optional(),
  website: z.string().url().optional(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  // Length is enforced in the domain, which owns the password policy; this is
  // only an upper bound so an absurd body never reaches the hash function.
  password: z.string().min(1).max(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

/** What a client is given after signing in. The token is shown exactly once. */
function sessionPayload(result: AuthenticatedSession, organizationBidId: string) {
  return {
    token: result.token,
    expiresAt: result.session.expiresAt,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      platformRoles: result.user.platformRoles,
    },
    workspace: {
      id: result.workspace.id,
      name: result.workspace.name,
      requesterEnabled: result.workspace.requesterEnabled,
    },
    organization: { bidId: organizationBidId },
  };
}

const clientHints = (request: FastifyRequest) => ({
  userAgent: (request.headers['user-agent'] as string | undefined)?.slice(0, 300),
  ipAddress: request.ip,
});

export async function registerAuthRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  app.post('/v1/auth/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) throw badRequest('Invalid registration payload', body.error.flatten());

    const result = await platform.registerAccount({ ...body.data, ...clientHints(request) });
    reply.code(201);
    return { data: sessionPayload(result, result.organization.bidId) };
  });

  app.post('/v1/auth/login', async (request) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) throw badRequest('Invalid login payload', body.error.flatten());

    const result = await platform.identity.login({ ...body.data, ...clientHints(request) });
    const organization = platform.organizations.require(result.workspace.organizationId);
    return { data: sessionPayload(result, organization.bidId) };
  });

  app.post('/v1/auth/logout', async (request) => {
    const identity = request.identity;
    if (!identity) throw unauthorized();
    // An API key has no session to end; saying so beats pretending it worked.
    if (!identity.sessionId) throw badRequest('This credential is not an interactive session.');
    platform.identity.revoke(identity.sessionId);
    return { data: { revoked: true } };
  });

  app.post('/v1/auth/logout-all', async (request) => {
    const access = resolveAccess(context, request);
    const revoked = platform.identity.revokeAllForUser(access.userId);
    return { data: { revoked } };
  });

  app.get('/v1/auth/me', async (request) => {
    const identity = request.identity;
    if (!identity) throw unauthorized();
    const { access } = identity;

    const organization = platform.organizations.get(access.organizationId);
    const user = platform.identity.get(access.userId);

    return {
      data: {
        authenticatedVia: identity.via,
        user: user
          ? { id: user.id, name: user.name, email: user.email, platformRoles: user.platformRoles }
          : { id: access.userId, name: access.userName, email: null, platformRoles: access.platformRoles },
        workspace: { id: access.workspaceId, roles: access.roles },
        organization: organization
          ? {
              bidId: organization.bidId,
              displayName: organization.displayName,
              legalName: organization.legalName,
              commercialState: organization.commercialState,
              lifecycle: organization.lifecycle,
            }
          : null,
        // The UI shows and hides capabilities from these, never from a plan
        // name — entitlements are the authorization surface (ADR-009).
        entitlements: access.entitlements,
      },
    };
  });

  app.get('/v1/auth/sessions', async (request) => {
    const access = resolveAccess(context, request);
    const sessions = platform.identity.activeSessionsFor(access.userId).map((session) => ({
      id: session.id,
      issuedAt: session.issuedAt,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      // Never the token or its hash: a session list is a security screen, and
      // handing back the credential would defeat the point of storing a digest.
      current: session.id === request.identity?.sessionId,
    }));
    return { data: sessions, count: sessions.length };
  });

  app.delete('/v1/auth/sessions/:id', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const owned = platform.identity.activeSessionsFor(access.userId).some((session) => session.id === id);
    // Another user's session is reported as absent, not forbidden — the same
    // rule the rest of the API follows for records outside your tenant.
    if (!owned) return { data: { revoked: false } };
    platform.identity.revoke(id);
    return { data: { revoked: true } };
  });
}
