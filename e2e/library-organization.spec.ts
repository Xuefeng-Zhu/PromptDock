import { expect, test } from '@playwright/test';
import {
  createPrompt,
  promptCard,
  searchPrompts,
  selectPrompt,
  startLocalLibrary,
} from './helpers';

test.describe('library organization', () => {
  test('organizes by folder and tag, searches, filters, sorts, and toggles view mode', async ({ page }) => {
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
    await searchPrompts(page, 'Research Brief');
    await expect(promptCard(page, title)).toBeVisible();
    await expect(promptCard(page, 'Email Draft')).toHaveCount(0);
    await searchPrompts(page, '');

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

  test('shows empty search state and can clear back to the seeded library', async ({ page }) => {
    await startLocalLibrary(page);

    await searchPrompts(page, 'this prompt does not exist');
    await expect(page.getByText('No prompts found')).toBeVisible();

    await searchPrompts(page, '');
    await expect(promptCard(page, 'Summarize Text')).toBeVisible();
  });

  test('deletes a folder and keeps its prompts in the library with no folder', async ({ page }) => {
    const title = 'E2E Folder Cleanup Prompt';
    const folder = 'E2E Cleanup';

    await startLocalLibrary(page);
    await createPrompt(page, {
      title,
      description: 'Prompt used to verify folder cleanup.',
      body: 'Keep this prompt when deleting its folder.',
      folder,
    });

    const folderButton = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: `${folder} 1` });
    await folderButton.hover();
    await page.getByRole('button', { name: `Delete ${folder} folder` }).click();

    const deleteDialog = page.getByRole('dialog', { name: `Delete "${folder}"?` });
    await expect(deleteDialog).toBeVisible();
    await expect(deleteDialog).toContainText('1 prompt will stay in your library and move to No folder.');
    await deleteDialog.getByRole('button', { name: 'Delete folder' }).click();
    await expect(page.getByRole('alert')).toContainText(`Deleted folder "${folder}" and moved 1 prompt to No folder.`);

    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /All Prompts/ }).click();
    await selectPrompt(page, title);
    await expect(page.getByRole('complementary', { name: 'Prompt details' }).getByText('No folder')).toBeVisible();
  });
});
