import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;
const OYENTES_KEY = process.env.NODE_ENV === "development" ? "oyentes-dev" : "oyentes";

export async function GET(req: NextRequest) {
  if (!redis) return NextResponse.json({ total: 0 });
  const total = await redis.scard(OYENTES_KEY);
  return NextResponse.json({ total: total ?? 0 });
}

