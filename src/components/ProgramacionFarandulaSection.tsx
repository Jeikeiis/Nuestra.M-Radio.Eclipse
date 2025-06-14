import React, { useEffect, useState } from "react";

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

  // Función para cargar noticias de farándula desde la nueva API
  const cargarNoticias = () => {
    setLoading(true);
    setError(null);
    fetch("/api/farandula")
      .then(res => res.json())
      .then(data => {
        let noticiasValidas = Array.isArray(data.noticias)
          ? data.noticias.filter(
              (n: Noticia) => n && n.title && n.link && n.title.length > 6
            )
          : [];
        const titulosVistos = new Set<string>();
        noticiasValidas = noticiasValidas.filter((n: Noticia) => {
          if (titulosVistos.has(n.title)) return false;
          titulosVistos.add(n.title);
          return true;
        });
        noticiasValidas.sort((a: Noticia, b: Noticia) => (b.description ? 1 : 0) - (a.description ? 1 : 0));
        setNoticias(noticiasValidas.slice(0, 4));
        setLoading(false);
        if (data.errorMsg) {
          setError(data.errorMsg);
        } else if (!noticiasValidas.length) {
          setError("No se encontraron noticias de farándula relevantes.");
        }
      })
      .catch((e) => {
        setError(e.message || "No se pudieron obtener noticias de farándula.");
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    cargarNoticias();
    const interval = setInterval(() => {
      if (isMounted) cargarNoticias();
    }, 180000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
            <span className="noticia-titulo-text">{noticia.title}</span>
          </a>
          <div className="noticia-meta">
            {noticia.source_id && (
              <span className="noticia-fuente" title="Fuente">
                <svg width="14" height="14" viewBox="0 0 20 20" style={{marginRight:4,verticalAlign:'middle'}}><circle cx="10" cy="10" r="8" fill="#b71c1c"/><text x="10" y="15" textAnchor="middle" fontSize="10" fill="#fff">F</text></svg>
                {noticia.source_id}
              </span>
            )}
            {noticia.pubDate && (
              <span className="noticia-fecha" title="Fecha de publicación">
                <svg width="14" height="14" viewBox="0 0 20 20" style={{marginRight:4,verticalAlign:'middle'}}><rect x="2" y="4" width="16" height="14" rx="3" fill="#888"/><rect x="5" y="8" width="10" height="2" fill="#fff"/></svg>
                {formatearFecha(noticia.pubDate)}
              </span>
            )}
          </div>
          {noticia.description && (
            <div className="noticia-description">
              {noticia.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
