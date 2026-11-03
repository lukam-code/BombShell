import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { defaultLayout } from '../layout';
import type { Block, CreateResult, Layout, Occupancy, Reservation } from '../types';
import type { ReservationInput } from '../validation';
import type { Store } from './types';

interface Db { layout: Layout; reservations: Reservation[]; blocks: Block[] }

/**
 * Lokalna "baza" u JSON fajlu – za razvoj i male instalacije na jednom serveru.
 * Sve operacije prolaze kroz jedan lanac obećanja (mutex), pa je provera
 * zauzetosti + upis atomski u okviru procesa. Za više instanci koristi Supabase.
 */
export class FileStore implements Store {
  private chain: Promise<unknown> = Promise.resolve();
  constructor(private file = process.env.DATA_FILE ?? path.join(process.cwd(), 'data', 'db.json')) {}

  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.chain.then(fn, fn);
    this.chain = next.catch(() => undefined);
    return next;
  }

  private async read(): Promise<Db> {
    try {
      return JSON.parse(await fs.readFile(this.file, 'utf8')) as Db;
    } catch {
      return { layout: defaultLayout, reservations: [], blocks: [] };
    }
  }

  private async write(db: Db) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, this.file); // atomska zamena
  }

  getLayout() { return this.run(async () => (await this.read()).layout); }

  saveLayout(layout: Layout) {
    return this.run(async () => { const db = await this.read(); db.layout = layout; await this.write(db); });
  }

  getOccupancy(date: string): Promise<Occupancy> {
    return this.run(async () => {
      const db = await this.read();
      return {
        reserved: db.reservations.filter((r) => r.date === date && r.status === 'confirmed').map((r) => ({ tableId: r.tableId, slot: r.slot })),
        blocked: db.blocks.filter((b) => b.date === date).map((b) => ({ tableId: b.tableId, slot: b.slot })),
      };
    });
  }

  createReservation(input: ReservationInput): Promise<CreateResult> {
    return this.run(async () => {
      const db = await this.read();
      const table = db.layout.tables.find((t) => t.id === input.tableId);
      if (!table) return { ok: false, code: 'NO_TABLE' } as const;
      if (input.guests > table.seats) return { ok: false, code: 'CAPACITY' } as const;
      if (db.blocks.some((b) => b.tableId === input.tableId && b.date === input.date && (b.slot === '*' || b.slot === input.slot)))
        return { ok: false, code: 'BLOCKED' } as const;
      if (db.reservations.some((r) => r.status === 'confirmed' && r.tableId === input.tableId && r.date === input.date && r.slot === input.slot))
        return { ok: false, code: 'TAKEN' } as const;
      const reservation: Reservation = {
        id: randomUUID(), tableId: input.tableId, date: input.date, slot: input.slot, guests: input.guests,
        name: input.name, phone: input.phone, email: input.email, note: input.note,
        status: 'confirmed', createdAt: new Date().toISOString(),
      };
      db.reservations.push(reservation);
      await this.write(db);
      return { ok: true, reservation } as const;
    });
  }

  listReservations({ date, from }: { date?: string; from?: string }) {
    return this.run(async () => (await this.read()).reservations
      .filter((r) => (date ? r.date === date : from ? r.date >= from : true))
      .sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot)));
  }

  cancelReservation(id: string) {
    return this.run(async () => {
      const db = await this.read();
      const r = db.reservations.find((x) => x.id === id);
      if (!r) return false;
      r.status = 'cancelled';
      await this.write(db);
      return true;
    });
  }

  listBlocks(date?: string) {
    return this.run(async () => (await this.read()).blocks.filter((b) => !date || b.date === date));
  }

  addBlock(b: Omit<Block, 'id'>) {
    return this.run(async () => {
      const db = await this.read();
      const dupe = db.blocks.find((x) => x.tableId === b.tableId && x.date === b.date && x.slot === b.slot);
      if (dupe) return dupe;
      const block = { ...b, id: randomUUID() };
      db.blocks.push(block);
      await this.write(db);
      return block;
    });
  }

  removeBlock(id: string) {
    return this.run(async () => {
      const db = await this.read();
      const n = db.blocks.length;
      db.blocks = db.blocks.filter((b) => b.id !== id);
      if (db.blocks.length === n) return false;
      await this.write(db);
      return true;
    });
  }
}
