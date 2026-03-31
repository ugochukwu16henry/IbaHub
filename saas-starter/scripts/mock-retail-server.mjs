/**
 * Minimal upstream for INTEGRATION_PLAN §3.6 — retail catalog without QUANTUM-STASH.
 * Run: pnpm mock:retail
 * Default: INTEGRATION_RETAIL_URL=http://localhost:4300 (MOCK_RETAIL_PORT).
 */
import http from 'node:http';

const PORT = Number(process.env.MOCK_RETAIL_PORT || 4300);

const products = {
  products: [
    {
      id: 'sku_demo_1',
      name: 'Mock product A',
      stock: 42
    },
    {
      id: 'sku_demo_2',
      name: 'Mock product B',
      stock: 7
    }
  ],
  meta: { source: 'mock-retail-server', planRef: 'INTEGRATION_PLAN 3.6 retail' }
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (req.method === 'GET' && path === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, service: 'retail-mock' }));
    return;
  }
  if (req.method === 'GET' && path === '/api/products') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(products));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'not_found', path }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`mock retail upstream: http://127.0.0.1:${PORT}`);
  console.log('  GET /health   GET /api/products');
});
