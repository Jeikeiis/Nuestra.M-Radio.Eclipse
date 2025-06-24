import { NextResponse } from 'next/server';
import { exportarCaches } from '../../../../utils/cacheWorkflowManager';
import { USER_API_KEY } from '../../../../utils/cacheManager';
import { respuestaApiEstandar } from '../../../../utils/cacheHelpers';

export async function POST(request: Request) {
  if (!USER_API_KEY) {
    return NextResponse.json(respuestaApiEstandar({ noticias: [], errorMsg: 'API_KEY no configurada', cached: false, huboCambio: false, fallback: false, apiStatus: 'unauthorized', meta: {} }), { status: 500 });
  }
  const auth = request.headers.get('authorization');
  if (!auth || auth !== `Bearer ${USER_API_KEY}`) {
    return NextResponse.json(respuestaApiEstandar({ noticias: [], errorMsg: 'No autorizado', cached: false, huboCambio: false, fallback: false, apiStatus: 'unauthorized', meta: {} }), { status: 401 });
  }
  try {
    const data = await exportarCaches();
    return NextResponse.json(respuestaApiEstandar({ noticias: [], data, cached: true, huboCambio: false, fallback: false, apiStatus: 'ok', meta: { exportedAt: new Date().toISOString() } }));
  } catch (e: any) {
    return NextResponse.json(respuestaApiEstandar({ noticias: [], errorMsg: e?.message || 'Error desconocido', cached: false, huboCambio: false, fallback: false, apiStatus: 'error', meta: {} }), { status: 500 });
  }
}
