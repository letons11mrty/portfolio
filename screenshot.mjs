import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const BEAUTY_DIR = 'C:\\創作\\portfolio-3d\\beauty-demo';
const LUMOS_DIR  = 'C:\\創作\\Lumos&Musk';
const SK_DIR     = 'C:\\hal\\SK';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.gif':  'image/gif',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
};

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function startServer(port, dir) {
  return new Promise(resolve => {
    const server = createServer((req, res) => {
      const rel      = req.url === '/' ? '/index.html' : req.url;
      const filePath = join(dir, rel.split('?')[0]);
      if (!existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(readFileSync(filePath));
    });
    server.listen(port, () => {
      console.log(`Server [${dir.split('\\').pop()}]: http://localhost:${port}`);
      resolve(server);
    });
  });
}

const CSS_RESET = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
`;

async function screenshot(page, url, outPath, label, scrollY = 0) {
  console.log(`Capturing: ${label}…`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: CSS_RESET });
  await page.waitForTimeout(1500);
  if (scrollY) {
    await page.evaluate(y => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 93 });
  console.log(`  → ${outPath}`);
}

(async () => {
  const BEAUTY_PORT = 9998;
  const LUMOS_PORT  = 9999;

  const SK_PORT = 9997;

  const [beautyServer, lumosServer, skServer] = await Promise.all([
    startServer(BEAUTY_PORT, BEAUTY_DIR),
    startServer(LUMOS_PORT,  LUMOS_DIR),
    startServer(SK_PORT,     SK_DIR),
  ]);

  const beautyBase = `http://localhost:${BEAUTY_PORT}`;
  const lumosBase  = `http://localhost:${LUMOS_PORT}`;
  const skBase     = `http://localhost:${SK_PORT}`;

  const beautyOut = join(__dirname, 'work04-beauty');
  const lumosOut  = join(__dirname, 'work02-lumos');
  const skOut     = join(__dirname, 'work03-sukima');

  mkdirSync(beautyOut, { recursive: true });
  mkdirSync(lumosOut,  { recursive: true });
  mkdirSync(skOut,     { recursive: true });

  const browser = await chromium.launch({
    executablePath: EDGE,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--force-device-scale-factor=1',
      '--disable-web-security',
    ],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // ── Beauty: 01 minimal-luxury ────────────────────────────────────────────────
  await screenshot(page, `${beautyBase}/01-minimal-luxury.html`, join(beautyOut, 'ss-01-hero.jpg'),  '01 Hero (top)');
  await screenshot(page, `${beautyBase}/01-minimal-luxury.html`, join(beautyOut, 'ss-01-works.jpg'), '01 Works section', 900);

  // ── Beauty: 04 clean-simple ──────────────────────────────────────────────────
  await screenshot(page, `${beautyBase}/04-clean-simple.html`,   join(beautyOut, 'ss-04-hero.jpg'),  '04 Hero (top)');
  await screenshot(page, `${beautyBase}/04-clean-simple.html`,   join(beautyOut, 'ss-04-works.jpg'), '04 Works section', 900);

  // ── Lumos & Musk ────────────────────────────────────────────────────────────
  await screenshot(page, `${lumosBase}/index.html`,       join(lumosOut, 'ss-index.jpg'),      'Lumos Top');
  await screenshot(page, `${lumosBase}/shop.html`,        join(lumosOut, 'ss-shop.jpg'),       'Lumos Shop');
  await screenshot(page, `${lumosBase}/discovery.html`,   join(lumosOut, 'ss-discovery.jpg'),  'Lumos Discovery');
  await screenshot(page, `${lumosBase}/reservation.html`, join(lumosOut, 'ss-reservation.jpg'),'Lumos Reservation');

  // ── すきまけしき (SK) ────────────────────────────────────────────────────────
  await screenshot(page, `${skBase}/index.html`,        join(skOut, 'ss-login.jpg'),  'SK ログイン');
  await screenshot(page, `${skBase}/pages/main.html`,   join(skOut, 'ss-main.jpg'),   'SK メイン');
  await screenshot(page, `${skBase}/pages/home.html`,   join(skOut, 'ss-home.jpg'),   'SK ホーム');
  await screenshot(page, `${skBase}/pages/map.html`,    join(skOut, 'ss-map.jpg'),    'SK マップ');

  await browser.close();
  beautyServer.close();
  lumosServer.close();
  skServer.close();
  console.log('\nAll done!');
})();
