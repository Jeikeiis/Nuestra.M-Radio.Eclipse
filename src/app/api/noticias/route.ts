import { createSectionApiHandler } from "@/utils/sectionCacheManager";
import { fetchNoticiasNewsData } from "@/utils/fetchNoticiasNewsData";

const CACHE_DURATION_MS = parseInt(process.env.CACHE_DURATION_MS || '') || 10 * 60 * 1000;
const COOLDOWN_MS = parseInt(process.env.COOLDOWN_MS || '') || 61 * 60 * 1000;

const { GET } = createSectionApiHandler({
  seccion: "noticias",
  cacheDurationMs: CACHE_DURATION_MS,
  cooldownMs: COOLDOWN_MS,
  fetchNoticias: () => fetchNoticiasNewsData("noticias"),
});

export { GET };
