import { Redis } from '@upstash/redis';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

export default redis;
