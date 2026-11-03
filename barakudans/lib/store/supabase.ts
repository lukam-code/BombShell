import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { defaultLayout } from '../layout';
import type { Block, CreateResult, Layout, Occupancy, Reservation, TableDef } from '../types';
import type { ReservationInput } from '../validation';
import type { Store } from './types';

/**
 * Supabase implementacija. Koristi SERVICE ROLE ključ i radi ISKLJUČIVO na serveru
 * (RLS na tabelama je uključen bez javnih politika – vidi supabase/schema.sql).
 * Atomsko bukiranje radi SQL funkcija `create_reservation` + unique indeks.
 */
export class SupabaseStore implements Store {
  private db: SupabaseClient;
  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false } });
  }

  private static unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
    if (res.error) throw new Error(res.error.message);
    return res.data as T;
  }

  async getLayout(): Promise<Layout> {
    const [t, s] = await Promise.all([
      this.db.from('tables').select('*').order('sort'),
      this.db.from('settings').select('value').eq('key', 'layout_meta').maybeSingle(),
    ]);
    const rows = SupabaseStore.unwrap(t) as Record<string, unknown>[];
    if (!rows.length) return defaultLayout;
    const meta = (SupabaseStore.unwrap(s) as { value: { width: number; height: number; fixtures: Layout['fixtures'] } } | null)?.value;
    return {
      width: meta?.width ?? defaultLayout.width,
      height: meta?.height ?? defaultLayout.height,
      fixtures: meta?.fixtures ?? defaultLayout.fixtures,
      tables: rows.map((r) => ({ id: r.id, label: r.label, x: r.x, y: r.y, w: r.w, h: r.h, shape: r.shape, seats: r.seats, zone: r.zone }) as TableDef),
    };
  }

  async saveLayout(layout: Layout) {
    const ids = layout.tables.map((t) => t.id);
    SupabaseStore.unwrap(await this.db.from('tables').upsert(layout.tables.map((t, i) => ({ ...t, sort: i }))));
    // obriši stolove koji više ne postoje (rezervacije ostaju – nema FK na tables.id)
    const existing = SupabaseStore.unwrap(await this.db.from('tables').select('id')) as { id: string }[];
    const gone = existing.map((e) => e.id).filter((id) => !ids.includes(id));
    if (gone.length) SupabaseStore.unwrap(await this.db.from('tables').delete().in('id', gone));
    SupabaseStore.unwrap(await this.db.from('settings').upsert({
      key: 'layout_meta', value: { width: layout.width, height: layout.height, fixtures: layout.fixtures },
    }));
  }

  async getOccupancy(date: string): Promise<Occupancy> {
    const [r, b] = await Promise.all([
      this.db.from('reservations').select('table_id,slot').eq('date', date).eq('status', 'confirmed'),
      this.db.from('blocks').select('table_id,slot').eq('date', date),
    ]);
    return {
      reserved: (SupabaseStore.unwrap(r) as { table_id: string; slot: string }[]).map((x) => ({ tableId: x.table_id, slot: x.slot })),
      blocked: (SupabaseStore.unwrap(b) as { table_id: string; slot: string }[]).map((x) => ({ tableId: x.table_id, slot: x.slot })),
    };
  }

  async createReservation(i: ReservationInput): Promise<CreateResult> {
    const res = await this.db.rpc('create_reservation', {
      p_table: i.tableId, p_date: i.date, p_slot: i.slot, p_guests: i.guests,
      p_name: i.name, p_phone: i.phone, p_email: i.email, p_note: i.note,
    });
    const out = SupabaseStore.unwrap(res) as { ok: boolean; code?: string; reservation?: Record<string, unknown> };
    if (!out.ok) return { ok: false, code: out.code as 'TAKEN' | 'BLOCKED' | 'NO_TABLE' | 'CAPACITY' };
    return { ok: true, reservation: SupabaseStore.map(out.reservation!) };
  }

  private static map(r: Record<string, unknown>): Reservation {
    return {
      id: r.id as string, tableId: r.table_id as string, date: r.date as string, slot: (r.slot as string).slice(0, 5),
      guests: r.guests as number, name: r.name as string, phone: r.phone as string, email: r.email as string,
      note: (r.note as string) ?? '', status: r.status as Reservation['status'], createdAt: r.created_at as string,
    };
  }

  async listReservations({ date, from }: { date?: string; from?: string }) {
    let q = this.db.from('reservations').select('*').order('date').order('slot');
    if (date) q = q.eq('date', date); else if (from) q = q.gte('date', from);
    return (SupabaseStore.unwrap(await q) as Record<string, unknown>[]).map(SupabaseStore.map);
  }

  async cancelReservation(id: string) {
    const d = SupabaseStore.unwrap(await this.db.from('reservations').update({ status: 'cancelled' }).eq('id', id).select('id'));
    return (d as unknown[]).length > 0;
  }

  async listBlocks(date?: string) {
    let q = this.db.from('blocks').select('*');
    if (date) q = q.eq('date', date);
    return (SupabaseStore.unwrap(await q) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string, tableId: r.table_id as string, date: r.date as string, slot: r.slot as string, reason: (r.reason as string) ?? '',
    }));
  }

  async addBlock(b: Omit<Block, 'id'>) {
    const r = SupabaseStore.unwrap(await this.db.from('blocks')
      .upsert({ table_id: b.tableId, date: b.date, slot: b.slot, reason: b.reason }, { onConflict: 'table_id,date,slot' })
      .select().single()) as Record<string, unknown>;
    return { id: r.id as string, tableId: r.table_id as string, date: r.date as string, slot: r.slot as string, reason: (r.reason as string) ?? '' };
  }

  async removeBlock(id: string) {
    const d = SupabaseStore.unwrap(await this.db.from('blocks').delete().eq('id', id).select('id'));
    return (d as unknown[]).length > 0;
  }
}
