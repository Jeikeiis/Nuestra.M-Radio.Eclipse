import json
import os
import re
from datetime import datetime

# Rutas de los archivos de cache (ajusta si usas persistencia en disco)
BASE = '../src/app/api/'
ARCHIVOS = {
    'noticias': BASE + 'noticias/route.ts',
    'musica': BASE + 'musica/route.ts',
    'farandula': BASE + 'farandula/route.ts',
}

# Extrae array y timestamp de un archivo de cache (simulación)
def extraer_cache(path, nombre_variable, nombre_timestamp):
    noticias = []
    timestamp = None
    if not os.path.exists(path):
        return noticias, timestamp
    with open(path, 'r', encoding='utf-8') as f:
        contenido = f.read()
    # Busca la variable en el archivo (muy simple, para demo)
    inicio = contenido.find(f'{nombre_variable} =')
    if inicio == -1:
        return noticias, timestamp
    inicio = contenido.find('[', inicio)
    fin = contenido.find(']', inicio)
    if inicio == -1 or fin == -1:
        return noticias, timestamp
    try:
        array_str = contenido[inicio:fin+1]
        noticias = json.loads(array_str)
    except Exception:
        pass
    # Buscar timestamp
    m = re.search(rf'{nombre_timestamp}\s*:\s*(\d+)', contenido)
    if m:
        try:
            timestamp = int(m.group(1))
        except Exception:
            pass
    return noticias, timestamp

for nombre, ruta in ARCHIVOS.items():
    nuevo, ts_nuevo = extraer_cache(ruta, 'cache.noticias', 'timestamp')
    viejo, ts_viejo = extraer_cache(ruta, 'cacheFijo', 'timestamp')
    print(f'[{nombre.upper()}]')
    print(f'  Artículos en cache nuevo: {len(nuevo)}')
    print(f'  Artículos en cache viejo: {len(viejo)}')
    if ts_nuevo:
        print(f'  Última actualización cache nuevo: {datetime.fromtimestamp(ts_nuevo/1000)}')
    if ts_viejo:
        print(f'  Última actualización cache viejo: {datetime.fromtimestamp(ts_viejo/1000)}')
    print('')
