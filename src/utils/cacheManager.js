// utils/cacheManager.js
// Funcionalidad de cache temporalmente deshabilitada
// import { Redis } from '@upstash/redis';
// const REDIS_URL = process.env.REDIS_URL;
// const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export const API_USER_KEY = process.env.API_KEY; // Unifica el nombre de la variable
// const SECCIONES = ['farandula', 'musica', 'noticias'];
// const fs = require('fs');
// const path = require('path');
// const EXPORT_PATH = path.join('/tmp', 'caches_export.json');

// export const redis = new Redis({
//   url: REDIS_URL,
//   token: UPSTASH_REDIS_REST_TOKEN,
// });

export async function exportarCaches() {
  // Funcionalidad deshabilitada temporalmente
  return 'Función de exportar caché deshabilitada temporalmente';
}

export async function importarCaches() {
  // Funcionalidad deshabilitada temporalmente
  return 'Función de importar caché deshabilitada temporalmente';
}
