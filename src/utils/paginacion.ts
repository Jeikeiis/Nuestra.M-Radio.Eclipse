// utils/paginacion.ts
/**
 * Pagina un array de datos de forma consistente y controlada, completando con fallback si es necesario.
 *
 * @template T Tipo de los elementos a paginar.
 * @param {T[]} items Array de elementos a paginar (nuevos).
 * @param {number} page Número de página (1-indexed).
 * @param {number} pageSize Cantidad de elementos por página.
 * @param {number} maxPages Máximo de páginas permitidas.
 * @param {T[]} [fallbackItems] Array opcional de elementos de respaldo (cache persistente).
 * @returns {{ itemsPaginados: T[], totalItems: number, realMaxPages: number }}
 */
export function paginar<T>(items: T[], page: number, pageSize: number, maxPages: number, fallbackItems?: T[]) {
  let todos: T[] = items;
  if (fallbackItems && fallbackItems.length) {
    // Evitar duplicados por clave (title o link)
    const titulos = new Set((items as any[]).map(n => n.title || n.link));
    const faltantes = fallbackItems.filter((n: any) => !titulos.has(n.title || n.link));
    todos = [...items, ...faltantes];
  }
  const maxNoticias = maxPages * pageSize;
  const limitados = todos.slice(0, maxNoticias);
  const totalItems = limitados.length;
  const realMaxPages = Math.max(1, Math.ceil(totalItems / pageSize));
  // Si la página pedida es mayor a las disponibles, devolver la última página válida
  const safePage = Math.min(page, realMaxPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalItems);
  return {
    itemsPaginados: limitados.slice(start, end),
    totalItems,
    realMaxPages,
  };
}
