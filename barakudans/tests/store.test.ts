import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { bookableError } from '../lib/dates';
import { FileStore } from '../lib/store/file';
import { normalizePhone, reservationSchema } from '../lib/validation';

const fresh = () => new FileStore(path.join(mkdtempSync(path.join(tmpdir(), 'bk-')), 'db.json'));
const base = (o: object = {}) => reservationSchema.parse({
  tableId: 't1', date: '2030-01-01', slot: '20:00', guests: 2, name: 'Pera Perić', phone: '064 123 4567', email: 'PERA@x.rs', ...o,
});

describe('FileStore.createReservation', () => {
  it('sprečava duplo bukiranje i pri istovremenim zahtevima', async () => {
    const s = fresh();
    const results = await Promise.all(Array.from({ length: 10 }, () => s.createReservation(base())));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.code === 'TAKEN')).toHaveLength(9);
  });
  it('zauzetost je po datumu i terminu, ne globalno', async () => {
    const s = fresh();
    expect((await s.createReservation(base())).ok).toBe(true);
    expect((await s.createReservation(base({ slot: '22:00' }))).ok).toBe(true);
    expect((await s.createReservation(base({ date: '2030-01-02' }))).ok).toBe(true);
  });
  it('odbija premali sto i nepostojeći sto', async () => {
    const s = fresh();
    expect(await s.createReservation(base({ guests: 3 }))).toEqual({ ok: false, code: 'CAPACITY' }); // t1 ima 2 mesta
    expect(await s.createReservation(base({ tableId: 'nema' }))).toEqual({ ok: false, code: 'NO_TABLE' });
  });
  it('blokiran sto se ne može rezervisati; otkazivanje oslobađa sto', async () => {
    const s = fresh();
    const b = await s.addBlock({ tableId: 't1', date: '2030-01-01', slot: '*', reason: '' });
    expect(await s.createReservation(base())).toEqual({ ok: false, code: 'BLOCKED' });
    await s.removeBlock(b.id);
    const r = await s.createReservation(base());
    expect(r.ok).toBe(true);
    if (r.ok) await s.cancelReservation(r.reservation.id);
    expect((await s.createReservation(base())).ok).toBe(true);
  });
  it('javna zauzetost ne sadrži lične podatke', async () => {
    const s = fresh();
    await s.createReservation(base());
    expect(JSON.stringify(await s.getOccupancy('2030-01-01'))).not.toMatch(/Pera|064|@/);
  });
});

describe('validacija', () => {
  it('normalizuje telefon', () => { expect(normalizePhone('064 123-4567')).toBe('+381641234567'); expect(normalizePhone('0038164123456')).toBe('+38164123456'); });
  it('odbija loše podatke', () => {
    expect(reservationSchema.safeParse({ ...base(), email: 'x' }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...base(), phone: 'abc' }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...base(), guests: 99 }).success).toBe(false);
  });
});

describe('bookableError', () => {
  const now = new Date('2030-06-05T12:00:00Z'); // sreda
  it('prošlost / predaleko / zatvoreno / nepoznat termin', () => {
    expect(bookableError('2030-06-01', '20:00', now)).toBeTruthy();
    expect(bookableError('2031-01-01', '20:00', now)).toBeTruthy();
    expect(bookableError('2030-06-10', '20:00', now)).toBeTruthy(); // ponedeljak – zatvoreno
    expect(bookableError('2030-06-07', '19:30', now)).toBeTruthy();
    expect(bookableError('2030-06-07', '20:00', now)).toBeNull();
  });
});
