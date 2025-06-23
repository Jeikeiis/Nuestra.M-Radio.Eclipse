// sectionDeduplicar.ts
// Lógica de deduplicación y helpers puros, sin dependencias de Node.js

export interface Dato {
  [key: string]: any;
}

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

function areSimilar(a: string, b: string): boolean {
  if (!a || !b) return false;
  const na = normalizeText(a);
  const nb = normalizeText(b);
  return na === nb;
}

export function deduplicarCombinado(
  nuevos: Dato[],
  viejos: Dato[],
  camposClave: string[] = ['title','link'],
  campoFecha: string = 'pubDate',
  maxItems: number = 20,
  camposMezcla: string[] = []
): Dato[] {
  const todas = [...nuevos, ...viejos].sort((a, b) => {
    const da = a[campoFecha] ? new Date(a[campoFecha]).getTime() : 0;
    const db = b[campoFecha] ? new Date(b[campoFecha]).getTime() : 0;
    return db - da;
  });
  const resultado: Dato[] = [];
  const vistos = new Set<string>();
  for (const n of todas) {
    const key = camposClave.map(c => normalizeText(n[c] || '')).join('|');
    if (vistos.has(key)) continue;
    const idx = resultado.findIndex(prev =>
      camposClave.every(c => areSimilar(n[c], prev[c]))
    );
    if (idx !== -1) {
      // Mezclar campos opcionales si se pide
      if (camposMezcla.length) {
        for (const campo of camposMezcla) {
          if (!resultado[idx][campo] && n[campo]) {
            resultado[idx][campo] = n[campo];
          }
        }
      }
    } else {
      resultado.push({ ...n });
      vistos.add(key);
    }
    if (resultado.length >= maxItems) break;
  }
  return resultado;
}

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
  opciones = opciones || {};
  let arr = Array.isArray(datos) ? [...datos] : [];
  if (opciones.minTitulo) {
    arr = arr.filter(n => n.title && n.title.length >= opciones!.minTitulo!);
  }
  if (opciones.minDescripcion) {
    arr = arr.filter(n => n.description && n.description.length >= opciones!.minDescripcion!);
  }
  if (opciones.maxDias && opciones.campoFecha) {
    const ahora = Date.now();
    arr = arr.filter(n => {
      const fecha = n[opciones!.campoFecha!];
      if (!fecha) return false;
      const t = new Date(fecha).getTime();
      return !isNaN(t) && ahora - t < opciones!.maxDias! * 86400000;
    });
  }
  if (opciones.excluirTitulo && opciones.excluirTitulo.length) {
    arr = arr.filter(n => !opciones!.excluirTitulo!.some(ex => n.title && n.title.includes(ex)));
  }
  if (opciones.excluirDescripcion && opciones.excluirDescripcion.length) {
    arr = arr.filter(n => !opciones!.excluirDescripcion!.some(ex => n.description && n.description.includes(ex)));
  }
  // Deduplicar y limitar
  arr = deduplicarCombinado(
    arr,
    [],
    opciones.camposClave,
    opciones.campoFecha,
    opciones.maxItems,
    opciones.camposMezcla
  );
  return arr;
}
