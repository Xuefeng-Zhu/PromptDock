import { expect, test } from '@playwright/test';
import {
  importPromptsFromJson,
  openSettings,
  promptCard,
  selectPrompt,
  startLocalLibrary,
} from './helpers';

function exportDocument(prompts: Array<Record<string, unknown>>) {
  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date('2026-05-14T12:00:00.000Z').toISOString(),
    prompts,
  });
}

test.describe('settings, import, and export', () => {
  test('persists appearance preferences and keeps browser-only default action safe after reload', async ({ page }) => {
    await startLocalLibrary(page);
    await openSettings(page);

    await page.getByRole('button', { name: 'Appearance' }).click();
    await page.getByRole('region', { name: 'Appearance settings' }).getByText('Dark', { exact: true }).click();
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Default Behavior' }).click();
    await expect(page.getByRole('radio', { name: /Copy to Clipboard/ })).toBeChecked();
    await expect(page.getByRole('radio', { name: /Paste into Active App/ })).toHaveCount(0);

    await page.reload();

    await expect(page.locator('html')).toHaveClass(/dark/);
    await openSettings(page);
    await page.getByRole('button', { name: 'Appearance' }).click();
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  test('exports prompts, reports invalid import JSON, and imports a valid prompt file', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'showSaveFilePicker', {
        configurable: true,
        value: undefined,
      });
    });

    await startLocalLibrary(page);
    await openSettings(page);
    await page.getByRole('button', { name: 'Import/Export' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export prompts to JSON file' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^promptdock-export-\d{4}-\d{2}-\d{2}\.json$/);
    await expect(page.getByText('Prompts exported successfully.')).toBeVisible();

    await importPromptsFromJson(page, '{not valid json', 'broken-import.json');
    await expect(page.getByRole('alert')).toContainText('Invalid JSON: unable to parse input');

    const importedTitle = 'E2E Imported Prompt';
    await importPromptsFromJson(
      page,
      exportDocument([
        {
          title: importedTitle,
          description: 'Imported from the browser e2e flow.',
          body: 'Write a short imported prompt.',
          tags: ['imported'],
        },
      ]),
    );
    await expect(page.getByText('Imported 1 prompt(s) successfully.')).toBeVisible();

    await page.getByRole('button', { name: 'Go back' }).click();
    await page.getByRole('searchbox', { name: 'Search prompts' }).fill(importedTitle);
    await expect(promptCard(page, importedTitle)).toBeVisible();
  });

  test('lets users skip or overwrite duplicate imports deliberately', async ({ page }) => {
    await startLocalLibrary(page);
    await openSettings(page);
    await page.getByRole('button', { name: 'Import/Export' }).click();

    const duplicateTitle = 'Email Draft';
    const replacementBody = 'Imported replacement body for the existing email draft.';
    const duplicatePayload = exportDocument([
      {
        title: duplicateTitle,
        description: 'Replacement from an import file.',
        body: replacementBody,
        tags: ['imported-replacement'],
      },
    ]);

    await importPromptsFromJson(page, duplicatePayload);
    await expect(page.getByRole('alert')).toContainText('1 duplicate(s) found');
    await page.getByRole('button', { name: 'Skip duplicates' }).click();
    await expect(page.getByText('Skipped 1 duplicate(s). No new prompts imported.')).toBeVisible();

    await importPromptsFromJson(page, duplicatePayload);
    await expect(page.getByRole('alert')).toContainText('1 duplicate(s) found');
    await page.getByRole('button', { name: 'Overwrite duplicates' }).click();
    await expect(page.getByText('Imported 1 prompt(s), overwrote 1 duplicate(s).')).toBeVisible();

    await page.getByRole('button', { name: 'Go back' }).click();
    await page.getByRole('searchbox', { name: 'Search prompts' }).fill(duplicateTitle);
    const details = await selectPrompt(page, duplicateTitle);
    await expect(details).toContainText(replacementBody);
    await expect(details).toContainText('#imported-replacement');
  });
});
