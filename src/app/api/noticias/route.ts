import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const API_KEY = "pub_c0d1669584c7417b93361bfdc354b1c3";
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos en ms

type Noticia = {
  title: string;
  link: string;
  source_id?: string;
  pubDate?: string;
  description?: string;
};

let cache: {
  noticias: Noticia[];
  timestamp: number;
  errorMsg?: string;
} = {
  noticias: [],
  timestamp: 0,
  errorMsg: undefined,
};

const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;
const OYENTES_KEY = process.env.NODE_ENV === "development" ? "oyentes-dev" : "oyentes";

async function fetchNoticias(region: string): Promise<{noticias: Noticia[], errorMsg?: string}> {
  const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=${encodeURIComponent(region)}&country=uy&language=es&category=top`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const msg = await res.text();
      if (msg.includes("rate limit") || msg.includes("limit exceeded")) {
        return { noticias: [], errorMsg: "Límite de peticiones de la API alcanzado. Intenta más tarde." };
      }
      return { noticias: [], errorMsg: "No se pudo obtener noticias de NewsData.io." };
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return { noticias: [], errorMsg: "La respuesta de la API de NewsData.io no contiene artículos." };
    }
    return { noticias: data.results, errorMsg: undefined };
  } catch (e: any) {
    return { noticias: [], errorMsg: "No se pudieron obtener noticias. Verifica tu conexión o la API key." };
  }
}

function getIp(req: NextRequest): string {
  // X-Forwarded-For puede contener varias IP, tomamos la primera
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  // fallback: req.ip (Next.js edge), o localhost
  // @ts-ignore
  return req.ip || "127.0.0.1";
}

async function addOyente(ip: string) {
  if (!redis) return;
  await redis.sadd(OYENTES_KEY, ip);
  await redis.expire(OYENTES_KEY, CACHE_DURATION / 1000); // TTL en segundos
}

export async function GET(req: NextRequest) {
  const now = Date.now();
  const ip = getIp(req);
  await addOyente(ip);

  if (
    (cache.noticias.length > 0 || cache.errorMsg) &&
    now - cache.timestamp < CACHE_DURATION
  ) {
    return NextResponse.json({
      noticias: cache.noticias,
      cached: true,
      errorMsg: cache.errorMsg
    });
  }

  // Solo consulta Montevideo
  const { noticias, errorMsg } = await fetchNoticias("Montevideo Uruguay");
  cache = { noticias, timestamp: now, errorMsg };
  return NextResponse.json({
    noticias,
    cached: false,
    errorMsg
  });
}

