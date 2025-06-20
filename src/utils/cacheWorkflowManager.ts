// src/utils/cacheWorkflowManager.ts
/**
 * Utilidad para exportar, importar y limpiar caches de farándula, música y noticias.
 *
 * - exportarCaches: Devuelve el estado actual de todos los caches.
 * - importarCaches: Sobrescribe los caches con datos externos.
 * - limpiarCacheSiExcede: Limita el tamaño del caché por sección.
 *
 * Integración: Usa cacheFileManager para acceso a disco. Usado por endpoints de importación/exportación y helpers de caché.
 */
import fs from 'fs';
import path from 'path';
import { saveCache, loadCache, getCacheFilePath } from './cacheFileManager';

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


/**
 * Limita el tamaño del caché de una sección a un máximo de páginas.
 * @param seccion Nombre de la sección (ej: 'noticias')
 * @param maxPaginas Máximo de páginas a conservar
 * @param porPagina Elementos por página
 */
export function limpiarCacheSiExcede(seccion: string, maxPaginas = 15, porPagina = 20) {
  const cache = loadCache(seccion);
  if (cache && Array.isArray(cache.noticias) && cache.noticias.length > maxPaginas * porPagina) {
    const nuevas = cache.noticias.slice(0, maxPaginas * porPagina);
    saveCache(seccion, nuevas);
  }
}
