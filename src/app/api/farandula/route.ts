import { NextRequest, NextResponse } from "next/server";

const API_KEY = "pub_151f47e41b2f4d94946766a4c0ef7666";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 60 minutos

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

let cache: NoticiasCache = {
  noticias: [],
  timestamp: 0,
  errorMsg: undefined,
  lastValidNoticias: [],
};
let cacheFijo: Noticia[] = [];

async function fetchNoticiasFarandula(): Promise<{ noticias: Noticia[]; errorMsg?: string }> {
  const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=farandula%20&language=es&category=entertainment&timezone=America/Montevideo`;
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

function filtrarYLimpiarNoticias(noticias: Noticia[]): Noticia[] {
  const titulosVistos = new Set<string>();
  return noticias
    .filter(n => n && n.title && n.link && n.title.length > 6)
    .filter(n => {
      const titulo = n.title.trim().toLowerCase();
      if (titulosVistos.has(titulo)) return false;
      titulosVistos.add(titulo);
      return true;
    })
    .sort((a, b) => (b.description ? 1 : 0) - (a.description ? 1 : 0));
}

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();
    const { searchParams } = new URL(req.url);
    let page = parseInt(searchParams.get("page") || "1", 10);
    if (isNaN(page) || page < 1) page = 1;
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "4", 10), 1), 30);
    const cacheValido = (cache.noticias.length > 0 || cache.errorMsg) && now - cache.timestamp < CACHE_DURATION_MS;

    function paginarNoticias(noticias: Noticia[]) {
      const totalNoticias = noticias.length;
      const maxPages = Math.max(1, Math.ceil(totalNoticias / pageSize));
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, totalNoticias);
      return {
        noticiasPaginadas: noticias.slice(start, end),
        totalNoticias,
        maxPages,
      };
    }

    if (cacheValido) {
      const { noticiasPaginadas, totalNoticias, maxPages } = paginarNoticias(cache.noticias);
      return NextResponse.json({
        noticias: noticiasPaginadas,
        cached: true,
        errorMsg: cache.errorMsg,
        fallback: false,
        meta: {
          page,
          pageSize,
          total: totalNoticias,
          maxPages,
          updatedAt: new Date(cache.timestamp).toISOString(),
          fromCache: true,
        },
      });
    }

    const { noticias, errorMsg } = await fetchNoticiasFarandula();
    const noticiasValidas = filtrarYLimpiarNoticias(noticias);

    cache = {
      noticias: noticiasValidas,
      timestamp: now,
      errorMsg,
      lastValidNoticias: noticiasValidas.length > 0 ? noticiasValidas : cache.lastValidNoticias || [],
    };
    if (noticiasValidas.length > 0) {
      cacheFijo = noticiasValidas;
    }

    let noticiasParaMostrar = noticiasValidas;
    let usandoFallback = false;
    let apiStatus: 'ok' | 'fallback-temporal' | 'fallback-fijo' = 'ok';
    if (errorMsg && cache.lastValidNoticias && cache.lastValidNoticias.length > 0) {
      noticiasParaMostrar = cache.lastValidNoticias;
      usandoFallback = true;
      apiStatus = 'fallback-temporal';
    }
    let usandoFallbackFijo = false;
    if (errorMsg && noticiasParaMostrar.length === 0 && cacheFijo.length > 0) {
      noticiasParaMostrar = cacheFijo;
      usandoFallback = true;
      usandoFallbackFijo = true;
      apiStatus = 'fallback-fijo';
    }

    const { noticiasPaginadas, totalNoticias, maxPages } = paginarNoticias(noticiasParaMostrar);

    return NextResponse.json({
      noticias: noticiasPaginadas,
      cached: false,
      errorMsg: usandoFallback ? `Mostrando últimas noticias guardadas. ${errorMsg}` : errorMsg,
      fallback: usandoFallbackFijo,
      apiStatus,
      meta: {
        page,
        pageSize,
        total: totalNoticias,
        maxPages,
        updatedAt: new Date(now).toISOString(),
        fromCache: usandoFallback,
      },
    });
  } catch (err: any) {
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
