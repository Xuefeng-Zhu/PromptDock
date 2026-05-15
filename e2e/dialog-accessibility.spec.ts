import { expect, test } from '@playwright/test';
import {
  openCommandPalette,
  startLocalLibrary,
} from './helpers';

test.describe('dialog accessibility', () => {
  test('moves focus into the command palette and restores it to the search trigger on close', async ({ page }) => {
    await startLocalLibrary(page);

    const searchTrigger = page
      .locator('header')
      .getByRole('searchbox', { name: 'Search prompts' });
    await searchTrigger.focus();
    await expect(searchTrigger).toBeFocused();

    const palette = await openCommandPalette(page);
    await expect(palette.getByLabel('Search prompts')).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(palette).toHaveCount(0);
    await expect(searchTrigger).toBeFocused();
  });

  test('autofocuses the first variable field and lets keyboard users dismiss variable fill', async ({ page }) => {
    await startLocalLibrary(page);

    const palette = await openCommandPalette(page);
    await palette.getByLabel('Search prompts').fill('Summarize Text');
    await palette.getByRole('option', { name: /Summarize Text/ }).click();

    const fillDialog = page.getByRole('dialog', { name: 'Fill variables for Summarize Text' });
    await expect(fillDialog).toBeVisible();
    await expect(fillDialog.getByLabel('Value for variable length')).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(fillDialog).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
