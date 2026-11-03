import { NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/lib/config';
import { isAdmin } from '@/lib/auth';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

const schema = z.object({
  tableId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.string().refine((s) => s === '*' || config.booking.slots.includes(s)),
  reason: z.string().max(120).optional().default(''),
});

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Neautorizovano' }, { status: 401 });
  return NextResponse.json(await getStore().listBlocks(new URL(req.url).searchParams.get('date') ?? undefined));
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Neautorizovano' }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Neispravni podaci' }, { status: 422 });
  return NextResponse.json(await getStore().addBlock(p.data), { status: 201 });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Neautorizovano' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Nedostaje id' }, { status: 400 });
  const ok = await getStore().removeBlock(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
