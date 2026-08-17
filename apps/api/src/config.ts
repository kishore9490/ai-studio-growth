/**
 * Environment configuration. Nothing in the domain reads process.env directly —
 * configuration enters through this module only, so the same services run in a
 * test, a container or a browser.
 */
export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: 'development' | 'production' | 'test';
  publicBaseUrl: string;
  corsOrigins: string[];
  /** Demo master key. In production, keys live in the database, hashed. */
  demoApiKey: string;
  requestLogging: boolean;
  /**
   * `postgres` runs the platform against a durable store; `memory` keeps the
   * seeded network in process only. Tests and the browser demo use `memory`
   * so neither needs a database to run.
   */
  persistence: 'postgres' | 'memory';
  databaseUrl?: string;
  /** Seed the fictional demo network when the database has no data yet. */
  seedWhenEmpty: boolean;
}

/**
 * Note on DATABASE_URL: importing `@prisma/client` loads the repository `.env`
 * into `process.env` as a side effect. Anything that must not touch a database
 * — tests above all — should pass `BID_PERSISTENCE=memory` rather than assume
 * the variable is unset.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: Number(env.PORT ?? 4000),
    host: env.HOST ?? '0.0.0.0',
    nodeEnv: (env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development',
    publicBaseUrl: env.PUBLIC_BASE_URL ?? 'https://bidtrust.in',
    // localhost and 127.0.0.1 are different origins to a browser, and dev
    // servers bind whichever you asked for — allowing only one of them turns a
    // working setup into "the API is not responding".
    corsOrigins: (
      env.CORS_ORIGINS ??
      'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173'
    )
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    demoApiKey: env.BID_DEMO_API_KEY ?? 'bid_demo_key',
    requestLogging: env.REQUEST_LOGGING !== 'false',
    persistence: env.BID_PERSISTENCE === 'memory' || !env.DATABASE_URL?.trim() ? 'memory' : 'postgres',
    databaseUrl: env.DATABASE_URL?.trim() || undefined,
    seedWhenEmpty: env.BID_SEED_WHEN_EMPTY !== 'false',
  };
}
