// src/utils/apiSectionHandler.ts
import { NextRequest, NextResponse } from "next/server";
import { deduplicarCombinado, Dato, filtrarYLimpiarDatos } from "@/utils/deduplicar";
import { loadCache, saveCache } from "@/utils/cacheFileManager";
import { limpiarCacheSiExcede } from '@/utils/cacheWorkflowManager';
import { guardarCacheEnArchivo, respuestaApiEstandar } from '@/utils/cacheHelpers';
import { paginar } from '@/utils/paginacion';

interface SectionApiOptions {
  seccion: string;
  cacheDurationMs: number;
  cooldownMs: number;
  fetchNoticias: () => Promise<{ noticias: Dato[]; errorMsg?: string }>;
  region?: string;
}

// Helper para reintentos con backoff exponencial
async function fetchWithRetry(fetchFn: () => Promise<{ noticias: Dato[]; errorMsg?: string }>, maxRetries = 3, baseDelay = 1000): Promise<{ noticias: Dato[]; errorMsg?: string }> {
  let attempt = 0;
  let lastError = null;
  while (attempt <= maxRetries) {
    const result = await fetchFn();
    if (!result.errorMsg || !/rate limit|limit exceeded|cooldown/i.test(result.errorMsg)) {
      return result;
    }
    lastError = result.errorMsg;
    await new Promise(res => setTimeout(res, baseDelay * Math.pow(2, attempt)));
    attempt++;
  }
  return { noticias: [], errorMsg: lastError || 'Error desconocido tras reintentos.' };
}

export function createSectionApiHandler({ seccion, cacheDurationMs, cooldownMs, fetchNoticias, region }: SectionApiOptions) {
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
  let lastApiSuccess: number = 0;

  function cargarCacheDesdeArchivo() {
    const loaded = loadCache(seccion);
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

  cargarCacheDesdeArchivo();

  async function updateCacheInBackground(pageSize: number, MAX_PAGES: number) {
    try {
      const { noticias: noticiasApi } = await fetchWithRetry(fetchNoticias);
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
        // Controlar tamaño antes de guardar
        const maxNoticias = MAX_PAGES * pageSize;
        const noticiasLimitadas = noticiasValidas.slice(0, maxNoticias);
        cache = {
          noticias: noticiasLimitadas,
          timestamp: Date.now(),
          errorMsg: undefined,
          lastValidNoticias: noticiasLimitadas,
        };
        saveCache(seccion, noticiasLimitadas); // Guardar solo si hay cambios
      }
    } catch {}
  }

  async function GET(req: NextRequest) {
    try {
      const now = Date.now();
      const { searchParams } = new URL(req.url);
      let page = parseInt(searchParams.get("page") || "1", 10);
      if (isNaN(page) || page < 1) page = 1;
      const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "4", 10), 1), 4);
      const MAX_PAGES = 5;
      let errorMsg: string | null = null;
      let fromCache = true;
      let huboCambio = false;
      let noticiasParaResponder: Dato[] = [];
      const cacheExpirado = !cache.timestamp || (now - cache.timestamp > cacheDurationMs);
      if (cacheExpirado) {
        // Responde rápido con caché viejo si existe
        noticiasParaResponder = cache.noticias;
        fromCache = true;
        // Actualiza en background SIEMPRE
        updateCacheInBackground(pageSize, MAX_PAGES);
      } else {
        noticiasParaResponder = cache.noticias;
        fromCache = true;
        // Actualiza en background SIEMPRE
        updateCacheInBackground(pageSize, MAX_PAGES);
      }
      const cooldownActive = lastApiSuccess > 0 && (now - lastApiSuccess < cooldownMs);
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
          cooldownActive,
        },
        page,
        pageSize,
        realMaxPages,
        total: totalItems,
      }));
    } catch (e: any) {
      return NextResponse.json(respuestaApiEstandar({
        noticias: [],
        cached: false,
        huboCambio: false,
        errorMsg: e?.message || 'Error desconocido',
        fallback: false,
        apiStatus: 'error',
        meta: {},
        page: 1,
        pageSize: 4,
        realMaxPages: 1,
        total: 0,
      }), { status: 500 });
    }
  }

  return { GET };
}
