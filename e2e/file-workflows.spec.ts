import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { appUrl, openNewPrompt, openPromptAction, openSettings, selectPrompt, startLocalLibrary } from './helpers';

const fixture = (name: string) => resolve('docs/hackathon/fixtures', name);

async function exportedPrompts(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export prompts to JSON file' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/^promptdock-export-.*\.json$/);
  const path = await download.path();
  expect(path).not.toBeNull();
  const document = JSON.parse(await readFile(path!, 'utf8'));
  expect(document.version).toBe('1.0');
  return document.prompts as Array<{ title: string; body: string; description: string; tags: string[] }>;
}

test('visible JSON file control preserves duplicates, supports overwrite, and recovers from invalid files', async ({ page }) => {
  // This must download even in browsers that implement the native save picker.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      value: () => { throw new Error('Native picker should not be called'); },
      configurable: true,
    });
  });
  await startLocalLibrary(page);
  await openSettings(page);
  await page.getByRole('button', { name: 'Import/Export', exact: true }).click();
  const upload = page.getByLabel('Choose JSON file', { exact: true });
  await expect(upload).toBeVisible();
  await page.screenshot({ path: '/tmp/promptdock-file-settings-desktop.png' });
  await upload.setInputFiles(fixture('ts4-valid.json'));
  await expect(page.getByText('Imported 1 prompt(s) successfully.')).toBeVisible();

  for (const name of ['ts4-valid.json', 'ts4-valid.json', 'ts4-modified.json']) {
    await upload.setInputFiles(fixture(name));
    await expect(page.getByRole('button', { name: 'Skip duplicates' })).toBeVisible();
    await page.getByRole('button', { name: 'Skip duplicates' }).click();
    await expect(upload).toBeEnabled();
  }
  const preserved = await exportedPrompts(page);
  expect(preserved.filter(p => p.title === 'TS4 Fixture Recipe')).toEqual([
    expect.objectContaining({ body: 'Fixture original {{name}}.', description: 'Disposable test fixture', tags: ['ts4-fixture'] }),
  ]);
  expect(preserved.filter(p => p.title === 'TS4 Imported New')).toEqual([
    expect.objectContaining({ body: 'New unique fixture body.' }),
  ]);

  for (const name of ['ts4-bad-json.json', 'ts4-bad-schema.json']) {
    await upload.setInputFiles(fixture(name));
    await expect(page.getByRole('alert')).toBeVisible();
    expect(await exportedPrompts(page)).toEqual(preserved);
  }
  await upload.setInputFiles(fixture('ts4-modified.json'));
  await page.getByRole('button', { name: 'Overwrite duplicates' }).click();
  await expect(page.getByText('Imported 2 prompt(s), overwrote 2 duplicate(s).')).toBeVisible();
  await page.reload();
  await openSettings(page);
  await page.getByRole('button', { name: 'Import/Export', exact: true }).click();
  const overwritten = await exportedPrompts(page);
  expect(overwritten).toHaveLength(preserved.length);
  expect(overwritten.filter(p => p.title === 'TS4 Fixture Recipe')).toEqual([
    expect.objectContaining({ body: 'Fixture updated {{name}}.', description: 'Modified disposable fixture', tags: ['ts4-fixture', 'updated'] }),
  ]);
});

test('loads and edits the entire exact UTF-8 body on mobile through reload, clipboard, and export', async ({ page, context }) => {
  const source = await readFile(fixture('ts4-exact-12k.txt'), 'utf8');
  expect(Buffer.byteLength(source)).toBe(12288);
  expect(createHash('sha256').update(source).digest('hex')).toBe('23e14e2b4353242e11ada37a7f645db7d74437b015efdf598179cb0ce70cff7a');
  await page.setViewportSize({ width: 390, height: 844 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: appUrl });
  await startLocalLibrary(page);
  await openNewPrompt(page);
  await page.getByLabel('Title', { exact: true }).fill('Exact long file');
  await page.getByLabel('Load text file', { exact: true }).setInputFiles(fixture('ts4-exact-12k.txt'));
  await expect(page.getByLabel('Body', { exact: true })).toHaveValue(source);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await selectPrompt(page, 'Exact long file');
  await openPromptAction(page, 'Edit prompt');
  await expect(page.getByLabel('Body', { exact: true })).toHaveValue(source);
  const edited = source + '\nExact edit 中文 😀';
  await page.getByLabel('Body', { exact: true }).fill(edited);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  const details = await selectPrompt(page, 'Exact long file');
  await details.getByRole('button', { name: 'Copy prompt body', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(edited);
  expect(await page.evaluate(() => ({ width: window.innerWidth, scroll: document.documentElement.scrollWidth }))).toEqual({ width: 390, scroll: 390 });
  await page.getByRole('button', { name: 'Close prompt details', exact: true }).click();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await openSettings(page);
  await page.getByRole('button', { name: 'Import/Export', exact: true }).click();
  expect((await exportedPrompts(page)).find(p => p.title === 'Exact long file')?.body).toBe(edited);
  await page.screenshot({ path: '/tmp/promptdock-file-settings-mobile.png' });
});
