import { expect, test } from '@playwright/test';
import { startLocalLibrary } from './helpers';

test.describe('responsive navigation', () => {
  test('opens the mobile drawer, routes to settings, and returns to the library', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 820 });
    await startLocalLibrary(page);

    await page.getByRole('button', { name: 'Open navigation' }).click();
    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(mobileNav).toBeVisible();
    await mobileNav.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await page.getByRole('button', { name: 'Go back' }).click();
    await expect(page.getByRole('heading', { name: 'All Prompts' })).toBeVisible();

    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.keyboard.press('Escape');
    await expect(mobileNav).toHaveCount(0);
  });
});
