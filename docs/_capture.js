/* Capture every screen of the running app -> docs/screenshots/*.jpg + docs/walkthrough.mp4
 * Run via `python docs/capture.py` (installs the two npm deps first), or directly:
 *   cd docs && npm i puppeteer-core ffmpeg-static && node _capture.js
 * Requires: frontend dev server on http://localhost:5173, Django backend on :8000,
 * and demo data loaded (python manage.py seed_demo_data).
 *
 * Auth: this logs in through the API as CAPTURE_USER / CAPTURE_PASS (default
 * demo_admin / DemoPass!2026). capture.py creates that throwaway admin before
 * running this and deletes it afterwards; to use an existing admin instead, set
 * CAPTURE_USER / CAPTURE_PASS and run capture.py with --no-temp-user.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const puppeteer = require("puppeteer-core");
const ffmpeg = require("ffmpeg-static");

const BASE = process.env.APP_URL || "http://localhost:5173";
const API = process.env.API_URL || "http://127.0.0.1:8000/api";
const USER = process.env.CAPTURE_USER || "demo_admin";
const PASS = process.env.CAPTURE_PASS || "DemoPass!2026";
const DOCS = __dirname;
const OUT = path.join(DOCS, "screenshots");
const W = 1440, H = 900;
const DWELL = 2.8;

function findChrome() {
  const guesses = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const g of guesses) if (fs.existsSync(g)) return g;
  throw new Error("Chrome/Edge not found - set CHROME_PATH");
}

const ROUTES = [
  ["01-login", "/login", false], ["02-signup", "/signup", false],
  ["03-dashboard", "/", true], ["04-billing", "/billing", true],
  ["05-sales", "/sales", true], ["06-products", "/products", true],
  ["07-stock", "/stock", true], ["08-purchases", "/purchases", true],
  ["09-suppliers", "/suppliers", true], ["10-customers", "/customers", true],
  ["11-user-management", "/user-management", true], ["12-settings", "/settings", true],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const frames = fs.mkdtempSync(path.join(os.tmpdir(), "ib-frames-"));

  const res = await fetch(API + "/auth/login/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const tok = await res.json();
  if (!tok.access) throw new Error("API login failed for " + USER + ": " + JSON.stringify(tok));

  const browser = await puppeteer.launch({
    executablePath: findChrome(), headless: "new",
    defaultViewport: { width: W, height: H, deviceScaleFactor: 2 },
    args: ["--hide-scrollbars", "--force-device-scale-factor=2"],
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(45000);
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });

  let n = 0;
  for (const [name, route, auth] of ROUTES) {
    await page.evaluate((a, r, want) => {
      if (want) { localStorage.setItem("ib_access", a); localStorage.setItem("ib_refresh", r); }
      else { localStorage.removeItem("ib_access"); localStorage.removeItem("ib_refresh"); }
    }, tok.access, tok.refresh, auth);
    await page.goto(BASE + route, { waitUntil: "networkidle2" });
    await sleep(1700);
    await page.screenshot({ path: path.join(OUT, name + ".png"), fullPage: true });
    n += 1;
    await page.screenshot({ path: path.join(frames, String(n).padStart(2, "0") + ".png") });
    console.log("  ", name);
  }
  await browser.close();

  for (const f of fs.readdirSync(OUT).filter((f) => f.endsWith(".png"))) {
    execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", path.join(OUT, f),
      "-qscale:v", "3", path.join(OUT, f.replace(/\.png$/, ".jpg"))]);
    fs.unlinkSync(path.join(OUT, f));
  }

  const ordered = fs.readdirSync(frames).filter((f) => f.endsWith(".png")).sort();
  const list = path.join(frames, "list.txt");
  fs.writeFileSync(list, ordered.map((f) =>
    `file '${path.join(frames, f)}'\nduration ${DWELL}`).join("\n") +
    `\nfile '${path.join(frames, ordered[ordered.length - 1])}'\n`);
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list,
    "-vf", "scale=1920:1200:force_original_aspect_ratio=decrease,pad=1920:1200:(ow-iw)/2:(oh-ih)/2:color=0x2e1065,setsar=1,format=yuv420p",
    "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-movflags", "+faststart",
    path.join(DOCS, "walkthrough.mp4")]);
  fs.rmSync(frames, { recursive: true, force: true });

  console.log(`\nDone: ${n} screenshots -> docs/screenshots/, docs/walkthrough.mp4`);
})().catch((e) => { console.error(e); process.exit(1); });
