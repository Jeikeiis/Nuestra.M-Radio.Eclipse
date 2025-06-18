// utils/noticiasUtils.ts
// Utilidades profesionales para deduplicar y limpiar noticias en backend y frontend

export type Noticia = {
  title: string;
  link: string;
  source_id?: string;
  pubDate?: string;
  description?: string;
};

export function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/gi, "")
    .trim();
}

export function areSimilar(a: string, b: string): boolean {
  if (!a || !b) return false;
  a = normalizeText(a);
  b = normalizeText(b);
  if (a === b) return true;
  const aWords = new Set(a.split(" "));
  const bWords = new Set(b.split(" "));
  const intersection = [...aWords].filter((x) => bWords.has(x));
  return intersection.length >= Math.min(aWords.size, bWords.size) * 0.7;
}

export function deduplicarNoticias(noticias: Noticia[]): Noticia[] {
  const vistos = new Set<string>();
  const resultado: Noticia[] = [];
  for (const n of noticias) {
    const key = normalizeText(n.title) + "|" + normalizeText(n.link);
    if (vistos.has(key)) continue;
    // Evitar similares en el resultado
    if (resultado.some((prev) => areSimilar(n.title, prev.title) || areSimilar(n.description || '', prev.description || ''))) continue;
    vistos.add(key);
    resultado.push(n);
  }
  return resultado;
}

export function filtrarYLimpiarNoticias(noticias: Noticia[]): Noticia[] {
  const ahora = Date.now();
  return deduplicarNoticias(
    noticias
      .filter((n) => n && n.title && n.link && n.title.length > 15)
      .filter((n) => {
        const titulo = n.title.toLowerCase();
        if (titulo.includes("resumen") || titulo.includes("video:")) return false;
        if (!n.description || n.description.length < 40) return false;
        if (n.pubDate) {
          const fecha = new Date(n.pubDate).getTime();
          if (isNaN(fecha) || ahora - fecha > 7 * 24 * 60 * 60 * 1000) return false;
        }
        return true;
      })
      .sort((a, b) => (b.description ? 1 : 0) - (a.description ? 1 : 0))
  ).slice(0, 30);
}
