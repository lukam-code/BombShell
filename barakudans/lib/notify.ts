import { config } from './config';
import { formatDateLong } from './dates';
import type { Reservation } from './types';

export type NotifyStatus = 'sent' | 'skipped' | 'failed';
export interface NotifyResult { email: NotifyStatus; sms: NotifyStatus }

function text(r: Reservation, tableLabel: string) {
  return `${config.name}: rezervacija potvrđena. ${formatDateLong(r.date)} u ${r.slot}, sto ${tableLabel}, ${r.guests} os. Šifra: ${r.id.slice(0, 8).toUpperCase()}. Otkazivanje: ${config.contact.phone}`;
}

async function sendEmail(r: Reservation, label: string): Promise<NotifyStatus> {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.log(`[notify] RESEND_API_KEY nije postavljen – email za ${r.email} preskočen`); return 'skipped'; }
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM ?? `${config.name} <onboarding@resend.dev>`,
      to: r.email,
      subject: `Rezervacija potvrđena – ${config.name}`,
      html: `<h2>Hvala, ${esc(r.name)}!</h2><p>${esc(text(r, label))}</p><p>${esc(config.contact.address)}</p>`,
    }),
  });
  return res.ok ? 'sent' : 'failed';
}

async function sendSms(r: Reservation, label: string): Promise<NotifyStatus> {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) { console.log(`[notify] Twilio nije podešen – SMS za ${r.phone} preskočen`); return 'skipped'; }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: r.phone, From: from, Body: text(r, label) }),
  });
  return res.ok ? 'sent' : 'failed';
}

/** Nikad ne baca grešku – neuspela potvrda ne sme da poništi rezervaciju. */
export async function notify(r: Reservation, tableLabel: string, wantEmail: boolean, wantSms: boolean): Promise<NotifyResult> {
  const safe = async (want: boolean, fn: () => Promise<NotifyStatus>): Promise<NotifyStatus> => {
    if (!want) return 'skipped';
    try { return await fn(); } catch (e) { console.error('[notify]', e); return 'failed'; }
  };
  const [email, sms] = await Promise.all([safe(wantEmail, () => sendEmail(r, tableLabel)), safe(wantSms, () => sendSms(r, tableLabel))]);
  return { email, sms };
}
