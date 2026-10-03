// Spaja više screenshotova u jedan (za brz vizuelni pregled): node scripts/montage.mjs out.png a.png b.png ...
import sharp from "sharp";
const [out, ...files] = process.argv.slice(2);
const imgs = await Promise.all(files.map(async (f) => ({ f, m: await sharp(f).metadata() })));
const H = 1600;
const scaled = await Promise.all(imgs.map(async ({ f, m }) => {
  const w = Math.round((m.width * H) / m.height);
  return { buf: await sharp(f).resize(w, H).toBuffer(), w };
}));
const width = scaled.reduce((s, x) => s + x.w + 20, 0);
let left = 0;
await sharp({ create: { width, height: H, channels: 3, background: "#ffffff" } })
  .composite(scaled.map((s) => { const c = { input: s.buf, left, top: 0 }; left += s.w + 20; return c; }))
  .png().toFile(out);
