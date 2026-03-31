import { test, expect } from '@playwright/test';

/**
 * INTEGRATION_PLAN §3.2 / §3.8 — shell boundaries without browser login.
 * Session-protected routes return 401; webhooks reject bad/missing secrets (401 or 503).
 */
test.describe('integration shell API', () => {
  test('gateway requires session', async ({ request }) => {
    const res = await request.get('/api/gateway/logistics/health');
    expect(res.status()).toBe(401);
  });

  test('unknown gateway service returns 404', async ({ request }) => {
    const res = await request.get('/api/gateway/unknown/health');
    expect(res.status()).toBe(404);
  });

  test('contracts manifest requires session', async ({ request }) => {
    const res = await request.get('/api/integration/contracts');
    expect(res.status()).toBe(401);
  });

  test('integration health requires session', async ({ request }) => {
    const res = await request.get('/api/integration/health');
    expect(res.status()).toBe(401);
  });

  test('integration webhook rejects invalid secret or missing config', async ({
    request
  }) => {
    const res = await request.post('/api/webhooks/integration', {
      data: { ping: true },
      headers: {
        'Content-Type': 'application/json',
        'X-IbaHub-Webhook-Secret': 'invalid-e2e-secret'
      }
    });
    expect([401, 503]).toContain(res.status());
  });

  test('paystack webhook rejects invalid signature', async ({ request }) => {
    const res = await request.post('/api/webhooks/paystack', {
      data: {
        event: 'charge.success',
        data: {
          amount: 500000,
          reference: 'e2e-ref',
          metadata: { kind: 'rider_booking', riderBookingId: 1 }
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': 'invalid'
      }
    });
    expect(res.status()).toBe(401);
  });

  test('rider booking creation requires session', async ({ request }) => {
    const res = await request.post('/api/rides/bookings', {
      data: {
        riderProfileId: 1,
        pickupLabel: 'A',
        dropoffLabel: 'B',
        pickupLat: 5.1,
        pickupLng: 7.1,
        dropoffLat: 5.2,
        dropoffLng: 7.2,
        quotedFareNaira: 1500
      }
    });
    expect(res.status()).toBe(401);
  });
});
