import { SALON } from "./salon.ts";

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

export function buildIcs(o: { uid: string; start: string; end: string; title: string; description: string; url?: string }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bombshell//Zakazivanje//SR",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${o.uid}@bombshell`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(new Date(o.start))}`,
    `DTEND:${icsDate(new Date(o.end))}`,
    `SUMMARY:${esc(o.title)}`,
    `LOCATION:${esc(SALON.addressFull)}`,
    `GEO:${SALON.lat};${SALON.lng}`,
    `DESCRIPTION:${esc(o.description)}`,
    ...(o.url ? [`URL:${o.url}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(o.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
