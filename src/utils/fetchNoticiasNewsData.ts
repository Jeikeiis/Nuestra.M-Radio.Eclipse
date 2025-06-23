/**
 * Cliente profesional para la API de NewsData.io con manejo robusto de errores,
 * rate limiting, validación de datos y logging estructurado.
 * 
 * @author Radio Eclipse - Sistema de Noticias
 * @version 2.0.0
 */

// Tipos TypeScript específicos para NewsData.io
export interface NewsDataArticle {
  title: string;
  link: string;
  keywords?: string[];
  creator?: string[];
  video_url?: string;
  description?: string;
  content?: string;
  pubDate: string;
  image_url?: string;
  source_id: string;
  source_priority?: number;
  country?: string[];
  category?: string[];
  language?: string;
}

export interface NewsDataResponse {
  status: string;
  totalResults: number;
  results: NewsDataArticle[];
  nextPage?: string;
}

export interface FetchNoticiasResult {
  noticias: NewsDataArticle[];
  errorMsg?: string;
  fromCache?: boolean;
  rateLimitHit?: boolean;
  totalResults?: number;
}

// Configuración centralizada
const CONFIG = {
  API_BASE_URL: 'https://newsdata.io/api/1/latest',
  API_KEY: process.env.USER_API_KEY || '',
  DEFAULT_COUNTRY: 'uy',
  DEFAULT_LANGUAGE: 'es',
  DEFAULT_CATEGORY: 'top',
  TIMEOUT_MS: 15000,
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
} as const;

// Errores personalizados
export class NewsDataApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isRateLimit: boolean = false,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'NewsDataApiError';
  }
}

// Validador de artículos
function validateArticle(article: any): article is NewsDataArticle {
  return (
    article &&
    typeof article === 'object' &&
    typeof article.title === 'string' &&
    article.title.length >= 3 &&
    typeof article.link === 'string' &&
    article.link.startsWith('http') &&
    typeof article.pubDate === 'string' &&
    typeof article.source_id === 'string'
  );
}

// Sanitizador de texto
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Logger estructurado
const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[NewsData] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(`[NewsData] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    console.error(`[NewsData] ${message}`, error?.message || '', meta ? JSON.stringify(meta, null, 2) : '');
  }
};

/**
 * Obtiene noticias desde NewsData.io con manejo profesional de errores y validación.
 * 
 * @param region Región o término de búsqueda
 * @param options Opciones adicionales para la consulta
 * @returns Resultado con noticias validadas y metadatos
 */
export async function fetchNoticiasNewsData(
  region: string,
  options: {
    country?: string;
    language?: string;
    category?: string;
    size?: number;
  } = {}
): Promise<FetchNoticiasResult> {
  const startTime = Date.now();
  
  // Validación de entrada
  if (!CONFIG.API_KEY) {
    const error = 'USER_API_KEY no está configurada en las variables de entorno';
    logger.error(error);
    return { noticias: [], errorMsg: error };
  }

  if (!region || typeof region !== 'string' || region.trim().length < 2) {
    const error = 'Región debe ser una cadena válida con al menos 2 caracteres';
    logger.error(error, { region });
    return { noticias: [], errorMsg: error };
  }

  // Construcción de URL con parámetros seguros
  const searchParams = new URLSearchParams({
    apikey: CONFIG.API_KEY,
    q: region.trim(),
    country: options.country || CONFIG.DEFAULT_COUNTRY,
    language: options.language || CONFIG.DEFAULT_LANGUAGE,
    category: options.category || CONFIG.DEFAULT_CATEGORY,
    ...(options.size && { size: Math.min(options.size, 50).toString() })
  });

  const url = `${CONFIG.API_BASE_URL}?${searchParams.toString()}`;
  
  logger.info('Iniciando consulta a NewsData.io', { 
    region, 
    options,
    urlLength: url.length 
  });

  // Fetch con timeout y manejo de errores profesional
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RadioEclipse/2.0 (+https://radio-eclipse.com)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Manejo específico de códigos de estado HTTP
    if (!response.ok) {
      const isRateLimit = response.status === 429;
      const retryAfter = response.headers.get('Retry-After');
      
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `Error HTTP ${response.status}`;
      } catch {
        errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
      }

      logger.error('Error HTTP de NewsData.io', undefined, {
        status: response.status,
        statusText: response.statusText,
        isRateLimit,
        retryAfter,
        errorMessage
      });

      throw new NewsDataApiError(
        errorMessage,
        response.status,
        isRateLimit,
        retryAfter ? parseInt(retryAfter) : undefined
      );
    }

    // Parseo y validación de respuesta
    const responseText = await response.text();
    if (!responseText.trim()) {
      throw new Error('La respuesta de la API está vacía');
    }

    let data: NewsDataResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Error al parsear JSON de NewsData.io', parseError as Error, {
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200)
      });
      throw new Error('La respuesta no es un JSON válido');
    }

    // Validación de estructura de respuesta
    if (!data || typeof data !== 'object') {
      throw new Error('Estructura de respuesta inválida');
    }

    if (data.status !== 'success') {
      throw new Error(`API devolvió estado: ${data.status}`);
    }

    if (!Array.isArray(data.results)) {
      throw new Error('La respuesta no contiene un array de resultados');
    }

    // Validación y sanitización de artículos
    const validatedArticles: NewsDataArticle[] = [];
    
    for (const article of data.results) {
      if (validateArticle(article)) {
        const sanitizedArticle: NewsDataArticle = {
          ...article,
          title: sanitizeText(article.title),
          description: article.description ? sanitizeText(article.description) : undefined,
          content: article.content ? sanitizeText(article.content) : undefined,
        };
        
        // Filtrar artículos con títulos muy cortos después de sanitizar
        if (sanitizedArticle.title.length >= 10) {
          validatedArticles.push(sanitizedArticle);
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Consulta a NewsData.io completada exitosamente', {
      region,
      totalResults: data.totalResults,
      validArticles: validatedArticles.length,
      invalidArticles: data.results.length - validatedArticles.length,
      duration: `${duration}ms`
    });

    return {
      noticias: validatedArticles,
      totalResults: data.totalResults,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof NewsDataApiError) {
      // Re-lanzar errores específicos de la API
      logger.error('Error específico de NewsData.io', error, {
        region,
        duration: `${duration}ms`,
        isRateLimit: error.isRateLimit,
        retryAfter: error.retryAfter
      });
      
      return {
        noticias: [],
        errorMsg: error.message,
        rateLimitHit: error.isRateLimit,
      };
    }

    // Manejo de otros errores
    let errorMessage = 'Error desconocido al obtener noticias';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Error de conexión de red';
    } else if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Timeout después de ${CONFIG.TIMEOUT_MS}ms`;
      } else {
        errorMessage = error.message;
      }
    }

    logger.error('Error general al obtener noticias', error as Error, {
      region,
      duration: `${duration}ms`,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });

    return {
      noticias: [],
      errorMsg: `No se pudieron obtener noticias: ${errorMessage}`,
    };
  }
}
