/** Zajednički tipovi (klijent + server). */
export type Shape = 'round' | 'rect';

/** Sto na planu. x/y = gornji levi ugao u koordinatama plana (vidi Layout.width/height). */
export interface TableDef {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: Shape;
  seats: number;
  zone: string;
}

/** Dekor na planu (šank, DJ, ulaz...). Nije kliktljiv. */
export interface Fixture {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  width: number;
  height: number;
  tables: TableDef[];
  fixtures: Fixture[];
}

export type ReservationStatus = 'confirmed' | 'cancelled';

export interface Reservation {
  id: string;
  tableId: string;
  date: string; // YYYY-MM-DD (noć na koju se rezervacija odnosi)
  slot: string; // HH:mm
  guests: number;
  name: string;
  phone: string;
  email: string;
  note: string;
  status: ReservationStatus;
  createdAt: string;
}

/** Ručno blokiran sto. slot '*' = svi termini tog datuma. */
export interface Block {
  id: string;
  tableId: string;
  date: string;
  slot: string;
  reason: string;
}

/** Javna (anonimna) slika zauzetosti — bez ličnih podataka. */
export interface Occupancy {
  reserved: { tableId: string; slot: string }[];
  blocked: { tableId: string; slot: string }[];
}

export type CreateResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; code: 'TAKEN' | 'BLOCKED' | 'NO_TABLE' | 'CAPACITY' };
