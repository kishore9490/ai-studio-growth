import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { generateToken, hashToken } from '@bid/core';
import { badRequest, forbidden, notFound, resolveAccess, type ApiContext } from '../context.js';

const SCOPES = [
  'organizations:read',
  'organizations:write',
  'relationships:read',
  'relationships:write',
  'verification-requests:read',
  'verification-requests:write',
  'evidence:read',
  'monitoring:write',
  'billing:read',
] as const;

/**
 * Workspace API keys.
 *
 * The secret is generated here, shown once, and stored only as a digest — the
 * same rule sessions follow. What is stored alongside it is the prefix, which is
 * what makes a key identifiable in a list and greppable in a log without being
 * usable.
 */
export async function registerApiKeyRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  app.get('/v1/api-keys', async (request) => {
    const access = resolveAccess(context, request);
    const keys = platform.store.apiKeys
      .find((key) => key.workspaceId === access.workspaceId)
      .map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        scopes: key.scopes,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        revokedAt: key.revokedAt,
      }));
    return { data: keys, count: keys.length };
  });

  app.post('/v1/api-keys', async (request, reply) => {
    const access = resolveAccess(context, request);
    if (!access.roles.includes('OWNER') && !access.roles.includes('ADMIN')) {
      throw forbidden('Only an owner or admin can create API keys.');
    }

    const body = z
      .object({
        name: z.string().min(2).max(80),
        scopes: z.array(z.enum(SCOPES)).min(1).default(['organizations:read', 'verification-requests:write']),
      })
      .safeParse(request.body);
    if (!body.success) throw badRequest('Invalid API key payload', body.error.flatten());

    const secret = generateToken('bid_live');
    // The prefix is the part of the secret we are willing to keep: enough to
    // recognise which key a request used, useless on its own.
    const prefix = secret.slice(0, 20);

    const record = platform.store.apiKeys.insert({
      id: platform.context.ids.next('key'),
      workspaceId: access.workspaceId,
      name: body.data.name,
      prefix,
      hashedSecret: await hashToken(secret),
      scopes: body.data.scopes,
      createdAt: new Date().toISOString(),
    });

    reply.code(201);
    return {
      data: {
        id: record.id,
        name: record.name,
        prefix: record.prefix,
        scopes: record.scopes,
        createdAt: record.createdAt,
        // The only time this is ever returned.
        secret,
      },
    };
  });

  app.delete('/v1/api-keys/:id', async (request) => {
    const access = resolveAccess(context, request);
    const { id } = request.params as { id: string };
    const key = platform.store.apiKeys.get(id);
    if (!key || key.workspaceId !== access.workspaceId) throw notFound('API key');
    if (key.revokedAt) return { data: { revoked: true } };
    platform.store.apiKeys.update(id, { revokedAt: new Date().toISOString() });
    return { data: { revoked: true } };
  });
}
