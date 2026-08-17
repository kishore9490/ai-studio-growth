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
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: Number(env.PORT ?? 4000),
    host: env.HOST ?? '0.0.0.0',
    nodeEnv: (env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development',
    publicBaseUrl: env.PUBLIC_BASE_URL ?? 'https://bidtrust.in',
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:4173').split(',').map((value) => value.trim()),
    demoApiKey: env.BID_DEMO_API_KEY ?? 'bid_demo_key',
    requestLogging: env.REQUEST_LOGGING !== 'false',
  };
}
