import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { openNewPrompt, openPromptAction, promptCard, searchPrompts, selectPrompt, startLocalLibrary } from './helpers';

async function expectFingerprint(page: Page, expected: string) {
  await page.getByRole('button', { name: 'Text details', exact: true }).click();
  await expect(page.getByLabel('UTF-8 bytes', { exact: true })).toHaveText(String(Buffer.byteLength(expected)));
  await expect(page.getByLabel('Text SHA-256', { exact: true })).toHaveText(createHash('sha256').update(expected).digest('hex'));
}

for (const id of ['ONB-009', 'LIB-013', 'EDT-009', 'FLT-018', 'TEM-009', 'FAV-014']) {
  test(`${id}: verifies complete text after reload and recovers search and empty views`, async ({ page }) => {
    const source = await readFile(resolve('docs/hackathon/fixtures/ts4-exact-12k.txt'), 'utf8');
    const title = `Long text ${id}`;
    const expected = id === 'EDT-009' ? source + '\nTS4 edited marker' : source;
    await startLocalLibrary(page);
    await openNewPrompt(page);
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Load text file', { exact: true }).setInputFiles(resolve('docs/hackathon/fixtures/ts4-exact-12k.txt'));
    await expect(page.getByLabel('Body', { exact: true })).toHaveValue(source);
    await expectFingerprint(page, source);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    if (id === 'EDT-009') {
      await selectPrompt(page, title);
      await openPromptAction(page, 'Edit prompt');
      const body = page.getByLabel('Body', { exact: true });
      // Exercise an actual append, preserving every character before the cursor.
      await body.focus();
      await body.press('ControlOrMeta+a');
      await body.press('ArrowRight');
      await body.press('Enter');
      await body.pressSequentially('TS4 edited marker');
      await expect(body).toHaveValue(expected);
      await expectFingerprint(page, expected);
      await page.getByRole('button', { name: 'Save', exact: true }).click();
    }
    await page.reload();
    await selectPrompt(page, title);
    await openPromptAction(page, 'Edit prompt');
    await expect(page.getByLabel('Body', { exact: true })).toHaveValue(expected);
    await expectFingerprint(page, expected);
    if (id === 'LIB-013') await page.screenshot({ path: '/tmp/promptdock-text-details-desktop.png' });
    await page.getByRole('button', { name: 'Library', exact: true }).click();
    await searchPrompts(page, 'TS4 unmatched 918274');
    await expect(page.getByText('No prompts found', { exact: true })).toBeVisible();
    const search = page.getByRole('searchbox', { name: 'Search prompts' });
    await search.press('ControlOrMeta+a');
    await search.press('Backspace');
    await expect(search).toHaveValue('');
    await expect(promptCard(page, title)).toBeVisible();
    const navigation = page.getByRole('navigation', { name: 'Main navigation' });
    for (const view of ['Favorites', 'Archived']) {
      await navigation.getByRole('button', { name: new RegExp(view) }).click();
      await expect(page.getByRole('heading', { name: view, exact: true })).toBeVisible();
      await expect(page.getByRole('option')).toHaveCount(0);
      if (id === 'FAV-014') {
        await searchPrompts(page, 'TS4 unmatched 918274');
        await expect(search).toHaveValue('TS4 unmatched 918274');
        await expect(page.getByRole('option')).toHaveCount(0);
        await search.press('ControlOrMeta+a');
        await search.press('Backspace');
        await expect(search).toHaveValue('');
        await expect(page.getByRole('heading', { name: view, exact: true })).toBeVisible();
        await expect(page.getByRole('option')).toHaveCount(0);
      }
    }
    await navigation.getByRole('button', { name: /All Prompts/ }).click();
    await expect(page.getByRole('option')).toHaveCount(5);
    await expect(promptCard(page, title)).toBeVisible();
  });
}
