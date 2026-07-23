import { Redis } from "@upstash/redis";

/**
 * NoSQL cache layer (Upstash Redis) with a transparent in-memory fallback.
 *
 * The rest of the codebase depends only on this small interface, so the
 * backing store can be swapped without touching business logic. Used for:
 *  - hot-path caching (home sections, movie details)
 *  - OneDrive download-URL + access-token caching (critical for 4K startup time)
 *  - trending view counters (sorted set)
 */
export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Increment a member's score inside a sorted set. */
  zincr(setKey: string, member: string, by?: number): Promise<void>;
  /** Top members of a sorted set, highest score first. */
  ztop(setKey: string, limit: number): Promise<string[]>;
}

class RedisStore implements CacheStore {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      return (await this.redis.get<T>(key)) ?? null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) await this.redis.set(key, value, { ex: ttlSeconds });
      else await this.redis.set(key, value);
    } catch {
      /* cache write failures must never break requests */
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      /* ignore */
    }
  }

  async zincr(setKey: string, member: string, by = 1): Promise<void> {
    try {
      await this.redis.zincrby(setKey, by, member);
      await this.redis.expire(setKey, 60 * 60 * 24 * 14);
    } catch {
      /* ignore */
    }
  }

  async ztop(setKey: string, limit: number): Promise<string[]> {
    try {
      return await this.redis.zrange<string[]>(setKey, 0, limit - 1, { rev: true });
    } catch {
      return [];
    }
  }
}

interface MemoryEntry {
  value: unknown;
  expiresAt: number | null;
}

/** Dev/demo fallback — same semantics, process-local. */
class MemoryStore implements CacheStore {
  private map = new Map<string, MemoryEntry>();
  private zsets = new Map<string, Map<string, number>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.map.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
  }

  async zincr(setKey: string, member: string, by = 1): Promise<void> {
    const set = this.zsets.get(setKey) ?? new Map<string, number>();
    set.set(member, (set.get(member) ?? 0) + by);
    this.zsets.set(setKey, set);
  }

  async ztop(setKey: string, limit: number): Promise<string[]> {
    const set = this.zsets.get(setKey);
    if (!set) return [];
    return [...set.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([member]) => member);
  }
}

const globalForCache = globalThis as unknown as { __cache?: CacheStore };

export function getCache(): CacheStore {
  if (!globalForCache.__cache) {
    const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
    globalForCache.__cache =
      url && token ? new RedisStore(new Redis({ url, token })) : new MemoryStore();
  }
  return globalForCache.__cache;
}

/** Read-through cache helper: get from cache or compute + store. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const cache = getCache();
  const hit = await cache.get<T>(key);
  if (hit !== null) return hit;
  const value = await compute();
  if (value !== null && value !== undefined) {
    await cache.set(key, value, ttlSeconds);
  }
  return value;
}
