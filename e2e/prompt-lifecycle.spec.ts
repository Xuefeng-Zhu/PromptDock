import { expect, test } from '@playwright/test';
import {
  createPrompt,
  expectPromptAbsent,
  openPromptAction,
  promptCard,
  selectPrompt,
  startLocalLibrary,
} from './helpers';

test.describe('prompt lifecycle', () => {
  test('favorites, edits, archives, restores, and permanently deletes a prompt', async ({ page }) => {
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
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(promptCard(page, updatedTitle)).toBeVisible();

    await openPromptAction(page, 'Delete');
    await page.getByRole('button', { name: 'Delete permanently' }).click();
    await expectPromptAbsent(page, updatedTitle);
  });

  test('duplicates a prompt into the local workspace without mutating the source', async ({ page }) => {
    await startLocalLibrary(page);
    await selectPrompt(page, 'Email Draft');

    await openPromptAction(page, 'Duplicate');
    const duplicateDialog = page.getByRole('dialog', { name: 'Duplicate prompt' });
    await expect(duplicateDialog).toBeVisible();
    await expect(duplicateDialog.getByRole('radio', { name: /My Prompts/ })).toHaveAttribute('aria-checked', 'true');

    await duplicateDialog.getByRole('button', { name: 'Duplicate' }).click();
    await expect(page.getByRole('alert')).toContainText('Duplicated "Email Draft" to My Prompts.');
    await expect(promptCard(page, 'Copy of Email Draft')).toBeVisible();

    await selectPrompt(page, 'Email Draft');
    await expect(page.getByRole('complementary', { name: 'Prompt details' }).getByRole('heading', { name: 'Email Draft' })).toBeVisible();
  });

  test('blocks navigation away from dirty editor state until the user saves or cancels', async ({ page }) => {
    await startLocalLibrary(page);
    await page.getByRole('button', { name: 'New Prompt' }).click();
    await page.getByLabel('Title').fill('E2E Unsaved Draft');

    await page.getByRole('button', { name: 'Settings' }).click();

    await expect(page.getByRole('heading', { name: 'New Prompt' })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Save or cancel your prompt changes before leaving the editor.');

    await page.getByRole('button', { name: 'Library' }).click();
    await expect(page.getByRole('heading', { name: 'All Prompts' })).toBeVisible();
  });
});
