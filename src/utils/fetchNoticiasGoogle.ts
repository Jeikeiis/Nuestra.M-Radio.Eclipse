const API_KEY = "pub_151f47e41b2f4d94946766a4c0ef7666"; // API key pública de NewsData.io

export async function fetchNoticiasNewsData(region: string) {
  const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&q=${encodeURIComponent(region)}&country=uy&language=es&category=top`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`No se pudo obtener noticias de NewsData.io: ${msg}`);
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("La respuesta de la API de NewsData.io no contiene artículos.");
    }
    return data.results;
  } catch (e: any) {
    throw new Error("No se pudieron obtener noticias. Verifica tu conexión, la API key o el límite de uso. " + (e?.message || ""));
  }
}
