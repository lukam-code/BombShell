import type { Block, CreateResult, Layout, Occupancy, Reservation } from '../types';
import type { ReservationInput } from '../validation';

/** Apstrakcija baze. Dve implementacije: FileStore (lokalno) i SupabaseStore (produkcija). */
export interface Store {
  getLayout(): Promise<Layout>;
  saveLayout(layout: Layout): Promise<void>;
  /** Anonimna zauzetost za ceo datum (svi termini). */
  getOccupancy(date: string): Promise<Occupancy>;
  /** Atomski: proveri sto/kapacitet/blokadu/zauzetost i upiši. Nikad dva potvrđena na isti (sto,datum,termin). */
  createReservation(input: ReservationInput): Promise<CreateResult>;
  listReservations(opts: { date?: string; from?: string }): Promise<Reservation[]>;
  cancelReservation(id: string): Promise<boolean>;
  listBlocks(date?: string): Promise<Block[]>;
  addBlock(b: Omit<Block, 'id'>): Promise<Block>;
  removeBlock(id: string): Promise<boolean>;
}
