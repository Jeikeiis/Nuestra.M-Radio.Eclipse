// src/utils/deduplicar.ts
// Utilidad centralizada y profesional para deduplicar y limpiar arrays de objetos por campos clave, con mezcla de información útil.
// Dependencias cruzadas: Usado por cacheHelpers.ts y endpoints de API. No depende de otros utils salvo tipos propios.

export interface Dato {
  [key: string]: any;
}

// Normaliza texto para comparación robusta (sin tildes, minúsculas, sin HTML)
function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Compara similitud de textos (solo exacto, más estricto)
function areSimilar(a: string, b: string): boolean {
  if (!a || !b) return false;
  const na = normalizeText(a);
  const nb = normalizeText(b);
  return na === nb;
}

// Distancia de Levenshtein para similitud flexible
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
 * Deduplica y combina arrays de objetos, priorizando los más recientes (por campo fecha) y mezclando información útil.
 * @param nuevos Array de objetos nuevos
 * @param viejos Array de objetos viejos (persistentes)
 * @param camposClave Campos a usar para comparar similitud (ej: ['title','link'])
 * @param campoFecha Campo a usar para priorizar el más reciente (ej: 'pubDate')
 * @param maxItems Máximo de elementos a devolver
 * @param camposMezcla Campos a mezclar (el más largo/no vacío, ej: ['description','image_url'])
 */
export function deduplicarCombinado(
  nuevos: Dato[],
  viejos: Dato[],
  camposClave: string[] = ['title','link'],
  campoFecha: string = 'pubDate',
  maxItems: number = 20,
  camposMezcla: string[] = []
): Dato[] {
  // Unimos y ordenamos por campoFecha descendente
  const todas = [...nuevos, ...viejos].sort((a, b) => {
    const da = a[campoFecha] ? new Date(a[campoFecha]).getTime() : 0;
    const db = b[campoFecha] ? new Date(b[campoFecha]).getTime() : 0;
    return db - da;
  });
  const resultado: Dato[] = [];
  const vistos = new Set<string>();
  for (const n of todas) {
    // Clave única combinando todos los campos clave normalizados
    const key = camposClave.map(c => normalizeText(n[c] || '')).join('|');
    if (vistos.has(key)) continue;
    // Buscar si ya hay uno similar en resultado (solo exacto)
    const idx = resultado.findIndex(prev =>
      camposClave.every(c => areSimilar(n[c], prev[c]))
    );
    if (idx !== -1) {
      // Mezclar información útil
      const actual = resultado[idx];
      const mezclado: Dato = { ...actual, ...n };
      for (const campo of camposMezcla) {
        if ((n[campo] && (typeof n[campo] === 'string') && n[campo].length > (actual[campo]?.length || 0))) {
          mezclado[campo] = n[campo];
        } else if (n[campo] && !actual[campo]) {
          mezclado[campo] = n[campo];
        }
      }
      // Mantener el más reciente
      if (n[campoFecha] && (!actual[campoFecha] || new Date(n[campoFecha]) > new Date(actual[campoFecha]))) {
        mezclado[campoFecha] = n[campoFecha];
      }
      resultado[idx] = mezclado;
      continue;
    }
    vistos.add(key);
    resultado.push(n);
    if (resultado.length >= maxItems) break;
  }
  return resultado;
}

/**
 * Filtra, limpia y deduplica datos (ej: noticias) usando reglas personalizables y deduplicarCombinado.
 * @param datos Array de objetos tipo Dato (ej: noticias)
 * @param opciones Opciones de filtrado y deduplicado
 * @returns Array filtrado y deduplicado
 */
export function filtrarYLimpiarDatos(
  datos: Dato[],
  opciones?: {
    minTitulo?: number;
    minDescripcion?: number;
    maxDias?: number;
    camposClave?: string[];
    campoFecha?: string;
    maxItems?: number;
    camposMezcla?: string[];
    excluirTitulo?: string[];
    excluirDescripcion?: string[];
  }
): Dato[] {
  const {
    minTitulo = 15,
    minDescripcion = 40,
    maxDias = 7,
    camposClave = ['title','link'],
    campoFecha = 'pubDate',
    maxItems = 30,
    camposMezcla = ['description'],
    excluirTitulo = ['resumen', 'video:'],
    excluirDescripcion = [],
  } = opciones || {};
  const ahora = Date.now();
  const filtrados = datos
    .filter((n) => n && n.title && n.link && n.title.length > minTitulo)
    .filter((n) => {
      const titulo = n.title.toLowerCase();
      if (excluirTitulo.some((pal) => titulo.includes(pal))) return false;
      if (!n.description || n.description.length < minDescripcion) return false;
      if (excluirDescripcion.length && n.description) {
        const desc = n.description.toLowerCase();
        if (excluirDescripcion.some((pal) => desc.includes(pal))) return false;
      }
      if (n[campoFecha]) {
        const fecha = new Date(n[campoFecha]).getTime();
        if (isNaN(fecha) || ahora - fecha > maxDias * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  return deduplicarCombinado(filtrados, [], camposClave, campoFecha, maxItems, camposMezcla);
}
