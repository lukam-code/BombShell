// Integracioni test obaveštenja: trigger u bazi → (pg_net imitacija) → Edge Function (Deno) → notification_log.
// Pretpostavlja pokrenut lokalni stack sa shim-om tests/sql/20_pgnet_vault_shim.sql i Edge Functions (vidi run-notifications.sh).
import { execSync } from "node:child_process";
import http from "node:http";

const DB = process.env.DEV_DB || "bombshell";
const sql = (q) => execSync(`sudo -u postgres psql -d ${DB} -tAq`, { input: q }).toString().trim();
const assert = (c, m) => {
  if (!c) throw new Error("FAIL: " + m);
  console.log("✔", m);
};

// Lažni Infobip server
const infobipCalls = [];
const mock = http.createServer((req, res) => {
  let b = "";
  req.on("data", (c) => (b += c));
  req.on("end", () => {
    infobipCalls.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(b) });
    res.setHeader("Content-Type", "application/json");
    if (req.url.startsWith("/viber")) return res.writeHead(200).end(JSON.stringify({ messages: [{ messageId: "v1", status: { groupName: "REJECTED", description: "Not a Viber user" } }] }));
    res.writeHead(200).end(JSON.stringify({ messages: [{ messageId: "s1", status: { groupName: "PENDING" } }] }));
  });
});
await new Promise((r) => mock.listen(9999, r));

async function flush() {
  const rows = sql("select id || '|' || url || '|' || body::text || '|' || headers::text from net.calls where not processed order by id")
    .split("\n")
    .filter(Boolean);
  const results = [];
  for (const row of rows) {
    const [id, url, body, headers] = row.split("|");
    const res = await fetch(url, { method: "POST", headers: JSON.parse(headers), body });
    results.push({ url, body: JSON.parse(body), status: res.status, json: await res.json() });
    sql(`update net.calls set processed = true where id = ${id}`);
  }
  return results;
}

sql("delete from notification_log; delete from net.calls;");
const svc = sql("select id from services where name = 'Šišanje'");
const day = sql("select to_char(date_trunc('week', now() at time zone 'Europe/Belgrade') + interval '21 days', 'YYYY-MM-DD')");

// 1) Online zakazivanje kao anonimni korisnik → trigger zakazuje 2 poziva
const created = sql(`set role anon; select id || '|' || cancel_token from create_booking('${svc}', ('${day} 12:00'::timestamp at time zone 'Europe/Belgrade'), 'Integracija Test', '+381651110001', 'klijent@example.com', null, true);`).split("\n").pop();
const [bookingId, token] = created.split("|");
let calls = await flush();
assert(calls.length === 2, "trigger posle create_booking poziva 2 Edge Function-a");
assert(calls[0].url === "http://localhost:54321/functions/v1/send-customer-notification" && calls[0].body.type === "confirmation", "SMS/Viber potvrda");
assert(calls[1].body.type === "booking_created" && calls[1].body.notify_salon === true, "email salonu + klijentkinji");
assert(calls.every((c) => c.status === 200), "Edge Functions odgovaraju 200");
assert(infobipCalls.length === 2 && infobipCalls[0].url === "/viber/2/messages" && infobipCalls[1].url === "/sms/2/text/advanced", "Viber odbijen → SMS fallback");
assert(infobipCalls[1].body.messages[0].text.includes(`/otkazivanje/${token}`), "SMS sadrži link za otkazivanje");
assert(infobipCalls[1].body.messages[0].text.includes("Vas termin je zakazan - Sisanje"), "SMS bez kvačica (GSM-7)");
let log = sql(`select string_agg(channel || ':' || type || ':' || status, ',' order by id) from notification_log where booking_id = '${bookingId}'`);
assert(log === "viber:confirmation:failed,sms:confirmation:sent,email:salon_new:skipped,email:confirmation:skipped", "notification_log: " + log);

// 2) Bez tajne → 401
const unauth = await fetch("http://localhost:54321/functions/v1/send-customer-notification", { method: "POST", body: JSON.stringify({ booking_id: bookingId, type: "confirmation" }) });
assert(unauth.status === 401, "poziv bez x-webhook-secret je odbijen (401)");

// 3) Klijentkinja otkazuje → SMS otkazivanje + email salonu
sql(`set role anon; select * from cancel_booking('${token}');`);
calls = await flush();
assert(calls.map((c) => c.body.type).join(",") === "cancellation,booking_cancelled", "otkazivanje pokreće SMS + email salonu");
log = sql(`select string_agg(channel || ':' || type || ':' || status, ',' order by id) from notification_log where booking_id = '${bookingId}' and type in ('cancellation','salon_cancelled')`);
assert(log === "viber:cancellation:failed,sms:cancellation:sent,email:salon_cancelled:skipped", "log otkazivanja: " + log);

// 4) Admin ručno, bez potvrde → nema SMS poziva, nema emaila salonu
sql(`set role authenticated; select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated"}', false);
     select * from admin_create_booking('${svc}', ('${day} 14:00'::timestamp at time zone 'Europe/Belgrade'), 'Telefonom Test', '+381651110002', null, null, false);`);
calls = await flush();
assert(calls.length === 1 && calls[0].body.type === "booking_created" && calls[0].body.notify_salon === false && calls[0].body.notify_customer === false, "admin bez potvrde: samo email poziv koji ništa ne šalje");

// 5) Recenzija → email salonu
sql(`set role anon; insert into reviews (customer_name, rating, text) values ('Integracija', 5, 'Test recenzija za email');`);
calls = await flush();
assert(calls.length === 1 && calls[0].body.type === "review_created", "nova recenzija → email salonu");
assert(sql("select status from notification_log where type = 'salon_review'") === "skipped", "salon_review: skipped (Resend nije podešen)");

// 6) Podsetnik: termin za 24h → poslat tačno jednom
sql(`insert into bookings (service_id, customer_name, customer_phone, start_time, end_time) values ('${svc}', 'Podsetnik Int', '+381651110003', date_trunc('hour', now()) + interval '24 hours', date_trunc('hour', now()) + interval '24 hours 45 minutes')`);
await flush(); // potvrda za ovaj termin
const before = infobipCalls.length;
const r1 = await (await fetch("http://localhost:54321/functions/v1/send-reminders", { method: "POST", headers: { "x-webhook-secret": "test-webhook-secret" } })).json();
const r2 = await (await fetch("http://localhost:54321/functions/v1/send-reminders", { method: "POST", headers: { "x-webhook-secret": "test-webhook-secret" } })).json();
assert(r1.processed >= 1 && r2.processed === 0, `podsetnik poslat jednom (prvi poziv: ${r1.processed}, drugi: ${r2.processed})`);
assert(infobipCalls.slice(before).some((c) => c.body.messages[0].text?.includes("Podsetnik - sutra u")), "SMS podsetnik poslat");
assert(sql("select count(*) from bookings where customer_name = 'Podsetnik Int' and reminder_sent_at is not null") === "1", "reminder_sent_at upisan");

mock.close();
console.log("\n✔ Integracioni test obaveštenja je prošao");
