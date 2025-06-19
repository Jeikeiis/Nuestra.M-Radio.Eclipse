// src/utils/deduplicarNoticias.ts
// Utilidad centralizada para deduplicar noticias combinando nuevas y viejas (caché)
// Normaliza títulos, compara descripciones y permite cierto fuzzy matching

export interface Noticia {
  title: string;
  link: string;
  description?: string;
  [key: string]: any;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/&[a-z]+;/gi, '') // quita entidades html
    .replace(/<[^>]+>/g, '') // quita etiquetas html
    .replace(/\s+/g, ' ') // espacios múltiples
    .trim();
}

function areSimilar(a: string, b: string): boolean {
  if (!a || !b) return false;
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return true;
  // Si uno contiene al otro y son largos
  if (na.length > 20 && nb.length > 20 && (na.includes(nb) || nb.includes(na))) return true;
  // Si la distancia de Levenshtein es baja (<=3 para strings >20)
  if (na.length > 20 && nb.length > 20 && levenshtein(na, nb) <= 3) return true;
  return false;
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + 1
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Deduplica y combina noticias nuevas y viejas, priorizando las nuevas.
 * Si hay varias muy similares, conserva la más reciente (por pubDate) y mezcla la información útil.
 * @param nuevas Noticias nuevas (de la API)
 * @param viejas Noticias viejas (del caché local/persistente)
 * @param maxNoticias Máximo de noticias a devolver (por defecto 20)
 */
export function deduplicarNoticiasCombinadas(
  nuevas: Noticia[],
  viejas: Noticia[],
  maxNoticias: number = 20
): Noticia[] {
  // Unimos y ordenamos por pubDate descendente (más reciente primero)
  const todas = [...nuevas, ...viejas].sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });
  const resultado: Noticia[] = [];
  const vistos = new Set<string>();
  for (const n of todas) {
    // Buscar si ya hay una noticia similar en resultado
    const idx = resultado.findIndex(prev =>
      areSimilar(n.title, prev.title) ||
      areSimilar(n.description || '', prev.description || '')
    );
    if (idx !== -1) {
      // Mezclar información: conservar la más reciente, pero si la vieja tiene mejor descripción o imagen, usarla
      const actual = resultado[idx];
      resultado[idx] = {
        ...actual,
        ...n,
        // Mejor descripción
        description: (n.description && n.description.length > (actual.description?.length || 0)) ? n.description : actual.description,
        // Mejor imagen
        image_url: n.image_url || actual.image_url,
        // Mejor fuente
        source_id: n.source_id || actual.source_id,
        // Mejor link
        link: n.link || actual.link,
        // Mejor pubDate (la más reciente)
        pubDate: (n.pubDate && (!actual.pubDate || new Date(n.pubDate) > new Date(actual.pubDate))) ? n.pubDate : actual.pubDate,
      };
      continue;
    }
    // Si no hay similar, agregar
    const key = normalizeText(n.title) + '|' + normalizeText(n.link);
    if (vistos.has(key)) continue;
    vistos.add(key);
    resultado.push(n);
    if (resultado.length >= maxNoticias) break;
  }
  return resultado;
}
