import { z } from 'zod';
import { config } from './config';

/** Normalizuje telefon: skida razmake/crtice, 00 → +, vodeće 0 → +381. */
export function normalizePhone(raw: string): string {
  let p = raw.replace(/[\s\-().\/]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  else if (p.startsWith('0')) p = '+381' + p.slice(1);
  return p;
}

const phone = z
  .string().trim().min(6, 'Unesi broj telefona')
  .transform(normalizePhone)
  .refine((p) => /^\+\d{8,15}$/.test(p), 'Neispravan broj telefona');

/** Šema deljena između klijenta i servera. */
export const reservationSchema = z.object({
  tableId: z.string().min(1, 'Izaberi sto').max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Neispravan datum'),
  slot: z.string().regex(/^\d{2}:\d{2}$/, 'Neispravan termin'),
  guests: z.coerce.number().int().min(1, 'Najmanje 1 osoba').max(config.booking.maxGuests, `Najviše ${config.booking.maxGuests} osoba online`),
  name: z.string().trim().min(2, 'Unesi ime').max(80),
  phone,
  email: z.string().trim().toLowerCase().email('Neispravan email').max(120),
  note: z.string().trim().max(300, 'Najviše 300 karaktera').optional().default(''),
  notifyEmail: z.boolean().optional().default(true),
  notifySms: z.boolean().optional().default(false),
  /** Honeypot – botovi popunjavaju, ljudi ne vide. */
  website: z.string().max(0).optional().default(''),
});

export type ReservationInput = z.infer<typeof reservationSchema>;

export const layoutSchema = z.object({
  width: z.number().min(200).max(4000),
  height: z.number().min(200).max(4000),
  tables: z.array(z.object({
    id: z.string().min(1).max(40).regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string().min(1).max(8),
    x: z.number(), y: z.number(),
    w: z.number().min(20).max(400), h: z.number().min(20).max(400),
    shape: z.enum(['round', 'rect']),
    seats: z.number().int().min(1).max(30),
    zone: z.string().max(40),
  })).max(80),
  fixtures: z.array(z.object({
    id: z.string().min(1).max(40), label: z.string().max(20),
    x: z.number(), y: z.number(), w: z.number().min(10), h: z.number().min(10),
  })).max(30),
}).superRefine((l, ctx) => {
  const ids = new Set<string>();
  l.tables.forEach((t, i) => {
    if (ids.has(t.id)) ctx.addIssue({ code: 'custom', message: `Dupliran ID stola: ${t.id}`, path: ['tables', i, 'id'] });
    ids.add(t.id);
  });
});
