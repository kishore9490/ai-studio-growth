import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { ForbiddenError, isVerificationBlockedError } from '@bid/core';
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
    if (error instanceof ForbiddenError) {
      reply.code(403).send({ error: { code: 'FORBIDDEN', message: error.message, reason: error.reason } });
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
