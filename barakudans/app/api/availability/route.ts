import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** GET /api/availability?date=YYYY-MM-DD – anonimna zauzetost svih termina tog datuma. */
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get('date') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Neispravan datum' }, { status: 400 });
  return NextResponse.json(await getStore().getOccupancy(date), { headers: { 'Cache-Control': 'no-store' } });
}
