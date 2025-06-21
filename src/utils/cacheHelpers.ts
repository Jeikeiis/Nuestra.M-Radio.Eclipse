// utils/cacheHelpers.ts
// Funciones comunes para guardar caché y respuesta profesional
import { filtrarYLimpiarDatos, Dato } from './deduplicar';
import { saveCache } from './cacheFileManager';
import { limpiarCacheSiExcede } from './cacheWorkflowManager';

export function guardarCacheEnArchivo(seccion: string, noticias: Dato[], pageSize: number = 4, maxPages: number = 5) {
  // Permitir guardar más si hay más elementos, solo recortar si se supera el máximo
  const maxNoticias = maxPages * pageSize;
  const noticiasUnicas = filtrarYLimpiarDatos(noticias, {
    camposClave: ["title","link"],
    campoFecha: "pubDate",
    maxItems: 100, // Permitir más elementos
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
