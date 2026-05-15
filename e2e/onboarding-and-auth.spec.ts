import { expect, test } from '@playwright/test';
import { expectSeededLibrary, promptCard } from './helpers';

test.describe('onboarding and account entry', () => {
  test('loads the app, starts locally, seeds the library, and skips onboarding after reload', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/PromptDock/);
    await expect(page.getByRole('heading', { name: 'Get started' })).toBeVisible();

    await page.getByRole('button', { name: 'Start locally' }).click();
    await expectSeededLibrary(page);

    await page.reload();

    await expect(page.getByRole('heading', { name: 'Get started' })).toHaveCount(0);
    await expectSeededLibrary(page);
    await expect(promptCard(page, 'Summarize Text')).toBeVisible();
  });

  test('opens the cloud auth branch and lets users cancel back to local mode', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in or create account' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in to account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Start locally' }).click();
    await expectSeededLibrary(page);

    await page.getByRole('button', { name: 'Account' }).click();
    const accountDialog = page.getByRole('dialog', { name: 'Account' });
    await expect(accountDialog).toBeVisible();
    await expect(accountDialog.getByLabel('Email')).toBeVisible();
    await expect(accountDialog.getByLabel('Password')).toBeVisible();
    await expect(accountDialog.getByRole('button', { name: 'Sign in to account' })).toBeVisible();
  });
});
