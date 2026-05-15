import { expect, test } from '@playwright/test';
import {
  appUrl,
  openCommandPalette,
  startLocalLibrary,
} from './helpers';

test.describe('prompt execution', () => {
  test('opens the command palette, handles empty search, and closes with Escape', async ({ page }) => {
    await startLocalLibrary(page);

    const palette = await openCommandPalette(page);
    await expect(palette.getByRole('option', { name: /Summarize Text/ })).toBeVisible();

    await palette.getByLabel('Search prompts').fill('no matching prompt exists');
    await expect(palette.getByText('No prompts found')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(palette).toHaveCount(0);
  });

  test('fills variables from command palette selection and copies rendered prompt text', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: appUrl });
    await startLocalLibrary(page);

    const palette = await openCommandPalette(page);
    await palette.getByLabel('Search prompts').fill('Summarize Text');
    await palette.getByRole('option', { name: /Summarize Text/ }).click();

    const fillDialog = page.getByRole('dialog', { name: 'Fill variables for Summarize Text' });
    await expect(fillDialog).toBeVisible();
    await fillDialog.getByLabel('Value for variable length').fill('3');
    await fillDialog.getByLabel('Value for variable text').fill('PromptDock keeps prompt recipes local by default.');
    await fillDialog.getByLabel('Value for variable format').fill('bullet list');
    await expect(fillDialog.getByLabel('Rendered prompt preview')).toContainText('PromptDock keeps prompt recipes local by default.');

    await fillDialog.getByRole('button', { name: /Copy to Clipboard/ }).click();

    await expect(fillDialog).toHaveCount(0);
    await expect(page.getByRole('alert')).toContainText('Prompt copied to clipboard');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('3 sentences');
  });
});
