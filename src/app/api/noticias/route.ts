import { NextRequest, NextResponse } from "next/server";
import { visitasPorIp } from "./visitasStore";

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

export async function GET(req: NextRequest) {
  const now = Date.now();

  // Trackeo por IP: si la IP no está o expiró, cuenta como nueva visita
  const ip = getIp(req);
  let nuevaVisita = false;
  if (!visitasPorIp[ip] || now - visitasPorIp[ip] > CACHE_DURATION) {
    visitasPorIp[ip] = now;
    nuevaVisita = true;
  }

  if (
    (cache.noticias.length > 0 || cache.errorMsg) &&
    now - cache.timestamp < CACHE_DURATION
  ) {
    return NextResponse.json({
      noticias: cache.noticias,
      cached: true,
      errorMsg: cache.errorMsg,
      sintonizado: !nuevaVisita ? false : true
    });
  }

  // Solo consulta Montevideo
  const { noticias, errorMsg } = await fetchNoticias("Montevideo Uruguay");
  cache = { noticias, timestamp: now, errorMsg };
  return NextResponse.json({
    noticias,
    cached: false,
    errorMsg,
    sintonizado: !nuevaVisita ? false : true
  });
}
