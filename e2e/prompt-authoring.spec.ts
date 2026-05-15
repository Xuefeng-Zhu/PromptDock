import { expect, test } from '@playwright/test';
import {
  expectPromptAbsent,
  fillPromptForm,
  openNewPrompt,
  promptCard,
  selectPrompt,
  startLocalLibrary,
} from './helpers';

test.describe('prompt authoring', () => {
  test('creates a prompt with variables and persists rendered preview values after reload', async ({ page }) => {
    const promptTitle = 'E2E Launch Note Prompt';

    await startLocalLibrary(page);
    await openNewPrompt(page);
    await fillPromptForm(page, {
      title: promptTitle,
      description: 'Creates a launch note for a specific audience.',
      body: 'Write a launch note about {{feature}} for {{audience}}.',
    });

    const variableControls = page.getByLabel('Variable controls');
    await expect(page.getByRole('heading', { name: 'Variable controls' })).toBeVisible();
    await expect(variableControls.getByText('{{feature}}')).toBeVisible();
    await expect(variableControls.getByText('{{audience}}')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(promptCard(page, promptTitle)).toBeVisible();

    await page.reload();

    await expect(page.getByRole('heading', { name: 'Get started' })).toHaveCount(0);
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

  test('validates required fields and dropdown variable metadata before save', async ({ page }) => {
    await startLocalLibrary(page);
    await openNewPrompt(page);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert')).toContainText('Title is required.');

    await page.getByLabel('Title').fill('E2E Dropdown Guard');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert')).toContainText('Body is required.');

    await page.getByLabel('Body').fill('Write in a {{tone}} tone.');
    await page.getByRole('button', { name: 'Use dropdown input for tone' }).click();
    await page.getByLabel('Default value for tone').fill('Formal');
    await page.getByLabel('Options for tone').fill('Friendly\nProfessional');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Default value for tone must match one of its dropdown options.',
    );

    await page.getByLabel('Default value for tone').fill('Friendly');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(promptCard(page, 'E2E Dropdown Guard')).toBeVisible();

    const details = await selectPrompt(page, 'E2E Dropdown Guard');
    await expect(details.getByLabel('Preview value for tone')).toHaveValue('Friendly');
  });

  test('cancels an unsaved draft without persisting it', async ({ page }) => {
    const draftTitle = 'E2E Cancelled Draft';

    await startLocalLibrary(page);
    await openNewPrompt(page);
    await page.getByLabel('Title').fill(draftTitle);
    await page.getByLabel('Body').fill('This draft should be discarded.');

    await page.getByRole('button', { name: 'Library' }).click();

    await expect(page.getByRole('heading', { name: 'All Prompts' })).toBeVisible();
    await expectPromptAbsent(page, draftTitle);
  });
});
