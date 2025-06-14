import React, { useEffect, useState, useRef } from "react";

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
  const [cached, setCached] = useState<boolean | null>(null);
  const [showUpdated, setShowUpdated] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const reloadTimeout = useRef<NodeJS.Timeout | null>(null);

  // Recarga profesional: feedback visual, aviso de noticias nuevas, botón solo para admins
  const cargarNoticias = (forzar = false) => {
    setLoading(!forzar);
    setIsReloading(forzar);
    setError(null);
    fetch(`/api/noticias${forzar ? '?force=1' : ''}`)
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
        setCached(data.cached);
        setLoading(false);
        setIsReloading(false);
        if (data.errorMsg) {
          setError(data.errorMsg);
        } else if (!noticiasValidas.length) {
          setError("No se encontraron noticias relevantes para Montevideo.");
        }
        // Mostrar aviso de noticias nuevas
        if (forzar && data.cached === false) {
          setShowUpdated(true);
          if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
          reloadTimeout.current = setTimeout(() => setShowUpdated(false), 2500);
        }
      })
      .catch((e) => {
        setError(e.message || "No se pudieron obtener noticias.");
        setLoading(false);
        setIsReloading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    cargarNoticias();
    // Refresca cada 30 minutos (1800000 ms)
    const interval = setInterval(() => {
      if (isMounted) cargarNoticias();
    }, 1800000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
    };
  }, []);

  // Solo muestra el botón si el usuario es admin/desarrollador (ejemplo: localStorage)
  const esAdmin = typeof window !== 'undefined' && localStorage.getItem('adminNoticias') === '1';

  const botonRecargaManual = esAdmin && (
    <button
      onClick={() => cargarNoticias(true)}
      style={{
        position: 'absolute',
        top: 24,
        right: 6,
        background: isReloading ? '#444' : '#222',
        color: '#fff',
        border: '1px solid #888',
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 12,
        cursor: isReloading ? 'wait' : 'pointer',
        zIndex: 11,
        opacity: isReloading ? 0.5 : 0.7,
        transition: 'background 0.3s, opacity 0.3s',
      }}
      title="Forzar recarga de noticias"
      disabled={isReloading}
    >
      {isReloading ? 'Recargando...' : 'Recargar'}
    </button>
  );

  // El punto será naranja ante cualquier error
  const apiGastada = error !== null;

  // Punto indicador siempre visible
  const puntoIndicador = (
    <span
      title={apiGastada ? "API gastada, esperando nuevas noticias" : "API disponible"}
      style={{
        position: 'absolute',
        top: 6,
        right: 10,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: apiGastada ? 'orange' : '#888',
        boxShadow: apiGastada ? '0 0 6px 2px #ff9800aa' : '0 0 4px 1px #8888',
        zIndex: 10,
        display: 'inline-block',
        transition: 'background 0.3s',
      }}
      aria-label={apiGastada ? "Indicador interno de API gastada" : "Indicador interno de API disponible"}
    />
  );

  if (loading) {
    return (
      <div className="programacion-noticias-section" aria-busy="true" style={{position:'relative'}}>
        Cargando noticias...
        {puntoIndicador}
        {botonRecargaManual}
      </div>
    );
  }

  if (error) {
    return (
      <div className="programacion-noticias-section" style={{ color: "#b71c1c", fontWeight: 500, position: 'relative' }} role="alert">
        {error}
        {puntoIndicador}
        {botonRecargaManual}
      </div>
    );
  }

  return (
    <div className="programacion-noticias-section" style={{position:'relative'}}>
      {puntoIndicador}
      {botonRecargaManual}
      {showUpdated && (
        <div style={{
          position: 'absolute',
          top: 6,
          left: 16,
          background: '#43a047',
          color: '#fff',
          borderRadius: 6,
          padding: '2px 10px',
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 2px 8px #0002',
          zIndex: 20,
          animation: 'fadeinout 2.5s',
        }}>
          ¡Noticias actualizadas!
        </div>
      )}
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
      <style>{`
        @keyframes fadeinout {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
