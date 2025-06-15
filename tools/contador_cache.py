import json
import os

# Rutas de los archivos de cache (ajusta si usas persistencia en disco)
CACHE_NUEVO_PATH = '../src/app/api/musica/route.ts'
CACHE_VIEJO_PATH = '../src/app/api/musica/route.ts'

# Función para extraer el array de noticias de un archivo de cache (simulación)
def extraer_noticias_cache(path, nombre_variable):
    noticias = []
    if not os.path.exists(path):
        return noticias
    with open(path, 'r', encoding='utf-8') as f:
        contenido = f.read()
    # Busca la variable en el archivo (muy simple, para demo)
    inicio = contenido.find(f'{nombre_variable} =')
    if inicio == -1:
        return noticias
    inicio = contenido.find('[', inicio)
    fin = contenido.find(']', inicio)
    if inicio == -1 or fin == -1:
        return noticias
    try:
        array_str = contenido[inicio:fin+1]
        noticias = json.loads(array_str)
    except Exception:
        pass
    return noticias

# Simulación: en Next.js normalmente el cache está en memoria, pero si lo persistes en disco puedes adaptar esto
noticias_nuevo = extraer_noticias_cache(CACHE_NUEVO_PATH, 'cache.noticias')
noticias_viejo = extraer_noticias_cache(CACHE_VIEJO_PATH, 'cacheFijo')

print(f"Artículos en cache nuevo (sin duplicados): {len(noticias_nuevo)}")
print(f"Artículos en cache viejo (sin duplicados): {len(noticias_viejo)}")
