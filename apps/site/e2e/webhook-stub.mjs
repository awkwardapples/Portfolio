// A stand-in for the Make.com webhook during browser tests (spec Pass 6
// acceptance). It records every forward it receives and can fail a given
// visitor's forward, so the tests can see exactly what the Worker sent.
//
//   POST /hook             a forward from the Worker (recorded; 200, or 500 while failing)
//   GET  /requests         everything received so far, as JSON
//   POST /fail?email=E     fail the next forward for that visitor (tests run in parallel)
//   GET  /health           for Playwright's readiness check
import { createServer } from 'node:http';

const PORT = Number(process.env.WEBHOOK_STUB_PORT ?? 8799);
const received = [];
const failFor = new Set();

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${PORT}`);
  const send = (status, body) => {
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(body));
  };

  if (request.method === 'GET' && url.pathname === '/health') return send(200, { ok: true });
  if (request.method === 'GET' && url.pathname === '/requests') return send(200, received);
  if (request.method === 'POST' && url.pathname === '/fail') {
    failFor.add(url.searchParams.get('email') ?? '');
    return send(200, { failing: [...failFor] });
  }
  if (request.method === 'POST' && url.pathname === '/hook') {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', () => {
      let payload = null;
      try {
        payload = JSON.parse(body);
      } catch {
        // Recorded as null.
      }
      const email = payload?.answers?.contact_email ?? '';
      const failed = failFor.delete(email);
      received.push({ secret: request.headers['x-webhook-secret'] ?? null, failed, payload });
      send(failed ? 500 : 200, { accepted: !failed });
    });
    return undefined;
  }
  return send(404, { error: 'not found' });
});

server.listen(PORT, '127.0.0.1');
