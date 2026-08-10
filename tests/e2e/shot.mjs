/**
 * Ad-hoc visual capture for the manager-panel Apple redesign.
 *
 * Not a test — a screenshot harness. Points at the locally-running
 * mypos-web-dashboard service, injects a real auth token into localStorage the
 * same way the app stores it, and captures each surface in both appearances.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1/panel/manager';
const TOKEN = fs.readFileSync(process.argv[2], 'utf8').trim();
const OUT = process.argv[3];

const PAGES = [
  ['login', '/uz/login', false],
  ['overview', '/uz/overview', true],
  ['incoming-log', '/uz/inventory/incoming-log', true],
  ['reports-orders', '/uz/reports/orders', true],
  ['menu-items', '/uz/menu/items', true],
];

const browser = await chromium.launch();

for (const scheme of ['light', 'dark']) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: scheme,
  });

  // Seed the token on the app origin before any page script runs.
  await context.addInitScript((token) => {
    try {
      localStorage.setItem('mypos_auth_token', token);
    } catch {
      /* first navigation may be about:blank */
    }
  }, TOKEN);

  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  for (const [name, path, authed] of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30_000 });
      // Let the auth store resolve and data land.
      await page.waitForTimeout(authed ? 2500 : 900);
      await page.screenshot({ path: `${OUT}/${scheme}-${name}.png`, fullPage: false });
      console.log(`${scheme}/${name}: ok`);
    } catch (err) {
      console.log(`${scheme}/${name}: FAILED — ${err.message.split('\n')[0]}`);
    }
  }

  if (errors.length) {
    console.log(`  ${scheme} console errors (${errors.length}):`);
    for (const e of [...new Set(errors)].slice(0, 6)) console.log(`    ${e.slice(0, 160)}`);
  }
  await context.close();
}

await browser.close();
