import { useCallback } from "react";

export function useLocalCache<T = any>(cacheKey: string) {
  const guardarCache = useCallback((data: T) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {}
  }, [cacheKey]);

  const cargarCache = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [cacheKey]);

  return { guardarCache, cargarCache };
}
