import fs from "fs";
import path from "path";
import { Dato } from "./deduplicar";

export function getCacheFilePath(seccion: string) {
  return path.resolve(process.cwd(), `${seccion}-cache.json`);
}

export function loadCache(seccion: string): { noticias: Dato[]; timestamp: number } | null {
  const file = getCacheFilePath(seccion);
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    if (Array.isArray(data.noticias)) return { noticias: data.noticias, timestamp: data.timestamp || 0 };
  } catch {}
  return null;
}

export function saveCache(seccion: string, noticias: Dato[]) {
  const file = getCacheFilePath(seccion);
  fs.writeFileSync(file, JSON.stringify({ noticias, timestamp: Date.now() }, null, 2), "utf-8");
}
