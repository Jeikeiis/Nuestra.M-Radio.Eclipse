/**
 * Sistema profesional unificado de gestión de caché para secciones de noticias.
 * Integra caché en memoria, disco, deduplicación y APIs robustas.
 * 
 * @author Radio Eclipse - Sistema de Noticias
 * @version 3.0.0
 */

import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from "next/server";
import { deduplicarCombinado, filtrarYLimpiarDatos, type Dato } from "./sectionDeduplicar";
import type { NewsDataArticle, FetchNoticiasResult } from "./fetchNoticiasNewsData";
import { redisGet, redisSet } from './redisClient';

// --- TIPOS PROFESIONALES ---

export interface CacheMetadata {
  timestamp: number;
  lastApiSuccess: number;
  version: string;
  region?: string;
  totalApiCalls: number;
  rateLimitHits: number;
}

export interface CacheData {
  noticias: Dato[];
  metadata: CacheMetadata;
}

export interface MemoryCacheEntry extends CacheData {
  updating: boolean;
  lastUpdateAttempt: number;
}

export interface ApiResponse {
  noticias: Dato[];
  cached: boolean;
  huboCambio: boolean;
  errorMsg: string;
  fallback: boolean;
  apiStatus: 'ok' | 'error' | 'cooldown' | 'rate_limit' | 'fallback';
  meta: {
    page: number;
    pageSize: number;
    realMaxPages: number;
    total: number;
    cooldownActive: boolean;
    lastUpdate?: string;
    cacheAge?: number;
    region?: string;
  };
}

export interface SectionConfig {
  seccion: string;
  cacheDurationMs: number;
  cooldownMs: number;
  fetchNoticias: () => Promise<FetchNoticiasResult>;
  region?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

// --- CONFIGURACIÓN CENTRALIZADA ---

const CONFIG = {
  CACHE_VERSION: '3.0.0',
  CACHE_DIR: path.resolve(process.cwd()),
  DEFAULT_PAGE_SIZE: 4,
  DEFAULT_MAX_PAGES: 5,
  MAX_CACHE_ITEMS: 100,
  MIN_ARTICLE_TITLE_LENGTH: 10,
  UPDATE_COOLDOWN_MS: 10000, // 10 segundos entre updates
  CLEANUP_THRESHOLD: 200, // Limpiar cuando supere este número
} as const;

const SECCIONES = ['farandula', 'musica', 'noticias'] as const;
type Seccion = typeof SECCIONES[number];

// --- LOGGING PROFESIONAL ---

const logger = {
  info: (section: string, message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache:${section}] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  },
  warn: (section: string, message: string, meta?: Record<string, any>) => {
    console.warn(`[Cache:${section}] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  error: (section: string, message: string, error?: Error, meta?: Record<string, any>) => {
    console.error(`[Cache:${section}] ${message}`, error?.message || '', meta ? JSON.stringify(meta, null, 2) : '');
  }
};

// --- GESTIÓN DE CACHÉ EN REDIS (ASYNC) ---

export async function saveCache(seccion: string, noticias: Dato[], metadata?: Partial<CacheMetadata>): Promise<boolean> {
  const key = `${seccion}-cache`;
  const cacheData: CacheData = {
    noticias: noticias.slice(0, CONFIG.MAX_CACHE_ITEMS),
    metadata: {
      timestamp: Date.now(),
      lastApiSuccess: Date.now(),
      version: CONFIG.CACHE_VERSION,
      totalApiCalls: 0,
      rateLimitHits: 0,
      ...metadata,
    }
  };
  // Guardar en Redis
  const ok = await redisSet(key, cacheData);
  // Guardar en disco local también (sincrónico, pero rápido)
  saveCacheEnDisco(seccion, cacheData.noticias, cacheData.metadata);
  if (ok) {
    logger.info(seccion, 'Caché guardado en Redis y disco', {
      itemCount: cacheData.noticias.length
    });
  } else {
    logger.error(seccion, 'Error guardando caché en Redis');
  }
  return ok;
}

export async function loadCache(seccion: string): Promise<CacheData | null> {
  const key = `${seccion}-cache`;
  let data = await redisGet<CacheData>(key);
  if (data) {
    logger.info(seccion, 'Caché cargado desde Redis', {
      itemCount: data.noticias.length,
      version: data.metadata.version
    });
    // Sincronizar disco si está desactualizado
    saveCacheEnDisco(seccion, data.noticias, data.metadata);
    return data;
  }
  logger.info(seccion, 'Caché no encontrado en Redis, intentando cargar desde disco');
  // Intentar cargar desde disco y migrar a Redis si existe
  const diskData = loadCacheDesdeDisco(seccion);
  if (diskData) {
    await redisSet(key, diskData);
    logger.info(seccion, 'Caché migrado de disco a Redis', {
      itemCount: diskData.noticias.length
    });
    return diskData;
  }
  return null;
}

export async function limpiarCacheSiExcede(seccion: string, maxItems: number = CONFIG.CLEANUP_THRESHOLD): Promise<boolean> {
  const cache = await loadCache(seccion);
  if (!cache || cache.noticias.length <= maxItems) {
    return false;
  }
  logger.info(seccion, 'Limpiando caché por exceso de items', {
    currentCount: cache.noticias.length,
    targetCount: maxItems
  });
  const noticiasLimitadas = cache.noticias
    .sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
    .slice(0, maxItems);
  return await saveCache(seccion, noticiasLimitadas, cache.metadata);
}

// --- GESTIÓN DE CACHÉ EN DISCO ---

export function getCacheFilePath(seccion: string): string {
  return path.resolve(CONFIG.CACHE_DIR, `${seccion}-cache.json`);
}

export function loadCacheDesdeDisco(seccion: string): CacheData | null {
  const file = getCacheFilePath(seccion);
  
  if (!fs.existsSync(file)) {
    logger.info(seccion, 'Archivo de caché no existe');
    return null;
  }

  try {
    const rawData = fs.readFileSync(file, "utf-8");
    const data = JSON.parse(rawData);

    // Migración de formato legacy
    if (Array.isArray(data.noticias)) {
      const cacheData: CacheData = {
        noticias: data.noticias,
        metadata: {
          timestamp: data.timestamp || 0,
          lastApiSuccess: data.lastApiSuccess || 0,
          version: data.version || '1.0.0',
          region: data.region,
          totalApiCalls: data.totalApiCalls || 0,
          rateLimitHits: data.rateLimitHits || 0,
        }
      };

      logger.info(seccion, 'Caché cargado desde disco', {
        itemCount: cacheData.noticias.length,
        age: Date.now() - cacheData.metadata.timestamp,
        version: cacheData.metadata.version
      });

      return cacheData;
    }

    logger.warn(seccion, 'Formato de caché inválido', { dataKeys: Object.keys(data) });
    return null;

  } catch (error) {
    logger.error(seccion, 'Error leyendo caché desde disco', error as Error, { file });
    return null;
  }
}

export function saveCacheEnDisco(seccion: string, noticias: Dato[], metadata?: Partial<CacheMetadata>): boolean {
  const file = getCacheFilePath(seccion);
  
  try {
    const cacheData: CacheData = {
      noticias: noticias.slice(0, CONFIG.MAX_CACHE_ITEMS), // Limitar tamaño
      metadata: {
        timestamp: Date.now(),
        lastApiSuccess: Date.now(),
        version: CONFIG.CACHE_VERSION,
        totalApiCalls: 0,
        rateLimitHits: 0,
        ...metadata,
      }
    };

    fs.writeFileSync(file, JSON.stringify(cacheData, null, 2), "utf-8");
    
    logger.info(seccion, 'Caché guardado en disco', {
      itemCount: cacheData.noticias.length,
      file: path.basename(file)
    });

    return true;

  } catch (error) {
    logger.error(seccion, 'Error guardando caché en disco', error as Error, { file });
    return false;
  }
}

// --- FUNCIONES DE UTILIDAD PROFESIONALES ---

export function procesarNoticiasApi(
  noticiasApi: NewsDataArticle[], 
  cacheExistente: Dato[] = [],
  seccion: string = 'noticias'
): Dato[] {
  // Filtrar y validar artículos de la API con logging
  const noticiasValidas = filtrarNoticiasValidas(noticiasApi, seccion);

  // Deduplicar combinando con caché existente
  const deduplicadas = deduplicarCombinado(
    noticiasValidas,
    cacheExistente,
    ['title', 'link'],
    'pubDate',
    CONFIG.MAX_CACHE_ITEMS,
    ['description', 'image_url', 'source_id', 'content']
  );

  if (deduplicadas.length < noticiasValidas.length) {
    logger.warn(seccion, 'Se detectaron y eliminaron duplicados', {
      antes: noticiasValidas.length,
      despues: deduplicadas.length
    });
  }
  return deduplicadas;
}

export function respuestaApiEstandar(params: {
  noticias: Dato[];
  cached: boolean;
  huboCambio: boolean;
  errorMsg: string;
  fallback: boolean;
  apiStatus: ApiResponse['apiStatus'];
  meta: Partial<ApiResponse['meta']>;
  page?: number;
  pageSize?: number;
  total?: number;
}): ApiResponse {
  const {
    noticias,
    cached,
    huboCambio,
    errorMsg,
    fallback,
    apiStatus,
    meta,
    page = 1,
    pageSize = CONFIG.DEFAULT_PAGE_SIZE,
    total = noticias.length
  } = params;

  const realMaxPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    noticias,
    cached,
    huboCambio,
    errorMsg: noticias.length === 0 && !errorMsg ? 'No hay noticias disponibles' : errorMsg,
    fallback,
    apiStatus,
    meta: {
      page,
      pageSize,
      realMaxPages,
      total,
      cooldownActive: false,
      ...meta,
    },
  };
}

// --- WORKFLOWS DE IMPORTACIÓN/EXPORTACIÓN ---

export async function exportarCaches(): Promise<Record<string, CacheData | null>> {
  logger.info('global', '[INICIO] Exportación de todos los cachés');
  const resultado: Record<string, CacheData | null> = {};
  for (const seccion of SECCIONES) {
    try {
      resultado[seccion] = await loadCache(seccion);
      logger.info(seccion, 'Caché exportado', {
        hasData: !!resultado[seccion],
        itemCount: resultado[seccion]?.noticias.length || 0
      });
    } catch (error) {
      logger.error(seccion, 'Error exportando caché', error as Error);
      resultado[seccion] = null;
    }
  }
  logger.info('global', '[FIN] Exportación de cachés');
  return resultado;
}

export async function importarCaches(data: Record<string, any>): Promise<boolean> {
  logger.info('global', '[INICIO] Importación de cachés');
  let success = true;
  for (const seccion of SECCIONES) {
    try {
      const sectionData = data[seccion];
      if (sectionData && Array.isArray(sectionData.noticias)) {
        const saved = await saveCache(seccion, sectionData.noticias, sectionData.metadata);
        if (!saved) success = false;
        logger.info(seccion, 'Caché importado', {
          itemCount: sectionData.noticias.length,
          success: saved
        });
      } else {
        logger.warn(seccion, 'Datos de importación inválidos', {
          hasSection: !!sectionData,
          hasNoticias: !!sectionData?.noticias,
          isArray: Array.isArray(sectionData?.noticias)
        });
      }
    } catch (error) {
      logger.error(seccion, 'Error importando caché', error as Error);
      success = false;
    }
  }
  logger.info('global', '[FIN] Importación de cachés');
  return success;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const memoryCache: Record<string, MemoryCacheEntry> = {};

export async function initializeMemoryCache(seccion: string): Promise<MemoryCacheEntry> {
  const diskCache = await loadCache(seccion);
  const entry: MemoryCacheEntry = {
    noticias: diskCache?.noticias || [],
    metadata: diskCache?.metadata || {
      timestamp: 0,
      lastApiSuccess: 0,
      version: CONFIG.CACHE_VERSION,
      totalApiCalls: 0,
      rateLimitHits: 0,
    },
    updating: false,
    lastUpdateAttempt: 0,
  };
  memoryCache[seccion] = entry;
  logger.info(seccion, 'Caché en memoria inicializado', {
    itemCount: entry.noticias.length,
    lastSuccess: entry.metadata.lastApiSuccess,
    version: entry.metadata.version
  });
  return entry;
}

export function getMemoryCache(seccion: string): MemoryCacheEntry {
  return memoryCache[seccion];
}

// --- FACTORY PARA HANDLERS DE API ---

export function createSectionApiHandler(config: SectionConfig) {
  const { 
    seccion, 
    cacheDurationMs, 
    cooldownMs, 
    fetchNoticias, 
    region,
    maxRetries = 3,
    retryDelayMs = 1000
  } = config;

  // --- Mover helpers internos aquí para que estén en scope ---
  async function fetchWithRetry(): Promise<FetchNoticiasResult> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const cache = memoryCache[seccion];
        cache.metadata.totalApiCalls++;
        const result = await fetchNoticias();
        if (result.rateLimitHit) {
          cache.metadata.rateLimitHits++;
          logger.warn(seccion, 'Rate limit detectado', { 
            attempt: attempt + 1, 
            totalRateLimits: cache.metadata.rateLimitHits 
          });
        }
        if (!result.errorMsg || result.noticias.length > 0) {
          return result;
        }
        lastError = new Error(result.errorMsg);
      } catch (error) {
        lastError = error as Error;
        logger.warn(seccion, `Intento ${attempt + 1} falló`, { 
          error: lastError.message 
        });
      }
      if (attempt < maxRetries) {
        const delay = retryDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return {
      noticias: [],
      errorMsg: lastError?.message || 'Error desconocido tras múltiples intentos',
    };
  }

  async function updateCacheInBackground(pageSize: number, maxPages: number): Promise<void> {
    const cache = memoryCache[seccion];
    const now = Date.now();
    if (cache.updating) {
      logger.info(seccion, 'Update ya en progreso, omitiendo');
      return;
    }
    if (now - cache.lastUpdateAttempt < CONFIG.UPDATE_COOLDOWN_MS) {
      logger.info(seccion, 'En cooldown, omitiendo update');
      return;
    }
    cache.updating = true;
    cache.lastUpdateAttempt = now;
    logger.info(seccion, '[INICIO] Actualización de caché');
    try {
      const result = await fetchWithRetry();
      // Log de resultado crudo para debug
      logger.info(seccion, '[DEBUG] Resultado de fetchWithRetry', { noticiasCount: result.noticias.length, errorMsg: result.errorMsg });
      if (result.noticias && Array.isArray(result.noticias) && result.noticias.length > 0) {
        const noticiasValidas = procesarNoticiasApi(result.noticias, cache.noticias, seccion);
        // Solo actualizar si hay cambios reales
        const titulosActuales = new Set(cache.noticias.map(n => n.title));
        const hayNuevas = noticiasValidas.some(n => !titulosActuales.has(n.title));
        if (hayNuevas) {
          cache.noticias = noticiasValidas;
          cache.metadata.timestamp = now;
          cache.metadata.lastApiSuccess = now;
          cache.metadata.region = region;
          setTimeout(() => {
            saveCache(seccion, noticiasValidas, cache.metadata);
            limpiarCacheSiExcede(seccion);
          }, 0);
          logger.info(seccion, '[FIN] Caché actualizado exitosamente', {
            newItemCount: noticiasValidas.length,
            apiItemCount: result.noticias.length,
            totalApiCalls: cache.metadata.totalApiCalls
          });
        } else {
          logger.info(seccion, 'No hay noticias nuevas respecto al caché actual. No se actualiza.');
        }
      } else {
        logger.warn(seccion, 'No se obtuvieron noticias válidas', {
          errorMsg: result.errorMsg,
          rateLimitHit: result.rateLimitHit
        });
      }
    } catch (error) {
      logger.error(seccion, 'Error en actualización de caché', error as Error);
    } finally {
      cache.updating = false;
    }
  }

  async function getCacheSafe() {
    if (!memoryCache[seccion]) {
      await initializeMemoryCache(seccion);
    }
    return memoryCache[seccion];
  }

  async function GET(req: NextRequest): Promise<NextResponse> {
    const cache = await getCacheSafe();
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, Math.min(20, parseInt(url.searchParams.get('pageSize') || '4', 10)));
    const force = url.searchParams.get('force') === '1';
    const now = Date.now();
    const cacheAge = now - cache.metadata.timestamp;
    const isStale = cacheAge > cacheDurationMs;
    logger.info(seccion, 'Procesando request', {
      page,
      pageSize,
      force,
      cacheAge: `${Math.round(cacheAge / 1000)}s`,
      isStale,
      itemCount: cache.noticias.length
    });

    // Determinar si necesitamos actualizar
    let needsUpdate = force || isStale;
    
    // Si no tenemos datos, forzar update
    if (cache.noticias.length === 0) {
      needsUpdate = true;
    }

    // Actualizar caché si es necesario
    if (needsUpdate && !cache.updating) {
      // Para requests forzados, esperar la actualización
      if (force) {
        await updateCacheInBackground(pageSize, CONFIG.DEFAULT_MAX_PAGES);
      } else {
        // Para requests normales, actualizar en background
        setTimeout(() => {
          updateCacheInBackground(pageSize, CONFIG.DEFAULT_MAX_PAGES);
        }, 0);
      }
    }

    // Verificar cooldown
    const timeSinceLastSuccess = now - cache.metadata.lastApiSuccess;
    const cooldownActive = cache.metadata.lastApiSuccess > 0 && timeSinceLastSuccess < cooldownMs;

    // Preparar datos de respuesta
    const noticiasParaResponder = cache.noticias;
    const total = noticiasParaResponder.length;
    const realMaxPages = Math.max(1, Math.ceil(total / pageSize));
    
    // Paginar resultados
    const inicio = (page - 1) * pageSize;
    const fin = inicio + pageSize;
    const itemsPaginados = noticiasParaResponder.slice(inicio, fin);

    // Determinar estado de la API
    let apiStatus: ApiResponse['apiStatus'] = 'ok';
    if (cooldownActive) {
      apiStatus = 'cooldown';
    } else if (total === 0) {
      apiStatus = 'error';
    }

    const response = respuestaApiEstandar({
      noticias: itemsPaginados,
      cached: !force && !isStale,
      huboCambio: force || isStale,
      errorMsg: '',
      fallback: false,
      apiStatus,
      meta: {
        cooldownActive,
        lastUpdate: new Date(cache.metadata.timestamp).toISOString(),
        cacheAge: Math.round(cacheAge / 1000),
        region: cache.metadata.region,
      },
      page,
      pageSize,
      total,
    });

    return NextResponse.json(response);
  }

  return { GET };
}

// --- HELPERS INTERNOS MEJORADOS ---

/**
 * Pagina un array de noticias de forma segura.
 * @param items Noticias a paginar
 * @param page Página solicitada (1-indexed)
 * @param pageSize Tamaño de página
 * @returns Noticias paginadas
 */
function paginarNoticias<T>(items: T[], page: number, pageSize: number): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const realMaxPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, realMaxPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, items.length);
  return items.slice(start, end);
}

/**
 * Valida y filtra noticias, logueando las descartadas.
 */
function filtrarNoticiasValidas(noticiasApi: NewsDataArticle[], seccion: string): NewsDataArticle[] {
  return noticiasApi.filter(noticia => {
    const valida = noticia && noticia.title && noticia.link && typeof noticia.title === 'string' && noticia.title.trim().length >= CONFIG.MIN_ARTICLE_TITLE_LENGTH && noticia.link.startsWith('http');
    if (!valida) {
      logger.warn(seccion, 'Noticia descartada por formato inválido', { noticia });
    }
    return valida;
  });
}

// Re-exportar utilidades para compatibilidad
export { deduplicarCombinado } from "./sectionDeduplicar";
