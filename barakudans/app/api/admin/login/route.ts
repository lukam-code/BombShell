import { NextResponse } from 'next/server';
import { COOKIE, checkPassword, makeToken, rateLimit } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const cookieBase = { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/' };

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!rateLimit(`login:${ip}`, 5, 60_000)) return NextResponse.json({ error: 'Previše pokušaja' }, { status: 429 });
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !checkPassword(password)) return NextResponse.json({ error: 'Pogrešna lozinka' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), { ...cookieBase, maxAge: 60 * 60 * 12 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { ...cookieBase, maxAge: 0 });
  return res;
}
