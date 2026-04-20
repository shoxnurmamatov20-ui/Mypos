import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

/**
 * Tiny placeholder HTTP server for Telegram Web App buttons.
 *
 * For MVP we only serve a friendly HTML stub. Once the consumer web app is
 * ready, point the bot's WebApp button at its URL directly and delete this
 * module (or replace the handler with a reverse proxy).
 */
const STUB_HTML = `<!doctype html>
<html lang="uz">
<head><meta charset="utf-8" /><title>MyPOS WebApp</title></head>
<body>
  <h1>MyPOS Telegram WebApp</h1>
  <p>Consumer web app mount point. Replace this with the real frontend URL.</p>
</body>
</html>`;

export function startWebAppServer(port: number): () => Promise<void> {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/healthz')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(STUB_HTML);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });
  server.listen(port, () => {
    console.log(`WebApp stub listening on http://0.0.0.0:${port}`);
  });
  return () =>
    new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
}
