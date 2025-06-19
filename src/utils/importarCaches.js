const redis = new Redis('redis://default:Ax25ie83tq25ocdvmi30klrnmm2oon5a8t5jziufojqt9zhvl7@redis-xxxx:6379');

const IMPORT_PATH = path.join('/tmp', 'caches_export.json');

async function importarCaches() {
  if (!fs.existsSync(IMPORT_PATH)) {
    console.error('No se encontró el archivo de backup de cachés.');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(IMPORT_PATH, 'utf-8'));
  for (const seccion in data) {
    for (const key in data[seccion]) {
      await redis.set(key, data[seccion][key]);
    }
  }
  process.exit(0);
}

importarCaches();
