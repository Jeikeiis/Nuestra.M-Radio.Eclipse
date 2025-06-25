import { NextResponse } from 'next/server';
import { importarCaches, limpiarCacheSiExcede } from '../../../../utils/cacheWorkflowManager';
import { USER_API_KEY } from '../../../../utils/cacheManager';
import { respuestaApiEstandar } from '../../../../utils/cacheHelpers';

const SECCIONES = ['farandula', 'musica', 'noticias'];

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth || auth !== `Bearer ${USER_API_KEY}`) {
    return NextResponse.json(respuestaApiEstandar({ noticias: [], errorMsg: 'No autorizado', cached: false, huboCambio: false, fallback: false, apiStatus: 'error', meta: {} }), { status: 401 });
  }
  try {
    const data = await request.json();
    await importarCaches(data);
    for (const seccion of SECCIONES) {
      if (data[seccion]?.noticias?.length > 5 * 20) {
        limpiarCacheSiExcede(seccion, 5, 20);
      }
    }
    return NextResponse.json(respuestaApiEstandar({ noticias: [], errorMsg: '', cached: true, huboCambio: true, fallback: false, apiStatus: 'ok', meta: {} }));
  } catch (e: any) {
    return NextResponse.json(respuestaApiEstandar({ noticias: [], errorMsg: e?.message || 'Error desconocido', cached: false, huboCambio: false, fallback: false, apiStatus: 'error', meta: {} }), { status: 500 });
  }
}
