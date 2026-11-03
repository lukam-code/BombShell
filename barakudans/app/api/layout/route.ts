import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** Javni raspored stolova (podatak, ne kod). */
export async function GET() {
  return NextResponse.json(await getStore().getLayout(), { headers: { 'Cache-Control': 'no-store' } });
}
