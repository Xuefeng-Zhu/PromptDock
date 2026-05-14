import { expect, test } from '@playwright/test';
import {
  appUrl,
  createPrompt,
  openPromptAction,
  openSettings,
  promptCard,
  selectPrompt,
  startLocalLibrary,
} from './helpers';

test('onboarding supports the sign-in branch, cancel, local start, and account popover', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Get started' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in or create account' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in to account' })).toBeVisible();

  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Start locally' }).click();
  await expect(page.getByRole('heading', { name: 'All Prompts' })).toBeVisible();

  await page.getByRole('button', { name: 'Account' }).click();
  await expect(page.getByRole('dialog', { name: 'Account' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Account' }).getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Account' }).getByLabel('Password')).toBeVisible();
});

test('prompt lifecycle covers create, favorite, edit, archive, restore, and delete', async ({ page }) => {
  const title = 'E2E Lifecycle Prompt';
  const updatedTitle = 'E2E Lifecycle Prompt Updated';

  await startLocalLibrary(page);
  await createPrompt(page, {
    title,
    description: 'A prompt used to verify the browser lifecycle.',
    body: 'Draft a concise release update for {{audience}}.',
    tags: ['lifecycle'],
  });

  const details = await selectPrompt(page, title);
  await details.getByRole('button', { name: 'Add to favorites' }).click();
  await expect(details.getByRole('button', { name: 'Remove from favorites' })).toBeVisible();

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /Favorites/ }).click();
  await expect(promptCard(page, title)).toBeVisible();

  await openPromptAction(page, 'Edit prompt');
  await expect(page.getByRole('heading', { name: 'Edit Prompt' })).toBeVisible();
  await page.getByLabel('Title').fill(updatedTitle);
  await page.getByLabel('Body').fill('Draft a concise release update for {{audience}} with one risk.');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(promptCard(page, updatedTitle)).toBeVisible();

  await selectPrompt(page, updatedTitle);
  await openPromptAction(page, 'Archive');
  await expect(promptCard(page, updatedTitle)).toHaveCount(0);

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /Archived/ }).click();
  await selectPrompt(page, updatedTitle);
  await openPromptAction(page, 'Restore');

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /All Prompts/ }).click();
  await selectPrompt(page, updatedTitle);
  await openPromptAction(page, 'Delete');
  await expect(page.getByRole('dialog', { name: new RegExp(`Delete "${updatedTitle}" permanently`) })).toBeVisible();
  await page.getByRole('button', { name: 'Delete permanently' }).click();

  await page.getByRole('searchbox', { name: 'Search prompts' }).fill(updatedTitle);
  await expect(page.getByText('No prompts found')).toBeVisible();
});

test('library organization covers folders, tags, search, filters, sorting, and view mode', async ({ page }) => {
  const title = 'E2E Research Brief';
  const folder = 'E2E Research';
  const tag = 'research';

  await startLocalLibrary(page);
  await createPrompt(page, {
    title,
    description: 'A research brief organized by folder and tag.',
    body: 'Create a research brief about market signals.',
    folder,
    tags: [tag],
  });

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: `${folder} 1` }).click();
  await expect(promptCard(page, title)).toBeVisible();

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: `${tag} 1`, exact: true }).click();
  await expect(promptCard(page, title)).toBeVisible();

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /All Prompts/ }).click();
  await page.getByRole('searchbox', { name: 'Search prompts' }).fill('Research Brief');
  await expect(promptCard(page, title)).toBeVisible();
  await expect(promptCard(page, 'Email Draft')).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search prompts' }).fill('');

  await page.getByRole('button', { name: /Sorted by Last used/ }).click();
  await page.getByRole('menuitemradio', { name: 'A-Z' }).click();
  await expect(page.getByRole('button', { name: /Sorted by A-Z/ })).toBeVisible();

  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /Filters/ }).click();
  const filters = page.getByRole('dialog', { name: 'Filters' });
  await filters.getByLabel('Search title or keywords').fill('research');
  await filters.getByRole('button', { name: 'Select tags' }).click();
  await page.getByRole('option', { name: `#${tag}` }).click();
  await filters.getByRole('button', { name: 'Apply filters' }).click();
  await expect(promptCard(page, title)).toBeVisible();
  await expect(promptCard(page, 'Email Draft')).toHaveCount(0);
});

test('command palette opens variable fill and copies rendered prompt text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: appUrl });
  await startLocalLibrary(page);

  await page.getByRole('searchbox', { name: 'Search prompts' }).click();
  const palette = page.getByRole('dialog', { name: 'Command palette' });
  await expect(palette).toBeVisible();
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

test('settings covers appearance, default behavior, export, and import', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      value: undefined,
    });
  });

  await startLocalLibrary(page);
  await openSettings(page);

  await page.getByRole('button', { name: 'Appearance' }).click();
  await page.getByRole('region', { name: 'Appearance settings' }).getByText('Dark', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.getByRole('button', { name: 'Default Behavior' }).click();
  await expect(page.getByRole('radio', { name: /Copy to Clipboard/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: /Paste into Active App/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Import/Export' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export prompts to JSON file' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^promptdock-export-\d{4}-\d{2}-\d{2}\.json$/);
  await expect(page.getByText('Prompts exported successfully.')).toBeVisible();

  const importedTitle = 'E2E Imported Prompt';
  const importJson = JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    prompts: [
      {
        title: importedTitle,
        description: 'Imported from the browser e2e flow.',
        body: 'Write a short imported prompt.',
        tags: ['imported'],
      },
    ],
  });

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import prompts from JSON file' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    buffer: Buffer.from(importJson),
    mimeType: 'application/json',
    name: 'promptdock-import.json',
  });
  await expect(page.getByText('Imported 1 prompt(s) successfully.')).toBeVisible();

  await page.getByRole('button', { name: 'Go back' }).click();
  await page.getByRole('searchbox', { name: 'Search prompts' }).fill(importedTitle);
  await expect(promptCard(page, importedTitle)).toBeVisible();
});

test('mobile navigation opens the drawer and routes to settings', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 820 });
  await startLocalLibrary(page);

  await page.getByRole('button', { name: 'Open navigation' }).click();
  const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobileNav).toBeVisible();
  await mobileNav.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Go back' }).click();
  await expect(page.getByRole('heading', { name: 'All Prompts' })).toBeVisible();
});
