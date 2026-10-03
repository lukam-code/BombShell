// Preuzima fotografije salona, konvertuje ih u WebP i čuva u /public/images.
// Pokretanje: npm run images            (preuzima sa biznisgroup.com)
//             npm run images -- --local  (koristi već ručno ubačene .jpg/.png fajlove iz public/images/izvorne/)
//
// Posle pokretanja pogledajte slike! Ako je neka mutna, tamna ili ima vodeni žig,
// zamenite je nekom od rezervnih (REZERVNE ispod) i ponovo pokrenite skriptu.
// Na kraju u lib/siteConfig.ts upišite putanje (npr. src: "/images/hero.webp").
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BASE = "https://www.biznisgroup.com/wp-content/uploads/2018/12/";
const SLIKE = {
  hero: "salon-lepote-bombshell129823.jpg",
  about: "salon-lepote-bombshell129825.jpg",
  "gallery-1": "salon-lepote-bombshell129826.jpg",
  "gallery-2": "salon-lepote-bombshell129827.jpg",
  "gallery-3": "46707212_2074785145911767_29914524526051328_n.jpg",
  "gallery-4": "40950793_1971359312921018_7618727853697269760_n.jpg",
  "gallery-5": "45198383_2046443572079258_594592652528189440_n.jpg",
  "gallery-6": "44219150_2023356357721313_5658446200743919616_n.jpg",
};
export const REZERVNE = [
  "40911482_1967551089968507_1275954360378982400_n.jpg",
  "38726079_1925544620835821_1341018179995959296_n.jpg",
  "39799681_1947409495316000_862844451431645184_n.jpg",
  "40457775_1962516817138601_4272319847548846080_n.jpg",
];

const OUT = path.join(process.cwd(), "public/images");
const SRC = path.join(OUT, "izvorne");
const local = process.argv.includes("--local");
await fs.mkdir(SRC, { recursive: true });

for (const [name, file] of Object.entries(SLIKE)) {
  const srcPath = path.join(SRC, file);
  try {
    if (!local) {
      const res = await fetch(BASE + file);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fs.writeFile(srcPath, Buffer.from(await res.arrayBuffer()));
    }
    const img = sharp(srcPath);
    const meta = await img.metadata();
    const width = name === "hero" ? 2000 : 1200;
    await img
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(OUT, `${name}.webp`));
    const warn = (meta.width ?? 0) < (name === "hero" ? 1600 : 800) ? "  ⚠ niska rezolucija" : "";
    console.log(`✔ ${name}.webp  (izvor ${meta.width}×${meta.height})${warn}`);
  } catch (e) {
    console.log(`✖ ${name}: ${file} – ${e.message}`);
  }
}
console.log("\nSada u lib/siteConfig.ts postavite src za svaku sliku, npr. hero: { src: \"/images/hero.webp\", ... }");
