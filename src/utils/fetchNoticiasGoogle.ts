const API_KEY = process.env.API_KEY || ""; // Unifica el nombre de la variable

export async function fetchNoticiasNewsData(region: string) {
  const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=${encodeURIComponent(region)}&country=uy&language=es&category=top`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`No se pudo obtener noticias de NewsData.io: ${msg}`);
    }
    const text = await res.text();
    if (!text) {
      throw new Error("La respuesta de la API está vacía.");
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error("La respuesta de la API no es un JSON válido.");
    }
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("La respuesta de la API de NewsData.io no contiene artículos.");
    }
    return data.results;
  } catch (e: any) {
    throw new Error("No se pudieron obtener noticias. Verifica tu conexión, la API key o el límite de uso. " + (e?.message || ""));
  }
}
    throw new Error("No se pudieron obtener noticias. Verifica tu conexión, la API key o el límite de uso. " + (e?.message || ""));
  }
}
