import { test, expect } from '@playwright/test';

test.describe('public shell', () => {
  test('home responds', async ({ request }) => {
    const res = await request.get('/');
    expect(res.ok(), await res.text()).toBeTruthy();
  });

  test('web app manifest', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.ok(), await res.text()).toBeTruthy();
    const data = await res.json();
    expect(data.name).toBe('IbaHub');
    expect(data.short_name).toBe('IbaHub');
  });
});
