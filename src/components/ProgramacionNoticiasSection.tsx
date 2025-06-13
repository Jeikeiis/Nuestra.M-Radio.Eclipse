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

export default function ProgramacionNoticiasSection() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar noticias desde el backend cacheado
  const cargarNoticias = () => {
    setLoading(true);
    setError(null);
    fetch("/api/noticias")
      .then(res => res.json())
      .then(data => {
        setNoticias(data.noticias.slice(0, 3));
        setLoading(false);
        if (data.errorMsg) {
          setError(data.errorMsg);
        } else if (!data.noticias.length) {
          setError("No se encontraron noticias para Montevideo.");
        }
      })
      .catch((e) => {
        setError(e.message || "No se pudieron obtener noticias.");
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    cargarNoticias();
    // Refresca cada 3 minutos (180000 ms)
    const interval = setInterval(() => {
      if (isMounted) cargarNoticias();
    }, 180000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return <div className="programacion-noticias-section" aria-busy="true">Cargando noticias...</div>;
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
