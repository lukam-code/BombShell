# BOMBSHELL – Salon lepote (Novi Sad)

Sajt salona lepote sa online zakazivanjem, SMS/Viber i email obaveštenjima, recenzijama, politikom otkazivanja i admin panelom.

**Tehnologije:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Supabase (Postgres, Auth, Edge Functions, pg_cron, pg_net) · react-hook-form + zod · date-fns (sr-Latn) · lucide-react · Infobip (SMS/Viber) · Resend (email)

---

## Sadržaj

- [Struktura projekta](#struktura-projekta)
- [Šta se gde menja](#šta-se-gde-menja)
- [Promenljive okruženja i tajni ključevi](#promenljive-okruženja-i-tajni-ključevi)
- [Postavljanje – korak po korak](#postavljanje--korak-po-korak)
  1. [Kreiranje Supabase projekta](#1-kreiranje-supabase-projekta)
  2. [Pokretanje migracija i seed-a](#2-pokretanje-migracija-i-seed-a)
  3. [pg_cron, pg_net i posao za podsetnike](#3-pg_cron-pg_net-i-posao-za-podsetnike)
  4. [Kreiranje admin naloga](#4-kreiranje-admin-naloga)
  5. [Infobip: SMS i Viber](#5-infobip-sms-i-viber)
  6. [Resend: email](#6-resend-email)
  7. [Deploy Edge Functions](#7-deploy-edge-functions)
  8. [Lokalno pokretanje](#8-lokalno-pokretanje)
  9. [Deploy na Vercel](#9-deploy-na-vercel)
- [Kako radi zakazivanje i obaveštavanje](#kako-radi-zakazivanje-i-obaveštavanje)
- [Testiranje](#testiranje)
- [Slike](#slike)

---

## Struktura projekta

```
app/
  (site)/                 javni deo sajta (navigacija, footer, mobilna traka)
    page.tsx              početna (landing) strana
    zakazivanje/          booking wizard (5 koraka)
    otkazivanje/[token]/  samostalno otkazivanje termina
    politika-otkazivanja/
  admin/                  admin panel (zaštićen middleware-om)
  sitemap.ts, robots.ts, icon.svg, opengraph-image.tsx, not-found.tsx
components/
  ui/                     Button, SectionTitle, Card, Input, Modal, Stars…
  home/ booking/ cancel/ admin/ layout/
lib/
  siteConfig.ts           ⭐ svi podaci o salonu (adresa, telefon, radno vreme, tekstovi, slike)
supabase/
  migrations/             šema, RPC funkcije, RLS, trigeri za obaveštenja, pg_cron, seed
  functions/              Edge Functions: send-customer-notification, send-email-notification, send-reminders
tests/                    SQL, unit, integracioni i E2E testovi
scripts/optimize-images.mjs
```

## Šta se gde menja

| Šta | Gde |
| --- | --- |
| Adresa, telefon, email, društvene mreže, slogan, tekst „O nama”, politika otkazivanja, Google recenzije link, putanje slika | `lib/siteConfig.ts` |
| Usluge, cene, trajanja, redosled, sakrivanje | Admin panel → **Usluge** |
| Radno vreme (za online termine) | Admin panel → **Radno vreme** (prikaz na sajtu: `lib/siteConfig.ts`) |
| Praznici / odmor | Admin panel → **Neradni dani** |
| Tekstovi SMS/Viber poruka | `supabase/functions/_shared/messages.ts` |
| Email šabloni | `supabase/functions/_shared/emailTemplates.ts` |
| Podaci o salonu u porukama | `supabase/functions/_shared/salon.ts` |
| Boje i fontovi | `tailwind.config.ts`, `app/layout.tsx` |

> Rok za otkazivanje (24h) je definisan u `lib/siteConfig.ts` (`CANCELLATION_HOURS`) i u bazi (funkcija `public.cancellation_hours()`); ako ga menjate, promenite oba.

## Promenljive okruženja i tajni ključevi

### Next.js (`.env.local` lokalno, Environment Variables na Vercel-u)

| Promenljiva | Opis |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` / publishable ključ |
| `NEXT_PUBLIC_SITE_URL` | Javna adresa sajta, npr. `https://www.bombshell.rs` |

Ovi ključevi su javni po dizajnu – svu zaštitu podataka obezbeđuje Row Level Security u bazi.

### Supabase secrets za Edge Functions (NIKAD u frontend kodu)

| Secret | Obavezan | Opis |
| --- | --- | --- |
| `NOTIFY_WEBHOOK_SECRET` | ✅ | Nasumičan string; isti kao `notify_secret` u Vault-u (korak 3) |
| `SITE_URL` | ✅ | Npr. `https://www.bombshell.rs` (za linkove u porukama) |
| `INFOBIP_API_KEY` | za SMS/Viber | Infobip API ključ |
| `INFOBIP_BASE_URL` | za SMS/Viber | Npr. `xxxxx.api.infobip.com` |
| `INFOBIP_SMS_SENDER` | opciono | Ime pošiljaoca SMS-a, npr. `Bombshell` |
| `INFOBIP_VIBER_SENDER` | opciono | Registrovani Viber pošiljalac; bez njega se šalje samo SMS |
| `INFOBIP_VIBER_SMS_FAILOVER` | opciono | `true` → Infobip sam šalje SMS ako primalac nema Viber |
| `RESEND_API_KEY` | za email | Resend API ključ |
| `RESEND_FROM_EMAIL` | opciono | Npr. `BOMBSHELL <termini@bombshell.rs>`; podrazumevano `onboarding@resend.dev` |
| `SALON_NOTIFICATION_EMAIL` | za email salonu | Npr. `sanela.dejan@gmail.com` |

`SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` Supabase automatski daje svakoj Edge Function.

**Ako Infobip ili Resend ključevi nisu podešeni, zakazivanje i dalje radi normalno** – u log obaveštenja se samo upisuje status „Preskočeno”.

---

## Postavljanje – korak po korak

### 1. Kreiranje Supabase projekta

1. Otvorite nalog na <https://supabase.com> i kliknite **New project**.
2. Region: **Central EU (Frankfurt)** (najbliži Srbiji).
3. Sačuvajte lozinku baze.
4. U **Project Settings → API** kopirajte *Project URL* i *anon/publishable key*.
5. **Authentication → Sign In / Providers → Email**: isključite **Allow new users to sign up** (admin nalozi se prave ručno).
6. **Authentication → URL Configuration → Site URL**: upišite adresu sajta.

### 2. Pokretanje migracija i seed-a

Potreban je Node.js 20+. Supabase CLI se pokreće preko `npx`:

```bash
npx supabase login
npx supabase link --project-ref <REF_PROJEKTA>   # REF je deo URL-a: https://<REF>.supabase.co
npx supabase db push                             # primenjuje sve fajlove iz supabase/migrations
```

Migracije prave:

- tabele (`services`, `bookings`, `reviews`, `notification_log`…), uključujući **EXCLUDE constraint** protiv duplog bukiranja (`btree_gist`)
- RPC funkcije `get_available_slots`, `create_booking`, `get_booking_by_token`, `cancel_booking`…
- Row Level Security na svim tabelama
- trigere za obaveštenja i pg_cron posao
- **seed**: radno vreme (pon–sub 09–21), kategorije i usluge sa okvirnim trajanjima i bez cena. Recenzije se **ne** seed-uju.

Bez CLI-ja: otvorite **SQL Editor** i redom izvršite sadržaj fajlova iz `supabase/migrations/` (po imenu, od najstarijeg).

### 3. pg_cron, pg_net i posao za podsetnike

1. **Database → Extensions**: uključite **pg_cron** i **pg_net** (ako ih migracija nije uključila).
2. U **SQL Editor** upišite dve tajne u Vault (zamenite vrednosti):

```sql
select vault.create_secret('https://<REF>.supabase.co', 'project_url');
select vault.create_secret('<DUGACAK-NASUMICAN-STRING>', 'notify_secret');
```

   Nasumičan string možete napraviti komandom `openssl rand -hex 32`. Isti string ćete u koraku 7 upisati kao `NOTIFY_WEBHOOK_SECRET`.

3. Proverite da posao postoji:

```sql
select jobname, schedule, active from cron.job;   -- bombshell-send-reminders, */15 * * * *
```

   Ako ga nema (npr. pg_cron je uključen posle migracije), pokrenite ponovo sadržaj fajla `supabase/migrations/20261003000005_cron.sql` u SQL Editoru.

Kako radi: pg_cron svakih 15 minuta poziva Edge Function `send-reminders`. Ona pronalazi termine (status „na čekanju” ili „potvrđen”) koji počinju za 23–25h i nemaju `reminder_sent_at`, atomično upisuje `reminder_sent_at` i šalje podsetnik, tako da se isti podsetnik nikad ne pošalje dvaput.

### 4. Kreiranje admin naloga

1. **Authentication → Users → Add user → Create new user**: email i jaka lozinka, uključite **Auto Confirm User**.
2. U **SQL Editor** dodajte nalog u administratore:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'sanela.dejan@gmail.com';
```

3. Prijava: `https://<sajt>/admin`.

> Samo nalozi iz tabele `admin_users` imaju pristup podacima. Čak i ako se neko registruje, ne vidi termine.

### 5. Infobip: SMS i Viber

1. Otvorite nalog na <https://www.infobip.com> (Sign up). Probni nalog šalje poruke samo na Vaš verifikovani broj.
2. U Infobip portalu (**Developers → API Keys**) napravite API ključ. Base URL je prikazan na vrhu (npr. `xxxxx.api.infobip.com`).
3. **SMS pošiljalac:** alfanumeričko ime (npr. `Bombshell`) za Srbiju često treba registrovati preko Infobip podrške; dok to ne završite, izostavite `INFOBIP_SMS_SENDER` i Infobip će koristiti podrazumevanog pošiljaoca.
4. **Viber pošiljalac:** u portalu **Channels and Numbers → Viber** pokrenite registraciju Viber Business naloga (logo, opis, kategorija). Odobrenje traje i Viber ga posebno naplaćuje. Dok pošiljalac ne bude odobren, sajt šalje samo SMS.
5. Unesite ključeve (korak 7). Posle odobrenja Viber pošiljaoca dodajte `INFOBIP_VIBER_SENDER`.
6. Opciono `INFOBIP_VIBER_SMS_FAILOVER=true`: Infobip automatski šalje SMS kada primalac nema Viber. Proverite u Infobip dokumentaciji da je SMS failover uključen za Vaš nalog. Bez ove opcije SMS se šalje kada Infobip odmah odbije Viber poruku.

Poruke su kratke. SMS verzija je bez kvačica (č→c, ć→c, š→s, ž→z, đ→dj) da ostane u GSM-7 kodiranju (160 karaktera po poruci). Viber verzija ima pravilna slova.

### 6. Resend: email

1. Otvorite nalog na <https://resend.com> i napravite API ključ (**API Keys → Create**).
2. **Za testiranje:** bez verifikovanog domena koristite pošiljaoca `onboarding@resend.dev` (podrazumevano). Resend tada isporučuje poruke samo na email adresu vlasnika Resend naloga.
3. **Verifikacija sopstvenog domena** (obavezno za slanje klijentkinjama):
   - **Domains → Add Domain** → upišite npr. `bombshell.rs`.
   - Resend prikazuje DNS zapise (SPF – `TXT`/`MX` za `send.` poddomen, DKIM – `TXT resend._domainkey`). Dodajte ih kod registra domena ili DNS provajdera.
   - Kliknite **Verify** (propagacija traje od nekoliko minuta do nekoliko sati).
   - Postavite `RESEND_FROM_EMAIL="BOMBSHELL <termini@bombshell.rs>"`.
4. `SALON_NOTIFICATION_EMAIL` je adresa na koju salon dobija obaveštenja o novim/otkazanim terminima i recenzijama.

### 7. Deploy Edge Functions

```bash
npx supabase secrets set \
  NOTIFY_WEBHOOK_SECRET=<ISTI-STRING-KAO-U-VAULTU> \
  SITE_URL=https://www.bombshell.rs \
  SALON_NOTIFICATION_EMAIL=sanela.dejan@gmail.com \
  INFOBIP_API_KEY=... INFOBIP_BASE_URL=xxxxx.api.infobip.com INFOBIP_SMS_SENDER=Bombshell \
  RESEND_API_KEY=re_... RESEND_FROM_EMAIL="BOMBSHELL <termini@bombshell.rs>"

npx supabase functions deploy send-customer-notification --no-verify-jwt
npx supabase functions deploy send-email-notification --no-verify-jwt
npx supabase functions deploy send-reminders --no-verify-jwt
```

Funkcije poziva isključivo baza (trigeri preko `pg_net` i `pg_cron`) sa zaglavljem `x-webhook-secret`, pa je JWT provera isključena (`supabase/config.toml`), a funkcije same proveravaju tajnu. Zahtev bez nje dobija 401.

**Provera:** zakažite probni termin na sajtu, pa otvorite Admin → **Log obaveštenja**. Tu se za svaku poruku vidi status: Poslato / Neuspešno (sa razlogom) / Preskočeno.

### 8. Lokalno pokretanje

```bash
npm install
cp .env.example .env.local      # popunite vrednosti iz koraka 1
npm run dev                     # http://localhost:3000
```

Za potpuno lokalni Supabase (potreban Docker): `npx supabase start`, pa u `.env.local` upišite URL i anon ključ koje komanda ispiše. Edge Functions lokalno: `npx supabase functions serve --env-file supabase/.env`.

Korisne komande:

```bash
npm run build        # produkcioni build
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm test             # unit testovi (telefon, vreme)
```

### 9. Deploy na Vercel

1. Postavite kod na GitHub i na <https://vercel.com> izaberite **Add New → Project → Import** repozitorijuma.
2. Framework: **Next.js** (automatski).
3. **Environment Variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
4. **Deploy.** Posle prvog deploy-a:
   - u Vercel → Settings → Domains povežite domen (npr. `bombshell.rs`)
   - ažurirajte `NEXT_PUBLIC_SITE_URL`, Supabase Site URL (korak 1) i secret `SITE_URL` (korak 7) na pravi domen, pa uradite redeploy.

---

## Kako radi zakazivanje i obaveštavanje

```
Klijentkinja ──► /zakazivanje ──► RPC create_booking (provere: usluga, radno vreme, neradni dani,
                                   ≥2h unapred, ≤60 dana, max 3 aktivna termina po broju, preklapanje)
                                        │
                                        ▼  INSERT u bookings (EXCLUDE constraint garantuje da nema duplog termina)
                                  trigger bookings_notify ──(pg_net, posle COMMIT-a)──►
                                        ├─► send-customer-notification → Viber, pa SMS ako Viber ne uspe → notification_log
                                        └─► send-email-notification    → email salonu + potvrda klijentkinji (.ics) → notification_log
pg_cron (*/15 min) ──► send-reminders → podsetnik 24h ranije (tačno jednom)
Otkazivanje (link ili admin) → status 'cancelled' → SMS/Viber klijentkinji + email salonu (ko je otkazao)
```

**Bezbednost:**
- Anonimni posetioci nemaju direktan pristup tabeli `bookings` niti `notification_log`. Slobodne termine vide samo preko `get_available_slots`, koja vraća isključivo vremena, bez ličnih podataka.
- Recenzije: javno se čitaju samo odobrene, i to samo skraćeno ime („Jelena M.”). Nove recenzije uvek ulaze kao neodobrene, uz limit od 5 na sat.
- Honeypot polja na formama za zakazivanje i recenzije.
- Admin pristup: Supabase Auth i tabela `admin_users`. Sve `/admin` rute štiti middleware.

**Napomena o kapacitetu:** salon se tretira kao jedan „resurs” – dva aktivna termina se ne mogu preklapati, bez obzira na uslugu. Ako salon istovremeno radi npr. manikir i frizuru kod različitih radnica, sistem je potrebno proširiti zaposlenima (kolona `staff_id` u EXCLUDE constraint-u). `btree_gist` je već uključen za to.

## Testiranje

| Test | Komanda | Pokriva |
| --- | --- | --- |
| Unit | `npm test` | normalizacija telefona (06x, +3816x, 003816x → E.164), vreme u Europe/Belgrade |
| SQL | `npm run test:db` | 63 provere: slotovi, dupli termin, van radnog vremena, nedelja, neradni dan, <2h, >60 dana, limit po telefonu, otkazivanje >24h i <24h, RLS (anonimni ne vide tuđe termine ni neodobrene recenzije), admin prava, podsetnik samo jednom |
| Edge Functions | `npm run test:functions` (Deno) | tekstovi poruka, GSM-7, Viber → SMS fallback, „skipped” bez ključeva, email šabloni i .ics |
| Integracioni | `tests/integration/run-notifications.sh` | trigger → Edge Function → Infobip (mock) → notification_log; trka 10 paralelnih zahteva za isti termin |
| E2E | `npm run test:e2e` | ceo booking tok (mobilni i desktop), zauzet termin u međuvremenu, .ics, otkazivanje, admin panel |

SQL, integracioni i E2E testovi rade nad lokalnim Postgres-om preko `tests/local-stack/` (Postgres + PostgREST, bez Docker-a). Detalji su u `tests/local-stack/README.md`.

## Slike

Originalne fotografije sa biznisgroup.com nisu mogle da se preuzmu tokom izrade, pa sajt trenutno prikazuje elegantne roze gradijent placeholdere. Da ubacite prave slike:

```bash
npm run images                # preuzima, konvertuje u WebP i čuva u public/images/
# ili ručno: stavite .jpg fajlove u public/images/izvorne/ (imena kao u skripti) i pokrenite
npm run images -- --local
```

Zatim **pregledajte svaku sliku** (mutna, tamna, vodeni žig → zamenite rezervnom, spisak je u skripti) i u `lib/siteConfig.ts` upišite putanje, npr. `hero: { src: "/images/hero.webp", ... }`. Hero slika automatski dobija roze overlay i blagi blur, koji sakrivaju nisku rezoluciju.
