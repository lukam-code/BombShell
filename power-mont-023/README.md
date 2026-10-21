# POWER MONT 023 – sajt

Statički sajt za **Milutin Janković PR Malterisanje Power Mont 023 Zrenjanin**.
Čist HTML, CSS i JavaScript, bez build koraka i bez zavisnosti – radi na bilo kom hostingu.

```
index.html            /          početna (landing)
kontakt/index.html    /kontakt   kontakt stranica sa formom
404.html                         stranica „nije pronađeno“
assets/css/styles.css            svi stilovi (boje i fontovi su promenljive na vrhu fajla)
assets/js/main.js                navigacija, suptilne animacije, kontakt forma
assets/img/                      fotografije (trenutno privremene, vidi dole)
assets/logo-mark.svg            monogram PM (vektorski, napravljen po logotipu)
assets/favicon.svg
robots.txt
scripts/generate-placeholders.py generator privremenih slika
```

## Lokalni pregled

```bash
cd power-mont-023
python3 -m http.server 8023
# otvorite http://localhost:8023
```

Putanje su apsolutne (`/assets/...`, `/kontakt/`), pa sajt treba otvarati preko servera, a ne duplim klikom na fajl.

## Postavljanje (deploy)

Ceo sadržaj foldera `power-mont-023/` otpremiti u koren sajta (npr. `public_html` na cPanel/Hostinger hostingu,
ili kao „publish directory“ na Netlify / Vercel / Cloudflare Pages). `/kontakt` se servira iz `kontakt/index.html`.

## Vizuelni identitet

Stil prati logotip: grafitna pozadina sa blagim zrnom (`assets/img/grain.png`), srebrni tekst,
čelično plavi akcenat (`--steel`), široko pismo **Michroma** za znak i kratke oznake i **Inter** za naslove i tekst.
Monogram `assets/logo-mark.svg` je ponovo nacrtan kao vektor. **Napomena:** na dostavljenom logotipu piše „POWEMORT“;
na sajtu je korišćen ispravan naziv „POWER MONT 023“. Kada stigne ispravljen logo u vektoru (SVG/AI/PDF), može zameniti ovaj fajl.

## Fotografije

Trenutne slike su **proceduralno generisane teksture maltera** – nisu fotografije stvarnih radova i služe samo kao privremeno rešenje.
Kada stignu stvarne fotografije, zamenite fajlove **istim imenima**:

| Mesto | Fajlovi | Odnos stranica |
|---|---|---|
| Hero (početna, desno) | `hero-640.webp`, `hero-1000.webp`, `hero-1400.webp`, `hero.jpg` (1000 px) | uspravno, oko 5:6 |
| O nama | `o-nama-600.webp`, `o-nama-900.webp`, `o-nama-1200.webp`, `o-nama.jpg` (900 px) | uspravno, 4:5 |

Brojevi u imenu su širina u pikselima. Slike se automatski seku (`object-fit: cover`), pa tačan odnos nije obavezan.
Konverzija iz jedne fotografije (ImageMagick):

```bash
for w in 640 1000 1400; do convert foto.jpg -resize ${w}x -quality 75 assets/img/hero-$w.webp; done
convert foto.jpg -resize 1000x -quality 78 -strip assets/img/hero.jpg
```

Posle zamene ažurirajte i `alt` tekst slike u `index.html` (opis onoga što je stvarno na fotografiji).

## Kontakt forma

Forma ima validaciju na srpskom, stanje slanja, poruku o grešci i stanje uspešnog slanja.
Obavezna polja: ime i prezime, telefon, poruka. Email je opcion.

**Povezivanje sa servisom:** u `kontakt/index.html` upišite URL u atribut `data-endpoint` forme:

```html
<form class="form" data-contact-form data-endpoint="https://formspree.io/f/VAS_ID" novalidate>
```

Forma šalje `POST` sa JSON telom `{ ime, telefon, email, poruka, _subject }` i zaglavljem `Accept: application/json`
(radi direktno sa Formspree, a lako i sa sopstvenim backendom ili serverless funkcijom). Svaki `2xx` odgovor = uspeh.

Dok je `data-endpoint` prazan, forma posle validacije **otvara email program posetioca** sa popunjenom porukom
na adresu milutinjankovic@hotmail.rs, i jasno to kaže posetiocu – ništa se ne „gubi“ tiho.

## SEO

- `title`, `meta description`, Open Graph, jedan `h1` po stranici, semantički HTML.
- JSON-LD `HomeAndConstructionBusiness` sa isključivo potvrđenim podacima (naziv, vlasnik, adresa, telefon, email, PIB, datum osnivanja).
- **Kada domen bude poznat**, dodati u `<head>` obe stranice `<link rel="canonical" href="https://DOMEN/">` (odnosno `/kontakt`),
  promeniti `og:image` u apsolutni URL, dodati `"url"` u JSON-LD i napraviti `sitemap.xml` (pa ga navesti u `robots.txt`).
  Domen namerno nije upisan jer nije potvrđen.

## Sadržaj koji treba potvrditi sa vlasnikom

Sajt navodi samo potvrđene podatke. Sledeće je namerno izostavljeno dok se ne potvrdi:
konkretne vrste malterisanja (mesto za njih je označeno komentarom u sekciji „Naša usluga“), reference i projekti,
radno vreme, tačno područje rada van Zrenjanina, domen sajta i stvarne fotografije.

## Pristupačnost i performanse

- Link „Preskoči na sadržaj“, vidljiv fokus, `aria-current`, `aria-invalid` + poruke greške vezane za polja, `role="status"` za stanje slanja.
- Mobilni meni: zatvara se na Escape, klik na link i prelazak na desktop širinu.
- Animacije su kratke i potpuno isključene uz `prefers-reduced-motion`; bez JavaScript-a sav sadržaj je vidljiv.
- Nema JS biblioteka; responzivne WebP slike sa fiksnim dimenzijama (bez pomeranja layout-a), hero slika se preučitava.
