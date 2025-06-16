import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// --- Tipos ---
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

const API_KEY = "pub_8484afa6b57a48fdbbebf04b313ba4f9";
const CACHE_FILE = path.resolve(process.cwd(), "noticias-cache.json");
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas

// --- Estado de caché en memoria ---
let cache: NoticiasCache = {
  noticias: [],
  timestamp: 0,
  errorMsg: undefined,
  lastValidNoticias: [],
};
let cacheFijo: Noticia[] = [];

// --- Cargar cache desde archivo al iniciar ---
function cargarCacheDesdeArchivo() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      const json = JSON.parse(data);
      if (Array.isArray(json.noticias)) {
        cacheFijo = json.noticias;
        cache.noticias = json.noticias;
        cache.timestamp = json.timestamp || Date.now();
        cache.lastValidNoticias = json.noticias;
      }
    }
  } catch {}
}

// --- Guardar cache a archivo ---
function guardarCacheEnArchivo(noticias: Noticia[]) {
  try {
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ noticias, timestamp: Date.now() }, null, 2),
      "utf-8"
    );
  } catch {}
}

// Cargar cache al iniciar
cargarCacheDesdeArchivo();

// --- Utilidades ---
function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  // @ts-ignore
  return req.ip || "127.0.0.1";
}

async function fetchNoticias(region: string): Promise<{ noticias: Noticia[]; errorMsg?: string }> {
  // Usar filtro local: país Uruguay y búsqueda por Uruguay
  const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=Uruguay&country=uy`;
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
  // Si la diferencia de longitud es muy pequeña y comparten muchas palabras
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
      // Excluir títulos genéricos o poco informativos
      const titulo = n.title.toLowerCase();
      if (titulo.includes('resumen') || titulo.includes('video:') || titulo.match(/^noticias(\s|:|$)/i)) return false;
      if (!n.description || n.description.length < 40) return false;
      // Excluir noticias sin fecha o con fecha muy antigua (más de 7 días)
      if (n.pubDate) {
        const fecha = new Date(n.pubDate).getTime();
        if (isNaN(fecha) || ahora - fecha > 7 * 24 * 60 * 60 * 1000) return false;
      }
      // Detección de duplicados por título y enlace normalizados
      const key = normalizeText(n.title) + '|' + normalizeText(n.link);
      if (vistos.has(key)) return false;
      // Detección de similitud con noticias ya aceptadas
      for (const prev of recientes) {
        if (areSimilar(n.title, prev.title) || areSimilar(n.description || '', prev.description || '')) return false;
      }
      vistos.add(key);
      recientes.push(n);
      return true;
    })
    .sort((a, b) => (b.description ? 1 : 0) - (a.description ? 1 : 0))
    .slice(0, 30); // máximo 30 para paginación local
}

// --- Registro de recargas forzadas ---
async function registrarRecargaForzada(ip: string, region: string) {
  // No se implementa almacenamiento en este caso
}

// --- Handler principal ---
export async function GET(req: NextRequest) {
  try {
    const now = Date.now();
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") || "Uruguay";
    let page = parseInt(searchParams.get("page") || "1", 10);
    if (isNaN(page) || page < 1) page = 1;
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "8", 10), 1), 30);
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
      const { noticias, errorMsg: apiError } = await fetchNoticias(region);
      const noticiasValidas = filtrarYLimpiarNoticias(noticias);
      if (noticiasValidas.length > 0) {
        cache = {
          noticias: noticiasValidas,
          timestamp: now,
          errorMsg: undefined,
          lastValidNoticias: noticiasValidas,
        };
        cacheFijo = noticiasValidas;
        guardarCacheEnArchivo(noticiasValidas);
        noticiasParaResponder = noticiasValidas;
        fromCache = false;
        huboCambio = true;
      } else {
        errorMsg = apiError || "No se encontraron noticias válidas.";
        noticiasParaResponder = cacheFijo.length > 0 ? cacheFijo : [];
        fromCache = true;
      }
    } else {
      noticiasParaResponder = cacheFijo;
      fromCache = true;
    }

    const { noticiasPaginadas, totalNoticias, realMaxPages } = paginarNoticias(noticiasParaResponder);

    return NextResponse.json({
      noticias: noticiasPaginadas,
      cached: fromCache,
      huboCambio,
      errorMsg,
      fallback: fromCache,
      apiStatus: fromCache ? 'cache-fijo' : 'api-directa',
      meta: {
        region,
        page,
        pageSize,
        total: totalNoticias,
        maxPages: realMaxPages,
        updatedAt: new Date(cache.timestamp || now).toISOString(),
        fromCache,
      },
    });
  } catch (err: any) {
    // Manejo global de errores: siempre devolver JSON
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

// Endpoint para contar artículos en cache nuevo y viejo
export async function GET_CACHE_COUNT(req: NextRequest) {
  const titulosNuevo = new Set(cache.noticias.map(n => n.title));
  const titulosViejo = new Set(cacheFijo.map(n => n.title));
  return NextResponse.json({
    cacheNuevo: titulosNuevo.size,
    cacheViejo: titulosViejo.size
  });
}

