/**
 * Hook React para gestionar caché local en el navegador de forma tipada y segura.
 * Permite guardar y cargar datos en localStorage bajo una clave específica.
 *
 * @template T Tipo de dato a almacenar.
 * @param {string} cacheKey Clave única para el caché en localStorage.
 * @returns {{ guardarCache: (data: T) => void, cargarCache: () => T | null }}
 *
 * Dependencias: React (useCallback). Solo debe usarse en componentes cliente.
 *
 * Ejemplo:
 * const { guardarCache, cargarCache } = useLocalCache<MyType>('mi-clave');
 */
import { useCallback } from "react";

export function useLocalCache<T = any>(cacheKey: string) {
  const guardarCache = useCallback((data: T) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
      // Puede fallar si el almacenamiento está lleno o deshabilitado
      if (process.env.NODE_ENV === 'development') {
        console.warn('No se pudo guardar en localStorage:', e);
      }
    }
  }, [cacheKey]);

  const cargarCache = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('No se pudo cargar desde localStorage:', e);
      }
      return null;
    }
  }, [cacheKey]);

  return { guardarCache, cargarCache };
}
