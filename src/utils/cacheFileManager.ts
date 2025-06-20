/**
 * Funciones para gestionar archivos de caché de noticias/música/farándula en disco.
 *
 * - getCacheFilePath: Devuelve la ruta absoluta del archivo de caché para una sección.
 * - loadCache: Carga y valida el caché desde disco.
 * - saveCache: Guarda el caché en disco con timestamp.
 *
 * Dependencias: Node.js (fs, path), tipos de Dato de deduplicar.ts
 *
 * Integración: Usado por cacheWorkflowManager y helpers de caché.
 */
import fs from "fs";
import path from "path";
import { Dato } from "./deduplicar";

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
