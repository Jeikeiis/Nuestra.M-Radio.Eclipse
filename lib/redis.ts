import { Redis } from '@upstash/redis';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
  throw new Error("Faltan variables de entorno para Redis: REDIS_URL y UPSTASH_REDIS_REST_TOKEN");
}

const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });

export default redis;
