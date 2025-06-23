# Script para limpiar cachés antiguos

import fs from 'fs';
import path from 'path';

const cacheDir = path.resolve(__dirname, '../mi-aplicacion-next');
const cacheFiles = ['farandula-cache.json', 'musica-cache.json', 'noticias-cache.json'];

for (const file of cacheFiles) {
  const filePath = path.join(cacheDir, file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(data.noticias) && data.noticias.length > 100) {
      data.noticias = data.noticias.slice(0, 100);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Limpiado: ${file}`);
    }
  }
}
console.log('Limpieza de cachés finalizada.');
