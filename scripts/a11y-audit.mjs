// Real-browser accessibility audit of the production build.
//
//   npm run build && npm run audit:a11y
//
// For every route, in light and dark themes, on desktop (mouse) and mobile
// (touch), it checks:
//   1. axe-core, WCAG 2.0/2.1/2.2 Levels A and AA, including color contrast
//      and target size, which jsdom cannot measure.
//   2. Target size: 24x24px with a mouse, 44x44px on touch (SC 2.5.8, plus
//      this site's stricter touch rule). Inline links in sentences are exempt.
//   3. Focus appearance: every Tab stop shows a visible outline or ring.
//   4. Reduced motion: transitions and animations are switched off.
//   5. No console errors, page errors, or hydration errors.
//
// Exits 1 on any failure. Set CHROME_PATH to use a different browser.

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const PORT = Number(process.env.AUDIT_PORT ?? 3217);
const BASE = `http://localhost:${PORT}`;
const ROUTES = ["/", "/guide", "/forum", "/sources", "/about"];
const CHROME =
  process.env.CHROME_PATH ??
  join(homedir(), ".cache/ms-playwright/chromium-1234/chrome-linux64/chrome");

const VIEWPORTS = {
  desktop: { width: 1280, height: 800, min: 24 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2, min: 44 },
};

// Runs in the page: lists visible interactive elements smaller than min px.
const findSmallTargets = (min) => {
    const sel = "a[href], button, input, textarea, select, summary, [role=tab], [tabindex]:not([tabindex='-1'])";
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.visibility === "hidden") continue;
      if (el.closest(".sr-only") || el.classList.contains("sr-only")) continue;
      if (el.closest("[aria-hidden=true]")) continue;
      // SC 2.5.8 inline exception: a link inside a sentence or a footnote.
      if (el.closest("sup")) continue;
      if (cs.display === "inline" && el.closest("p, li, td, dd, figcaption, blockquote")) continue;
      if (r.width < min - 0.5 || r.height < min - 0.5) {
        out.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return out;
  };

// Runs in the page: does the focused element show an outline or ring?
const focusVisible = (el) => {
  const cs = getComputedStyle(el);
  const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2;
  const ring = cs.boxShadow !== "none" && /rgb/.test(cs.boxShadow);
  return outline || ring;
};

const failures = [];
const fail = (where, what) => failures.push(`${where}: ${what}`);

function startServer() {
  // detached: the server gets its own process group, so stop() ends all of it.
  const server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], { stdio: "pipe", detached: true });
  server.stop = () => {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
  };
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("next start timed out")), 30000);
    server.stdout.on("data", (d) => {
      if (/ready|started|Local:/i.test(String(d))) {
        clearTimeout(timer);
        resolve(server);
      }
    });
    server.on("exit", (code) => reject(new Error(`next start exited with ${code}`)));
  });
}

async function audit(browser, route, theme, vpName) {
  const where = `${route} [${theme}, ${vpName}]`;
  const vp = VIEWPORTS[vpName];
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.setViewport(vp);
  await page.evaluateOnNewDocument((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, theme);
  await page.goto(BASE + route, { waitUntil: "networkidle0" });
  // Let hydration and any entry animation finish.
  await new Promise((r) => setTimeout(r, 600));

  const htmlClass = await page.evaluate(() => document.documentElement.className);
  if (!htmlClass.includes(theme)) fail(where, `theme class missing (got "${htmlClass}")`);
  if (vpName === "mobile") {
    const coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
    if (!coarse) fail(where, "mobile emulation did not report a coarse pointer");
  }

  // Open collapsed content so axe checks it too.
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));

  // 1. axe
  await page.addScriptTag({ path: AXE });
  const axe = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
      count: v.nodes.length,
    }));
  });
  for (const v of axe) fail(where, `axe ${v.id} (${v.impact}, ${v.count}x): ${v.nodes.join(" | ")}`);

  // 2. target size
  const small = await page.evaluate(findSmallTargets, vp.min);
  for (const s of small) fail(where, `target under ${vp.min}px: ${s}`);

  // 3. focus appearance on every Tab stop (desktop keyboard only)
  if (vpName === "desktop") {
    await page.evaluate(() => document.activeElement?.blur());
    const seen = new Set();
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press("Tab");
      // Same focusVisible() the canary checks, run in the page.
      const info = await page.evaluate(`(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const path = el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + ' "' + (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30) + '"';
        return { path, visible: (${focusVisible})(el) };
      })()`);
      if (!info || seen.has(info.path)) break;
      seen.add(info.path);
      if (!info.visible) fail(where, `no visible focus indicator on ${info.path}`);
    }
  }

  // 4. reduced motion
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const moving = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      const t = Math.max(...cs.transitionDuration.split(",").map(parseFloat));
      const a = Math.max(...cs.animationDuration.split(",").map(parseFloat));
      if (t > 0.001 || a > 0.001) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} t=${t}s a=${a}s`);
    }
    return out.slice(0, 5);
  });
  for (const m of moving) fail(where, `motion under reduced-motion: ${m}`);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  // 5. console and hydration errors
  for (const e of errors) fail(where, `console: ${e.slice(0, 160)}`);

  await page.close();
  return { where, axe: axe.length, small: small.length };
}


// Canary: plant a 10x10 button with no focus style and make sure both
// detectors flag it. If they don't, the audit itself is broken.
async function canary(browser) {
  const page = await browser.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    const b = document.createElement("button");
    b.id = "canary";
    b.textContent = "x";
    b.style.cssText = "all:unset;display:block;width:10px;height:10px;outline:none !important;box-shadow:none !important";
    document.querySelector("main").appendChild(b);
  });
  const small = await page.evaluate(findSmallTargets, 24);
  if (!small.some((t) => t.includes("10x10"))) fail("canary", "target-size check missed a 10x10 button");
  await page.focus("#canary");
  const visible = await page.evaluate(`(${focusVisible})(document.getElementById("canary"))`);
  if (visible) fail("canary", "focus check passed a button with no focus style");
  await page.close();
}

const server = await startServer();
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
let runs = 0;
try {
  await canary(browser);
  for (const route of ROUTES)
    for (const theme of ["light", "dark"])
      for (const vp of Object.keys(VIEWPORTS)) {
        await audit(browser, route, theme, vp);
        runs++;
      }

  // The mobile drawer, open, in both themes.
  for (const theme of ["light", "dark"]) {
    const where = `drawer [${theme}, mobile]`;
    const page = await browser.newPage();
    await page.setViewport(VIEWPORTS.mobile);
    await page.evaluateOnNewDocument((t) => localStorage.setItem("theme", t), theme);
    await page.goto(BASE + "/guide", { waitUntil: "networkidle0" });
    await page.click('button[aria-label="Open menu"]');
    await page.waitForSelector('[role="dialog"]');
    await new Promise((r) => setTimeout(r, 500));
    await page.addScriptTag({ path: AXE });
    const v = await page.evaluate(async () =>
      (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => x.id)
    );
    for (const id of v) fail(where, `axe ${id}`);
    await page.close();
    runs++;
  }
} finally {
  await browser.close();
  server.stop();
}

console.log(`Audited ${runs} page states (${ROUTES.length} routes x 2 themes x 2 viewports, plus the drawer).`);
if (failures.length) {
  console.log(`\n${failures.length} problem(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("No problems found.");
