import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const API_KEY = process.env.API_KEY as string;
const CACHE_FILE = path.resolve(process.cwd(), "musica-cache.json");
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas

type Noticia = {
  title: string;
  link: string;
  source_id?: string;
  pubDate?: string;
  description?: string;
};

type NoticiasCache = {
  noticias: Noticia[];
  timestamp: number;
  errorMsg?: string;
  lastValidNoticias?: Noticia[];
};

// --- Estado de caché en memoria ---
let cache: NoticiasCache = {
  noticias: [],
  timestamp: 0,
  errorMsg: undefined,
  lastValidNoticias: [],
};

// --- Cargar cache desde archivo al iniciar ---
function cargarCacheDesdeArchivo() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      const json = JSON.parse(data);
      if (Array.isArray(json.noticias)) {
        // Limitar a 20 artículos únicos
        const noticiasUnicas = deduplicarNoticias(json.noticias).slice(0, 20);
        cache.noticias = noticiasUnicas;
        cache.timestamp = json.timestamp || Date.now();
        cache.lastValidNoticias = noticiasUnicas;
      }
    }
  } catch {}
}

// --- Guardar cache a archivo ---
function guardarCacheEnArchivo(noticias: Noticia[]) {
  try {
    // Limitar a 20 artículos únicos
    const noticiasUnicas = deduplicarNoticias(noticias).slice(0, 20);
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ noticias: noticiasUnicas, timestamp: Date.now() }, null, 2),
      "utf-8"
    );
  } catch {}
}

// --- Deduplicar noticias por título y link ---
function deduplicarNoticias(noticias: Noticia[]): Noticia[] {
  const vistos = new Set<string>();
  return noticias.filter(n => {
    const key = normalizeText(n.title) + '|' + normalizeText(n.link);
    if (vistos.has(key)) return false;
    vistos.add(key);
    return true;
  });
}

// Cargar cache al iniciar
cargarCacheDesdeArchivo();

function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  // @ts-ignore
  return req.ip || "127.0.0.1";
}

async function registrarRecargaForzada(ip: string, tema: string) {
  // No se implementa almacenamiento en este caso
}

async function fetchNoticiasMusica(tema: string): Promise<{ noticias: Noticia[]; errorMsg?: string }> {
  // Permitir cambiar el tema dinámicamente
  const queryTema = tema || "Musica";
  const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=${encodeURIComponent(queryTema)}&language=es`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const msg = await res.text();
      if (msg.includes("rate limit") || msg.includes("limit exceeded")) {
        return { noticias: [], errorMsg: "Límite de peticiones de la API alcanzado. Intenta más tarde." };
      }
      return { noticias: [], errorMsg: `Error ${res.status}: ${msg}` };
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return { noticias: [], errorMsg: "La respuesta de la API de NewsData.io no contiene artículos." };
    }
    return { noticias: data.results };
  } catch (e: any) {
    return { noticias: [], errorMsg: `Error de red o API: ${e?.message || e}` };
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/gi, '')
    .trim();
}

function areSimilar(a: string, b: string): boolean {
  if (!a || !b) return false;
  a = normalizeText(a);
  b = normalizeText(b);
  if (a === b) return true;
  const aWords = new Set(a.split(' '));
  const bWords = new Set(b.split(' '));
  const intersection = [...aWords].filter(x => bWords.has(x));
  return intersection.length >= Math.min(aWords.size, bWords.size) * 0.7;
}

function filtrarYLimpiarNoticias(noticias: Noticia[]): Noticia[] {
  const vistos = new Set<string>();
  const recientes: Noticia[] = [];
  const ahora = Date.now();
  return noticias
    .filter(n => n && n.title && n.link && n.title.length > 15)
    .filter(n => {
      const titulo = n.title.toLowerCase();
      if (titulo.includes('resumen') || titulo.includes('video:') || titulo.match(/^noticias(\s|:|$)/i)) return false;
      if (!n.description || n.description.length < 40) return false;
      if (n.pubDate) {
        const fecha = new Date(n.pubDate).getTime();
        if (isNaN(fecha) || ahora - fecha > 7 * 24 * 60 * 60 * 1000) return false;
      }
      const key = normalizeText(n.title) + '|' + normalizeText(n.link);
      if (vistos.has(key)) return false;
      for (const prev of recientes) {
        if (areSimilar(n.title, prev.title) || areSimilar(n.description || '', prev.description || '')) return false;
      }
      vistos.add(key);
      recientes.push(n);
      return true;
    })
    .sort((a, b) => (b.description ? 1 : 0) - (a.description ? 1 : 0))
    .slice(0, 30);
}

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();
    const { searchParams } = new URL(req.url);
    const tema = searchParams.get("tema") || "Musica";
    let page = parseInt(searchParams.get("page") || "1", 10);
    if (isNaN(page) || page < 1) page = 1;
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "4", 10), 1), 4); // Fijo en 4
    const MAX_PAGES = 5;
    function paginarNoticias(noticias: Noticia[]) {
      const totalNoticias = Math.min(noticias.length, MAX_PAGES * pageSize);
      const realMaxPages = Math.max(1, Math.min(MAX_PAGES, Math.ceil(totalNoticias / pageSize)));
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, totalNoticias);
      return {
        noticiasPaginadas: noticias.slice(start, end),
        totalNoticias,
        realMaxPages,
      };
    }

    let errorMsg: string | null = null;
    let fromCache = true;
    let huboCambio = false;
    let noticiasParaResponder: Noticia[] = [];

    const cacheExpirado = !cache.timestamp || (now - cache.timestamp > CACHE_DURATION_MS);

    if (cacheExpirado) {
      const { noticias: noticiasApi, errorMsg: apiError } = await fetchNoticiasMusica(tema);
      const noticiasValidas = deduplicarNoticias(filtrarYLimpiarNoticias(noticiasApi)).slice(0, 20);
      if (noticiasValidas.length > 0) {
        cache = {
          noticias: noticiasValidas,
          timestamp: now,
          errorMsg: undefined,
          lastValidNoticias: noticiasValidas,
        };
        guardarCacheEnArchivo(noticiasValidas);
        noticiasParaResponder = noticiasValidas;
        fromCache = false;
        huboCambio = true;
      } else {
        errorMsg = apiError || "No se encontraron noticias de música válidas.";
        noticiasParaResponder = cache.lastValidNoticias || [];
        fromCache = true;
      }
    } else {
      noticiasParaResponder = cache.noticias;
      fromCache = true;
      // --- Actualización en segundo plano, NO afecta la respuesta actual ---
      (async () => {
        try {
          const { noticias: noticiasApi } = await fetchNoticiasMusica(tema);
          const noticiasValidas = deduplicarNoticias(filtrarYLimpiarNoticias(noticiasApi)).slice(0, 20);
          const titulosCache = new Set(cache.noticias.map(n => n.title));
          if (
            noticiasValidas.length > 0 &&
            (noticiasValidas.length !== cache.noticias.length ||
              noticiasValidas.some(n => !titulosCache.has(n.title)))
          ) {
            cache = {
              noticias: noticiasValidas,
              timestamp: Date.now(),
              errorMsg: undefined,
              lastValidNoticias: noticiasValidas,
            };
            guardarCacheEnArchivo(noticiasValidas);
          }
        } catch {}
      })();
    }

    // No mostrar páginas vacías
    const { noticiasPaginadas, totalNoticias, realMaxPages } = paginarNoticias(noticiasParaResponder);
    const hayNoticias = noticiasPaginadas.length > 0;

    return NextResponse.json({
      noticias: noticiasPaginadas,
      cached: fromCache,
      huboCambio,
      errorMsg: hayNoticias ? errorMsg : "No hay noticias disponibles.",
      fallback: fromCache,
      apiStatus: fromCache ? 'cache-fijo' : 'api-directa',
      meta: {
        tema,
        page,
        pageSize,
        total: totalNoticias,
        maxPages: realMaxPages,
        updatedAt: new Date(cache.timestamp || now).toISOString(),
        fromCache,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      noticias: [],
      cached: false,
      errorMsg: err?.message || "Error inesperado en el servidor.",
      fallback: false,
      meta: {
        updatedAt: new Date().toISOString(),
        fromCache: false,
      },
    }, { status: 500 });
  }
}

export async function GET_CACHE_COUNT(req: NextRequest) {
  const titulosNuevo = new Set(cache.noticias.map((n: Noticia) => n.title));
  const titulosViejo = new Set((cache.lastValidNoticias || []).map((n: Noticia) => n.title));
  return NextResponse.json({
    cacheNuevo: titulosNuevo.size,
    cacheViejo: titulosViejo.size
  });
}

console.log('API_KEY en Vercel:', process.env.API_KEY);
