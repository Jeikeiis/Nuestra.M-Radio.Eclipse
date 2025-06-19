import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { deduplicarCombinado, Dato, filtrarYLimpiarDatos } from "@/utils/deduplicar";

const API_KEY = process.env.API_KEY || '';
const CACHE_FILE = path.resolve(process.cwd(), "farandula-cache.json");
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas

// --- Estado de caché en memoria ---
let cache: {
  noticias: Dato[];
  timestamp: number;
  errorMsg?: string;
  lastValidNoticias?: Dato[];
} = {
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
        const noticiasUnicas = filtrarYLimpiarDatos(json.noticias, {
          camposClave: ["title","link"],
          campoFecha: "pubDate",
          maxItems: 20,
          camposMezcla: ["description","image_url","source_id","link"]
        });
        cache.noticias = noticiasUnicas;
        cache.timestamp = json.timestamp || Date.now();
        cache.lastValidNoticias = noticiasUnicas;
      }
    }
  } catch {}
}

// --- Guardar cache a archivo ---
function guardarCacheEnArchivo(noticias: Dato[], pageSize: number = 4, maxPages: number = 5) {
  try {
    const noticiasUnicas = filtrarYLimpiarDatos(noticias, {
      camposClave: ["title","link"],
      campoFecha: "pubDate",
      maxItems: maxPages * pageSize,
      camposMezcla: ["description","image_url","source_id","link"]
    });
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ noticias: noticiasUnicas, timestamp: Date.now() }, null, 2),
      "utf-8"
    );
  } catch {}
}

function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  // @ts-ignore
  return req.ip || "127.0.0.1";
}

async function registrarRecargaForzada(ip: string, region: string) {
  // No se implementa almacenamiento en este caso
}

async function fetchNoticiasFarandula(): Promise<{ noticias: Dato[]; errorMsg?: string }> {
  if (!API_KEY) {
    return { noticias: [], errorMsg: 'API key de NewsData.io no configurada en el entorno (API_KEY).' };
  }
  const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=Entretenimiento&country=ar,uy`;
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

cargarCacheDesdeArchivo();

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") || "Entretenimiento";
    let page = parseInt(searchParams.get("page") || "1", 10);
    if (isNaN(page) || page < 1) page = 1;
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "4", 10), 1), 4);
    const MAX_PAGES = 5;
    function paginarNoticias(noticias: Dato[]) {
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
    let noticiasParaResponder: Dato[] = [];

    const cacheExpirado = !cache.timestamp || (now - cache.timestamp > CACHE_DURATION_MS);

    if (cacheExpirado) {
      const { noticias: noticiasApi, errorMsg: apiError } = await fetchNoticiasFarandula();
      const noticiasFiltradas = (Array.isArray(noticiasApi) ? noticiasApi : []).filter(
        (n: Dato) => n && n.title && n.link && typeof n.title === 'string' && n.title.length > 6
      );
      const noticiasValidas = deduplicarCombinado(
        noticiasFiltradas,
        [],
        ["title","link"],
        "pubDate",
        MAX_PAGES * pageSize,
        ["description","image_url","source_id","link"]
      );
      if (noticiasValidas.length > 0) {
        cache = {
          noticias: noticiasValidas,
          timestamp: now,
          errorMsg: undefined,
          lastValidNoticias: noticiasValidas,
        };
        guardarCacheEnArchivo(noticiasValidas, pageSize, MAX_PAGES);
        noticiasParaResponder = noticiasValidas;
        fromCache = false;
        huboCambio = true;
      } else {
        errorMsg = apiError || "No se encontraron noticias de farándula válidas.";
        noticiasParaResponder = cache.lastValidNoticias || [];
        fromCache = true;
      }
    } else {
      noticiasParaResponder = cache.noticias;
      fromCache = true;
      (async () => {
        try {
          const { noticias: noticiasApi } = await fetchNoticiasFarandula();
          const noticiasFiltradas = (Array.isArray(noticiasApi) ? noticiasApi : []).filter(
            (n: Dato) => n && n.title && n.link && typeof n.title === 'string' && n.title.length > 6
          );
          const noticiasValidas = deduplicarCombinado(
            noticiasFiltradas,
            [],
            ["title","link"],
            "pubDate",
            MAX_PAGES * pageSize,
            ["description","image_url","source_id","link"]
          );
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
            guardarCacheEnArchivo(noticiasValidas, pageSize, MAX_PAGES);
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
      apiStatus: errorMsg && !hayNoticias ? 'api-error' : (fromCache ? 'cache-fijo' : 'api-directa'),
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
  const titulosNuevo = new Set(cache.noticias.map((n: Dato) => n.title));
  const titulosViejo = new Set((cache.lastValidNoticias || []).map((n: Dato) => n.title));
  return NextResponse.json({
    cacheNuevo: titulosNuevo.size,
    cacheViejo: titulosViejo.size
  });
}
