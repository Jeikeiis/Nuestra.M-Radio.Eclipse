// cacheManager.ts
/**
 * Exporta la clave de usuario de API para endpoints protegidos.
 *
 * Dependencia: requiere variable de entorno API_USER_KEY.
 *
 * Uso: Importar en endpoints que requieran autenticación de usuario para operaciones sensibles.
 */
export const API_USER_KEY = process.env.API_USER_KEY;