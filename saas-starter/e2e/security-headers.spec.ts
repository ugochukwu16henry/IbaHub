import { test, expect } from '@playwright/test';

test.describe('security headers (§3.8)', () => {
  test('home sends baseline headers', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-frame-options']).toBe('DENY');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
    expect(res.headers()['referrer-policy']).toBe(
      'strict-origin-when-cross-origin'
    );
    const csp = res.headers()['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('frame-ancestors');
  });
});
