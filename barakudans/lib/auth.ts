import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE = 'bk_admin';
const TTL_MS = 1000 * 60 * 60 * 12; // 12 h

function password(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  // Zaštita: u produkciji bez lozinke admin je ZAKLJUČAN. U razvoju postoji podrazumevana.
  return process.env.NODE_ENV === 'production' ? null : 'admin123';
}
function secret() { return process.env.ADMIN_SECRET || `dev-${password()}`; }
const sign = (v: string) => createHmac('sha256', secret()).update(v).digest('hex');

function safeEq(a: string, b: string) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

export function checkPassword(input: string): boolean {
  const p = password();
  return !!p && safeEq(input, p);
}

export function makeToken(): string {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token?: string): boolean {
  if (!token || !password()) return false;
  const [exp, sig] = token.split('.');
  return !!exp && !!sig && Number(exp) > Date.now() && safeEq(sig, sign(exp));
}

/** Za route handler-e: true ako je zahtev autorizovan admin sesijom. */
export async function isAdmin(): Promise<boolean> {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}

/** Primitivni limiter u memoriji (po ključu, N pokušaja u prozoru). */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length <= max;
}
