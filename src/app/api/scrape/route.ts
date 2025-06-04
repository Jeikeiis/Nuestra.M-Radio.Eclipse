import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Cambia esta URL por la página estatal de la comuna canaria de Uruguay
const EXTERNAL_URL = "https://www.canaria.gub.uy/agenda";

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(EXTERNAL_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; scraping-bot/1.0)",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo obtener la página externa" },
        { status: 500 }
      );
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const eventos: string[] = [];
    $(".views-row .views-field-title a").each(function () {
      eventos.push($(this).text().trim());
    });

    return NextResponse.json({ eventos });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error desconocido" },
      { status: 500 }
    );
  }
}
