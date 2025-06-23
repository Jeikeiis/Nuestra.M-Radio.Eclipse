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

// --- GESTIÓN DE CACHÉ EN DISCO ---

export function getCacheFilePath(seccion: string): string {
  return path.resolve(CONFIG.CACHE_DIR, `${seccion}-cache.json`);
}

export function loadCache(seccion: string): CacheData | null {
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

export function saveCache(seccion: string, noticias: Dato[], metadata?: Partial<CacheMetadata>): boolean {
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

export function limpiarCacheSiExcede(seccion: string, maxItems: number = CONFIG.CLEANUP_THRESHOLD): boolean {
  const cache = loadCache(seccion);
  
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

  return saveCache(seccion, noticiasLimitadas, cache.metadata);
}

// --- FUNCIONES DE UTILIDAD PROFESIONALES ---

export function procesarNoticiasApi(
  noticiasApi: NewsDataArticle[], 
  cacheExistente: Dato[] = []
): Dato[] {
  // Filtrar y validar artículos de la API
  const noticiasValidas = noticiasApi.filter(noticia => 
    noticia &&
    noticia.title &&
    noticia.link &&
    typeof noticia.title === 'string' &&
    noticia.title.trim().length >= CONFIG.MIN_ARTICLE_TITLE_LENGTH &&
    noticia.link.startsWith('http')
  );

  // Deduplicar combinando con caché existente
  return deduplicarCombinado(
    noticiasValidas,
    cacheExistente,
    ['title', 'link'],
    'pubDate',
    CONFIG.MAX_CACHE_ITEMS,
    ['description', 'image_url', 'source_id', 'content']
  );
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
  const resultado: Record<string, CacheData | null> = {};
  
  for (const seccion of SECCIONES) {
    try {
      resultado[seccion] = loadCache(seccion);
      logger.info(seccion, 'Caché exportado', {
        hasData: !!resultado[seccion],
        itemCount: resultado[seccion]?.noticias.length || 0
      });
    } catch (error) {
      logger.error(seccion, 'Error exportando caché', error as Error);
      resultado[seccion] = null;
    }
  }
  
  return resultado;
}

export async function importarCaches(data: Record<string, any>): Promise<boolean> {
  let success = true;
  
  for (const seccion of SECCIONES) {
    try {
      const sectionData = data[seccion];
      
      if (sectionData && Array.isArray(sectionData.noticias)) {
        const saved = saveCache(seccion, sectionData.noticias, sectionData.metadata);
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
  
  return success;
}

// --- CACHÉ EN MEMORIA GLOBAL ---

const memoryCache: Record<string, MemoryCacheEntry> = {};

function initializeMemoryCache(seccion: string): MemoryCacheEntry {
  const diskCache = loadCache(seccion);
  
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

  // Inicializar caché en memoria
  if (!memoryCache[seccion]) {
    initializeMemoryCache(seccion);
  }

  const cache = memoryCache[seccion];

  // Función de reintento con backoff exponencial
  async function fetchWithRetry(): Promise<FetchNoticiasResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
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
        logger.warn(seccion, `Intento ${attempt + 1} falló`, undefined, { 
          error: lastError.message 
        });
      }

      // Esperar antes del siguiente intento (backoff exponencial)
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

  // Actualización de caché en background
  async function updateCacheInBackground(pageSize: number, maxPages: number): Promise<void> {
    const now = Date.now();
    
    // Evitar updates concurrentes
    if (cache.updating) {
      logger.info(seccion, 'Update ya en progreso, omitiendo');
      return;
    }

    // Cooldown entre updates
    if (now - cache.lastUpdateAttempt < CONFIG.UPDATE_COOLDOWN_MS) {
      logger.info(seccion, 'En cooldown, omitiendo update');
      return;
    }

    cache.updating = true;
    cache.lastUpdateAttempt = now;

    try {
      logger.info(seccion, 'Iniciando actualización de caché');
      
      const result = await fetchWithRetry();
      
      if (result.noticias.length > 0) {
        const noticiasValidas = procesarNoticiasApi(result.noticias, cache.noticias);
        
        cache.noticias = noticiasValidas;
        cache.metadata.timestamp = now;
        cache.metadata.lastApiSuccess = now;
        cache.metadata.region = region;

        // Guardar en disco de forma asíncrona
        setImmediate(() => {
          saveCache(seccion, noticiasValidas, cache.metadata);
          limpiarCacheSiExcede(seccion);
        });

        logger.info(seccion, 'Caché actualizado exitosamente', {
          newItemCount: noticiasValidas.length,
          apiItemCount: result.noticias.length,
          totalApiCalls: cache.metadata.totalApiCalls
        });
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

  // Handler principal de la API
  async function GET(req: NextRequest): Promise<NextResponse> {
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
        setImmediate(() => updateCacheInBackground(pageSize, CONFIG.DEFAULT_MAX_PAGES));
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

// Re-exportar utilidades para compatibilidad
export { deduplicarCombinado } from "./sectionDeduplicar";
