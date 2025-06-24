import { NextResponse } from "next/server";
import { createSectionApiHandler } from "@/utils/sectionCacheManager";
import { fetchNoticiasNewsData } from "@/utils/fetchNoticiasNewsData";

// Configuración para cada sección
const configs = [
	{
		seccion: "noticias",
		cacheDurationMs: parseInt(process.env.NOTICIAS_CACHE_DURATION_MS || "") || 10 * 60 * 1000,
		cooldownMs: parseInt(process.env.NOTICIAS_COOLDOWN_MS || "") || 61 * 60 * 1000,
		fetchNoticias: () => fetchNoticiasNewsData("noticias", { category: "top", size: 20 }),
		region: "noticias",
		maxRetries: 3,
		retryDelayMs: 2000,
	},
	{
		seccion: "musica",
		cacheDurationMs: parseInt(process.env.MUSICA_CACHE_DURATION_MS || "") || 4 * 60 * 60 * 1000,
		cooldownMs: parseInt(process.env.MUSICA_COOLDOWN_MS || "") || 61 * 60 * 1000,
		fetchNoticias: () => fetchNoticiasNewsData("música", { category: "entertainment", size: 15 }),
		region: "música",
		maxRetries: 3,
		retryDelayMs: 2000,
	},
	{
		seccion: "farandula",
		cacheDurationMs: parseInt(process.env.FARANDULA_CACHE_DURATION_MS || "") || 4 * 60 * 60 * 1000,
		cooldownMs: parseInt(process.env.FARANDULA_COOLDOWN_MS || "") || 61 * 60 * 1000,
		fetchNoticias: () => fetchNoticiasNewsData("entretenimiento", { category: "entertainment", size: 15 }),
		region: "entretenimiento",
		maxRetries: 3,
		retryDelayMs: 2000,
	},
];

// Instancia los handlers para cada sección
const handlers = configs.map((cfg) => createSectionApiHandler(cfg));

// Ejecuta la actualización de las tres secciones en paralelo (forzando update)
export async function GET() {
	// Llama a los endpoints internos de tu app para forzar actualización
	const endpoints = ["/api/noticias?force=1", "/api/musica?force=1", "/api/farandula?force=1"];
	const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

	const results = await Promise.all(
		endpoints.map(async (path) => {
			try {
				const res = await fetch(baseUrl + path);
				const json = await res.json();
				return { path, ok: res.ok, ...json };
			} catch (e) {
				return { path, ok: false, error: (e as Error).message };
			}
		})
	);

	return NextResponse.json({ ok: true, results });
}
