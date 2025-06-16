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

export default function ProgramacionMusicaSection() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [noticiasPrevias, setNoticiasPrevias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<boolean | null>(null);
  const [showUpdated, setShowUpdated] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [maxPages, setMaxPages] = useState(5);
  const [lastManualReload, setLastManualReload] = useState<number>(0);
  const pageSize = 4;
  const reloadTimeout = useRef<NodeJS.Timeout | null>(null);
  const [fallback, setFallback] = useState(false);

  const cargarNoticias = (forzar = false, nuevaPagina = page) => {
    if (forzar) {
      const ahora = Date.now();
      if (ahora - lastManualReload < 120000) {
        setError("Debes esperar al menos 2 minutos entre recargas manuales.");
        return;
      }
      setLastManualReload(ahora);
    }
    setLoading(!forzar);
    setIsReloading(forzar);
    setError(null);
    fetch(`/api/musica?page=${nuevaPagina}&pageSize=${pageSize}${forzar ? '&force=1' : ''}`)
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
        setNoticias(noticiasValidas);
        // Siempre actualiza previas si hay datos, aunque haya error
        if (noticiasValidas.length > 0) {
          setNoticiasPrevias(noticiasValidas);
        }
        setCached(data.cached);
        setTotal(data.meta?.total || 0);
        setMaxPages(data.meta?.maxPages || 5);
        setFallback(!!data.fallback);
        setLoading(false);
        setIsReloading(false);
        if (data.errorMsg) {
          setError(data.errorMsg);
        } else if (!noticiasValidas.length) {
          setError("No se encontraron noticias de música relevantes.");
        }
        if (forzar && data.cached === false) {
          setShowUpdated(true);
          if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
          reloadTimeout.current = setTimeout(() => setShowUpdated(false), 2500);
        }
      })
      .catch((e) => {
        setError(e.message || "No se pudieron obtener noticias de música.");
        setLoading(false);
        setIsReloading(false);
        setFallback(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    cargarNoticias();
    const interval = setInterval(() => {
      if (isMounted) cargarNoticias();
    }, 1200000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
    };
    // eslint-disable-next-line
  }, []);

  // Unificación de lógica con ProgramacionNoticiasSection
  // (filtrado, paginación, recarga manual, feedback visual, placeholders, etc.)
  // Utilidad para llenar hasta 5 páginas combinando cache nuevo, cache viejo
  function obtenerNoticiasPagina(noticiasNuevas: Noticia[], noticiasViejas: Noticia[], pagina: number, pageSize: number) {
    // Unir ambos caches sin duplicados (prioridad: nuevas)
    const titulos = new Set<string>();
    const todas = [
      ...noticiasNuevas,
      ...noticiasViejas.filter(n => !noticiasNuevas.some(n2 => n2.title === n.title))
    ];
    const maxNoticias = 5 * pageSize;
    const todasLimitadas = todas.slice(0, maxNoticias);
    // Calcular páginas reales
    const totalUnicos = todasLimitadas.length;
    const paginasReales = Math.max(1, Math.ceil(totalUnicos / pageSize));
    if (page > paginasReales) setPage(paginasReales);
    const inicio = (pagina - 1) * pageSize;
    const fin = inicio + pageSize;
    return todasLimitadas.slice(inicio, fin);
  }

  // Actualiza maxPages dinámicamente según los artículos únicos
  useEffect(() => {
    const titulos = new Set<string>();
    const todas = [
      ...noticias,
      ...noticiasPrevias.filter(n => !noticias.some(n2 => n2.title === n.title))
    ];
    const maxNoticias = 5 * pageSize;
    const todasLimitadas = todas.slice(0, maxNoticias);
    const totalUnicos = todasLimitadas.length;
    const paginasReales = Math.max(1, Math.ceil(totalUnicos / pageSize));
    setMaxPages(paginasReales);
    if (page > paginasReales) setPage(paginasReales);
  }, [noticias, noticiasPrevias, pageSize]);

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
      title="Forzar recarga de música"
      disabled={isReloading}
    >
      {isReloading ? 'Recargando...' : 'Recargar'}
    </button>
  );

  // Indicador: gris (ok), naranja (cache temporal), rojo (cache fijo)
  let color = '#888', boxShadow = '0 0 4px 1px #8888', label = 'API disponible';
  if (fallback) {
    color = 'red';
    boxShadow = '0 0 8px 2px #ff0000cc';
    label = 'API tokens agotados, usando cache fijo';
  } else if (error !== null) {
    color = 'orange';
    boxShadow = '0 0 6px 2px #ff9800aa';
    label = 'API usando cache temporal';
  }
  const puntoIndicador = (
    <span
      title={label}
      style={{
        position: 'absolute',
        top: 6,
        right: 10,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        boxShadow,
        zIndex: 10,
        display: 'inline-block',
        transition: 'background 0.3s',
      }}
      aria-label={label}
    />
  );

  const noticiasPagina = obtenerNoticiasPagina(noticias, noticiasPrevias, page, pageSize);

  if (loading && noticiasPrevias.length > 0) {
    return (
      <div className="programacion-musica-section" aria-busy="true" style={{position:'relative'}}>
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
            ¡Música actualizada!
          </div>
        )}
        <div className="paginacion-controles">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid var(--section-border, #888)',
              background: page === 1 ? 'var(--section-bg-contrast, #333)' : 'var(--section-bg, #222)',
              color: 'var(--section-title, #fff)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            ◀ Anterior
          </button>
          <span style={{ alignSelf: 'center', color: 'var(--section-title, #fff)', fontWeight: 700, fontSize: 16 }}>
            Página {page} de {maxPages}
          </span>
          {page < maxPages && (
            <button
              onClick={() => setPage((p) => Math.min(maxPages, p + 1))}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: '1px solid var(--section-border, #888)',
                background: 'var(--section-bg, #222)',
                color: 'var(--section-title, #fff)',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              Siguiente ▶
            </button>
          )}
        </div>
        <div style={{opacity:0.5, pointerEvents:'none'}}>
          {noticiasPrevias.map((noticia, idx) => (
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
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontWeight:600,color:'#888'}}>Cargando noticias de música...</div>
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

  if (error && noticiasPrevias.length > 0) {
    return (
      <div className="programacion-musica-section" style={{ position: 'relative' }}>
        <div style={{ color: "#b71c1c", fontWeight: 500, marginBottom: 12 }} role="alert">
          {error}
        </div>
        {puntoIndicador}
        {botonRecargaManual}
        <div className="paginacion-controles">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid var(--section-border, #888)',
              background: page === 1 ? 'var(--section-bg-contrast, #333)' : 'var(--section-bg, #222)',
              color: 'var(--section-title, #fff)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            ◀ Anterior
          </button>
          <span style={{ alignSelf: 'center', color: 'var(--section-title, #fff)', fontWeight: 700, fontSize: 16 }}>
            Página {page} de {maxPages}
          </span>
          {page < maxPages && (
            <button
              onClick={() => setPage((p) => Math.min(maxPages, p + 1))}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: '1px solid var(--section-border, #888)',
                background: 'var(--section-bg, #222)',
                color: 'var(--section-title, #fff)',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              Siguiente ▶
            </button>
          )}
        </div>
        <div>
          {noticiasPrevias.map((noticia, idx) => (
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="programacion-musica-section" style={{ color: "#b71c1c", fontWeight: 500, position: 'relative' }} role="alert">
        {error}
        {puntoIndicador}
        {botonRecargaManual}
      </div>
    );
  }

  return (
    <div className="programacion-musica-section" style={{position:'relative'}}>
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
          ¡Música actualizada!
        </div>
      )}
      <div className="paginacion-controles">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid var(--section-border, #888)',
            background: page === 1 ? 'var(--section-bg-contrast, #333)' : 'var(--section-bg, #222)',
            color: 'var(--section-title, #fff)',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          ◀ Anterior
        </button>
        <span style={{ alignSelf: 'center', color: 'var(--section-title, #fff)', fontWeight: 700, fontSize: 16 }}>
          Página {page} de {maxPages}
        </span>
        {page < maxPages && (
          <button
            onClick={() => setPage((p) => Math.min(maxPages, p + 1))}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid var(--section-border, #888)',
              background: 'var(--section-bg, #222)',
              color: 'var(--section-title, #fff)',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            Siguiente ▶
          </button>
        )}
      </div>
      {noticiasPagina.map((noticia, idx) => (
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
