// Pokretanje: deno test supabase/functions/_shared/
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { notifyCustomer } from "./customer.ts";
import { handleEmail } from "./emails.ts";
import { isGsm7, toGsm7 } from "./format.ts";
import { smsText, viberText } from "./messages.ts";
import type { BookingRow, Db, LogEntry, ReviewRow } from "./types.ts";

const booking: BookingRow = {
  id: "b1",
  service_id: "s1",
  customer_name: "Đurđa Šćekić",
  customer_phone: "+381651234567",
  customer_email: "djurdja@example.com",
  note: "Molim <b>kraće</b>",
  start_time: "2026-10-12T13:00:00Z", // 15:00 u Beogradu
  end_time: "2026-10-12T13:45:00Z",
  status: "pending",
  cancel_token: "tok-123",
  notifications_opt_in: true,
  cancelled_by: null,
  services: { name: "Šišanje", duration_minutes: 45, price_rsd: null },
};

function fakeDb(b: BookingRow = booking, review?: ReviewRow) {
  const logs: LogEntry[] = [];
  const db: Db = {
    getBooking: async () => b,
    getReview: async () => review ?? null,
    claimDueReminders: async () => [],
    log: async (e) => void logs.push(e),
  };
  return { db, logs };
}

function fakeFetch(handler: (url: string, body: any) => { status?: number; json: unknown }) {
  const calls: Array<{ url: string; body: any; headers: Headers }> = [];
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ url, body, headers: new Headers(init?.headers) });
    const r = handler(url, body);
    return new Response(JSON.stringify(r.json), { status: r.status ?? 200 });
  }) as typeof fetch;
  return { fn, calls };
}

const msgInput = { serviceName: "Šišanje", startTime: booking.start_time, cancelUrl: "https://bombshell.rs/otkazivanje/tok-123", siteUrl: "https://bombshell.rs" };
const infobipEnv = { INFOBIP_API_KEY: "k", INFOBIP_BASE_URL: "xyz.api.infobip.com", INFOBIP_SMS_SENDER: "Bombshell", SITE_URL: "https://bombshell.rs" };

Deno.test("GSM-7: srpska slova i crtica se prevode", () => {
  assertEquals(toGsm7("Ćosića čšžđ ČŠŽĐ – „ok”"), 'Cosica cszdj CSZDj - "ok"');
  assert(isGsm7(toGsm7("Vaš termin – dođite 🙂")));
});

Deno.test("tekstovi poruka – potvrda (Viber sa kvačicama, SMS GSM-7)", () => {
  const v = viberText("confirmation", msgInput);
  assertEquals(
    v,
    "BOMBSHELL: Vaš termin je zakazan – Šišanje, ponedeljak 12.10. u 15:00. Adresa: Branimira Ćosića 11, Novi Sad. Otkazivanje najkasnije 24h ranije: https://bombshell.rs/otkazivanje/tok-123",
  );
  const s = smsText("confirmation", msgInput);
  assertEquals(
    s,
    "BOMBSHELL: Vas termin je zakazan - Sisanje, ponedeljak 12.10. u 15:00. Adresa: Branimira Cosica 11, Novi Sad. Otkazivanje najkasnije 24h ranije: https://bombshell.rs/otkazivanje/tok-123",
  );
  assert(isGsm7(s));
});

Deno.test("tekstovi poruka – podsetnik i otkazivanje", () => {
  assertEquals(
    smsText("reminder", msgInput),
    "BOMBSHELL: Podsetnik - sutra u 15:00 imate termin (Sisanje). Ako ne mozete da dodjete, otkazite ovde: https://bombshell.rs/otkazivanje/tok-123 ili pozovite 065 662 6031.",
  );
  assertEquals(
    smsText("cancellation", msgInput),
    "BOMBSHELL: Vas termin 12.10. u 15:00 je otkazan. Za novi termin: https://bombshell.rs/zakazivanje",
  );
  assertStringIncludes(viberText("reminder", msgInput), "dođete");
});

Deno.test("bez Infobip ključeva: skipped, bez greške i bez HTTP poziva", async () => {
  const { db, logs } = fakeDb();
  const { fn, calls } = fakeFetch(() => ({ json: {} }));
  const r = await notifyCustomer({ env: {}, db, fetch: fn }, booking, "confirmation");
  assertEquals(r.status, "skipped");
  assertEquals(calls.length, 0);
  assertEquals(logs.map((l) => l.status), ["skipped"]);
});

Deno.test("opt-out: skipped", async () => {
  const { db, logs } = fakeDb();
  const r = await notifyCustomer({ env: infobipEnv, db }, { ...booking, notifications_opt_in: false }, "confirmation");
  assertEquals(r.status, "skipped");
  assertStringIncludes(logs[0].error!, "nije želela");
});

Deno.test("Viber uspeh → nema SMS-a", async () => {
  const { db, logs } = fakeDb();
  const { fn, calls } = fakeFetch(() => ({ json: { messages: [{ messageId: "m1", status: { groupName: "PENDING" } }] } }));
  const r = await notifyCustomer({ env: { ...infobipEnv, INFOBIP_VIBER_SENDER: "Bombshell" }, db, fetch: fn }, booking, "confirmation");
  assertEquals(r, { status: "sent", channel: "viber" });
  assertEquals(calls.length, 1);
  assertEquals(calls[0].url, "https://xyz.api.infobip.com/viber/2/messages");
  assertEquals(calls[0].headers.get("Authorization"), "App k");
  assertEquals(calls[0].body.messages[0].destinations[0].to, "381651234567");
  assertStringIncludes(calls[0].body.messages[0].content.body.text, "Vaš termin");
  assertEquals(logs.map((l) => `${l.channel}:${l.status}`), ["viber:sent"]);
});

Deno.test("Viber neuspeh → automatski SMS fallback", async () => {
  const { db, logs } = fakeDb();
  const { fn, calls } = fakeFetch((url) =>
    url.includes("viber")
      ? { status: 400, json: { requestError: { serviceException: { text: "Invalid sender" } } } }
      : { json: { messages: [{ messageId: "s1", status: { groupName: "PENDING" } }] } },
  );
  const r = await notifyCustomer({ env: { ...infobipEnv, INFOBIP_VIBER_SENDER: "X" }, db, fetch: fn }, booking, "reminder");
  assertEquals(r, { status: "sent", channel: "sms" });
  assertEquals(calls[1].url, "https://xyz.api.infobip.com/sms/2/text/advanced");
  assertEquals(calls[1].body.messages[0].from, "Bombshell");
  assert(isGsm7(calls[1].body.messages[0].text));
  assertEquals(logs.map((l) => `${l.channel}:${l.status}`), ["viber:failed", "sms:sent"]);
  assertStringIncludes(logs[0].error!, "Invalid sender");
});

Deno.test("SMS odbijen (REJECTED) → failed u logu", async () => {
  const { db, logs } = fakeDb();
  const { fn } = fakeFetch(() => ({ json: { messages: [{ status: { groupName: "REJECTED", description: "Not enough credits" } }] } }));
  const r = await notifyCustomer({ env: infobipEnv, db, fetch: fn }, booking, "confirmation");
  assertEquals(r.status, "failed");
  assertEquals(logs[0].status, "failed");
  assertStringIncludes(logs[0].error!, "Not enough credits");
});

Deno.test("mrežna greška ne baca izuzetak", async () => {
  const { db, logs } = fakeDb();
  const fn = (async () => {
    throw new Error("ECONNRESET");
  }) as typeof fetch;
  const r = await notifyCustomer({ env: infobipEnv, db, fetch: fn }, booking, "confirmation");
  assertEquals(r.status, "failed");
  assertEquals(logs[0].error, "ECONNRESET");
});

Deno.test("otkazivanje se šalje samo za otkazan termin", async () => {
  const { db, logs } = fakeDb();
  const r = await notifyCustomer({ env: infobipEnv, db }, booking, "cancellation");
  assertEquals(r.status, "skipped");
  assertEquals(logs.length, 1);
});

Deno.test("email bez Resend ključa: skipped za salon i klijentkinju", async () => {
  const { db, logs } = fakeDb();
  const r = await handleEmail({ env: { SALON_NOTIFICATION_EMAIL: "salon@x.rs" }, db }, { type: "booking_created", booking_id: "b1" });
  assertEquals(r, { salon: "skipped", customer: "skipped" });
  assertEquals(logs.map((l) => `${l.type}:${l.status}`), ["salon_new:skipped", "confirmation:skipped"]);
});

Deno.test("email novi termin: salon + klijentkinja sa .ics prilogom, HTML je escape-ovan", async () => {
  const { db, logs } = fakeDb();
  const { fn, calls } = fakeFetch(() => ({ json: { id: "e1" } }));
  const env = { RESEND_API_KEY: "re_x", SALON_NOTIFICATION_EMAIL: "salon@x.rs", SITE_URL: "https://bombshell.rs" };
  const r = await handleEmail({ env, db, fetch: fn }, { type: "booking_created", booking_id: "b1" });
  assertEquals(r, { salon: "sent", customer: "sent" });
  const [salon, customer] = calls.map((c) => c.body);
  assertEquals(salon.subject, "Novi termin: Đurđa Šćekić – Šišanje, ponedeljak, 12. oktobar 2026. 15:00");
  assertEquals(salon.from, "BOMBSHELL <onboarding@resend.dev>");
  assertStringIncludes(salon.html, "Otvori u admin panelu");
  assertStringIncludes(salon.html, "https://bombshell.rs/admin/termini?id=b1");
  assertStringIncludes(salon.html, "Molim &lt;b&gt;kraće&lt;/b&gt;");
  assertEquals(customer.to, ["djurdja@example.com"]);
  assertStringIncludes(customer.html, "Otkaži termin");
  assertStringIncludes(customer.html, "https://bombshell.rs/otkazivanje/tok-123");
  assertStringIncludes(customer.html, "maps.google.com");
  assertStringIncludes(customer.html, "Politika otkazivanja");
  assertEquals(customer.attachments[0].filename, "bombshell-termin.ics");
  const ics = new TextDecoder().decode(Uint8Array.from(atob(customer.attachments[0].content), (c) => c.charCodeAt(0)));
  assertStringIncludes(ics, "DTSTART:20261012T130000Z");
  assertStringIncludes(ics, "SUMMARY:BOMBSHELL – Šišanje");
  assertEquals(logs.map((l) => l.status), ["sent", "sent"]);
});

Deno.test("email admin-termin: bez salona, klijentkinja po izboru", async () => {
  const { db } = fakeDb();
  const { fn, calls } = fakeFetch(() => ({ json: { id: "e1" } }));
  const env = { RESEND_API_KEY: "re_x", SALON_NOTIFICATION_EMAIL: "salon@x.rs" };
  const r = await handleEmail({ env, db, fetch: fn }, { type: "booking_created", booking_id: "b1", notify_salon: false, notify_customer: false });
  assertEquals(r, {});
  assertEquals(calls.length, 0);
});

Deno.test("email otkazan termin: piše ko je otkazao", async () => {
  const { db } = fakeDb({ ...booking, status: "cancelled", cancelled_by: "customer" });
  const { fn, calls } = fakeFetch(() => ({ json: { id: "e1" } }));
  await handleEmail({ env: { RESEND_API_KEY: "re_x", SALON_NOTIFICATION_EMAIL: "salon@x.rs" }, db, fetch: fn }, { type: "booking_cancelled", booking_id: "b1" });
  assertEquals(calls[0].body.subject, "Otkazan termin: Đurđa Šćekić – ponedeljak, 12. oktobar 2026. 15:00");
  assertStringIncludes(calls[0].body.html, "klijentkinja (online)");
});

Deno.test("email nova recenzija", async () => {
  const review: ReviewRow = { id: "r1", customer_name: "Ana", rating: 4, text: "Sjajno!", created_at: "2026-10-01T10:00:00Z", services: null };
  const { db, logs } = fakeDb(booking, review);
  const { fn, calls } = fakeFetch(() => ({ json: { id: "e1" } }));
  await handleEmail({ env: { RESEND_API_KEY: "re_x", SALON_NOTIFICATION_EMAIL: "salon@x.rs" }, db, fetch: fn }, { type: "review_created", review_id: "r1" });
  assertEquals(calls[0].body.subject, "Nova recenzija (4★) čeka odobrenje");
  assertEquals(logs[0].type, "salon_review");
});
