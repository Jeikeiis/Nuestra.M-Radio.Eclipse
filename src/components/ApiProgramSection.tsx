import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { deduplicarCombinado, Dato } from "@/utils/deduplicar";
import ApiStatusIndicator, { ApiStatus } from "./ApiStatusIndicator";
import { useLocalCache } from "@/utils/useLocalCache";

/**
 * Formatea una fecha a formato legible en español de Uruguay.
 */
function formatearFecha(fecha?: string) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-UY", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Props para ApiProgramSection
 */
interface ApiProgramSectionProps {
  apiPath: string;
  cacheKey: string;
  sectionClass: string;
  updatedMsg: string;
  emptyMsg: string;
  adminKey?: string;
}

const PAGE_SIZE = 4;

/**
 * Componente genérico para renderizar una sección de programación basada en datos de API y caché local.
 */
const ApiProgramSection: React.FC<ApiProgramSectionProps> = ({
  apiPath,
  cacheKey,
  sectionClass,
  updatedMsg,
  emptyMsg,
  adminKey = 'adminNoticias',
}) => {
  // --- Estados principales ---
  const [noticias, setNoticias] = useState<Dato[]>([]);
  const [noticiasPrevias, setNoticiasPrevias] = useState<Dato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<boolean | null>(null);
  const [showUpdated, setShowUpdated] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [page, setPage] = useState(1);
  const [maxPages, setMaxPages] = useState(5);
  const [lastManualReload, setLastManualReload] = useState<number>(0);
  const reloadTimeout = useRef<NodeJS.Timeout | null>(null);
  const [fallback, setFallback] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const { guardarCache, cargarCache } = useLocalCache<Dato[]>(cacheKey);

  // --- Función para limpiar descripciones de HTML/script ---
  const limpiarDescripcion = useCallback((texto: string): string => {
    if (!texto) return "";
    let limpio = texto.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
    limpio = limpio.replace(/<[^>]+>/g, "");
    const txt = document.createElement('textarea');
    txt.innerHTML = limpio;
    return txt.value;
  }, []);

  // --- Carga de noticias desde API y/o caché ---
  const cargarNoticias = useCallback((forzar = false, nuevaPagina = page) => {
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
    fetch(`${apiPath}?page=${nuevaPagina}&pageSize=${PAGE_SIZE}${forzar ? '&force=1' : ''}`)
      .then(res => res.json())
      .then(data => {
        let noticiasValidas = Array.isArray(data.noticias)
          ? data.noticias.filter((n: Dato) => n && n.title && n.link && n.title.length > 6)
          : [];
        let cacheLocal = cargarCache() || [];
        let combinadas = deduplicarCombinado(
          noticiasValidas,
          cacheLocal,
          ['title','link'],
          'pubDate',
          5 * PAGE_SIZE,
          ['description','image_url','source_id','link']
        );
        const titulosActuales = new Set<string>(noticiasValidas.map((n: Dato) => n.title));
        const viejasNoRepetidas = cacheLocal.filter((n: Dato) => !titulosActuales.has(n.title));
        guardarCache(combinadas);
        setNoticias(noticiasValidas);
        setNoticiasPrevias(viejasNoRepetidas);
        setCached(data.cached);
        setPage(data.meta?.page || 1);
        setMaxPages(data.meta?.realMaxPages || 1);
        setFallback(!!data.fallback);
        setCooldown(!!data.meta?.cooldownActive);
        setLoading(false);
        setIsReloading(false);
        if (data.errorMsg) {
          setError(data.errorMsg);
        } else if (!noticiasValidas.length && !viejasNoRepetidas.length) {
          setError(emptyMsg);
        }
        if (forzar && data.cached === false) {
          setShowUpdated(true);
          if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
          reloadTimeout.current = setTimeout(() => setShowUpdated(false), 2500);
        }
      })
      .catch((e: any) => {
        setError(e.message || `No se pudieron obtener datos.`);
        setLoading(false);
        setIsReloading(false);
        setFallback(false);
      });
  }, [apiPath, cargarCache, emptyMsg, guardarCache, lastManualReload, page]);

  // --- Efecto inicial y limpieza ---
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
  }, [cargarNoticias]);

  // --- Cálculo de paginación y sincronización de páginas ---
  useEffect(() => {
    const todas = [
      ...noticias,
      ...noticiasPrevias.filter(n => !noticias.some(n2 => n2.title === n.title))
    ];
    const maxNoticias = 5 * PAGE_SIZE;
    const todasLimitadas = todas.slice(0, maxNoticias);
    const paginasReales = Math.max(1, Math.ceil(todasLimitadas.length / PAGE_SIZE));
    setMaxPages(paginasReales);
    if (page > paginasReales) setPage(paginasReales);
  }, [noticias, noticiasPrevias, page]);

  // --- Memo para obtener las noticias de la página actual ---
  const noticiasPagina = useMemo(() => {
    const todas = [
      ...noticias,
      ...noticiasPrevias.filter(n => !noticias.some(n2 => n2.title === n.title))
    ];
    const todasLimitadas = todas.slice(0, 5 * PAGE_SIZE);
    const inicio = (page - 1) * PAGE_SIZE;
    const fin = inicio + PAGE_SIZE;
    return todasLimitadas.slice(inicio, fin);
  }, [noticias, noticiasPrevias, page]);

  // --- Estado de admin y botón de recarga manual ---
  const esAdmin = typeof window !== 'undefined' && localStorage.getItem(adminKey) === '1';
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
      title="Forzar recarga"
      disabled={isReloading}
    >
      {isReloading ? 'Recargando...' : 'Recargar'}
    </button>
  );

  // --- Estado de la API para el indicador visual ---
  let apiStatus: ApiStatus = "ok";
  if (cooldown) apiStatus = "cooldown";
  else if (fallback) apiStatus = "fallback";

  // --- Renderizado de estados especiales ---
  if (loading && noticiasPrevias.length > 0) {
    return (
      <div className={sectionClass} aria-busy="true" style={{position:'relative'}}>
        <ApiStatusIndicator status={apiStatus} />
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
            {updatedMsg}
          </div>
        )}
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontWeight:600,color:'#888'}}>Cargando datos...</div>
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
      <div className={sectionClass} style={{ position: 'relative' }}>
        <div style={{ color: "#b71c1c", fontWeight: 500, marginBottom: 12 }} role="alert">
          {error}
        </div>
        <ApiStatusIndicator status={apiStatus} />
        {botonRecargaManual}
      </div>
    );
  }

  if (error) {
    return (
      <div className={sectionClass} style={{ color: "#b71c1c", fontWeight: 500, position: 'relative' }} role="alert">
        {error}
        <ApiStatusIndicator status={apiStatus} />
        {botonRecargaManual}
      </div>
    );
  }

  // --- Renderizado principal ---
  return (
    <div className={sectionClass} style={{position:'relative'}}>
      <ApiStatusIndicator status={apiStatus} />
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
          {updatedMsg}
        </div>
      )}
      <nav className="paginacion-controles" aria-label="Paginación de noticias" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, margin: '16px 0' }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          aria-label="Página anterior"
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
        <span style={{ color: 'var(--section-title, #fff)', fontWeight: 700, fontSize: 16 }}>
          Página {page} de {maxPages}
        </span>
        {page < maxPages && (
          <button
            onClick={() => setPage((p) => Math.min(maxPages, p + 1))}
            aria-label="Página siguiente"
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
      </nav>
      <section aria-live="polite">
        {noticiasPagina.map((noticia, idx) => (
          <article className="noticia-contenedor" key={idx} style={{marginBottom:24}}>
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
                {limpiarDescripcion(noticia.description)}
              </div>
            )}
          </article>
        ))}
      </section>
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
};

export default ApiProgramSection;
