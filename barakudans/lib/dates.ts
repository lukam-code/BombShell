import { config } from './config';

const { timeZone } = config.booking;

/** Trenutno vreme u zoni bara kao { date:'YYYY-MM-DD', time:'HH:mm' }. */
export function nowInVenue(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${g('hour')}:${g('minute')}` };
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Da li je bar taj dan otvoren (po config.hours). */
export function isOpenDay(date: string): boolean {
  const h = config.hours.find((x) => x.day === weekday(date));
  return !!h && !!h.open;
}

/**
 * Termini posle ponoći (npr. 00:00) pripadaju "noći" prethodnog datuma,
 * pa se za poređenje sa trenutnim vremenom računaju kao sledeći kalendarski dan.
 */
function slotMoment(date: string, slot: string): string {
  const hour = Number(slot.slice(0, 2));
  const d = hour < 6 ? addDays(date, 1) : date;
  return `${d} ${slot}`;
}

/** Validira da se (datum, termin) još može rezervisati. Vraća grešku ili null. */
export function bookableError(date: string, slot: string, now = new Date()): string | null {
  if (!config.booking.slots.includes(slot)) return 'Nepoznat termin.';
  const cur = nowInVenue(now);
  if (date < addDays(cur.date, -1)) return 'Datum je u prošlosti.';
  if (date > addDays(cur.date, config.booking.maxAdvanceDays)) return 'Datum je predaleko unapred.';
  if (!isOpenDay(date)) return 'Bar tog dana ne radi.';
  const start = slotMoment(date, slot);
  const limit = new Date(now.getTime() + config.booking.cutoffMinutes * 60000);
  const lim = nowInVenue(limit);
  if (start < `${lim.date} ${lim.time}`) return 'Termin je već počeo ili je prošao.';
  return null;
}

/** Lista datuma koji se mogu birati (otvoreni dani u narednih maxAdvanceDays). */
export function bookableDates(now = new Date()): string[] {
  const cur = nowInVenue(now).date;
  const out: string[] = [];
  for (let i = -1; i <= config.booking.maxAdvanceDays; i++) {
    const d = addDays(cur, i);
    if (isOpenDay(d) && config.booking.slots.some((s) => !bookableError(d, s, now))) out.push(d);
  }
  return out;
}

export const DAYS_SHORT = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
export const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];

export function formatDateLong(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return `${DAYS_SHORT[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONTHS_SHORT[d.getUTCMonth()]}`;
}
