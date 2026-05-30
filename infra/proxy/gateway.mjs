import http from 'node:http';
import net from 'node:net';
import { URL } from 'node:url';

const GATEWAY_PORT = Number(process.env.GATEWAY_PORT ?? 3000);

const ROUTES = [
  { prefix: '/api/',           target: 'http://127.0.0.1:8000' },
  { prefix: '/broadcasting/',  target: 'http://127.0.0.1:8000' },
  { prefix: '/sanctum/',       target: 'http://127.0.0.1:8000' },
  { prefix: '/storage/',       target: 'http://127.0.0.1:8000' },
  { prefix: '/admin',          target: 'http://127.0.0.1:8000' },
  { prefix: '/app/',           target: 'http://127.0.0.1:8080' },
  { prefix: '/apps/',          target: 'http://127.0.0.1:8080' },
  { prefix: '/panel/ceo',      target: 'http://127.0.0.1:3001' },
  { prefix: '/panel/consumer', target: 'http://127.0.0.1:3002' },
  { prefix: '/panel/qr',       target: 'http://127.0.0.1:3003' },
  { prefix: '/panel/admin',    target: 'http://127.0.0.1:3004' },
  { prefix: '/panel/portal',   target: 'http://127.0.0.1:3005' },
  { prefix: '/panel/manager',  target: 'http://127.0.0.1:3006' },
  { prefix: '/panel/kitchen',  target: 'http://127.0.0.1:3007' },
  { prefix: '/panel/cashier',  target: 'http://127.0.0.1:3008' },
];

const FALLBACK = 'http://127.0.0.1:3009'; // web-marketing

function pickTarget(path) {
  for (const r of ROUTES) {
    if (path === r.prefix || path.startsWith(r.prefix + '/') || path.startsWith(r.prefix)) {
      return r.target;
    }
  }
  return FALLBACK;
}

function proxyRequest(clientReq, clientRes) {
  const targetBase = pickTarget(clientReq.url ?? '/');
  const targetUrl = new URL(clientReq.url ?? '/', targetBase);

  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || 80,
    method: clientReq.method,
    path: targetUrl.pathname + targetUrl.search,
    headers: {
      ...clientReq.headers,
      host: `${targetUrl.hostname}:${targetUrl.port || 80}`,
      'x-forwarded-host': clientReq.headers.host ?? '',
      'x-forwarded-proto': 'http',
      'x-forwarded-for': clientReq.socket.remoteAddress ?? '',
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[proxy] ${clientReq.method} ${clientReq.url} -> ${targetBase}: ${err.message}`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'content-type': 'text/plain' });
    }
    clientRes.end(`Bad Gateway: ${err.message}`);
  });

  clientReq.pipe(proxyReq, { end: true });
}

function handleUpgrade(req, clientSocket, head) {
  const targetBase = pickTarget(req.url ?? '/');
  const targetUrl = new URL(targetBase);
  const port = Number(targetUrl.port || 80);

  const upstream = net.connect(port, targetUrl.hostname, () => {
    const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
    for (const [k, v] of Object.entries(req.headers)) {
      lines.push(`${k}: ${v}`);
    }
    upstream.write(lines.join('\r\n') + '\r\n\r\n');
    if (head?.length) upstream.write(head);
    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
  });

  upstream.on('error', (err) => {
    console.error(`[proxy:ws] ${req.url} -> ${targetBase}: ${err.message}`);
    clientSocket.end();
  });

  clientSocket.on('error', () => upstream.end());
}

const server = http.createServer(proxyRequest);
server.on('upgrade', handleUpgrade);
server.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log(`[gateway] listening on http://localhost:${GATEWAY_PORT}`);
  console.log('[gateway] routes:');
  for (const r of ROUTES) console.log(`  ${r.prefix.padEnd(20)} -> ${r.target}`);
  console.log(`  ${'(fallback)'.padEnd(20)} -> ${FALLBACK}`);
});
