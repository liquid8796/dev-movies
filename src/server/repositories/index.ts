import { hasDatabase } from "@/server/db";
import { createDrizzleRepositories } from "./drizzle";
import { createMemoryRepositories } from "./memory";
import type { Repositories } from "./types";

export type { Repositories } from "./types";

const globalForRepos = globalThis as unknown as { __repos?: Repositories };

/**
 * Repository factory — the single place that decides which data backend the
 * app uses. With DATABASE_URL set you get Neon Postgres via Drizzle; without
 * it the app falls back to the in-memory demo catalog so it always boots.
 */
export function getRepositories(): Repositories {
  if (!globalForRepos.__repos) {
    globalForRepos.__repos = hasDatabase()
      ? createDrizzleRepositories()
      : createMemoryRepositories();
  }
  return globalForRepos.__repos;
}

export function isDemoMode(): boolean {
  return !hasDatabase();
}
