import { addDays, format as fmt } from "date-fns";
import { srLatn } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { TIME_ZONE } from "./siteConfig";

/** Formatiranje trenutka (ISO/Date) u lokalnom vremenu salona, srpski (latinica). */
export function formatBelgrade(date: Date | string, pattern: string) {
  return formatInTimeZone(date, TIME_ZONE, pattern, { locale: srLatn });
}

/** "subota, 4. oktobar 2026." */
export function formatLongDate(date: Date | string) {
  return formatBelgrade(date, "EEEE, d. MMMM yyyy.");
}

export function formatTime(date: Date | string) {
  return formatBelgrade(date, "HH:mm");
}

/** Današnji datum u Beogradu kao "yyyy-MM-dd". */
export function todayInBelgrade(now = new Date()) {
  return formatInTimeZone(now, TIME_ZONE, "yyyy-MM-dd");
}

/** Lokalni datum + vreme u Beogradu → UTC Date. */
export function belgradeToUtc(dateYmd: string, timeHm: string) {
  return fromZonedTime(`${dateYmd}T${timeHm}:00`, TIME_ZONE);
}

/** Pretvara "yyyy-MM-dd" u Date na ponoć (lokalno, za kalendar). */
export function ymdToDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dateToYmd(date: Date) {
  return fmt(date, "yyyy-MM-dd");
}

export function addDaysYmd(ymd: string, days: number) {
  return dateToYmd(addDays(ymdToDate(ymd), days));
}

/** Dan u nedelji (0 = nedelja) za "yyyy-MM-dd". */
export function dayOfWeek(ymd: string) {
  return ymdToDate(ymd).getDay();
}

export function formatYmdLong(ymd: string) {
  return fmt(ymdToDate(ymd), "EEEE, d. MMMM yyyy.", { locale: srLatn });
}

export function nowInBelgrade() {
  return toZonedTime(new Date(), TIME_ZONE);
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

export function formatPrice(price: number | null | undefined, prefix = "od ") {
  if (price == null) return "Cena na upit";
  return `${prefix}${new Intl.NumberFormat("sr-Latn-RS").format(price)} RSD`;
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
