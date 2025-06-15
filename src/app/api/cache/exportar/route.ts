import { NextResponse } from 'next/server';
import { exportarCaches, API_USER_KEY } from '@/utils/cacheManager';

export async function POST(request) {
  const auth = request.headers.get('authorization');
  if (!auth || auth !== `Bearer ${API_USER_KEY}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    await exportarCaches();
    return NextResponse.json({ ok: true, message: 'Caches exportadas correctamente.' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
