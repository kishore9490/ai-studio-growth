import { buildServer } from './app.js';
import { loadConfig } from './config.js';
import { ApiContext } from './context.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const context = await ApiContext.create(config);
  const app = await buildServer(context);

  await app.listen({ port: config.port, host: config.host });
  app.log.info(
    {
      organizations: context.platform.store.organizations.count(),
      verifications: context.platform.store.verificationRequests.count(),
    },
    `BID Trust API listening on http://${config.host}:${config.port} — demo network seeded`,
  );

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      app.log.info(`${signal} received, shutting down`);
      void app.close().then(() => process.exit(0));
    });
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start BID Trust API', error);
  process.exit(1);
});
