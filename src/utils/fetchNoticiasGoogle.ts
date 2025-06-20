/**
 * Obtiene noticias desde NewsData.io para una región específica.
 *
 * @param {string} region Región o término de búsqueda.
 * @returns {Promise<any[]>} Array de noticias obtenidas.
 * @throws {Error} Si la API responde con error, formato inesperado o problemas de red.
 *
 * Dependencias: requiere variable de entorno USER_API_KEY.
 *
 * Ejemplo:
 *   const noticias = await fetchNoticiasNewsData('montevideo');
 */
const USER_API_KEY = process.env.USER_API_KEY || ""; // Variable de entorno obligatoria

export async function fetchNoticiasNewsData(region: string) {
  const url = `https://newsdata.io/api/1/latest?apikey=${USER_API_KEY}&q=${encodeURIComponent(region)}&country=uy&language=es&category=top`;
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
