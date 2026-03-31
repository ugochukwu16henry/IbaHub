/**
 * Minimal upstream for INTEGRATION_PLAN §3.5 — proves logistics without fleetbase.
 * Run: pnpm mock:logistics
 * Then set INTEGRATION_LOGISTICS_URL=http://127.0.0.1:4100 (see .env.example).
 */
import http from 'node:http';

const PORT = Number(process.env.MOCK_LOGISTICS_PORT || 4100);

const orders = {
  orders: [
    {
      id: 'ord_demo_1',
      status: 'queued',
      reference: 'IbaHub mock logistics'
    },
    {
      id: 'ord_demo_2',
      status: 'in_transit',
      reference: 'plan-3.5-proof-path'
    }
  ],
  meta: { source: 'mock-logistics-server', planRef: 'INTEGRATION_PLAN 3.5' }
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (req.method === 'GET' && path === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, service: 'logistics-mock' }));
    return;
  }
  if (req.method === 'GET' && path === '/v1/orders') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(orders));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'not_found', path }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`mock logistics upstream: http://127.0.0.1:${PORT}`);
  console.log('  GET /health   GET /v1/orders');
});
