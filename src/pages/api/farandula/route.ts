import { NextRequest, NextResponse } from "next/server";

const API_KEY = "pub_c0d1669584c7417b93361bfdc354b1c3";

// Lógica similar a noticias, pero para farándula/entretenimiento
async function fetchFarandula(): Promise<{noticias: any[], errorMsg?: string}> {
  const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&country=uy,ar&category=entertainment&timezone=America/Montevideo`;
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

export async function GET(req: NextRequest) {
  // Obtener noticias de la API externa
  const { noticias, errorMsg } = await fetchFarandula();

  // Filtrar noticias válidas (título y link)
  let noticiasValidas = Array.isArray(noticias)
    ? noticias.filter(
        (n: any) => n && n.title && n.link && n.title.length > 6
      )
    : [];
  // Eliminar duplicados por título
  const titulosVistos = new Set<string>();
  noticiasValidas = noticiasValidas.filter((n: any) => {
    if (titulosVistos.has(n.title)) return false;
    titulosVistos.add(n.title);
    return true;
  });
  // Priorizar las que tienen descripción
  noticiasValidas.sort((a: any, b: any) => (b.description ? 1 : 0) - (a.description ? 1 : 0));
  // Limitar a 8 noticias
  noticiasValidas = noticiasValidas.slice(0, 8);

  return NextResponse.json({
    noticias: noticiasValidas,
    errorMsg
  });
}
