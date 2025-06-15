import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const API_KEY = "pub_151f47e41b2f4d94946766a4c0ef7666";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 60 minutos

// --- Tipos ---
type Noticia = {
  title: string;
  link: string;
  source_id?: string;
  pubDate?: string;
  description?: string;
};

type NoticiasCache = {
  noticias: Noticia[];
  timestamp: number;
  errorMsg?: string;
  lastValidNoticias?: Noticia[];
};

// --- Estado de caché en memoria ---
let cache: NoticiasCache = {
  noticias: [],
  timestamp: 0,
  errorMsg: undefined,
  lastValidNoticias: [],
};
// Nuevo: caché fijo persistente en memoria
let cacheFijo: Noticia[] = [];

// --- Redis (opcional) ---
const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
// Solo inicializa si ambos existen y no son cadenas vacías
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

// --- Utilidades ---
function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  // @ts-ignore
  return req.ip || "127.0.0.1";
}

async function fetchNoticias(region: string): Promise<{ noticias: Noticia[]; errorMsg?: string }> {
  // Usar filtro local: país Uruguay y búsqueda por Uruguay
  const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=Uruguay&country=uy`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const msg = await res.text();
      if (msg.includes("rate limit") || msg.includes("limit exceeded")) {
        return { noticias: [], errorMsg: "Límite de peticiones de la API alcanzado. Intenta más tarde." };
      }
      return { noticias: [], errorMsg: `Error ${res.status}: ${msg}` };
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return { noticias: [], errorMsg: "La respuesta de la API de NewsData.io no contiene artículos." };
    }
    return { noticias: data.results };
  } catch (e: any) {
    return { noticias: [], errorMsg: `Error de red o API: ${e?.message || e}` };
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/gi, '')
    .trim();
}

function areSimilar(a: string, b: string): boolean {
  if (!a || !b) return false;
  a = normalizeText(a);
  b = normalizeText(b);
  if (a === b) return true;
  // Si la diferencia de longitud es muy pequeña y comparten muchas palabras
  const aWords = new Set(a.split(' '));
  const bWords = new Set(b.split(' '));
  const intersection = [...aWords].filter(x => bWords.has(x));
  return intersection.length >= Math.min(aWords.size, bWords.size) * 0.7;
}

function filtrarYLimpiarNoticias(noticias: Noticia[]): Noticia[] {
  const vistos = new Set<string>();
  const recientes: Noticia[] = [];
  const ahora = Date.now();
  return noticias
    .filter(n => n && n.title && n.link && n.title.length > 15)
    .filter(n => {
      // Excluir títulos genéricos o poco informativos
      const titulo = n.title.toLowerCase();
      if (titulo.includes('resumen') || titulo.includes('video:') || titulo.match(/^noticias(\s|:|$)/i)) return false;
      if (!n.description || n.description.length < 40) return false;
      // Excluir noticias sin fecha o con fecha muy antigua (más de 7 días)
      if (n.pubDate) {
        const fecha = new Date(n.pubDate).getTime();
        if (isNaN(fecha) || ahora - fecha > 7 * 24 * 60 * 60 * 1000) return false;
      }
      // Detección de duplicados por título y enlace normalizados
      const key = normalizeText(n.title) + '|' + normalizeText(n.link);
      if (vistos.has(key)) return false;
      // Detección de similitud con noticias ya aceptadas
      for (const prev of recientes) {
        if (areSimilar(n.title, prev.title) || areSimilar(n.description || '', prev.description || '')) return false;
      }
      vistos.add(key);
      recientes.push(n);
      return true;
    })
    .sort((a, b) => (b.description ? 1 : 0) - (a.description ? 1 : 0))
    .slice(0, 30); // máximo 30 para paginación local
}

// --- Registro de recargas forzadas ---
async function registrarRecargaForzada(ip: string, region: string) {
  // Solo intenta si redis está correctamente configurado
  if (!redis || !REDIS_URL || !REDIS_TOKEN) return;
  try {
    const key = `recargas-forzadas:${region}`;
    await redis.zadd(key, { score: Date.now(), member: ip });
    // Mantener solo las últimas 100 recargas por región
    await redis.zremrangebyrank(key, 0, -101);
    await redis.expire(key, 60 * 60 * 24 * 7); // 7 días de retención
  } catch {
    // Silencia cualquier error de redis para no romper la API
  }
}

// --- Handler principal ---
export async function GET(req: NextRequest) {
  try {
    const now = Date.now();

    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") || "Uruguay";
    const force = searchParams.get("force") === "1";
    let page = parseInt(searchParams.get("page") || "1", 10);
    if (isNaN(page) || page < 1) page = 1;
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "8", 10), 1), 30); // entre 1 y 30
    // Solo aplicar caché y fallback si la región es Uruguay (no Montevideo ni otras)
    const isDefaultRegion = !searchParams.get("region") || region.toLowerCase() === "uruguay";
    const cacheValido = (cache.noticias.length > 0 || cache.errorMsg) && now - cache.timestamp < CACHE_DURATION_MS && isDefaultRegion;
    const MAX_PAGES = 5;

    if (force) {
      const ip = getIp(req);
      await registrarRecargaForzada(ip, region);
    }

    function paginarNoticias(noticias: Noticia[]) {
      const totalNoticias = Math.min(noticias.length, MAX_PAGES * pageSize);
      const realMaxPages = Math.max(1, Math.min(MAX_PAGES, Math.ceil(totalNoticias / pageSize)));
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, totalNoticias);
      return {
        noticiasPaginadas: noticias.slice(start, end),
        totalNoticias,
        realMaxPages,
      };
    }

    // 1. Responder desde caché temporal si corresponde
    if (!force && cacheValido) {
      const { noticiasPaginadas, totalNoticias, realMaxPages } = paginarNoticias(cache.noticias);
      return NextResponse.json({
        noticias: noticiasPaginadas,
        cached: true,
        errorMsg: cache.errorMsg,
        fallback: false,
        meta: {
          region,
          page,
          pageSize,
          total: totalNoticias,
          maxPages: realMaxPages,
          updatedAt: new Date(cache.timestamp).toISOString(),
          fromCache: true,
        },
      });
    }

    // 2. Obtener noticias frescas de la API
    const { noticias, errorMsg } = await fetchNoticias(region);
    const noticiasValidas = filtrarYLimpiarNoticias(noticias);

    // 3. Actualizar caché temporal y fijo si es región por defecto (Uruguay)
    if (isDefaultRegion) {
      cache = {
        noticias: noticiasValidas,
        timestamp: now,
        errorMsg,
        lastValidNoticias: noticiasValidas.length > 0 ? noticiasValidas : cache.lastValidNoticias || [],
      };
      // Si hay noticias válidas nuevas, actualizar el caché fijo
      if (noticiasValidas.length > 0) {
        cacheFijo = noticiasValidas;
      }
    }

    // 4. Si hay error y existen noticias válidas previas, usar el fallback temporal
    let noticiasParaMostrar = noticiasValidas;
    let usandoFallback = false;
    let apiStatus: 'ok' | 'fallback-temporal' | 'fallback-fijo' = 'ok';
    if (errorMsg && isDefaultRegion && cache.lastValidNoticias && cache.lastValidNoticias.length > 0) {
      noticiasParaMostrar = cache.lastValidNoticias;
      usandoFallback = true;
      apiStatus = 'fallback-temporal';
    }
    // 5. Si sigue habiendo error y no hay noticias válidas temporales, usar el caché fijo
    let usandoFallbackFijo = false;
    if (errorMsg && isDefaultRegion && noticiasParaMostrar.length === 0 && cacheFijo.length > 0) {
      noticiasParaMostrar = cacheFijo;
      usandoFallback = true;
      usandoFallbackFijo = true;
      apiStatus = 'fallback-fijo';
    }

    const { noticiasPaginadas, totalNoticias, realMaxPages } = paginarNoticias(noticiasParaMostrar);

    return NextResponse.json({
      noticias: noticiasPaginadas,
      cached: false,
      errorMsg: usandoFallback ? `Mostrando últimas noticias guardadas. ${errorMsg}` : errorMsg,
      fallback: usandoFallbackFijo,
      apiStatus,
      meta: {
        region,
        page,
        pageSize,
        total: totalNoticias,
        maxPages: realMaxPages,
        updatedAt: new Date(now).toISOString(),
        fromCache: usandoFallback,
      },
    });
  } catch (err: any) {
    // Manejo global de errores: siempre devolver JSON
    return NextResponse.json({
      noticias: [],
      cached: false,
      errorMsg: err?.message || "Error inesperado en el servidor.",
      fallback: false,
      meta: {
        updatedAt: new Date().toISOString(),
        fromCache: false,
      },
    }, { status: 500 });
  }
}

