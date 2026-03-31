/**
 * Minimal upstream for INTEGRATION_PLAN §3.5 — gig / on-demand list without libretaxi.
 * Run: pnpm mock:gig
 * Default: INTEGRATION_GIG_URL=http://localhost:4200 (MOCK_GIG_PORT).
 */
import http from 'node:http';

const PORT = Number(process.env.MOCK_GIG_PORT || 4200);

const rides = {
  rides: [
    {
      id: 'ride_demo_1',
      status: 'searching',
      reference: 'IbaHub mock gig'
    },
    {
      id: 'ride_demo_2',
      status: 'en_route',
      reference: 'plan-3.5-gig-proof'
    }
  ],
  meta: { source: 'mock-gig-server', planRef: 'INTEGRATION_PLAN 3.5 gig' }
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (req.method === 'GET' && path === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, service: 'gig-mock' }));
    return;
  }
  if (req.method === 'GET' && path === '/v1/rides') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rides));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'not_found', path }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`mock gig upstream: http://127.0.0.1:${PORT}`);
  console.log('  GET /health   GET /v1/rides');
});
