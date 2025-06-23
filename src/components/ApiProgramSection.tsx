/**
 * Componente genérico profesional para secciones de programación con datos de API.
 * Integra caché local, manejo de errores, paginación y estados de carga optimizados.
 * 
 * @author Radio Eclipse - Sistema de Noticias
 * @version 3.0.0
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import ApiStatusIndicator, { ApiStatus } from "./ApiStatusIndicator";
import { useLocalCache } from "@/utils/useLocalCache";
import { deduplicarCombinado, type Dato } from "@/utils/sectionDeduplicar";
import he from "he";

// --- TIPOS Y CONFIGURACIÓN ---

interface ApiProgramSectionProps {
  apiPath: string;
  cacheKey: string;
  sectionClass: string;
  updatedMsg: string;
  emptyMsg: string;
  adminKey?: string;
  pageSize?: number;
  refreshIntervalMs?: number;
  manualReloadCooldownMs?: number;
}

interface ApiResponseData {
  noticias: Dato[];
  cached: boolean;
  errorMsg?: string;
  fallback?: boolean;
  meta?: {
    page?: number;
    realMaxPages?: number;
    cooldownActive?: boolean;
    lastUpdate?: string;
    cacheAge?: number;
  };
}

const DEFAULT_CONFIG = {
  PAGE_SIZE: 4,
  REFRESH_INTERVAL_MS: 20 * 60 * 1000, // 20 minutos
  MANUAL_RELOAD_COOLDOWN_MS: 2 * 60 * 1000, // 2 minutos
  MAX_COMBINED_ITEMS: 20,
  MIN_TITLE_LENGTH: 6,
} as const;

// --- UTILIDADES ---

/**
 * Formatea una fecha a formato legible en español de Uruguay.
 */
function formatearFecha(fecha?: string): string {
  if (!fecha) return "";
  
  try {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-UY", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    });
  } catch {
    return "";
  }
}

/**
 * Limpia descripciones de HTML, scripts y decodifica entidades.
 */
function limpiarDescripcion(texto: string): string {
  if (!texto || typeof texto !== 'string') return "";
  
  try {
    let limpio = texto
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    
    return he.decode(limpio);
  } catch {
    return texto;
  }
}

/**
 * Valida que una noticia tenga los campos mínimos requeridos.
 */
function validarNoticia(noticia: any): noticia is Dato {
  return (
    noticia &&
    typeof noticia === 'object' &&
    typeof noticia.title === 'string' &&
    noticia.title.length >= DEFAULT_CONFIG.MIN_TITLE_LENGTH &&
    typeof noticia.link === 'string' &&
    noticia.link.startsWith('http')
  );
}

// --- COMPONENTE PRINCIPAL ---

const ApiProgramSection: React.FC<ApiProgramSectionProps> = ({
  apiPath,
  cacheKey,
  sectionClass,
  updatedMsg,
  emptyMsg,
  adminKey = 'adminNoticias',
  pageSize = DEFAULT_CONFIG.PAGE_SIZE,
  refreshIntervalMs = DEFAULT_CONFIG.REFRESH_INTERVAL_MS,
  manualReloadCooldownMs = DEFAULT_CONFIG.MANUAL_RELOAD_COOLDOWN_MS,
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
  const [fallback, setFallback] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // --- Referencias ---
  const reloadTimeout = useRef<NodeJS.Timeout | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const { guardarCache, cargarCache } = useLocalCache<Dato[]>(cacheKey);

  // --- Función de carga de noticias con manejo robusto de errores ---
  const cargarNoticias = useCallback(async (forzar = false, nuevaPagina = page) => {
    // Validación de cooldown para recargas manuales
    if (forzar) {
      const ahora = Date.now();
      if (ahora - lastManualReload < manualReloadCooldownMs) {
        const tiempoRestante = Math.ceil((manualReloadCooldownMs - (ahora - lastManualReload)) / 1000);
        setError(`Debes esperar ${tiempoRestante} segundos antes de recargar manualmente.`);
        return;
      }
      setLastManualReload(ahora);
      setRetryCount(0);
    }

    setLoading(!forzar);
    setIsReloading(forzar);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(
        `${apiPath}?page=${nuevaPagina}&pageSize=${pageSize}${forzar ? '&force=1' : ''}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': forzar ? 'no-cache' : 'default',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponseData = await response.json();

      if (!isMountedRef.current) return; // Componente desmontado

      // Validar y filtrar noticias de la API
      const noticiasValidas = Array.isArray(data.noticias)
        ? data.noticias.filter(validarNoticia)
        : [];

      // Cargar caché local
      const cacheLocal = cargarCache() || [];

      // Combinar y deduplicar
      const combinadas = deduplicarCombinado(
        noticiasValidas,
        cacheLocal,
        ['title', 'link'],
        'pubDate',
        DEFAULT_CONFIG.MAX_COMBINED_ITEMS,
        ['description', 'image_url', 'source_id', 'link']
      );

      // Separar noticias nuevas de las previas
      const titulosActuales = new Set(noticiasValidas.map(n => n.title));
      const viejasNoRepetidas = cacheLocal.filter(n => !titulosActuales.has(n.title));

      // Guardar en caché local
      guardarCache(combinadas);

      // Actualizar estados
      setNoticias(noticiasValidas);
      setNoticiasPrevias(viejasNoRepetidas);
      setCached(data.cached);
      setPage(data.meta?.page || nuevaPagina);
      setMaxPages(data.meta?.realMaxPages || 1);
      setFallback(!!data.fallback);
      setCooldown(!!data.meta?.cooldownActive);
      setRetryCount(0); // Reset retry count on success

      // Manejar estados de error/vacío
      if (data.errorMsg && noticiasValidas.length === 0) {
        setError(data.errorMsg);
      } else if (!noticiasValidas.length && !viejasNoRepetidas.length) {
        setError(emptyMsg);
      } else {
        setError(null);
      }

      // Mostrar mensaje de actualización
      if (forzar && !data.cached) {
        setShowUpdated(true);
        if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
        reloadTimeout.current = setTimeout(() => {
          if (isMountedRef.current) setShowUpdated(false);
        }, 3000);
      }

    } catch (fetchError: any) {
      if (!isMountedRef.current) return;

      let errorMessage = 'No se pudieron obtener datos';
      
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Tiempo de espera agotado';
      } else if (fetchError.message.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión';
      } else if (fetchError.message) {
        errorMessage = fetchError.message;
      }

      setError(errorMessage);
      setRetryCount(prev => prev + 1);

      // Auto-retry para errores de red (máximo 3 intentos)
      if (retryCount < 2 && !forzar && errorMessage.includes('conexión')) {
        setTimeout(() => {
          if (isMountedRef.current) {
            cargarNoticias(false, nuevaPagina);
          }
        }, (retryCount + 1) * 2000); // Backoff progresivo
      }

    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsReloading(false);
      }
    }
  }, [
    apiPath, 
    page, 
    pageSize, 
    cargarCache, 
    guardarCache, 
    emptyMsg, 
    lastManualReload, 
    manualReloadCooldownMs,
    retryCount
  ]);

  // --- Efecto de montaje e intervalo de actualización ---
  useEffect(() => {
    isMountedRef.current = true;
    
    // Cargar datos iniciales
    cargarNoticias();

    // Configurar intervalo de actualización automática
    refreshInterval.current = setInterval(() => {
      if (isMountedRef.current && !isReloading) {
        cargarNoticias();
      }
    }, refreshIntervalMs);

    // Cleanup al desmontar
    return () => {
      isMountedRef.current = false;
      if (refreshInterval.current) clearInterval(refreshInterval.current);
      if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
    };
  }, []); // Solo ejecutar una vez al montar

  // --- Efecto para sincronización de paginación ---
  useEffect(() => {
    const todas = [
      ...noticias,
      ...noticiasPrevias.filter(n => !noticias.some(n2 => n2.title === n.title))
    ];
    
    const maxNoticias = DEFAULT_CONFIG.MAX_COMBINED_ITEMS;
    const todasLimitadas = todas.slice(0, maxNoticias);
    const paginasReales = Math.max(1, Math.ceil(todasLimitadas.length / pageSize));
    
    setMaxPages(paginasReales);
    
    if (page > paginasReales) {
      setPage(paginasReales);
    }
  }, [noticias, noticiasPrevias, page, pageSize]);

  // --- Memo para noticias de la página actual ---
  const noticiasPagina = useMemo(() => {
    const todas = [
      ...noticias,
      ...noticiasPrevias.filter(n => !noticias.some(n2 => n2.title === n.title))
    ];
    
    const todasLimitadas = todas.slice(0, DEFAULT_CONFIG.MAX_COMBINED_ITEMS);
    const inicio = (page - 1) * pageSize;
    const fin = inicio + pageSize;
    
    return todasLimitadas.slice(inicio, fin);
  }, [noticias, noticiasPrevias, page, pageSize]);

  // --- Estado de admin y botón de recarga ---
  const esAdmin = typeof window !== 'undefined' && localStorage.getItem(adminKey) === '1';
  
  const botonRecargaManual = esAdmin && (
    <button
      onClick={() => cargarNoticias(true)}
      style={{
        position: 'absolute',
        top: 24,
        right: 6,
        background: isReloading ? '#666' : '#333',
        color: '#fff',
        border: '1px solid #999',
        borderRadius: 8,
        padding: '4px 12px',
        fontSize: 12,
        fontWeight: 500,
        cursor: isReloading ? 'not-allowed' : 'pointer',
        zIndex: 11,
        opacity: isReloading ? 0.6 : 0.8,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
      title={isReloading ? 'Recargando...' : 'Forzar recarga manual'}
      disabled={isReloading}
      onMouseEnter={(e) => {
        if (!isReloading) {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.background = '#555';
        }
      }}
      onMouseLeave={(e) => {
        if (!isReloading) {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.background = '#333';
        }
      }}
    >
      {isReloading ? 'Recargando...' : '↻ Recargar'}
    </button>
  );

  // --- Determinación del estado de la API ---
  let apiStatus: ApiStatus = "ok";
  if (cooldown) {
    apiStatus = "cooldown";
  } else if (fallback) {
    apiStatus = "fallback";
  } else if (error && !noticiasPagina.length) {
    apiStatus = "error";
  }

  // --- Función auxiliar para renderizar noticias ---
  function renderNoticias(noticias: Dato[]) {
    if (noticias.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          color: '#666',
          fontStyle: 'italic',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📰</div>
          {emptyMsg}
        </div>
      );
    }

    return (
      <section aria-live="polite">
        {noticias.map((noticia, idx) => (
          <article 
            className="noticia-contenedor" 
            key={`${noticia.title}-${idx}`} 
            style={{ marginBottom: 16 }}
          >
            <a
              href={noticia.link}
              target="_blank"
              rel="noopener noreferrer"
              className="noticia-titulo"
              aria-label={`Leer noticia: ${noticia.title}`}
              tabIndex={0}
              onClick={(e) => {
                if (!noticia.link || !noticia.link.startsWith('http')) {
                  e.preventDefault();
                  alert("Enlace no disponible o inválido");
                }
              }}
            >
              <span className="noticia-titulo-text">{noticia.title}</span>
            </a>

            <div className="noticia-meta">
              {noticia.source_id && (
                <span className="noticia-fuente" title={`Fuente: ${noticia.source_id}`}>
                  <svg width="14" height="14" viewBox="0 0 20 20" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                    <circle cx="10" cy="10" r="8" fill="#b71c1c" />
                    <text x="10" y="15" textAnchor="middle" fontSize="10" fill="#fff">F</text>
                  </svg>
                  {noticia.source_id}
                </span>
              )}
              {noticia.pubDate && (
                <span className="noticia-fecha" title={`Publicado: ${formatearFecha(noticia.pubDate)}`}>
                  <svg width="14" height="14" viewBox="0 0 20 20" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                    <rect x="2" y="4" width="16" height="14" rx="3" fill="#888" />
                    <rect x="5" y="8" width="10" height="2" fill="#fff" />
                  </svg>
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
    );
  }

  // --- Estados de renderizado ---

  // Estado de carga con datos previos
  if (loading && (noticiasPagina.length > 0)) {
    return (
      <div className={sectionClass} aria-busy="true" style={{ position: 'relative' }}>
        <ApiStatusIndicator status={apiStatus} />
        {botonRecargaManual}
        {showUpdated && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 16,
            background: 'linear-gradient(135deg, #43a047, #66bb6a)',
            color: '#fff',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(67, 160, 71, 0.3)',
            zIndex: 20,
            animation: 'slideInFadeOut 3s ease-in-out',
          }}>
            ✅ {updatedMsg}
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
        {renderNoticias(noticiasPagina)}
        <div style={{
          position: 'absolute',
          bottom: 8,
          right: 16,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          borderRadius: 4,
          padding: '4px 8px',
          fontSize: 11,
          fontWeight: 500,
        }}>
          Actualizando...
        </div>
        <style jsx>{`
          @keyframes slideInFadeOut {
            0% { opacity: 0; transform: translateX(-20px); }
            15% { opacity: 1; transform: translateX(0); }
            85% { opacity: 1; transform: translateX(0); }
            100% { opacity: 0; transform: translateX(-20px); }
          }
        `}</style>
      </div>
    );
  }

  // Estado de error con datos previos
  if (error && noticiasPagina.length > 0) {
    return (
      <div className={sectionClass} style={{ position: 'relative' }}>
        <div style={{
          color: "#d32f2f",
          background: "#ffebee",
          border: "1px solid #ffcdd2",
          borderRadius: 6,
          padding: 8,
          marginBottom: 12,
          fontSize: 13,
          fontWeight: 500,
        }} role="alert">
          ⚠️ {error}
        </div>
        <ApiStatusIndicator status={apiStatus} />
        {botonRecargaManual}
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
        {renderNoticias(noticiasPagina)}
      </div>
    );
  }

  // Estado de error sin datos
  if (error && noticiasPagina.length === 0) {
    return (
      <div className={sectionClass} style={{ 
        color: "#d32f2f", 
        fontWeight: 500, 
        position: 'relative',
        textAlign: 'center',
        padding: '2rem 1rem',
      }} role="alert">
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>😵</div>
        <div style={{ marginBottom: '0.5rem' }}>{error}</div>
        {retryCount > 0 && (
          <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            Intentos: {retryCount}/3
          </div>
        )}
        <ApiStatusIndicator status={apiStatus} />
        {botonRecargaManual}
      </div>
    );
  }

  // Estado normal con datos
  return (
    <div className={sectionClass} style={{ position: 'relative' }}>
      <ApiStatusIndicator status={apiStatus} />
      {botonRecargaManual}
      {showUpdated && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: 16,
          background: 'linear-gradient(135deg, #43a047, #66bb6a)',
          color: '#fff',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(67, 160, 71, 0.3)',
          zIndex: 20,
          animation: 'slideInFadeOut 3s ease-in-out',
        }}>
          ✅ {updatedMsg}
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
      {renderNoticias(noticiasPagina)}
      <style jsx>{`
        @keyframes slideInFadeOut {
          0% { opacity: 0; transform: translateX(-20px); }
          15% { opacity: 1; transform: translateX(0); }
          85% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(-20px); }
        }
      `}</style>
    </div>
  );
};

export default ApiProgramSection;
