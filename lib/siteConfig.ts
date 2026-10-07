/**
 * Centralna konfiguracija salona.
 * Sve podatke o salonu menjajte ovde – sajt, SEO i JSON-LD ih čitaju odavde.
 */

export const CANCELLATION_HOURS = 24;
export const MIN_BOOKING_NOTICE_HOURS = 2;
export const MAX_BOOKING_DAYS_AHEAD = 60;
export const SLOT_STEP_MINUTES = 15;
export const TIME_ZONE = "Europe/Belgrade";

/** Link ka Google recenzijama – dopunite kada bude dostupan. Prazan string sakriva dugme. */
export const GOOGLE_REVIEWS_URL = "";

const phoneDisplay = "+381 65 662 6031";
const phoneHref = "+381656626031";

export const siteConfig = {
  name: "BOMBSHELL",
  fullName: "BOMBSHELL – Salon lepote",
  slogan:
    "Iz našeg salona izaći ćete uvek negovane i lepe, jer nama je Vaša lepota uvek na prvom mestu!",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),

  seo: {
    title: "Salon lepote Novi Sad | Bombshell – frizer, manikir, trepavice, masaže",
    description:
      "Bombshell salon lepote u Novom Sadu: ženski i muški frizer, manikir, pedikir, depilacija, šminka, trajna šminka, svilene trepavice i masaže. Zakažite termin online.",
    keywords: [
      "salon lepote Novi Sad",
      "frizer Novi Sad",
      "manikir Novi Sad",
      "svilene trepavice Novi Sad",
      "masaža Novi Sad",
      "trajna šminka",
      "Bombshell",
    ],
  },

  address: {
    street: "Branimira Ćosića 11",
    postalCode: "21000",
    city: "Novi Sad",
    country: "Srbija",
    countryCode: "RS",
    full: "Branimira Ćosića 11, 21000 Novi Sad, Srbija",
  },
  geo: { lat: 45.2559058, lng: 19.831061 },

  phone: { display: phoneDisplay, href: `tel:${phoneHref}`, e164: phoneHref },
  email: "sanela.dejan@gmail.com",

  social: {
    instagram: "https://www.instagram.com/bombshell__ns",
    instagramHandle: "@bombshell__ns",
    facebook: "https://www.facebook.com/bombshellns/",
  },

  googleReviewsUrl: GOOGLE_REVIEWS_URL,
  get mapsEmbedUrl() {
    return `https://maps.google.com/maps?q=${this.geo.lat},${this.geo.lng}&z=17&hl=sr&output=embed`;
  },
  get navigationUrl() {
    return `https://maps.google.com?daddr=${this.geo.lat},${this.geo.lng}`;
  },

  /** Prikaz radnog vremena (stvarni termini se računaju iz tabele working_hours u bazi). */
  openingHoursShort: "Pon–Sub 09–21h",
  openingHours: [
    { day: "Ponedeljak", dow: 1, hours: "09:00 – 21:00" },
    { day: "Utorak", dow: 2, hours: "09:00 – 21:00" },
    { day: "Sreda", dow: 3, hours: "09:00 – 21:00" },
    { day: "Četvrtak", dow: 4, hours: "09:00 – 21:00" },
    { day: "Petak", dow: 5, hours: "09:00 – 21:00" },
    { day: "Subota", dow: 6, hours: "09:00 – 21:00" },
    { day: "Nedelja", dow: 0, hours: "Zatvoreno" },
  ],
  /** Za schema.org JSON-LD */
  openingHoursSpec: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "09:00",
    closes: "21:00",
  },

  cancellationPolicy: `Termin možete otkazati ili pomeriti najkasnije ${CANCELLATION_HOURS} sata pre zakazanog vremena, putem linka iz potvrde ili pozivom na ${phoneDisplay}. Molimo Vas da nas na vreme obavestite kako bismo termin mogli da ponudimo drugoj klijentkinji. Ukoliko često ne dolazite na zakazane termine bez otkazivanja, zadržavamo pravo da odbijemo buduća online zakazivanja.`,

  about: {
    text: "Stručno osposobljen kadar salona Bombshell spreman je da Vam u svakom trenutku ponudi brojne usluge iz oblasti nege lica i tela. Ako svom telu ili kosi želite da pružite stalnu negu, onda ste na pravom mestu – kompletnu uslugu dobićete na kvalitetan i profesionalan način, u prijatno uređenom ambijentu.",
    signature: "Vaš Bombshell",
  },

  /**
   * Putanje slika. Ako je `src` null, prikazuje se elegantan roze gradijent placeholder.
   * Kada ubacite prave slike u /public/images, upišite putanju ovde (npr. "/images/hero.webp").
   */
  images: {
    hero: { src: null as string | null, alt: "Enterijer salona lepote Bombshell u Novom Sadu" },
    about: { src: "/images/galerija-pramenovi.webp" as string | null, alt: "Pramenovi urađeni u salonu Bombshell, u prijatnom roze ambijentu salona" },
    /** Galerija: širina/visina su stvarne dimenzije slike (zadržava se format, bez sečenja). */
    gallery: [
      { src: "/images/galerija-balayage.webp", alt: "Balayage pre i posle – topli karamel pramenovi i lokne", width: 960, height: 960 },
      { src: "/images/galerija-french-manikir.webp", alt: "French manikir urađen u salonu Bombshell", width: 960, height: 597 },
      { src: "/images/galerija-pramenovi.webp", alt: "Svetli pramenovi na ravnoj kosi", width: 768, height: 960 },
      { src: "/images/galerija-gel-lak.webp", alt: "Gel lak pre i posle – roze i tirkizna boja", width: 894, height: 960 },
      { src: "/images/galerija-blond-pramenovi.webp", alt: "Pre i posle – hladni plavi pramenovi i talasi", width: 960, height: 960 },
    ] as Array<{ src: string | null; alt: string; width: number; height: number }>,
    ogImage: "/opengraph-image",
  },

  nav: [
    { label: "Početna", href: "/#pocetna" },
    { label: "Usluge", href: "/#usluge" },
    { label: "O nama", href: "/#o-nama" },
    { label: "Galerija", href: "/#galerija" },
    { label: "Recenzije", href: "/#recenzije" },
    { label: "Kontakt", href: "/#kontakt" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
