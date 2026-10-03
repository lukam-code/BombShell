// E2E test booking toka protiv lokalnog test-stack-a (tests/local-stack/start.sh).
// Pokretanje: node tests/e2e/booking.e2e.mjs [mobile|desktop]
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const mode = process.argv[2] || "mobile";
const shots = process.env.SHOTS_DIR;
const DB = process.env.DEV_DB || "bombshell";
const sql = (q) =>
  execSync(`sudo -u postgres psql -d ${DB} -tAq`, { input: q }).toString().trim();

const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined });
const ctx = await browser.newContext(
  mode === "mobile"
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true }
    : { viewport: { width: 1366, height: 900 }, acceptDownloads: true },
);
await ctx.addInitScript(() => {
  try {
    sessionStorage.setItem("bombshell-intro-seen", "1");
  } catch {}
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const step = async (name) => {
  console.log("✔", name);
  if (shots) await page.screenshot({ path: `${shots}/${mode}-${name.replace(/\W+/g, "_")}.png` });
};
const assert = (cond, msg) => {
  if (!cond) throw new Error("FAIL: " + msg);
};

// Ponedeljak za 2 nedelje (uvek > 24h, unutar 60 dana)
const target = sql(
  "select to_char(date_trunc('week', now() at time zone 'Europe/Belgrade') + interval '14 days', 'YYYY-MM-DD')",
);
const sunday = sql(
  "select to_char(date_trunc('week', now() at time zone 'Europe/Belgrade') + interval '13 days', 'YYYY-MM-DD')",
);
const minute = mode === "mobile" ? "10:00" : "11:00";
const other = mode === "mobile" ? "15:00" : "16:00";
const customerName = mode === "mobile" ? "Test Klijentkinja" : "Desktop Klijentkinja";
const phoneInput = mode === "mobile" ? "065 12 34 567" : "+381 64 765 4321";
const phoneE164 = mode === "mobile" ? "+381651234567" : "+381647654321";

// 1) Direktan link iz kartice usluge (?usluga=ID) preskače na korak 2
const serviceId = sql("select id from services where name = 'Šišanje'");
await page.goto(`${BASE}/zakazivanje?usluga=${serviceId}`);
await page.getByText("Korak 2 od 5", { exact: true }).waitFor();
await step("korak2-iz-linka");

// nazad na korak 1 → izbor kategorije i usluge
await page.getByRole("button", { name: /Nazad na korak: Usluga/ }).click();
await page.getByText("Korak 1 od 5", { exact: true }).waitFor();
await page.getByRole("button", { name: /Sve kategorije/ }).click();
await step("korak1-kategorije");
await page.getByRole("button", { name: /Ženski frizer/ }).click();
await page.getByRole("button", { name: /^Šišanje/ }).click();
await page.getByText("Korak 2 od 5", { exact: true }).waitFor();

// 2) Kalendar: nedelja onemogućena, izbor datuma
async function gotoMonth(ymd) {
  await page.locator("[data-ymd]").first().waitFor();
  await page.waitForTimeout(400);
  for (let i = 0; i < 3; i++) {
    if (await page.locator(`[data-ymd="${ymd}"]`).count()) return;
    await page.getByRole("button", { name: "Sledeći mesec" }).click();
    await page.waitForTimeout(200);
  }
}
await gotoMonth(sunday);
await page.waitForTimeout(400);
assert((await page.locator(`[data-ymd="${sunday}"]`).getAttribute("aria-disabled")) === "true", "nedelja je onemogućena");
await gotoMonth(target);
await step("korak2-kalendar");
await page.locator(`[data-ymd="${target}"]`).click();

// 3) Termini
await page.getByText("Korak 3 od 5", { exact: true }).waitFor();
await page.getByRole("button", { name: minute, exact: true }).waitFor();
await step("korak3-termini");
await page.getByRole("button", { name: minute, exact: true }).click();

// 4) Podaci – validacija
await page.getByText("Korak 4 od 5", { exact: true }).waitFor();
await page.getByRole("button", { name: /Dalje na pregled/ }).click();
await page.getByText("Unesite ime i prezime.").first().waitFor();
await page.getByLabel("Broj mobilnog telefona").fill("021 123 456");
await page.getByLabel("Ime i prezime").fill(customerName);
await page.getByText(/Unesite ispravan broj mobilnog telefona/).waitFor();
await page.getByLabel("Broj mobilnog telefona").fill(phoneInput);
await page.getByLabel("Email (opciono)").fill("test@example.com");
await page.getByLabel("Napomena (opciono)").fill("Želim kraću frizuru, hvala!");
assert(await page.getByLabel(/Želim da primim potvrdu/).isChecked(), "opt-in je podrazumevano čekiran");
await step("korak4-podaci");

// Nazad pa napred – podaci ostaju sačuvani
await page.getByRole("button", { name: /Nazad na korak: Termin/ }).click();
await page.getByText("Korak 3 od 5", { exact: true }).waitFor();
await page.getByRole("button", { name: minute, exact: true }).click();
await page.getByText("Korak 4 od 5", { exact: true }).waitFor();
assert((await page.getByLabel("Ime i prezime").inputValue()) === customerName, "ime je sačuvano posle povratka");
await page.getByRole("button", { name: /Dalje na pregled/ }).click();

// 5) Pregled – dugme onemogućeno bez checkbox-a
await page.getByText("Korak 5 od 5", { exact: true }).waitFor();
const confirmBtn = page.getByRole("button", { name: "Potvrdi termin" });
assert(await confirmBtn.isDisabled(), "Potvrdi termin je onemogućeno bez prihvatanja politike");
assert(await page.getByRole("heading", { name: "Politika otkazivanja" }).isVisible(), "politika otkazivanja je prikazana");
await page.getByLabel("Upoznata sam sa politikom otkazivanja").check();
assert(await confirmBtn.isEnabled(), "dugme je omogućeno posle prihvatanja");
await step("korak5-pregled");

// Simulacija: neko drugi zauzme isti termin u međuvremenu
sql(`insert into bookings (service_id, customer_name, customer_phone, start_time, end_time, status)
     values ('${serviceId}', 'Druga Klijentkinja', '+381601112223',
             ('${target} ${minute}'::timestamp at time zone 'Europe/Belgrade'),
             ('${target} ${minute}'::timestamp at time zone 'Europe/Belgrade') + interval '45 minutes', 'confirmed')`);
await confirmBtn.click();
await page.getByText("Nažalost, ovaj termin je upravo zauzet. Izaberite drugi.").waitFor();
await page.getByText("Korak 3 od 5", { exact: true }).waitFor();
await page.getByRole("button", { name: "09:00", exact: true }).waitFor();
assert((await page.getByRole("button", { name: minute, exact: true }).count()) === 0, "zauzet termin je uklonjen iz osveženih slotova");
await step("zauzet-termin");

// Izbor drugog termina i uspešna potvrda
await page.getByRole("button", { name: other, exact: true }).click();
await page.getByText("Korak 4 od 5", { exact: true }).waitFor();
await page.getByRole("button", { name: /Dalje na pregled/ }).click();
await page.getByText("Korak 5 od 5", { exact: true }).waitFor();
const cb = page.getByLabel("Upoznata sam sa politikom otkazivanja");
if (!(await cb.isChecked())) await cb.check();
await page.getByRole("button", { name: "Potvrdi termin" }).click();
await page.getByText("Vaš termin je zakazan!").waitFor();
await page.waitForTimeout(1200);
await step("uspeh");

// .ics fajl
const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Dodaj u kalendar/ }).click()]);
const ics = fs.readFileSync(await download.path(), "utf8");
assert(ics.includes("BEGIN:VCALENDAR") && ics.includes("SUMMARY:BOMBSHELL – Šišanje"), ".ics sadrži termin");
console.log("✔ .ics fajl");

// Upis u bazi: E.164 telefon, opt-in, status pending
const row = sql(`select customer_phone || '|' || notifications_opt_in || '|' || status || '|' || coalesce(customer_email,'') from bookings
  where customer_name = '${customerName}' and start_time = ('${target} ${other}'::timestamp at time zone 'Europe/Belgrade')`);
assert(row === `${phoneE164}|true|pending|test@example.com`, "u bazi: " + row);
console.log("✔ upis u bazi:", row);

// 6) Otkazivanje preko linka
await page.getByRole("link", { name: /Otkažite termin ovde/ }).click();
await page.getByRole("heading", { name: "Vaš termin" }).waitFor();
await step("otkazivanje-detalji");
await page.getByRole("button", { name: "Otkaži termin" }).click();
await page.getByRole("button", { name: "Da, otkaži termin" }).click();
await page.getByRole("heading", { name: "Termin je otkazan" }).waitFor();
await step("otkazano");
assert(
  sql(`select status || '|' || cancelled_by from bookings where customer_name = '${customerName}' and status = 'cancelled' limit 1`) ===
    "cancelled|customer",
  "status u bazi = cancelled/customer",
);
console.log("✔ status u bazi: cancelled / customer");

// Termin za manje od 24h → poruka sa telefonom
const hours = mode === "mobile" ? 5 : 7;
const soonToken = sql(`insert into bookings (service_id, customer_name, customer_phone, start_time, end_time)
  values ('${serviceId}', 'Uskoro Test', '+38160123459${hours}', date_trunc('hour', now()) + interval '${hours} hours',
          date_trunc('hour', now()) + interval '${hours} hours 45 minutes') returning cancel_token`).split("\n")[0];
await page.goto(`${BASE}/otkazivanje/${soonToken}`);
await page.getByText(/Rok za online otkazivanje je istekao/).first().waitFor();
assert((await page.getByRole("button", { name: "Otkaži termin" }).count()) === 0, "nema dugmeta za otkazivanje <24h");
assert((await page.locator('main a[href="tel:+381656626031"]').count()) > 0, "klikabilan telefon");
await step("otkazivanje-rok-istekao");

// Nepostojeći token
await page.goto(`${BASE}/otkazivanje/00000000-0000-0000-0000-000000000000`);
await page.getByRole("heading", { name: "Termin nije pronađen" }).waitFor();
console.log("✔ nepostojeći token");

assert(errors.length === 0, "JS greške na stranici: " + errors.join("; "));
console.log(`\n✔ E2E booking (${mode}) – sve provere su prošle`);
await browser.close();
