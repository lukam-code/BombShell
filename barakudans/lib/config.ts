/**
 * ============================================================
 *  BARAKUDANS – SAV SADRŽAJ NA JEDNOM MESTU
 * ============================================================
 *  Sve što vlasnik treba da menja (tekstovi, kontakt, radno vreme,
 *  meni, događaji, slike, termini rezervacija) nalazi se OVDE.
 *
 *  Instagram nije bio dostupan prilikom izrade, pa su sve stavke
 *  označene "PLACEHOLDER" privremene i NISU stvarni podaci bara.
 *  Kad popuniš podatke, postavi `isDraft: false` da nestane oznaka
 *  "primer" iz podnožja.
 */

export const config = {
  /** true = sajt prikazuje oznaku da su podaci još uvek primeri. */
  isDraft: true,

  name: 'Barakudans',
  // PLACEHOLDER – slogan
  tagline: 'Noć koja zagrize.',
  description:
    'Barakudans – bar, koktel karta i žurke. Rezerviši sto direktno na planu lokala.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',

  contact: {
    // PLACEHOLDER – zameniti stvarnim podacima
    phone: '+381 00 000 0000',
    email: 'info@barakudans.example',
    address: '[ULICA I BROJ], [GRAD]',
    // PLACEHOLDER – zameniti linkom iz Google Maps → Share. Prazno = prikazuje se samo adresa.
    mapsLink: '', // npr. https://maps.app.goo.gl/xxxx
    // Embed: Google Maps → Share → Embed a map → kopiraj src iz iframe-a. Prazno = pretraga po adresi.
    mapsEmbedSrc: '',
  },

  social: {
    instagram: 'https://www.instagram.com/barakudans/',
    facebook: '', // PLACEHOLDER (prazno = ne prikazuje se)
  },

  /** Radno vreme – PLACEHOLDER. day: 0=nedelja … 6=subota. open:null = zatvoreno. */
  hours: [
    { day: 1, label: 'Ponedeljak', open: null, close: null },
    { day: 2, label: 'Utorak', open: '20:00', close: '02:00' },
    { day: 3, label: 'Sreda', open: '20:00', close: '02:00' },
    { day: 4, label: 'Četvrtak', open: '20:00', close: '03:00' },
    { day: 5, label: 'Petak', open: '20:00', close: '04:00' },
    { day: 6, label: 'Subota', open: '20:00', close: '04:00' },
    { day: 0, label: 'Nedelja', open: '20:00', close: '01:00' },
  ] as { day: number; label: string; open: string | null; close: string | null }[],

  /** Pravila rezervacije. */
  booking: {
    /** Termini (početak). Stol je zauzet za ceo termin. */
    slots: ['20:00', '22:00', '00:00'],
    slotDurationHours: 2,
    maxAdvanceDays: 45,
    maxGuests: 12,
    /** Vremenska zona bara – za proveru "da li je termin već prošao". */
    timeZone: 'Europe/Belgrade',
    /** Koliko minuta pre početka termina se online rezervacija još prima. */
    cutoffMinutes: 30,
  },

  hero: {
    // Stavi fotografiju u public/images/ i upiši putanju, npr. '/images/hero.jpg'. null = generisani vizuel.
    image: null as string | null,
    imageAlt: 'Enterijer bara Barakudans noću',
  },

  about: {
    title: 'O nama',
    // PLACEHOLDER – ispričaj pravu priču bara
    paragraphs: [
      'Barakudans je mesto gde noć počinje tiho, a završava glasno. Prigušena svetla, dobra muzika i piće pripremljeno bez žurbe.',
      'Ovde dolaziš da ostaneš duže nego što si planirao – sa društvom, na koktel ili na žurku. Rezerviši sto i ostavi nam ostalo.',
    ],
    highlights: [
      { title: 'Koktel karta', text: 'Klasici i autorski koktli.' },
      { title: 'Muzika uživo', text: 'DJ večeri i posebni događaji.' },
      { title: 'Tvoj sto', text: 'Biraš tačno gde ćeš sedeti.' },
    ],
  },

  /** Meni – PLACEHOLDER. price:null prikazuje "cena uskoro". Cene upiši u dinarima. */
  menu: [
    {
      category: 'Koktel karta',
      items: [
        { name: 'Negroni', desc: 'Džin, vermut, bitter', price: null as number | null },
        { name: 'Old Fashioned', desc: 'Burbon, šećer, bitter', price: null },
        { name: 'Mojito', desc: 'Rum, nana, limeta', price: null },
        { name: 'Espresso Martini', desc: 'Votka, kafa, liker', price: null },
      ],
    },
    {
      category: 'Žestoka pića',
      items: [
        { name: 'Viski', desc: 'Izbor etiketa', price: null },
        { name: 'Rakija', desc: 'Domaći izbor', price: null },
        { name: 'Džin / Votka / Rum', desc: 'Izbor etiketa', price: null },
      ],
    },
    {
      category: 'Pivo, vino i bezalkoholno',
      items: [
        { name: 'Točeno pivo', desc: '0,3 / 0,5 l', price: null },
        { name: 'Vino', desc: 'Čaša / flaša', price: null },
        { name: 'Sokovi i limunade', desc: 'Bezalkoholno', price: null },
      ],
    },
  ],

  /** Događaji – PLACEHOLDER. `when` je slobodan tekst (npr. "Petak, 14. jun u 22:00"). */
  events: [
    { title: 'DJ večer', when: 'Petkom', desc: 'Najavi se na Instagramu – lineup uskoro.', image: null as string | null },
    { title: 'Vikend žurka', when: 'Subotom', desc: 'Rezerviši sto unapred, mesta se brzo pune.', image: null },
    { title: 'Koktel veče', when: 'Čekaj najavu', desc: 'Posebna ponuda i gostujući barmeni.', image: null },
  ],

  /** Galerija – ubaci slike u public/images/ pa upiši putanje. src:null = placeholder pločica. */
  gallery: [
    { src: null as string | null, alt: 'Šank u Barakudansu' },
    { src: null, alt: 'Koktel na šanku' },
    { src: null, alt: 'Sala sa stolovima' },
    { src: null, alt: 'DJ pult' },
    { src: null, alt: 'Gosti u sali' },
    { src: null, alt: 'VIP separe' },
  ],
};

export type SiteConfig = typeof config;
