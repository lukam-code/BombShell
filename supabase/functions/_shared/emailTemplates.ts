// HTML email šabloni u roze-belom stilu sajta (inline CSS, tabele – radi u Gmail/Outlook/Apple Mail).
import { capitalize, durationText, longDate, priceText, time } from "./format.ts";
import { SALON } from "./salon.ts";
import type { BookingRow, ReviewRow } from "./types.ts";

const C = { pink: "#E8A0B4", deep: "#B5507A", light: "#FCE8EE", cream: "#FFF9FA", ink: "#2D2D2D", soft: "#6B6B6B", gold: "#C9A96E" };

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function layout(opts: { preheader: string; title: string; body: string }) {
  return `<!doctype html>
<html lang="sr-Latn">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid ${C.light};overflow:hidden;">
    <tr><td align="center" style="background:${C.light};padding:28px 24px 22px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:6px;color:${C.ink};font-weight:bold;">BOMBSHELL</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:4px;color:#8A6D35;margin-top:6px;">SALON LEPOTE</div>
      <div style="width:60px;height:1px;background:${C.gold};margin:14px auto 0;line-height:1px;font-size:1px;">&nbsp;</div>
    </td></tr>
    <tr><td style="padding:28px 24px 8px;font-family:Arial,Helvetica,sans-serif;color:${C.ink};font-size:15px;line-height:1.6;">
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:24px;margin:0 0 16px;color:${C.ink};">${escapeHtml(opts.title)}</h1>
      ${opts.body}
    </td></tr>
    <tr><td style="padding:20px 24px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.soft};border-top:1px solid ${C.light};" align="center">
      ${escapeHtml(SALON.fullName)}<br>${escapeHtml(SALON.addressFull)}<br>
      <a href="${SALON.phoneHref}" style="color:${C.deep};text-decoration:none;">${SALON.phoneDisplay}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

function rows(items: Array<[string, string]>) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.light};border-radius:14px;margin:8px 0 20px;">
${items
  .map(
    ([k, v], i) => `<tr><td style="padding:10px 14px;font-size:13px;color:${C.soft};width:38%;vertical-align:top;${i ? `border-top:1px solid ${C.light};` : ""}">${escapeHtml(k)}</td>
<td style="padding:10px 14px;font-size:14px;color:${C.ink};font-weight:bold;vertical-align:top;${i ? `border-top:1px solid ${C.light};` : ""}">${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`,
  )
  .join("\n")}
</table>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="border-radius:999px;background:${C.deep};">
<a href="${href}" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
</td></tr></table>`;
}

function bookingRows(b: BookingRow) {
  return [
    ["Usluga", b.services?.name ?? "—"],
    ["Datum", capitalize(longDate(b.start_time))],
    ["Vreme", `${time(b.start_time)} – ${time(b.end_time)}${b.services ? ` (${durationText(b.services.duration_minutes)})` : ""}`],
  ] as Array<[string, string]>;
}

// ---------------------------------------------------------------- salonu
export function salonNewBooking(b: BookingRow, adminUrl: string) {
  const subject = `Novi termin: ${b.customer_name} – ${b.services?.name ?? "usluga"}, ${longDate(b.start_time)} ${time(b.start_time)}`;
  const details: Array<[string, string]> = [
    ...bookingRows(b),
    ["Klijentkinja", b.customer_name],
    ["Telefon", b.customer_phone],
    ["Email", b.customer_email ?? "—"],
    ["Napomena", b.note ?? "—"],
    ["SMS/Viber", b.notifications_opt_in ? "Da" : "Ne"],
  ];
  const html = layout({
    preheader: subject,
    title: "Novi online termin",
    body: `<p style="margin:0 0 8px;">Stiglo je novo zakazivanje preko sajta:</p>${rows(details)}${button(adminUrl, "Otvori u admin panelu")}`,
  });
  const text = `${subject}\n\n${details.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nAdmin panel: ${adminUrl}`;
  return { subject, html, text };
}

export function salonCancelledBooking(b: BookingRow, adminUrl: string) {
  const who = b.cancelled_by === "customer" ? "klijentkinja (online)" : "salon";
  const subject = `Otkazan termin: ${b.customer_name} – ${longDate(b.start_time)} ${time(b.start_time)}`;
  const details: Array<[string, string]> = [...bookingRows(b), ["Klijentkinja", b.customer_name], ["Telefon", b.customer_phone], ["Otkazao/la", who]];
  const html = layout({
    preheader: subject,
    title: "Termin je otkazan",
    body: `<p style="margin:0 0 8px;">Sledeći termin je otkazan i ponovo je slobodan:</p>${rows(details)}${button(adminUrl, "Otvori u admin panelu")}`,
  });
  const text = `${subject}\n\n${details.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nAdmin panel: ${adminUrl}`;
  return { subject, html, text };
}

export function salonNewReview(r: ReviewRow, adminUrl: string) {
  const subject = `Nova recenzija (${r.rating}★) čeka odobrenje`;
  const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
  const html = layout({
    preheader: subject,
    title: "Nova recenzija čeka odobrenje",
    body: `${rows([
      ["Ime", r.customer_name],
      ["Ocena", stars],
      ["Usluga", r.services?.name ?? "—"],
    ])}<p style="margin:0 0 20px;padding:14px 16px;background:${C.cream};border-left:3px solid ${C.gold};border-radius:8px;font-style:italic;">„${escapeHtml(r.text)}”</p>${button(adminUrl, "Odobri ili obriši")}`,
  });
  const text = `${subject}\n\n${r.customer_name} (${r.rating}/5): ${r.text}\n\n${adminUrl}`;
  return { subject, html, text };
}

// ---------------------------------------------------------------- klijentu
export function customerConfirmation(b: BookingRow, cancelUrl: string) {
  const subject = `Potvrda termina – ${b.services?.name ?? "BOMBSHELL"}, ${longDate(b.start_time)} u ${time(b.start_time)}`;
  const first = b.customer_name.split(/\s+/)[0];
  const details: Array<[string, string]> = [
    ...bookingRows(b),
    ["Cena", priceText(b.services?.price_rsd)],
    ["Adresa", SALON.addressFull],
  ];
  const html = layout({
    preheader: `Vaš termin je zakazan za ${longDate(b.start_time)} u ${time(b.start_time)}.`,
    title: `Draga ${first}, Vaš termin je zakazan!`,
    body: `<p style="margin:0 0 8px;">Hvala Vam na poverenju. Radujemo se Vašem dolasku!</p>
${rows(details)}
<p style="margin:0 0 20px;"><a href="${SALON.mapsUrl}" style="color:${C.deep};font-weight:bold;">📍 Otvori lokaciju u Google mapama</a></p>
<div style="background:${C.light};border-radius:14px;padding:16px 18px;margin:0 0 20px;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;margin-bottom:6px;">Politika otkazivanja</div>
<div style="font-size:13px;line-height:1.6;color:${C.ink};">${escapeHtml(SALON.cancellationPolicy)}</div>
</div>
${button(cancelUrl, "Otkaži termin")}
<p style="margin:0;font-size:12px;color:${C.soft};">U prilogu je fajl za dodavanje termina u kalendar telefona.</p>`,
  });
  const text = `${subject}\n\n${details.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nLokacija: ${SALON.mapsUrl}\n\nPolitika otkazivanja: ${SALON.cancellationPolicy}\n\nOtkazivanje: ${cancelUrl}`;
  return { subject, html, text };
}
