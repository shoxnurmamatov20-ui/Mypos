#!/usr/bin/env node
/**
 * MyPOS unified reverse proxy.
 *
 * Routes /panel/<role>/* to the right Next.js dev server, and / to web-marketing.
 * Forwards HTTP + WebSocket (Next.js HMR + Reverb) traffic transparently.
 *
 *   localhost/                  → web-marketing  :3000
 *   localhost/panel/admin/*     → web-superadmin :3004
 *   localhost/panel/ceo/*       → web-ceo        :3001
 *   localhost/panel/manager/*   → web-dashboard  :3006
 *   localhost/panel/cashier/*   → web-cashier    :3008
 *   localhost/panel/portal/*    → web-portal     :3005
 *   localhost/panel/kitchen/*   → kds            :3007
 *   localhost/panel/qr/*        → web-qr         :3003
 *   localhost/panel/consumer/*  → web-consumer   :3002
 *
 * Optional API alias (so frontend can call same-origin):
 *   localhost/api/*             → laravel        :8000
 *   localhost/reverb/*          → reverb         :8080 (WebSocket)
 */
import http from 'node:http';
import net from 'node:net';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT ?? 3000);

// Order matters: more specific prefixes first.
const ROUTES = [
  ['/panel/admin', 'http://127.0.0.1:3004'],
  ['/panel/ceo', 'http://127.0.0.1:3001'],
  ['/panel/manager', 'http://127.0.0.1:3006'],
  ['/panel/cashier', 'http://127.0.0.1:3008'],
  ['/panel/portal', 'http://127.0.0.1:3005'],
  ['/panel/kitchen', 'http://127.0.0.1:3007'],
  ['/panel/qr', 'http://127.0.0.1:3003'],
  ['/panel/consumer', 'http://127.0.0.1:3002'],
  ['/api', 'http://127.0.0.1:8000'],
  ['/sanctum', 'http://127.0.0.1:8000'],
  ['/broadcasting', 'http://127.0.0.1:8000'],
  ['/admin', 'http://127.0.0.1:8000'], // Filament panel
  ['/livewire', 'http://127.0.0.1:8000'],
  ['/storage', 'http://127.0.0.1:8000'],
  ['/up', 'http://127.0.0.1:8000'],
  ['/app/', 'http://127.0.0.1:8080'], // Reverb HTTP fallback (Pusher protocol uses /app/{key})
];

const FALLBACK = 'http://127.0.0.1:3009'; // web-marketing for / and everything else

function pickTarget(reqUrl) {
  for (const [prefix, dest] of ROUTES) {
    if (reqUrl === prefix || reqUrl.startsWith(prefix + '/') || reqUrl.startsWith(prefix + '?')) {
      return dest;
    }
  }
  return FALLBACK;
}

/**
 * Decide cache-control for the response based on path. Next.js production
 * builds emit immutable hashed assets under `/_next/static/...` — we cache
 * those for a year. Everything else gets a short cache to keep navigations
 * snappy on repeat visits.
 */
function cacheHeaderFor(url) {
  if (url.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  if (url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.woff2') || url.endsWith('.svg') || url.endsWith('.png') || url.endsWith('.webp')) {
    return 'public, max-age=86400';
  }
  // HTML / API responses — let downstream decide, but allow brief cache for
  // navigation back/forward.
  return null;
}

function forwardHttp(req, res) {
  const target = pickTarget(req.url);
  const u = new URL(target);

  const proxyReq = http.request(
    {
      hostname: u.hostname,
      port: u.port || 80,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        host: u.host,
        'x-forwarded-host': req.headers.host ?? '',
        'x-forwarded-proto': 'http',
        'x-forwarded-for':
          (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] + ', ' : '') +
          (req.socket.remoteAddress ?? ''),
      },
    },
    (proxyRes) => {
      // Override cache headers for static assets so repeat navigations
      // don't re-fetch JS/CSS bundles.
      const cache = cacheHeaderFor(req.url ?? '/');
      const headers = { ...proxyRes.headers };
      if (cache) {
        headers['cache-control'] = cache;
      }
      res.writeHead(proxyRes.statusCode ?? 502, headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    }
    res.end(`[proxy] upstream error → ${target}\n${err.message}`);
  });

  req.on('aborted', () => proxyReq.destroy());
  req.pipe(proxyReq);
}

function forwardUpgrade(req, clientSocket, head) {
  // WebSocket upgrade (Next.js HMR, Reverb push channel).
  const target = pickTarget(req.url ?? '/');
  const u = new URL(target);
  const upstream = net.connect(Number(u.port) || 80, u.hostname, () => {
    const reqLines = [
      `${req.method} ${req.url} HTTP/${req.httpVersion}`,
      ...Object.entries(req.headers).flatMap(([k, v]) =>
        Array.isArray(v) ? v.map((vi) => `${k}: ${vi}`) : [`${k}: ${v}`],
      ),
      '',
      '',
    ];
    upstream.write(reqLines.join('\r\n'));
    if (head && head.length) upstream.write(head);
    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
  });
  const teardown = () => {
    try { upstream.destroy(); } catch {}
    try { clientSocket.destroy(); } catch {}
  };
  upstream.on('error', teardown);
  clientSocket.on('error', teardown);
}

const server = http.createServer(forwardHttp);
server.on('upgrade', forwardUpgrade);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[proxy] listening on http://localhost:${PORT}`);
  console.log('[proxy] routes:');
  for (const [prefix, dest] of ROUTES) {
    console.log(`  ${prefix.padEnd(20)} → ${dest}`);
  }
  console.log(`  ${'(fallback)'.padEnd(20)} → ${FALLBACK}  (web-marketing)`);
});

server.on('error', (err) => {
  if (err.code === 'EACCES' && PORT < 1024) {
    console.error(
      `[proxy] cannot bind port ${PORT} — requires admin privileges on Windows ` +
        `or capabilities on Linux. Set PORT=8888 to use a high port.`,
    );
  }
  console.error('[proxy] server error:', err);
  process.exit(1);
});
