/**
 * API endpoint para noticias - Radio Eclipse
 * Integra con NewsData.io y sistema de caché profesional
 * 
 * @author Radio Eclipse - Sistema de Noticias
 * @version 2.0.0
 */

import { createSectionApiHandler } from "@/utils/sectionCacheManager";
import { fetchNoticiasNewsData } from "@/utils/fetchNoticiasNewsData";

// Configuración específica para noticias
const CONFIG = {
  CACHE_DURATION_MS: parseInt(process.env.NOTICIAS_CACHE_DURATION_MS || '') || 10 * 60 * 1000, // 10 min default
  COOLDOWN_MS: parseInt(process.env.NOTICIAS_COOLDOWN_MS || '') || 61 * 60 * 1000, // 61 min default
  REGION: 'noticias',
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
} as const;

// Crear handler con configuración específica de noticias
const handler = createSectionApiHandler({
  seccion: "noticias",
  cacheDurationMs: CONFIG.CACHE_DURATION_MS,
  cooldownMs: CONFIG.COOLDOWN_MS,
  fetchNoticias: () => fetchNoticiasNewsData('', {
    country: 'uy',
    // No pasar category ni size para que la URL sea solo country+apikey
  }),
  region: CONFIG.REGION,
  maxRetries: CONFIG.MAX_RETRIES,
  retryDelayMs: CONFIG.RETRY_DELAY_MS,
});

export const GET = handler.GET;
