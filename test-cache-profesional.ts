import { saveCache, loadCache } from './src/utils/sectionCacheManager';

const secciones = [
  {
    nombre: 'noticias',
    noticia: {
      title: 'Test noticia profesional',
      link: 'https://ejemplo.com/noticia',
      pubDate: new Date().toISOString(),
    },
  },
  {
    nombre: 'farandula',
    noticia: {
      title: 'Test farándula profesional',
      link: 'https://ejemplo.com/farandula',
      pubDate: new Date().toISOString(),
    },
  },
  {
    nombre: 'musica',
    noticia: {
      title: 'Test música profesional',
      link: 'https://ejemplo.com/musica',
      pubDate: new Date().toISOString(),
    },
  },
];

(async () => {
  for (const { nombre, noticia } of secciones) {
    try {
      console.log(`\n--- Sección: ${nombre} ---`);
      await saveCache(nombre, [noticia]);
      const cache = await loadCache(nombre);
      console.log('Noticias en caché:', cache?.noticias);
    } catch (e) {
      console.error(`Error en sección ${nombre}:`, e);
    }
  }
  process.exit(0);
})();
