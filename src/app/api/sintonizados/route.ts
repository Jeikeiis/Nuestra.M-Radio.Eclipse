import { NextRequest, NextResponse } from "next/server";
import { visitasPorIp } from "../noticias/visitasStore";

// Devuelve la cantidad de IPs únicas activas en los últimos 15 minutos
export async function GET(req: NextRequest) {
  const now = Date.now();
  const CACHE_DURATION = 15 * 60 * 1000;
  let total = 0;
  for (const ip in visitasPorIp) {
    if (now - visitasPorIp[ip] < CACHE_DURATION) total++;
  }
  return NextResponse.json({ total });
}
