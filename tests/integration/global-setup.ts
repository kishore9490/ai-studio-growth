import { execSync } from "node:child_process";
import { testDatabaseUrl } from "./load-env";

// Apply any pending migrations to the dedicated test database (non-destructive).
// Each test file then clears the tables it uses via fixtures.resetData().
export default function setup() {
  const url = testDatabaseUrl();
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
}
