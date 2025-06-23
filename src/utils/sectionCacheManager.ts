// sectionCacheManager.ts
// Lógica profesional unificada para deduplicación, caché, helpers y API de secciones (noticias, música, farándula, etc.)
import fs from 'fs';
import path from 'path';
import { deduplicarCombinado, filtrarYLimpiarDatos } from "./sectionDeduplicar";

// --- Tipos y utilidades base ---
export interface Dato {
  [key: string]: any;
}

// --- DEDUPLICACIÓN Y HELPERS PUROS ---
export { deduplicarCombinado } from "./sectionDeduplicar";

// --- Gestión de caché en disco ---
export function getCacheFilePath(seccion: string) {
  return path.resolve(process.cwd(), `${seccion}-cache.json`);
}

export function loadCache(seccion: string): { noticias: Dato[]; timestamp: number } | null {
  const file = getCacheFilePath(seccion);
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    if (Array.isArray(data.noticias)) return { noticias: data.noticias, timestamp: data.timestamp || 0 };
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error leyendo caché de', seccion, e);
    }
  }
  return null;
}

export function saveCache(seccion: string, noticias: Dato[]) {
  const file = getCacheFilePath(seccion);
  try {
    fs.writeFileSync(file, JSON.stringify({ noticias, timestamp: Date.now() }, null, 2), "utf-8");
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error guardando caché de', seccion, e);
    }
  }
}

export function limpiarCacheSiExcede(seccion: string, maxPaginas = 15, porPagina = 20) {
  const cache = loadCache(seccion);
  if (cache && Array.isArray(cache.noticias) && cache.noticias.length > maxPaginas * porPagina) {
    const nuevas = cache.noticias.slice(0, maxPaginas * porPagina);
    saveCache(seccion, nuevas);
  }
}

// --- Helpers de respuesta y guardado profesional ---
export function guardarCacheEnArchivo(seccion: string, noticias: Dato[], pageSize: number = 4, maxPages: number = 5) {
  const maxNoticias = maxPages * pageSize;
  const noticiasUnicas = filtrarYLimpiarDatos(noticias, {
    camposClave: ["title","link"],
    campoFecha: "pubDate",
    maxItems: 100,
    camposMezcla: ["description","image_url","source_id","link"]
  });
  if (noticiasUnicas.length > maxNoticias) {
    saveCache(seccion, noticiasUnicas.slice(0, maxNoticias));
  } else {
    saveCache(seccion, noticiasUnicas);
  }
  if (noticiasUnicas.length > 5 * 20) {
    limpiarCacheSiExcede(seccion, 5, 20);
  }
}

export function respuestaApiEstandar({ noticias, cached, huboCambio, errorMsg, fallback, apiStatus, meta, page, pageSize, realMaxPages, total }: any) {
  return {
    noticias,
    cached,
    huboCambio,
    errorMsg: noticias.length ? errorMsg : 'No hay noticias disponibles.',
    fallback,
    apiStatus,
    meta: {
      ...meta,
      page,
      pageSize,
      realMaxPages,
      total,
    },
  };
}

// --- Flujos de importación/exportación de caché ---
const SECCIONES = ['farandula', 'musica', 'noticias'];

export async function exportarCaches() {
  const resultado: Record<string, any> = {};
  for (const seccion of SECCIONES) {
    const cache = loadCache(seccion);
    resultado[seccion] = cache || { noticias: [], timestamp: 0 };
  }
  return resultado;
}

export async function importarCaches(data: Record<string, any>) {
  for (const seccion of SECCIONES) {
    if (data[seccion] && Array.isArray(data[seccion].noticias)) {
      saveCache(seccion, data[seccion].noticias);
    }
  }
}

// --- Factory para crear handlers de API de sección ---
import { NextRequest, NextResponse } from "next/server";

// --- CACHÉ EN MEMORIA GLOBAL POR SECCIÓN ---
const memoryCache: Record<string, {
  noticias: Dato[];
  timestamp: number;
  lastValidNoticias?: Dato[];
  lastApiSuccess?: number;
  updating?: boolean;
}> = {};

export function createSectionApiHandler({ seccion, cacheDurationMs, cooldownMs, fetchNoticias, region }: {
  seccion: string;
  cacheDurationMs: number;
  cooldownMs: number;
  fetchNoticias: () => Promise<{ noticias: Dato[]; errorMsg?: string }>;
  region?: string;
}) {
  // Inicializar caché en memoria si no existe
  if (!memoryCache[seccion]) {
    const loaded = loadCache(seccion);
    memoryCache[seccion] = {
      noticias: loaded?.noticias || [],
      timestamp: loaded?.timestamp || 0,
      lastValidNoticias: loaded?.noticias || [],
      lastApiSuccess: 0,
      updating: false,
    };
  }
  const cache = memoryCache[seccion];

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

  // --- Evitar updates simultáneos ---
  async function updateCacheInBackground(pageSize: number, MAX_PAGES: number) {
    if (cache.updating) return; // Ya hay un update en curso
    cache.updating = true;
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
        100,
        ["description","image_url","source_id","link"]
      );
      if (noticiasValidas.length > 0) {
        cache.lastApiSuccess = Date.now();
        cache.noticias = noticiasValidas;
        cache.timestamp = Date.now();
        cache.lastValidNoticias = noticiasValidas;
        saveCache(seccion, noticiasValidas);
      }
    } catch (e) {
      // Silenciar errores en background
    } finally {
      cache.updating = false;
    }
  }

  async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '4', 10);
    const MAX_PAGES = 5;
    const now = Date.now();
    let noticiasParaResponder = cache.noticias;
    let fromCache = false;
    if (!cache.timestamp || now - cache.timestamp > cacheDurationMs) {
      await updateCacheInBackground(pageSize, MAX_PAGES);
      noticiasParaResponder = cache.noticias;
      fromCache = false;
    } else {
      fromCache = true;
      // Solo actualizar si no hay update en curso y han pasado al menos 10 segundos desde el último update
      if (!cache.updating && (!cache.lastApiSuccess || now - cache.lastApiSuccess > 10000)) {
        updateCacheInBackground(pageSize, MAX_PAGES);
      }
    }
    // Evitar error de undefined en lastApiSuccess
    const cooldownActive = typeof cache.lastApiSuccess === 'number' && cache.lastApiSuccess > 0 && (now - cache.lastApiSuccess < cooldownMs);
    const total = noticiasParaResponder.length;
    const realMaxPages = Math.max(1, Math.ceil(total / pageSize));
    const inicio = (page - 1) * pageSize;
    const fin = inicio + pageSize;
    const itemsPaginados = noticiasParaResponder.slice(inicio, fin);
    return NextResponse.json(respuestaApiEstandar({
      noticias: itemsPaginados,
      cached: fromCache,
      huboCambio: !fromCache,
      errorMsg: '',
      fallback: false,
      apiStatus: 'ok',
      meta: { cooldownActive },
      page,
      pageSize,
      realMaxPages,
      total,
    }));
  }

  return { GET };
}
