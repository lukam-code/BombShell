// Pomoćna skripta za vizuelnu proveru: node scripts/screenshot.mjs <url> <izlaz.png> [mobile|desktop] [fullPage]
import { chromium } from "playwright-core";
import fs from "node:fs";

const [url, out, mode = "desktop", full = "full"] = process.argv.slice(2);
const exe = ["/opt/pw-browsers/chromium", process.env.CHROMIUM_PATH].find((p) => p && fs.existsSync(p));
const browser = await chromium.launch({ executablePath: findChrome(exe) });
const ctx = await browser.newContext(
  mode === "mobile"
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } },
);
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("console error:", m.text(), m.location().url));
page.on("pageerror", (e) => console.log("page error:", e.message));
await page.addInitScript(() => {
  try {
    sessionStorage.setItem("bombshell-intro-seen", "1");
  } catch {}
});
await page.goto(url, { waitUntil: "load" });
// skroluj da se pokrenu whileInView animacije
if (full === "full") {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
}
await page.screenshot({ path: out, fullPage: full === "full" });
await browser.close();

function findChrome(dir) {
  if (!dir) return undefined;
  if (fs.statSync(dir).isFile()) return dir;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${f.name}`;
      if (f.isDirectory()) stack.push(p);
      else if (f.name === "chrome" || f.name === "chromium") return p;
    }
  }
}
