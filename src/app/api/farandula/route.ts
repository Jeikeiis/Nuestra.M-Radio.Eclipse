/**
 * API endpoint para farándula - Radio Eclipse
 * Integra con NewsData.io y sistema de caché profesional
 * 
 * @author Radio Eclipse - Sistema de Noticias
 * @version 2.0.0
 */

import { createSectionApiHandler } from "@/utils/sectionCacheManager";
import { fetchNoticiasNewsData } from "@/utils/fetchNoticiasNewsData";

// Configuración específica para farándula
const CONFIG = {
  CACHE_DURATION_MS: parseInt(process.env.FARANDULA_CACHE_DURATION_MS || '') || 4 * 60 * 60 * 1000, // 4 horas default
  COOLDOWN_MS: parseInt(process.env.FARANDULA_COOLDOWN_MS || '') || 61 * 60 * 1000, // 61 min default
  REGION: 'entretenimiento',
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
} as const;

// Crear handler con configuración específica de farándula
const handler = createSectionApiHandler({
  seccion: "farandula",
  cacheDurationMs: CONFIG.CACHE_DURATION_MS,
  cooldownMs: CONFIG.COOLDOWN_MS,
  fetchNoticias: () => fetchNoticiasNewsData('farandula', {
    // Solo pasar q=farandula (region), sin category ni size
  }),
  region: CONFIG.REGION,
  maxRetries: CONFIG.MAX_RETRIES,
  retryDelayMs: CONFIG.RETRY_DELAY_MS,
});

export const GET = handler.GET;
