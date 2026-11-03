import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { layoutSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** PUT – čuva ceo raspored (stolovi + dekor). Postojeće rezervacije se ne brišu. */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Neautorizovano' }, { status: 401 });
  const p = layoutSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? 'Neispravan raspored' }, { status: 422 });
  await getStore().saveLayout(p.data);
  return NextResponse.json({ ok: true });
}
