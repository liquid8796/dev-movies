import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

/** True when a relational database is configured (production mode). */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const globalForDb = globalThis as unknown as { __db?: Database };

/**
 * Lazily-created Neon HTTP client. The HTTP driver is stateless and ideal for
 * serverless/Fluid Compute — no connection pool to exhaust.
 */
export function getDb(): Database {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — configure your Neon Postgres connection string.");
  }
  if (!globalForDb.__db) {
    globalForDb.__db = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return globalForDb.__db;
}

export { schema };
