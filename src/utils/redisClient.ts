import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Helpers para caché en Redis
 */
export async function redisGet<T = any>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    if (typeof data === 'string') return JSON.parse(data) as T;
    return data as T;
  } catch (e) {
    return null;
  }
}

// TTL de 4 días (en segundos)
const FOUR_DAYS_SECONDS = 4 * 24 * 60 * 60;

export async function redisSet<T = any>(key: string, value: T): Promise<boolean> {
  try {
    await redis.set(key, JSON.stringify(value), { ex: FOUR_DAYS_SECONDS });
    return true;
  } catch (e) {
    return false;
  }
}
