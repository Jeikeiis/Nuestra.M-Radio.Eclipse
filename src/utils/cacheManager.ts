// cacheManager.ts
/**
 * Exporta la clave de usuario de API para endpoints protegidos.
 *
 * Dependencia: requiere variable de entorno USER_API_KEY.
 *
 * Uso: Importar en endpoints que requieran autenticación de usuario para operaciones sensibles.
 */
export const USER_API_KEY = process.env.USER_API_KEY;