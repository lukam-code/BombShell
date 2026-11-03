import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { nowInVenue } from '@/lib/dates';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** GET ?date=YYYY-MM-DD (jedan dan) ili bez parametra (sve od danas nadalje). */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Neautorizovano' }, { status: 401 });
  const date = new URL(req.url).searchParams.get('date') ?? undefined;
  const list = await getStore().listReservations(date ? { date } : { from: nowInVenue().date });
  return NextResponse.json(list);
}

/** PATCH { id } → otkazuje rezervaciju (sto se odmah oslobađa). */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Neautorizovano' }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: 'Nedostaje id' }, { status: 400 });
  const ok = await getStore().cancelReservation(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
