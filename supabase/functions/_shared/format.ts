// Formatiranje datuma/vremena u zoni salona (Europe/Belgrade), srpski – latinica.
const TZ = "Europe/Belgrade";

function parts(iso: string) {
  const d = new Date(iso);
  const get = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("sr-Latn-RS", { timeZone: TZ, ...opts }).format(d);
  const num = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});
  return { get, num };
}

/** "ponedeljak" */
export function weekday(iso: string) {
  return parts(iso).get({ weekday: "long" });
}

/** "12.10." */
export function shortDate(iso: string) {
  const { num } = parts(iso);
  return `${num.day}.${num.month}.`;
}

/** "12.10.2026." */
export function numericDate(iso: string) {
  const { num } = parts(iso);
  return `${num.day}.${num.month}.${num.year}.`;
}

/** "15:00" */
export function time(iso: string) {
  const { num } = parts(iso);
  return `${num.hour === "24" ? "00" : num.hour}:${num.minute}`;
}

/** "ponedeljak, 12. oktobar 2026." */
export function longDate(iso: string) {
  const { get } = parts(iso);
  return `${get({ weekday: "long" })}, ${get({ day: "numeric", month: "long", year: "numeric" })}`.replace(/\s+г\.?$/, "");
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function priceText(price: number | null | undefined) {
  if (price == null) return "Cena na upit";
  return `od ${new Intl.NumberFormat("sr-Latn-RS").format(price)} RSD`;
}

export function durationText(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} h ${m} min`;
  return h ? `${h} h` : `${m} min`;
}

// ---------------------------------------------------------------------------
// GSM-7: SMS sa srpskim slovima bi prešao u UCS-2 (70 umesto 160 karaktera po
// poruci = skuplje). Zato se za SMS slova "skidaju": č,ć→c, š→s, ž→z, đ→dj.
// ---------------------------------------------------------------------------
const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXT = "^{}\\[~]|€";

const TRANSLIT: Record<string, string> = {
  č: "c", ć: "c", š: "s", ž: "z", đ: "dj",
  Č: "C", Ć: "C", Š: "S", Ž: "Z", Đ: "Dj",
  "–": "-", "—": "-", "„": '"', "“": '"', "”": '"', "‘": "'", "’": "'", "…": "...", "★": "*", " ": " ",
};

export function toGsm7(text: string) {
  let out = "";
  for (const ch of text) {
    const t = TRANSLIT[ch] ?? ch;
    for (const c of t) out += GSM7_BASIC.includes(c) || GSM7_EXT.includes(c) ? c : "?";
  }
  return out;
}

export function isGsm7(text: string) {
  for (const c of text) if (!GSM7_BASIC.includes(c) && !GSM7_EXT.includes(c)) return false;
  return true;
}
