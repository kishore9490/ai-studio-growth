import type { FastifyRequest } from 'fastify';
import { BidPlatform, seedDemo, type AccessContext } from '@bid/core';
import type { AppConfig } from './config.js';
import { PrismaPersistence } from './persistence/prisma-persistence.js';

export interface BootReport {
  persistence: 'postgres' | 'memory';
  hydratedRecords: number;
  seeded: boolean;
}

/**
 * Composition root for the API process.
 *
 * The API holds exactly one platform instance. Persistence is attached here and
 * nowhere else — no route, service or domain rule references a database.
 */
export class ApiContext {
  private constructor(
    readonly platform: BidPlatform,
    readonly config: AppConfig,
    readonly persistence: PrismaPersistence | undefined,
    readonly boot: BootReport,
  ) {}

  static async create(config: AppConfig): Promise<ApiContext> {
    if (config.persistence === 'memory' || !config.databaseUrl) {
      const { platform } = await seedDemo();
      return new ApiContext(platform, config, undefined, {
        persistence: 'memory',
        hydratedRecords: 0,
        seeded: true,
      });
    }

    const persistence = await PrismaPersistence.connect(config.databaseUrl);
    const empty = await persistence.isEmpty();

    if (empty && config.seedWhenEmpty) {
      // First boot against a fresh database: build the demo network in memory,
      // attach the sink, and replay it so the seed itself is persisted.
      const { platform } = await seedDemo();
      platform.store.bindSink(persistence);
      persistence.track(platform);
      for (const [name, collection] of Object.entries(platform.store.collections())) {
        for (const record of collection.all()) persistence.record(name, 'insert', record.id, record);
      }
      await persistence.flush();
      return new ApiContext(platform, config, persistence, {
        persistence: 'postgres',
        hydratedRecords: 0,
        seeded: true,
      });
    }

    const platform = new BidPlatform();
    const hydratedRecords = await persistence.hydrate(platform);
    // Bound only after hydration so loading existing rows does not re-write them.
    platform.store.bindSink(persistence);
    return new ApiContext(platform, config, persistence, {
      persistence: 'postgres',
      hydratedRecords,
      seeded: false,
    });
  }

  /** Blocks until every mutation applied so far is durable. */
  async flush(): Promise<void> {
    await this.persistence?.flush();
  }

  async close(): Promise<void> {
    await this.persistence?.disconnect();
  }
}

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const unauthorized = (message = 'API key required') => new HttpError(401, 'UNAUTHORIZED', message);
export const forbidden = (message: string) => new HttpError(403, 'FORBIDDEN', message);
export const notFound = (resource: string) => new HttpError(404, 'NOT_FOUND', `${resource} not found`);
export const badRequest = (message: string, details?: unknown) => new HttpError(400, 'BAD_REQUEST', message, details);

/**
 * Resolves the caller's access context.
 *
 * Production: the API key identifies a workspace, its scopes and its rate
 * limits. This build keeps that shape but accepts a demo master key so the
 * documented examples are runnable. `x-bid-act-as` is honoured only for the
 * demo key and is explicitly a demo affordance.
 */
export function resolveAccess(context: ApiContext, request: FastifyRequest): AccessContext {
  const headerKey = (request.headers['x-bid-api-key'] ?? '') as string;
  const bearer = (request.headers.authorization ?? '') as string;
  const apiKey = headerKey || (bearer.startsWith('Bearer ') ? bearer.slice(7) : '');
  if (!apiKey) throw unauthorized();

  const { platform, config } = context;

  const stored = platform.store.apiKeys.all().find((key) => apiKey.startsWith(key.prefix) && !key.revokedAt);
  const actAs = (request.headers['x-bid-act-as'] ?? '') as string;

  let organizationId: string | undefined;
  if (stored) {
    const workspace = platform.store.workspaces.get(stored.workspaceId);
    organizationId = workspace?.organizationId;
    platform.store.apiKeys.update(stored.id, { lastUsedAt: new Date().toISOString() });
  } else if (apiKey === config.demoApiKey) {
    const target = actAs ? platform.organizations.byBidId(actAs) : undefined;
    organizationId = target?.id ?? platform.organizations.byBidId('BID-BUS-00104')?.id;
  }

  if (!organizationId) throw unauthorized('API key is not recognized in this environment');

  const access = platform.accessContextFor(organizationId, { roles: ['API_CLIENT'] });
  return { ...access, viaApiKey: true, scopes: stored?.scopes ?? ['*'] };
}
