// Script para hacer ping a Redis Upstash
// Usa las variables de entorno UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Cargar variables de entorno desde .env o .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPathLocal = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPathLocal)) {
  dotenv.config({ path: envPathLocal });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error('Faltan las variables de entorno UPSTASH_REDIS_REST_URL o UPSTASH_REDIS_REST_TOKEN');
  process.exit(1);
}

const testKey = 'ping-test';
const testValue = `pong-${Date.now()}`;

async function pingRedis() {
  // Set value
  const setRes = await fetch(`${REDIS_URL}/set/${testKey}/${testValue}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const setJson = await setRes.json();
  if (setJson.result !== 'OK') {
    console.error('❌ Error al escribir en Redis:', setJson);
    return;
  }
  // Get value
  const getRes = await fetch(`${REDIS_URL}/get/${testKey}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const getJson = await getRes.json();
  if (getJson.result === testValue) {
    console.log('✅ Redis Upstash responde correctamente:', getJson.result);
  } else {
    console.error('⚠️ Redis respondió, pero el valor no coincide:', getJson);
  }
}

pingRedis().catch(err => {
  console.error('❌ Error al conectar con Redis Upstash:', err);
});
