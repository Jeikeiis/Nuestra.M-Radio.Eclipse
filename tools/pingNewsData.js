// Script para hacer ping a la API de NewsData.io
// Usa tu API KEY en la variable de entorno USER_API_KEY o en .env.local

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Cargar variables de entorno desde .env.local si existe
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const API_KEY = process.env.USER_API_KEY;
if (!API_KEY) {
  console.error('Falta la variable de entorno USER_API_KEY en .env.local');
  process.exit(1);
}

const url = `https://newsdata.io/api/1/news?country=uy&apikey=${API_KEY}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('Respuesta de NewsData.io:', data);
    if (data.status === 'success') {
      console.log('✅ Conexión exitosa');
    } else {
      console.error('⚠️ Respuesta inesperada:', data);
    }
  })
  .catch(err => {
    console.error('❌ Error al conectar con NewsData.io:', err);
  });
