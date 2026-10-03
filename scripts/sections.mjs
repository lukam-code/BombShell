// Screenshot pojedinačnih sekcija: node scripts/sections.mjs <url> <izlazni-dir> [mobile|desktop]
import { chromium } from "playwright-core";
const [url, dir, mode = "mobile"] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext(mode === "mobile" ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { sessionStorage.setItem("bombshell-intro-seen", "1"); } catch {} });
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("page error:", e.message));
await p.goto(url, { waitUntil: "load" });
await p.waitForTimeout(800);
await p.screenshot({ path: `${dir}/${mode}-hero.png` });
for (const id of ["usluge", "o-nama", "galerija", "recenzije", "kontakt"]) {
  const el = p.locator(`#${id}`);
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(1200);
  await el.screenshot({ path: `${dir}/${mode}-${id}.png` });
}
await b.close();
