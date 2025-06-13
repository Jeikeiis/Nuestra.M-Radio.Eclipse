import React, { useEffect, useState } from "react";

const API_KEY = "pub_c0d1669584c7417b93361bfdc354b1c3";

async function fetchNoticiasFarandula() {
  const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=Farándula&country=uy&language=es&category=top`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`No se pudo obtener noticias de NewsData.io: ${msg}`);
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("La respuesta de la API de NewsData.io no contiene artículos.");
    }
    return data.results;
  } catch (e: any) {
    throw new Error("No se pudieron obtener noticias de farándula. " + (e?.message || ""));
  }
}

type Noticia = {
  title: string;
  link: string;
  source_id?: string;
  pubDate?: string;
  description?: string;
};

function formatearFecha(fecha?: string) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProgramacionFarandulaSection() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchNoticiasFarandula()
      .then((noticiasFarandula) => {
        setNoticias(noticiasFarandula.slice(0, 3));
        setLoading(false);
        if (!noticiasFarandula.length) {
          setError("No se encontraron noticias de farándula.");
        }
      })
      .catch((e) => {
        setError(e.message || "No se pudieron obtener noticias.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="programacion-noticias-section" aria-busy="true">Cargando farándula...</div>;
  }

  if (error) {
    return (
      <div className="programacion-noticias-section" style={{ color: "#b71c1c", fontWeight: 500 }} role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="programacion-noticias-section">
      {noticias.map((noticia, idx) => (
        <div className="noticia-contenedor" key={idx}>
          <a
            href={noticia.link}
            target="_blank"
            rel="noopener noreferrer"
            className="noticia-titulo"
            aria-label={noticia.title}
            tabIndex={0}
            onClick={e => {
              if (!noticia.link) {
                e.preventDefault();
                alert("Enlace no disponible");
              }
            }}
          >
            {noticia.title}
          </a>
          <div className="noticia-resumen">
            {noticia.source_id && (
              <span style={{ fontStyle: "italic", fontSize: "0.93rem", marginRight: "0.5rem" }}>
                {noticia.source_id}
              </span>
            )}
            {noticia.pubDate && (
              <span style={{ color: "#888", fontSize: "0.93rem", marginRight: "0.5rem" }}>
                {formatearFecha(noticia.pubDate)}
              </span>
            )}
          </div>
          {noticia.description && (
            <div style={{ color: "#444", fontSize: "0.97rem", marginTop: "0.2rem" }}>
              {noticia.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
