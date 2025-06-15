// utils/cacheManager.js
// Utilidades para exportar e importar caches de Redis automáticamente
require('dotenv').config();
const { Redis } = require('@upstash/redis');
const fs = require('fs');
const path = require('path');

const REDIS_URL = process.env.REDIS_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const API_USER_KEY = process.env.API_USER_KEY;
const SECCIONES = ['farandula', 'musica', 'noticias'];
const EXPORT_PATH = path.join('/tmp', 'caches_export.json');

const redis = new Redis({
  url: REDIS_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});

async function exportarCaches() {
  const exportData = {};
  for (const seccion of SECCIONES) {
    const keys = await redis.keys(`${seccion}:*`);
    exportData[seccion] = {};
    for (const key of keys) {
      exportData[seccion][key] = await redis.get(key);
    }
  }
  fs.writeFileSync(EXPORT_PATH, JSON.stringify(exportData, null, 2));
  return EXPORT_PATH;
}

async function importarCaches() {
  if (!fs.existsSync(EXPORT_PATH)) {
    throw new Error('No se encontró el archivo de backup de cachés.');
  }
  const data = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf-8'));
  for (const seccion in data) {
    for (const key in data[seccion]) {
      await redis.set(key, data[seccion][key]);
    }
  }
  return true;
}

module.exports = { exportarCaches, importarCaches, EXPORT_PATH, API_USER_KEY };
