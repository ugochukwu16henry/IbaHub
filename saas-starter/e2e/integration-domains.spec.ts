import { test, expect } from '@playwright/test';

/**
 * Authenticated domain paths → gateway → mock upstreams.
 *
 * Requires:
 * - pnpm db:setup && pnpm db:seed (creates test@test.com / admin123)
 * - pnpm mock:domains (or mock:logistics / mock:gig / mock:retail)
 *
 * Opt-in to avoid surprising failures on machines without mocks:
 *   E2E_INTEGRATION_MOCKS=true pnpm test:e2e
 */

const EMAIL = 'test@test.com';
const PASSWORD = 'admin123';

const mocksEnabled = process.env.E2E_INTEGRATION_MOCKS === 'true';

test.describe('integration domain flows (authenticated)', () => {
  test.skip(!mocksEnabled, 'Set E2E_INTEGRATION_MOCKS=true to run mock-backed domain tests');

  test('logistics data panel shows gateway JSON', async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/hub/data/logistics');

    await expect(page.getByRole('heading', { name: 'Logistics data' })).toBeVisible();
    const pre = page.locator('pre').first();
    await expect(pre).toContainText('logistics-mock', { timeout: 10_000 });
  });

  test('gig data panel shows gateway JSON', async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/hub/data/gig');

    await expect(page.getByRole('heading', { name: 'Gig data' })).toBeVisible();
    const pre = page.locator('pre').first();
    await expect(pre).toContainText('gig-mock', { timeout: 10_000 });
  });

  test('retail data panel shows gateway JSON', async ({ page }) => {
    await signIn(page);
    await page.goto('/dashboard/hub/data/retail');

    await expect(page.getByRole('heading', { name: 'Retail data' })).toBeVisible();
    const pre = page.locator('pre').first();
    await expect(pre).toContainText('retail-mock', { timeout: 10_000 });
  });
});

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Protected dashboard should load after successful login
  await page.waitForURL(/\/dashboard(\/|$)/);
}

