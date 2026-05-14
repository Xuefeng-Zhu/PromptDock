import { expect, test } from '@playwright/test';
import { promptCard } from './helpers';

test('creates a prompt with variables and persists it in browser storage', async ({ page }) => {
  const promptTitle = 'E2E Launch Note Prompt';
  const promptDescription = 'Creates a launch note for a specific audience.';
  const promptBody = 'Write a launch note about {{feature}} for {{audience}}.';

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Get started' })).toBeVisible();
  await page.getByRole('button', { name: 'Start locally' }).click();

  await expect(page.getByRole('heading', { name: 'All Prompts' })).toBeVisible();
  await expect(page.getByText('Summarize Text')).toBeVisible();

  await page.getByRole('button', { name: 'New Prompt' }).click();
  await expect(page.getByRole('heading', { name: 'New Prompt' })).toBeVisible();

  await page.getByLabel('Title').fill(promptTitle);
  await page.getByLabel('Description').fill(promptDescription);
  await page.getByLabel('Body').fill(promptBody);

  const variableControls = page.getByLabel('Variable controls');
  await expect(page.getByRole('heading', { name: 'Variable controls' })).toBeVisible();
  await expect(variableControls.getByText('{{feature}}')).toBeVisible();
  await expect(variableControls.getByText('{{audience}}')).toBeVisible();

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('heading', { name: 'All Prompts' })).toBeVisible();
  await expect(promptCard(page, promptTitle)).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search prompts' }).fill(promptTitle);
  await expect(promptCard(page, promptTitle)).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Get started' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'All Prompts' })).toBeVisible();

  const createdPromptCard = promptCard(page, promptTitle);
  await expect(createdPromptCard).toBeVisible();
  await createdPromptCard.click();

  await expect(page.getByRole('complementary', { name: 'Prompt details' })).toBeVisible();
  await page.getByLabel('Preview value for feature').fill('offline-first prompts');
  await page.getByLabel('Preview value for audience').fill('engineering leads');

  await expect(
    page.getByText('Write a launch note about offline-first prompts for engineering leads.'),
  ).toBeVisible();
});
