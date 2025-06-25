import { saveCache, loadCache } from './src/utils/sectionCacheManager';

async function testNoticiasCache() {
  try {
    const noticias = [{
      title: 'Test noticia',
      link: 'https://ejemplo.com',
      pubDate: new Date().toISOString(),
    }];
    console.log('Guardando noticia de prueba en caché...');
    await saveCache('noticias', noticias);
    const cache = await loadCache('noticias');
    console.log('Noticias en caché:', cache?.noticias);
    process.exit(0);
  } catch (e) {
    console.error('Error al probar el flujo de caché de noticias:', e);
    process.exit(1);
  }
}

testNoticiasCache();
