// Uklanja "ucrtanu" šahovsku pozadinu iz logoa: zlatni (zasićeni) pikseli ostaju,
// sivi/beli pikseli postaju providni. node scripts/logo-transparent.mjs <ulaz> <izlaz.png>
import sharp from "sharp";
const [input, output] = process.argv.slice(2);
const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(info.width * info.height * 4);
for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max; // HSV zasićenost
  // meki prelaz: sat < 0.18 → providno, sat > 0.35 → puno
  const a = Math.max(0, Math.min(1, (sat - 0.18) / 0.17));
  out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = Math.round(a * 255);
}
await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).trim().png().toFile(output);
