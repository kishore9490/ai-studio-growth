import type { FastifyInstance } from 'fastify';
import { notFound, type ApiContext } from '../context.js';

/**
 * Unauthenticated surface.
 *
 * These routes serve the published projection only. They are built from the
 * same `publicProfile` / `digitalCard` projections the web app uses, so there
 * is exactly one definition of "safe to publish" in the system.
 */
export async function registerPublicRoutes(app: FastifyInstance, context: ApiContext): Promise<void> {
  const { platform } = context;

  app.get('/v1/public/profiles/:bidId', async (request) => {
    const { bidId } = request.params as { bidId: string };
    const profile = platform.organizations.publicProfile(bidId);
    if (!profile) throw notFound('BID profile');
    return { data: profile };
  });

  app.get('/v1/public/cards/:bidId', async (request) => {
    const { bidId } = request.params as { bidId: string };
    const card = platform.organizations.digitalCard(bidId);
    if (!card) throw notFound('BID card');
    return { data: card };
  });
}
