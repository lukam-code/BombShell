// E2E test admin panela i recenzija protiv lokalnog test-stack-a.
// Pokretanje: node tests/e2e/admin.e2e.mjs [mobile|desktop]
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const mode = process.argv[2] || "desktop";
const shots = process.env.SHOTS_DIR;
const DB = process.env.DEV_DB || "bombshell";
const sql = (q) => execSync(`sudo -u postgres psql -d ${DB} -tAq`, { input: q }).toString().trim();
const assert = (c, m) => {
  if (!c) throw new Error("FAIL: " + m);
  console.log("✔", m);
};

const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined });
const ctx = await browser.newContext(
  mode === "mobile"
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } },
);
await ctx.addInitScript(() => {
  try {
    sessionStorage.setItem("bombshell-intro-seen", "1");
  } catch {}
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", async (r) => r.url().includes("/rest/v1/reviews") && r.request().method() === "POST" && console.log("  reviews POST", r.status(), await r.text().catch(() => "")));
const shot = async (name) => shots && page.screenshot({ path: `${shots}/admin-${mode}-${name}.png`, fullPage: true });
const suffix = mode === "mobile" ? "M" : "D";

// ---------------------------------------------------------------- recenzija sa sajta
// početno stanje (test menja ove podatke)
sql(`delete from reviews;
     update services set price_rsd = null, duration_minutes = 60, is_active = true where name in ('Gel lak', 'Ampule');
     update working_hours set close_time = '21:00' where day_of_week = 6;
     update services set sort_order = case name when 'Šišanje' then 1 when 'Feniranje' then 2 else sort_order end
       where category_id = (select id from service_categories where slug = 'zenski-frizer');`);
await page.goto(`${BASE}/#recenzije`);
await page.getByText("Budite prva koja će podeliti utisak").waitFor();
assert(true, "prazan prikaz recenzija (nema lažnih recenzija)");
await page.getByRole("button", { name: /Ostavite recenziju/ }).click();
const dialog = page.getByRole("dialog");
await dialog.getByRole("button", { name: "Pošalji recenziju" }).click();
await dialog.getByText("Izaberite ocenu.").waitFor();
await dialog.getByLabel("Ime").fill(`Jelena Marković${suffix}`);
await dialog.getByRole("radio", { name: /^5 / }).click();
await dialog.getByLabel("Usluga (opciono)").selectOption({ label: "Gel lak" });
await dialog.getByLabel(/Vaš utisak/).fill("Prekratko");
await dialog.getByRole("button", { name: "Pošalji recenziju" }).click();
await dialog.getByText("Recenzija mora imati najmanje 10 karaktera.").waitFor();
await dialog.getByLabel(/Vaš utisak/).fill("Divan ambijent i savršen gel lak, sigurno se vraćam!");
await shot("recenzija-forma");
await dialog.getByRole("button", { name: "Pošalji recenziju" }).click();
await dialog.getByText("Hvala! Vaša recenzija će biti objavljena nakon odobrenja.").waitFor();
assert(sql(`select is_approved from reviews where customer_name = 'Jelena Marković${suffix}'`) === "f", "recenzija upisana kao neodobrena");
await page.keyboard.press("Escape");

// ---------------------------------------------------------------- zaštita /admin
await page.goto(`${BASE}/admin/termini`);
await page.waitForURL(/\/admin\/login\?next=/);
assert(true, "middleware preusmerava neulogovane na /admin/login");

// pogrešna lozinka
await page.getByLabel("Korisničko ime").fill("admin@bombshell.rs");
await page.getByLabel("Lozinka").fill("pogresna");
await page.getByRole("button", { name: "Prijavi se" }).click();
await page.getByText("Pogrešno korisničko ime ili lozinka.").waitFor();
assert(true, "pogrešna lozinka je odbijena");
await page.getByLabel("Lozinka").fill("Bombshell2026!");
await page.getByRole("button", { name: "Prijavi se" }).click();
await page.waitForURL(/\/admin\/termini/);
await page.getByRole("heading", { name: "Termini", exact: true }).waitFor();
assert(true, "prijava uspešna, vraćen na traženu stranu");

// ---------------------------------------------------------------- kontrolna tabla
// termin za danas (direktno u bazi) da bi tabla imala sadržaj
const svc = sql("select id from services where name = 'Gel lak'");
sql(`delete from bookings where customer_name like 'Admin Test%'`);
sql(`insert into bookings (service_id, customer_name, customer_phone, start_time, end_time, status)
     values ('${svc}', 'Admin Test Danas${suffix}', '+38164555000${mode === "mobile" ? 1 : 2}',
             date_trunc('day', now() at time zone 'Europe/Belgrade') at time zone 'Europe/Belgrade' + interval '${mode === "mobile" ? 19 : 20} hours',
             date_trunc('day', now() at time zone 'Europe/Belgrade') at time zone 'Europe/Belgrade' + interval '${mode === "mobile" ? 20 : 21} hours', 'pending')`);
await page.goto(`${BASE}/admin`);
await page.getByRole("heading", { name: "Kontrolna tabla" }).waitFor();
await page.getByText(`Admin Test Danas${suffix}`).waitFor();
assert(await page.getByText("Recenzije na čekanju").isVisible(), "kontrolna tabla: brojači");
await shot("tabla");

// promena statusa: potvrdi
await page.getByText(`Admin Test Danas${suffix}`).click();
await page.getByRole("dialog").getByRole("button", { name: "Potvrdi" }).click();
await page.getByRole("dialog").waitFor({ state: "detached" });
await page.waitForTimeout(500);
assert(sql(`select status from bookings where customer_name = 'Admin Test Danas${suffix}'`) === "confirmed", "status → potvrđen");

// ---------------------------------------------------------------- ručno dodavanje termina
const day = sql("select to_char(date_trunc('week', now() at time zone 'Europe/Belgrade') + interval '15 days', 'YYYY-MM-DD')"); // utorak
await page.goto(`${BASE}/admin/termini?prikaz=dan&datum=${day}`);
await page.getByRole("button", { name: "Novi termin" }).click();
const nb = page.getByRole("dialog");
await nb.getByLabel("Usluga").selectOption({ label: "Gel lak (60 min)" });
await nb.getByLabel("Datum").fill(day);
await nb.getByLabel("Vreme").fill(mode === "mobile" ? "12:00" : "13:00");
await nb.getByLabel("Ime i prezime").fill(`Admin Test Telefon${suffix}`);
await nb.getByLabel("Telefon").fill("021 123 456");
await nb.getByLabel(/Pošalji SMS\/Viber potvrdu/).uncheck();
await shot("novi-termin");
await nb.getByRole("button", { name: "Sačuvaj termin" }).click();
await nb.waitFor({ state: "detached" });
await page.getByText(`Admin Test Telefon${suffix}`).first().waitFor();
const row = sql(`select status || '|' || customer_phone || '|' || notifications_opt_in from bookings where customer_name = 'Admin Test Telefon${suffix}'`);
assert(row === "confirmed|+38121123456|false", "ručni termin (fiksni telefon, bez SMS-a): " + row);
await shot("dan");

// isti termin ponovo → greška preklapanja
await page.getByRole("button", { name: "Novi termin" }).click();
await nb.getByLabel("Usluga").selectOption({ label: "Gel lak (60 min)" });
await nb.getByLabel("Datum").fill(day);
await nb.getByLabel("Vreme").fill(mode === "mobile" ? "12:15" : "13:15");
await nb.getByLabel("Ime i prezime").fill("Duplo Test");
await nb.getByLabel("Telefon").fill("0601234567");
await nb.getByRole("button", { name: "Sačuvaj termin" }).click();
await nb.getByText("U tom periodu već postoji drugi termin.").waitFor();
assert(true, "admin ne može da zakaže preko postojećeg termina");
await page.keyboard.press("Escape");

// nedeljni prikaz
await page.getByRole("button", { name: "Nedelja", exact: true }).click();
await page.getByText(`Admin Test Telefon${suffix}`).first().waitFor();
await shot("nedelja");
assert(true, "nedeljni kalendar prikazuje termin");

// otkazivanje iz admina → cancelled_by = salon
await page.getByText(`Admin Test Telefon${suffix}`).first().click();
await page.getByRole("dialog").getByRole("button", { name: "Otkaži" }).click();
await page.getByRole("dialog").getByRole("button", { name: "Da, otkaži" }).click();
await page.getByRole("dialog").waitFor({ state: "detached" });
await page.waitForTimeout(500);
assert(sql(`select status || '|' || cancelled_by from bookings where customer_name = 'Admin Test Telefon${suffix}'`) === "cancelled|salon", "admin otkazivanje → cancelled/salon");

// lista sa filterom
await page.goto(`${BASE}/admin/termini?prikaz=lista&status=cancelled`);
await page.getByLabel("Do").fill(day);
await page.getByText(`Admin Test Telefon${suffix}`).waitFor();
assert(true, "lista sa filterom statusa");

// ---------------------------------------------------------------- klijentkinje
await page.goto(`${BASE}/admin/klijentkinje?tel=%2B38121123456`);
await page.getByText("Otkazivanja").waitFor();
await shot("klijentkinja");
assert((await page.getByText(`Admin Test Telefon${suffix}`).count()) > 0, "istorija klijentkinje po telefonu");

// ---------------------------------------------------------------- usluge
await page.goto(`${BASE}/admin/usluge`);
await page.getByRole("button", { name: "Izmeni: Gel lak" }).click();
await page.getByLabel("Cena od (RSD)").fill("2500");
await page.getByLabel("Trajanje (min)").fill("75");
await page.getByRole("button", { name: "Sačuvaj" }).click();
await page.getByText("od 2.500 RSD").first().waitFor();
assert(sql("select price_rsd || '|' || duration_minutes from services where name = 'Gel lak'") === "2500|75", "izmena cene i trajanja");
await page.getByRole("button", { name: "Sakrij: Ampule" }).click();
await page.getByRole("button", { name: "Prikaži: Ampule" }).waitFor();
assert(sql("select is_active from services where name = 'Ampule'") === "f", "usluga sakrivena");
const anonSees = execSync(`curl -s "http://localhost:54321/rest/v1/services?select=name&name=eq.Ampule"`).toString();
assert(anonSees === "[]", "sakrivena usluga nije vidljiva anonimnim korisnicima");
await page.getByRole("button", { name: "Prikaži: Ampule" }).click();
await page.getByRole("button", { name: "Sakrij: Ampule" }).waitFor();
await page.getByRole("button", { name: "Pomeri dole: Šišanje" }).click();
await page.waitForTimeout(800);
assert(sql("select string_agg(s.name, ',' order by s.sort_order) from services s join service_categories c on c.id = s.category_id where c.slug = 'zenski-frizer'").startsWith("Feniranje,Šišanje"), "promena redosleda");
await page.getByRole("button", { name: "Pomeri gore: Šišanje" }).click();
await page.waitForTimeout(800);
sql("update services set price_rsd = null, duration_minutes = 60 where name = 'Gel lak'");
await shot("usluge");

// ---------------------------------------------------------------- radno vreme
await page.goto(`${BASE}/admin/radno-vreme`);
await page.getByLabel("Subota do").fill("15:00");
await page.getByRole("button", { name: "Sačuvaj" }).click();
await page.getByText("Sačuvano ✓").waitFor();
assert(sql("select close_time from working_hours where day_of_week = 6") === "15:00:00", "izmena radnog vremena (subota do 15h)");
sql("update working_hours set close_time = '21:00' where day_of_week = 6");

// ---------------------------------------------------------------- neradni dani
const holiday = sql("select to_char(date_trunc('week', now() at time zone 'Europe/Belgrade') + interval '16 days', 'YYYY-MM-DD')");
sql(`delete from blocked_dates where date = '${holiday}'`);
await page.goto(`${BASE}/admin/neradni-dani`);
await page.getByLabel("Datum (od)").fill(holiday);
await page.getByLabel("Razlog").fill("Test praznik");
await page.getByRole("button", { name: "Dodaj" }).click();
await page.getByText("Test praznik").waitFor();
const slotsOnHoliday = execSync(
  `curl -s -X POST localhost:54321/rest/v1/rpc/get_available_slots -H "Content-Type: application/json" -d '{"p_service_id":"${svc}","p_date":"${holiday}"}'`,
).toString();
assert(slotsOnHoliday === "[]", "blokiran datum nema slobodnih termina");
await page.getByRole("button", { name: `Ukloni ${holiday}` }).click();
await page.getByText("Test praznik").waitFor({ state: "detached" });

// ---------------------------------------------------------------- recenzije
await page.goto(`${BASE}/admin/recenzije`);
await page.getByText(`Jelena Marković${suffix}`).waitFor();
await shot("recenzije");
await page.getByRole("button", { name: "Odobri" }).first().click();
await page.getByText("Objavljene (1)").waitFor();
assert(sql(`select is_approved from reviews where customer_name = 'Jelena Marković${suffix}'`) === "t", "recenzija odobrena");
const publicReviews = execSync(`curl -s "http://localhost:54321/rest/v1/reviews?select=display_name,rating"`).toString();
assert(publicReviews.includes(`"display_name":"Jelena M."`), "javno vidljiva kao „Jelena M.”: " + publicReviews);

// ---------------------------------------------------------------- log
await page.goto(`${BASE}/admin/obavestenja`);
await page.getByRole("heading", { name: "Log obaveštenja" }).waitFor();
await shot("log");
assert(true, "log obaveštenja se učitava");

// ---------------------------------------------------------------- odjava
if (mode === "mobile") await page.getByRole("button", { name: "Otvori meni" }).click();
await page.getByRole("button", { name: "Odjava" }).first().click();
await page.waitForURL(/\/admin\/login/);
assert(true, "odjava");

assert(errors.length === 0, "bez JS grešaka: " + errors.join("; "));
console.log(`\n✔ E2E admin (${mode}) – sve provere su prošle`);
await browser.close();
