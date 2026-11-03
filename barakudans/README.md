# Barakudans – sajt + rezervacija stolova

Next.js 15 (App Router) · TypeScript · Tailwind · Framer Motion · Supabase (opciono) · zod

Glavna funkcija je **interaktivni plan lokala**: gost bira datum, termin i broj osoba, pa klikom na sto
na SVG planu rezerviše. Zauzetost se računa po *(datum, termin)*, a duplo bukiranje se sprečava na serveru.

## Pokretanje

```bash
cd barakudans
cp .env.example .env.local     # popuni ADMIN_PASSWORD i ADMIN_SECRET
npm install
npm run dev                    # http://localhost:3000   (admin: /admin)
```

Bez Supabase ključeva podaci se čuvaju u `data/db.json` (lokalno, jedan server). U `npm run dev`
podrazumevana admin lozinka je `admin123`; u produkciji **admin je zaključan dok ne postaviš `ADMIN_PASSWORD`**.

```bash
npm test          # testovi: duplo bukiranje (10 paralelnih zahteva), kapacitet, blokade, validacija, datumi
npm run typecheck
npm run build && npm start
```

## Supabase (produkcija)

1. Napravi projekat, u SQL editoru pokreni `supabase/schema.sql` (tabele `tables`, `reservations`, `blocks`, `settings`,
   unique indeks protiv duplog bukiranja i funkcija `create_reservation`).
2. U `.env.local` / Vercel env postavi `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` (samo server, nikad `NEXT_PUBLIC_`).
3. Otvori `/admin` → **Raspored** → **Sačuvaj** da upišeš početni raspored u bazu.

> Supabase implementacija (`lib/store/supabase.ts`) je napisana po istom interfejsu kao testirani FileStore,
> ali **nije pokrenuta protiv pravog projekta** u izradi (nije bilo kredencijala) – prvo je isprobaj na test projektu.

Real-time: plan se osvežava **pollingom na 5 s** (`POLL_MS` u `components/booking/Booking.tsx`). Supabase Realtime nije
potreban jer anonimni klijent nema direktan pristup bazi (RLS bez javnih politika).

## Šta se gde menja

| Šta | Gde |
| --- | --- |
| Tekstovi, kontakt, radno vreme, meni, događaji, galerija, slike, termini rezervacije, Google mapa | `lib/config.ts` (jedno mesto) |
| Boje (paleta) | CSS promenljive u `app/globals.css` (`:root`) |
| Raspored stolova (pozicija, oblik, kapacitet) | Admin → **Raspored** (čuva se kao podatak u bazi). Početni: `lib/layout.ts` |
| Blokiranje stola, otkazivanje | Admin → **Blokade** / **Rezervacije** |
| Slike | ubaci u `public/images/` pa upiši putanje u `lib/config.ts` (`next/image` daje WebP/AVIF + lazy loading) |
| Potvrde mejlom/SMS-om | env: `RESEND_API_KEY`, `MAIL_FROM`, `TWILIO_*` – bez njih se preskaču (gost vidi „nije poslato“) |

Kad popuniš prave podatke, u `lib/config.ts` postavi `isDraft: false` (nestaje oznaka „radna verzija“ u podnožju).

## Arhitektura

```
app/page.tsx                   sve sekcije (Hero, O nama, Meni, Galerija, Događaji, Rezervacija, Kontakt)
components/booking/FloorPlan   SVG plan: animacije, marker koji klizi, zum, tastatura, aria
components/booking/Booking     tok: datum/termin/osobe → plan → forma → potvrda; polling
components/admin/*             admin (rezervacije, blokade, uređivač rasporeda)
app/api/*                      /layout, /availability, /reservations (javno) · /admin/* (zaštićeno sesijom)
lib/store/                     Store interfejs: FileStore (lokalno) i SupabaseStore
lib/validation.ts              zod šeme – ISTE na klijentu i serveru
```

**Duplo bukiranje:** server (`POST /api/reservations`) ponovo validira sve i poziva `store.createReservation`, koji u jednom
atomskom koraku proverava sto/kapacitet/blokadu/zauzetost. FileStore koristi mutex, a Supabase advisory lock +
`unique (table_id, date, slot) where status='confirmed'`.

**Bezbednost:** admin sesija je HMAC-potpisan `httpOnly`, `SameSite=Strict` cookie (12 h); limiter pokušaja prijave i rezervacija
(u memoriji – za više instanci stavi Redis/Upstash); honeypot polje; javni `/api/availability` ne vraća lične podatke.

**Pristupačnost:** stolovi su `role="button"` sa `aria-label`/`aria-pressed`/`aria-disabled`, strelice premeštaju fokus na
najbliži sto, Enter/Space bira, poruke idu u `aria-live` region, `prefers-reduced-motion` gasi animacije.

## Šta vlasnik mora da popuni (placeholderi)

Instagram nije bio dostupan pri izradi, pa **ništa ovde nije preuzeto sa njihovog profila**:

- [ ] Fotografije: hero, galerija (6), plakati događaja → `public/images/` + `lib/config.ts`
- [ ] Logo (trenutno tekstualni wordmark + generička riba, `components/Logo.tsx`) i Open Graph slika (`app/opengraph-image.tsx`)
- [ ] Adresa, telefon, email, Google Maps link i embed (`contact` u `lib/config.ts`) – dok je prazno, mapa se traži po adresi
- [ ] Radno vreme i termini rezervacija (`hours`, `booking.slots`) – trenutne vrednosti su **izmišljen primer**
- [ ] Tekst „O nama“, slogan, meni i **cene** (`price: null` prikazuje „cena uskoro“), događaji
- [ ] Stvarni raspored stolova i kapaciteti (Admin → Raspored)
- [ ] Palete/boje i fontovi su moj predlog u „noćnom“ duhu, nisu izvedeni iz njihovih fotografija – prilagodi kad ih vidiš
- [ ] `ADMIN_PASSWORD`, `ADMIN_SECRET`, Supabase i (opciono) Resend/Twilio ključevi, `NEXT_PUBLIC_SITE_URL`
