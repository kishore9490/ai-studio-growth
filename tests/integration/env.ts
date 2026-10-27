import { testDatabaseUrl } from "./load-env";

// Must run before any module constructs the Prisma client.
process.env.DATABASE_URL = testDatabaseUrl();
