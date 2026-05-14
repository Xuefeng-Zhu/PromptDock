import { expect, type Locator, type Page } from '@playwright/test';

export const appUrl = 'http://127.0.0.1:1420';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function promptCard(page: Page, title: string): Locator {
  return page.getByRole('option', { name: new RegExp(escapeRegExp(title)) });
}

export async function startLocalLibrary(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Get started' })).toBeVisible();
  await page.getByRole('button', { name: 'Start locally' }).click();
  await expect(page.getByRole('heading', { name: 'All Prompts' })).toBeVisible();
}

interface CreatePromptOptions {
  body: string;
  description?: string;
  folder?: string;
  tags?: string[];
  title: string;
}

export async function createPrompt(
  page: Page,
  {
    body,
    description = '',
    folder,
    tags = [],
    title,
  }: CreatePromptOptions,
): Promise<void> {
  await page.getByRole('button', { name: 'New Prompt' }).click();
  await expect(page.getByRole('heading', { name: 'New Prompt' })).toBeVisible();

  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill(description);
  await page.getByLabel('Body').fill(body);

  for (const tag of tags) {
    await page.getByRole('button', { name: 'Add tag' }).click();
    const tagInput = page.getByRole('combobox', { name: 'Add tag' });
    await tagInput.fill(tag);
    await tagInput.press('Enter');
    await expect(page.getByRole('button', { name: `Remove ${tag} tag` })).toBeVisible();
  }

  if (folder) {
    await page.getByRole('combobox', { name: 'Folder' }).click();
    const folderInput = page.getByRole('combobox', { name: 'Folder' });
    await folderInput.fill(folder);
    await page.getByRole('option', { name: `Create "${folder}"` }).click();
  }

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'All Prompts' })).toBeVisible();
  await expect(promptCard(page, title)).toBeVisible();
}

export async function selectPrompt(page: Page, title: string): Promise<Locator> {
  const card = promptCard(page, title);
  await expect(card).toBeVisible();
  if ((await card.getAttribute('aria-selected')) !== 'true') {
    await card.click();
  }
  const details = page.getByRole('complementary', { name: 'Prompt details' });
  await expect(details).toBeVisible();
  await expect(details.getByRole('heading', { name: title })).toBeVisible();
  return details;
}

export async function openPromptAction(page: Page, actionName: string): Promise<void> {
  await page
    .getByRole('complementary', { name: 'Prompt details' })
    .getByRole('button', { name: 'More options' })
    .click();
  await page.getByRole('menuitem', { name: actionName }).click();
}

export async function openSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
}
