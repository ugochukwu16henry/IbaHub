import { expect, test } from '@playwright/test';

test.describe('retail parity api auth', () => {
  test('retail products requires authentication', async ({ request }) => {
    const res = await request.get('/api/retail/products');
    expect(res.status()).toBe(401);
  });

  test('retail pos create requires authentication', async ({ request }) => {
    const res = await request.post('/api/retail/pos', {
      data: {
        idempotencyKey: `spec_${Date.now()}`,
        paymentMethod: 'cash',
        lines: [{ itemId: 1, quantity: 1 }]
      }
    });
    expect(res.status()).toBe(401);
  });
});
