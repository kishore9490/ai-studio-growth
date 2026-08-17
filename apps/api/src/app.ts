import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import {
  ForbiddenError,
  isConflictError,
  isLoginError,
  isValidationError,
  isVerificationBlockedError,
} from '@bid/core';
import { resolveIdentity } from './auth.js';
import { HttpError, type ApiContext } from './context.js';
import { registerRoutes } from './routes/index.js';

/**
 * HTTP transport. Deliberately thin: routes validate input, resolve an access
 * context and call domain services. No business rule lives in this layer.
 */
export async function buildServer(context: ApiContext): Promise<FastifyInstance> {
  const app = Fastify({
    logger: context.config.requestLogging
      ? { level: context.config.nodeEnv === 'production' ? 'info' : 'debug' }
      : false,
    disableRequestLogging: !context.config.requestLogging,
  });

  // Several endpoints are POSTs with nothing to say — logout, sweep, run.
  // Fastify treats an empty body with a JSON content-type as a parse failure,
  // which would make correct clients look broken; an empty body simply means
  // no fields were sent.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) => {
    const text = (body as string).trim();
    if (text.length === 0) return done(null, undefined);
    try {
      done(null, JSON.parse(text));
    } catch {
      done(new HttpError(400, 'INVALID_JSON', 'Request body is not valid JSON.'), undefined);
    }
  });

  await app.register(cors, {
    origin: context.config.corsOrigins.includes('*') ? true : context.config.corsOrigins,
    credentials: true,
  });

  // Simple in-process rate limiting per API key. Production runs this at the
  // gateway with a shared store.
  const windowMs = 60_000;
  const maxPerWindow = 600;
  const buckets = new Map<string, { count: number; resetAt: number }>();

  app.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/v1/public') || request.url === '/health' || request.url === '/' || request.url === '/v1') return;
    const key = String(request.headers['x-bid-api-key'] ?? request.headers.authorization ?? request.ip);
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    bucket.count += 1;
    if (bucket.count > maxPerWindow) {
      reply.code(429).send({
        error: { code: 'RATE_LIMITED', message: 'Too many requests for this key. Retry after the window resets.' },
      });
    }
  });

  // Credentials are resolved once per request, before any route runs. Nothing
  // is rejected here: whether a caller is required is each route's decision.
  app.addHook('preHandler', async (request) => {
    request.identity = await resolveIdentity(context, request);
  });

  // Durability barrier. A request does not get its response until the writes it
  // caused have committed, so a 201 always means the row survives a restart.
  app.addHook('onSend', async (request, reply, payload) => {
    if (request.method === 'GET' || request.method === 'HEAD') return payload;
    try {
      await context.flush();
    } catch (error) {
      request.log.error({ err: error }, 'failed to persist mutations for this request');
      reply.code(503);
      return JSON.stringify({
        error: {
          code: 'PERSISTENCE_UNAVAILABLE',
          message: 'The change could not be committed to durable storage and has not been applied.',
        },
      });
    }
    return payload;
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      reply.code(error.statusCode).send({ error: { code: error.code, message: error.message, details: error.details } });
      return;
    }
    if (isVerificationBlockedError(error)) {
      // A legitimate workflow state, not a fault: tell the caller precisely
      // what the subject still has to do.
      reply.code(409).send({
        error: {
          code: error.code,
          message: error.message,
          blockedBy: error.blockedBy,
          outstanding: error.outstanding,
        },
      });
      return;
    }
    if (isValidationError(error)) {
      reply.code(422).send({ error: { code: error.code, message: error.message, field: error.field } });
      return;
    }
    if (isConflictError(error)) {
      reply.code(409).send({ error: { code: error.code, message: error.message, resource: error.resourceType } });
      return;
    }
    if (isLoginError(error)) {
      request.log.info({ reason: error.reason }, 'login refused');
      // Only reasons that required a correct password may be relayed; anything
      // else would tell an unauthenticated caller which addresses have accounts.
      const disclosable = error.reason === 'ACCOUNT_SUSPENDED' || error.reason === 'NO_WORKSPACE';
      reply.code(401).send({
        error: {
          code: disclosable ? error.reason : 'INVALID_CREDENTIALS',
          message: disclosable ? error.message : 'Email address or password is incorrect.',
        },
      });
      return;
    }
    if (error instanceof ForbiddenError) {
      reply.code(403).send({ error: { code: 'FORBIDDEN', message: error.message, reason: error.reason } });
      return;
    }
    // Fastify's own errors (bad JSON, unsupported media type, body too large)
    // already carry the right status and a usable message. Collapsing them into
    // 500 would blame the server for what the client sent.
    const framework = error as { statusCode?: number; code?: string; message?: string };
    if (typeof framework.statusCode === 'number' && framework.statusCode >= 400 && framework.statusCode < 500) {
      request.log.info({ err: error }, 'request refused');
      reply.code(framework.statusCode).send({
        error: { code: framework.code ?? 'BAD_REQUEST', message: framework.message ?? 'Request refused.' },
      });
      return;
    }

    request.log.error({ err: error }, 'unhandled error');
    reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error handling the request.' } });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ error: { code: 'NOT_FOUND', message: `No route for ${request.method} ${request.url}` } });
  });

  await registerRoutes(app, context);
  return app;
}
