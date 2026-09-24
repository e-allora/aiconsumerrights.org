// Captures README screenshots from the production build.
//   npm run build && node scripts/screenshots.mjs
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const PORT = Number(process.env.AUDIT_PORT ?? 3217);
const BASE = `http://localhost:${PORT}`;
const OUT = "docs/screenshots";
const CHROME =
  process.env.CHROME_PATH ?? join(homedir(), ".cache/ms-playwright/chromium-1234/chrome-linux64/chrome");

const SHOTS = [
  { file: "guide-light.png", path: "/en/guide", theme: "light", vp: "desktop" },
  { file: "guide-dark.png", path: "/en/guide", theme: "dark", vp: "desktop" },
  { file: "explorer.png", path: "/en/guide", theme: "light", vp: "desktop", scrollTo: "#steps" },
  { file: "forum.png", path: "/en/forum", theme: "light", vp: "desktop", scrollTo: "#vote" },
  { file: "mobile-guide.png", path: "/en/guide", theme: "light", vp: "mobile" },
  { file: "mobile-drawer.png", path: "/es/forum", theme: "dark", vp: "mobile", drawer: true },
];
const VIEWPORTS = {
  desktop: { width: 1280, height: 800, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

const server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], { stdio: "pipe", detached: true });
await new Promise((resolve, reject) => {
  server.stdout.on("data", (d) => /ready|Local:/i.test(String(d)) && resolve());
  server.on("exit", (c) => reject(new Error(`next start exited ${c}`)));
});
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
try {
  for (const s of SHOTS) {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORTS[s.vp]);
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.evaluateOnNewDocument((t) => localStorage.setItem("theme", t), s.theme);
    await page.goto(BASE + s.path, { waitUntil: "networkidle0" });
    if (s.scrollTo) {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 90);
      }, s.scrollTo);
    }
    if (s.drawer) {
      await page.click('header button[aria-haspopup="dialog"]');
      await page.waitForSelector('[role="dialog"]');
    }
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: `${OUT}/${s.file}` });
    console.log("saved", s.file);
    await page.close();
  }
} finally {
  await browser.close();
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
}
