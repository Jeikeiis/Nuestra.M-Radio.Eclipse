import { NextRequest, NextResponse } from "next/server";

const API_KEY = "pub_c0d1669584c7417b93361bfdc354b1c3";
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos en ms

let cache: {
  noticias: Noticia[];
  timestamp: number;
  errorMsg?: string;
} = {
  noticias: [],
  timestamp: 0,
  errorMsg: undefined,
};

type Noticia = {
  title: string;
  link: string;
  source_id?: string;
  pubDate?: string;
  description?: string;
};

async function fetchNoticiasFarandula(): Promise<{ noticias: Noticia[]; errorMsg?: string }> {
  const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=farandula&country=uy&language=es&category=top`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const msg = await res.text();
      if (msg.includes("rate limit") || msg.includes("limit exceeded")) {
        return { noticias: [], errorMsg: "Límite de peticiones de la API alcanzado. Intenta más tarde." };
      }
      return { noticias: [], errorMsg: "No se pudo obtener noticias de NewsData.io." };
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return { noticias: [], errorMsg: "La respuesta de la API de NewsData.io no contiene artículos." };
    }
    return { noticias: data.results, errorMsg: undefined };
  } catch (e: any) {
    return { noticias: [], errorMsg: "No se pudieron obtener noticias. Verifica tu conexión o la API key." };
  }
}

export async function GET(_req: NextRequest) {
  const now = Date.now();
  if (cache.noticias.length > 0 && now - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      noticias: cache.noticias,
      cached: true,
      errorMsg: cache.errorMsg,
    });
  }

  const { noticias, errorMsg } = await fetchNoticiasFarandula();

  // Filtrar noticias válidas (título y link)
  let noticiasValidas = Array.isArray(noticias)
    ? noticias.filter(
        (n: Noticia) => n && n.title && n.link && n.title.length > 6
      )
    : [];
  // Eliminar duplicados por título
  const titulosVistos = new Set<string>();
  noticiasValidas = noticiasValidas.filter((n: Noticia) => {
    if (titulosVistos.has(n.title)) return false;
    titulosVistos.add(n.title);
    return true;
  });
  // Priorizar las que tienen descripción
  noticiasValidas.sort((a: Noticia, b: Noticia) => (b.description ? 1 : 0) - (a.description ? 1 : 0));
  // Limitar a 8 noticias
  noticiasValidas = noticiasValidas.slice(0, 8);

  cache = { noticias: noticiasValidas, timestamp: now, errorMsg };

  return NextResponse.json({
    noticias: noticiasValidas,
    cached: false,
    errorMsg,
  });
}
