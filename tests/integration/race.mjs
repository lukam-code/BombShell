// 10 istovremenih zahteva za ISTI termin preko javnog API-ja → tačno 1 sme da uspe.
import { execSync } from "node:child_process";
const sql = (q) => execSync(`sudo -u postgres psql -d ${process.env.DEV_DB || "bombshell"} -tAq`, { input: q }).toString().trim();
const svc = sql("select id from services where name = 'Farbanje'");
const start = sql("select ((date_trunc('week', now() at time zone 'Europe/Belgrade') + interval '22 days')::date + time '11:00') at time zone 'Europe/Belgrade'");
const results = await Promise.all(
  Array.from({ length: 10 }, (_, i) =>
    fetch("http://localhost:54321/rest/v1/rpc/create_booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ p_service_id: svc, p_start_time: start, p_customer_name: `Trka Test ${i}`, p_customer_phone: `+38166100000${i}` }),
    }).then(async (r) => ({ status: r.status, body: await r.json() })),
  ),
);
const ok = results.filter((r) => r.status === 200);
const taken = results.filter((r) => r.body?.code === "BS409");
console.log(`uspešno: ${ok.length}, odbijeno kao zauzeto (BS409): ${taken.length}`);
if (ok.length !== 1 || taken.length !== 9) throw new Error("FAIL: trka za termin");
console.log("✔ Paralelno duplo bukiranje je sprečeno");
