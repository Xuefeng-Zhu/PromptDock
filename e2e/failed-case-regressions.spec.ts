import { expect, test } from '@playwright/test';
import { createPrompt, fillPromptForm, openNewPrompt, openPromptAction, promptCard, selectPrompt, startLocalLibrary } from './helpers';

test('FLT-011: restores exact repeated-variable defaults and leaves saved edit without changes', async ({ page }) => {
  const title = 'TS4 Topic Tone Metadata';
  const body = 'Write {{topic}} in {{tone}}. Repeat: {{topic}}.';
  const rendered = 'Write Launch\nCampaign in Professional. Repeat: Launch\nCampaign.';
  await startLocalLibrary(page);
  await openNewPrompt(page);
  await fillPromptForm(page, { title, description: 'Saved variable metadata', body });
  await page.getByRole('button', { name: 'Use textarea input for topic' }).click();
  await page.getByLabel('Default value for topic', { exact: true }).fill('Launch');
  await page.getByRole('button', { name: 'Use dropdown input for tone' }).click();
  await page.getByLabel('Options for tone', { exact: true }).fill('Friendly\nProfessional\nConcise');
  await page.getByLabel('Default value for tone', { exact: true }).fill('Friendly');
  const preview = page.getByRole('complementary', { name: 'Live Preview', exact: true });
  await expect(preview.getByLabel('Preview value for topic', { exact: true })).toHaveValue('Launch');
  await expect(preview.getByLabel('Preview value for tone', { exact: true })).toHaveValue('Friendly');
  await page.getByLabel('Default value for topic', { exact: true }).fill('Launch\nCampaign');
  await page.getByLabel('Default value for tone', { exact: true }).fill('Professional');
  await expect(preview.locator('pre')).toHaveText(rendered);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await selectPrompt(page, title);
  await openPromptAction(page, 'Edit prompt');
  for (let visit = 0; visit < 2; visit++) {
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue(title);
    await expect(page.getByLabel('Description', { exact: true })).toHaveValue('Saved variable metadata');
    await expect(page.getByLabel('Body', { exact: true })).toHaveValue(body);
    await expect(page.getByLabel('Default value for topic', { exact: true })).toHaveValue('Launch\nCampaign');
    await expect(page.getByLabel('Default value for tone', { exact: true })).toHaveValue('Professional');
    await expect(page.getByLabel('Options for tone', { exact: true })).toHaveValue('Friendly\nProfessional\nConcise');
    await expect(preview.getByLabel('Preview value for topic', { exact: true })).toHaveCount(1);
    await expect(preview.locator('pre')).toHaveText(rendered);
    await page.getByRole('button', { name: 'Library', exact: true }).click();
    if (visit === 0) {
      await page.reload();
      await selectPrompt(page, title);
      await openPromptAction(page, 'Edit prompt');
    }
  }
  await expect(page.getByRole('listbox', { name: 'Prompt list' }).getByRole('option')).toHaveCount(5);
});

test('ONB-002: observes active-library exclusion before restoring the edited original', async ({ page }) => {
  await startLocalLibrary(page);
  await createPrompt(page, { title: 'TS4 Lifecycle Source', body: 'Disposable lifecycle body.' });
  await selectPrompt(page, 'TS4 Lifecycle Source');
  await openPromptAction(page, 'Edit prompt');
  await page.getByLabel('Title', { exact: true }).fill('TS4 Edited Prompt');
  await page.getByLabel('Description', { exact: true }).fill('TS4 edited description');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await selectPrompt(page, 'TS4 Edited Prompt');
  await openPromptAction(page, 'Duplicate');
  await page.getByRole('dialog', { name: 'Duplicate prompt' }).getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(promptCard(page, 'Copy of TS4 Edited Prompt')).toBeVisible();
  const details = await selectPrompt(page, 'TS4 Edited Prompt');
  await details.getByRole('button', { name: 'Add to favorites', exact: true }).click();
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await navigation.getByRole('button', { name: /Favorites/ }).click();
  await expect(promptCard(page, 'TS4 Edited Prompt')).toBeVisible();
  await selectPrompt(page, 'TS4 Edited Prompt');
  await openPromptAction(page, 'Archive');
  await expect(promptCard(page, 'TS4 Edited Prompt')).toHaveCount(0);
  await navigation.getByRole('button', { name: /All Prompts/ }).click();
  await expect(promptCard(page, 'TS4 Edited Prompt')).toHaveCount(0);
  await expect(promptCard(page, 'Copy of TS4 Edited Prompt')).toBeVisible();
  await navigation.getByRole('button', { name: /Archived/ }).click();
  await selectPrompt(page, 'TS4 Edited Prompt');
  await openPromptAction(page, 'Restore');
  await navigation.getByRole('button', { name: /All Prompts/ }).click();
  await expect(promptCard(page, 'TS4 Edited Prompt')).toContainText('TS4 edited description');
  await navigation.getByRole('button', { name: /Favorites/ }).click();
  await expect(promptCard(page, 'TS4 Edited Prompt')).toBeVisible();
});
