/**
 * API endpoint para música - Radio Eclipse
 * Integra con NewsData.io y sistema de caché profesional
 * 
 * @author Radio Eclipse - Sistema de Noticias
 * @version 2.0.0
 */

import { createSectionApiHandler } from "@/utils/sectionCacheManager";
import { fetchNoticiasNewsData } from "@/utils/fetchNoticiasNewsData";

// Configuración específica para música
const CONFIG = {
  CACHE_DURATION_MS: parseInt(process.env.MUSICA_CACHE_DURATION_MS || '') || 4 * 60 * 60 * 1000, // 4 horas default
  COOLDOWN_MS: parseInt(process.env.MUSICA_COOLDOWN_MS || '') || 61 * 60 * 1000, // 61 min default
  REGION: 'música',
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
} as const;

// Crear handler con configuración específica de música
const handler = createSectionApiHandler({
  seccion: "musica",
  cacheDurationMs: CONFIG.CACHE_DURATION_MS,
  cooldownMs: CONFIG.COOLDOWN_MS,
  fetchNoticias: () => fetchNoticiasNewsData('music', {
    language: 'es', // Solo pasar q=music y language=es
  }),
  region: CONFIG.REGION,
  maxRetries: CONFIG.MAX_RETRIES,
  retryDelayMs: CONFIG.RETRY_DELAY_MS,
});

export const GET = handler.GET;
