import { NextRequest, NextResponse } from "next/server";
import { deduplicarCombinado, Dato, filtrarYLimpiarDatos } from "@/utils/deduplicar";
import { loadCache, saveCache } from "@/utils/cacheFileManager";
import { USER_API_KEY } from "@/utils/cacheManager";
import { limpiarCacheSiExcede } from '@/utils/cacheWorkflowManager';
import { guardarCacheEnArchivo, respuestaApiEstandar } from '@/utils/cacheHelpers';
import { paginar } from '@/utils/paginacion';

const SECCION = "farandula";
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas
const COOLDOWN_MS = 61 * 60 * 1000;

let lastApiSuccess: number = 0;

// --- Estado de caché en memoria ---
let cache: {
  noticias: Dato[];
  timestamp: number;
  errorMsg?: string;
  lastValidNoticias?: Dato[];
} = {
  noticias: [],
  timestamp: 0,
  errorMsg: undefined,
  lastValidNoticias: [],
};

// --- Cargar cache desde archivo al iniciar ---
function cargarCacheDesdeArchivo() {
  const loaded = loadCache(SECCION);
  if (loaded) {
    const noticiasUnicas = filtrarYLimpiarDatos(loaded.noticias, {
      camposClave: ["title","link"],
      campoFecha: "pubDate",
      maxItems: 20,
      camposMezcla: ["description","image_url","source_id","link"]
    });
    cache.noticias = noticiasUnicas;
    cache.timestamp = loaded.timestamp;
    cache.lastValidNoticias = noticiasUnicas;
  }
}

function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  // @ts-ignore
  return req.ip || "127.0.0.1";
}

async function registrarRecargaForzada(ip: string, region: string) {
  // No se implementa almacenamiento en este caso
}

async function fetchNoticiasFarandula(): Promise<{ noticias: Dato[]; errorMsg?: string }> {
  const USER_API_KEY = process.env.USER_API_KEY || '';
  if (!USER_API_KEY) {
    return { noticias: [], errorMsg: 'API key de NewsData.io no configurada en el entorno (USER_API_KEY).' };
  }
  const url = `https://newsdata.io/api/1/latest?apikey=${USER_API_KEY}&q=Entretenimiento&country=ar,uy`;
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

cargarCacheDesdeArchivo();

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") || "Entretenimiento";
    let page = parseInt(searchParams.get("page") || "1", 10);
    if (isNaN(page) || page < 1) page = 1;
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "4", 10), 1), 4);
    const MAX_PAGES = 5;
    let errorMsg: string | null = null;
    let fromCache = true;
    let huboCambio = false;
    let noticiasParaResponder: Dato[] = [];
    const cacheExpirado = !cache.timestamp || (now - cache.timestamp > CACHE_DURATION_MS);
    if (cacheExpirado) {
      const { noticias: noticiasApi, errorMsg: apiError } = await fetchNoticiasFarandula();
      const noticiasFiltradas = (Array.isArray(noticiasApi) ? noticiasApi : []).filter(
        (n: Dato) => n && n.title && n.link && typeof n.title === 'string' && n.title.length > 6
      );
      const noticiasValidas = deduplicarCombinado(
        noticiasFiltradas,
        [],
        ["title","link"],
        "pubDate",
        5 * 4,
        ["description","image_url","source_id","link"]
      );
      lastApiSuccess = now;
      if (noticiasValidas.length > 0) {
        cache = {
          noticias: noticiasValidas,
          timestamp: now,
          errorMsg: undefined,
          lastValidNoticias: noticiasValidas,
        };
        guardarCacheEnArchivo(SECCION, noticiasValidas, pageSize, MAX_PAGES);
        noticiasParaResponder = noticiasValidas;
        fromCache = false;
        huboCambio = true;
      } else {
        errorMsg = apiError || "No se encontraron noticias válidas.";
        noticiasParaResponder = cache.lastValidNoticias || [];
        fromCache = true;
      }
    } else {
      noticiasParaResponder = cache.noticias;
      fromCache = true;
      (async () => {
        try {
          const { noticias: noticiasApi } = await fetchNoticiasFarandula();
          const noticiasFiltradas = (Array.isArray(noticiasApi) ? noticiasApi : []).filter(
            (n: Dato) => n && n.title && n.link && typeof n.title === 'string' && n.title.length > 6
          );
          const noticiasValidas = deduplicarCombinado(
            noticiasFiltradas,
            [],
            ["title","link"],
            "pubDate",
            5 * 4,
            ["description","image_url","source_id","link"]
          );
          if (noticiasValidas.length > 0) {
            lastApiSuccess = Date.now();
            cache = {
              noticias: noticiasValidas,
              timestamp: Date.now(),
              errorMsg: undefined,
              lastValidNoticias: noticiasValidas,
            };
            guardarCacheEnArchivo(SECCION, noticiasValidas, pageSize, MAX_PAGES);
          }
        } catch {}
      })();
    }
    const cooldownActive = lastApiSuccess > 0 && (now - lastApiSuccess < COOLDOWN_MS);
    const { itemsPaginados, totalItems, realMaxPages } = paginar(noticiasParaResponder, page, pageSize, MAX_PAGES);
    return NextResponse.json(respuestaApiEstandar({
      noticias: itemsPaginados,
      cached: fromCache,
      huboCambio,
      errorMsg,
      fallback: fromCache,
      apiStatus: errorMsg && !itemsPaginados.length ? 'api-error' : (fromCache ? 'cache-fijo' : 'api-directa'),
      meta: {
        region,
        page,
        pageSize,
        total: totalItems,
        maxPages: realMaxPages,
        updatedAt: new Date(cache.timestamp || now).toISOString(),
        fromCache,
        lastApiSuccess: lastApiSuccess ? new Date(lastApiSuccess).toISOString() : null,
        cooldownActive,
      },
    }));
  } catch (err: any) {
    return NextResponse.json(respuestaApiEstandar({
      noticias: [],
      cached: false,
      huboCambio: false,
      errorMsg: err?.message || "Error inesperado en el servidor.",
      fallback: false,
      apiStatus: 'api-error',
      meta: {
        updatedAt: new Date().toISOString(),
        fromCache: false,
        lastApiSuccess: null,
        cooldownActive: false,
      },
    }), { status: 500 });
  }
}

export async function GET_CACHE_COUNT(req: NextRequest) {
  const titulosNuevo = new Set(cache.noticias.map((n: Dato) => n.title));
  const titulosViejo = new Set((cache.lastValidNoticias || []).map((n: Dato) => n.title));
  return NextResponse.json({
    cacheNuevo: titulosNuevo.size,
    cacheViejo: titulosViejo.size
  });
}
