import { NextResponse } from 'next/server';
import { bookableError } from '@/lib/dates';
import { notify } from '@/lib/notify';
import { rateLimit } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { reservationSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const MESSAGES = {
  TAKEN: 'Taj sto je upravo rezervisan. Izaberi drugi.',
  BLOCKED: 'Taj sto trenutno nije dostupan.',
  NO_TABLE: 'Sto ne postoji.',
  CAPACITY: 'Sto nema dovoljno mesta za izabran broj osoba.',
} as const;

/**
 * POST /api/reservations
 * SERVERSKA validacija je izvor istine: šema, datum/termin, kapacitet, blokade i duplo bukiranje
 * (sve u store.createReservation, atomski). Klijentska provera je samo UX.
 */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!rateLimit(`res:${ip}`, 8, 60_000)) return NextResponse.json({ error: 'Previše pokušaja. Probaj za minut.' }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Neispravan zahtev' }, { status: 400 }); }

  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Proveri unete podatke', fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  const input = parsed.data;
  if (input.website) return NextResponse.json({ ok: true, fake: true }); // honeypot: tiho ignoriši bota

  const dateErr = bookableError(input.date, input.slot);
  if (dateErr) return NextResponse.json({ error: dateErr }, { status: 422 });

  const store = getStore();
  const result = await store.createReservation(input);
  if (!result.ok) {
    return NextResponse.json({ error: MESSAGES[result.code], code: result.code }, { status: result.code === 'TAKEN' || result.code === 'BLOCKED' ? 409 : 422 });
  }

  const layout = await store.getLayout();
  const label = layout.tables.find((t) => t.id === result.reservation.tableId)?.label ?? result.reservation.tableId;
  const notified = await notify(result.reservation, label, input.notifyEmail, input.notifySms);

  const r = result.reservation;
  // Javni odgovor: bez tuđih podataka, samo ono što gost sam poslao + šifra.
  return NextResponse.json({
    ok: true,
    code: r.id.slice(0, 8).toUpperCase(),
    reservation: { tableId: r.tableId, tableLabel: label, date: r.date, slot: r.slot, guests: r.guests, name: r.name },
    notified,
  }, { status: 201 });
}
