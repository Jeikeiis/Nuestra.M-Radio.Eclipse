import { createSectionApiHandler } from "@/utils/sectionCacheManager";
import { fetchNoticiasNewsData } from "@/utils/fetchNoticiasNewsData";

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas
const COOLDOWN_MS = 61 * 60 * 1000;

const { GET } = createSectionApiHandler({
  seccion: "musica",
  cacheDurationMs: CACHE_DURATION_MS,
  cooldownMs: COOLDOWN_MS,
  fetchNoticias: () => fetchNoticiasNewsData("musica"),
});

export { GET };
