const redis = new Redis('redis://default:Ax25ie83tq25ocdvmi30klrnmm2oon5a8t5jziufojqt9zhvl7@redis-xxxx:6379');

const SECCIONES = ['farandula', 'musica', 'noticias'];
const EXPORT_PATH = path.join('/tmp', 'caches_export.json');

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
  process.exit(0);
}

exportarCaches();
