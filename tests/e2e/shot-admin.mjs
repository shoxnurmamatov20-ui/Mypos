import { chromium } from '@playwright/test';
import fs from 'node:fs';
const TOKEN = fs.readFileSync(process.argv[2], 'utf8').trim();
const KEY = process.argv[4] ?? 'mypos_superadmin_token';
const OUT = process.argv[3];
const PAGES = [['dashboard','/uz/dashboard'],['tenants','/uz/tenants'],['billing','/uz/billing']];
const b = await chromium.launch();
for (const scheme of ['light','dark']) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, colorScheme: scheme });
  await ctx.addInitScript(([k,t]) => { try { localStorage.setItem(k,t); } catch {} }, [KEY, TOKEN]);
  const p = await ctx.newPage();
  for (const [name, path] of PAGES) {
    try {
      await p.goto('http://127.0.0.1/panel/admin'+path, { waitUntil:'networkidle', timeout:30000 });
      await p.waitForTimeout(2200);
      await p.screenshot({ path: `${OUT}/admin-${scheme}-${name}.png` });
      console.log(`${scheme}/${name}: ok`);
    } catch (e) { console.log(`${scheme}/${name}: FAILED ${e.message.split('\n')[0]}`); }
  }
  await ctx.close();
}
await b.close();
