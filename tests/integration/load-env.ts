import { readFileSync, existsSync } from "node:fs";

/** Minimal .env reader so tests don't need extra tooling. */
export function loadEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

export function testDatabaseUrl() {
  loadEnv();
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error("Set DATABASE_URL_TEST to run integration tests.");
  if (url === process.env.DATABASE_URL || /\/lifeos(\?|$)/.test(url)) {
    throw new Error("DATABASE_URL_TEST must point at a dedicated test database, not the development database.");
  }
  return url;
}
