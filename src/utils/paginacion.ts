// utils/paginacion.ts
/**
 * Pagina un array de datos de forma consistente y controlada.
 *
 * @template T Tipo de los elementos a paginar.
 * @param {T[]} items Array de elementos a paginar.
 * @param {number} page Número de página (1-indexed).
 * @param {number} pageSize Cantidad de elementos por página.
 * @param {number} maxPages Máximo de páginas permitidas.
 * @returns {{ itemsPaginados: T[], totalItems: number, realMaxPages: number }}
 *
 * Integración: Usado por endpoints y helpers para paginación profesional tras deduplicado.
 */
export function paginar<T>(items: T[], page: number, pageSize: number, maxPages: number) {
  const totalItems = Math.min(items.length, maxPages * pageSize);
  const realMaxPages = Math.max(1, Math.min(maxPages, Math.ceil(totalItems / pageSize)));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalItems);
  return {
    itemsPaginados: items.slice(start, end),
    totalItems,
    realMaxPages,
  };
}
