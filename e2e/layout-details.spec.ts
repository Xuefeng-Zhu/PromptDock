import { expect, test, type Page } from '@playwright/test';
import { openNewPrompt, startLocalLibrary } from './helpers';

async function expectActualMeasurements(page: Page) {
  const actual = await page.evaluate(() => ({
    'Browser inner width': window.innerWidth,
    'Browser inner height': window.innerHeight,
    'Document client width': document.documentElement.clientWidth,
    'Document scroll width': document.documentElement.scrollWidth,
    'Horizontal overflow': Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  }));
  for (const [label, value] of Object.entries(actual)) {
    await expect(page.getByLabel(label, { exact: true })).toHaveText(String(value));
  }
  return actual;
}

test('layout details report the current page, resize, and detect real horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startLocalLibrary(page);
  const libraryOverflow = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByText('Layout details', { exact: true }).click();
  expect(await expectActualMeasurements(page)).toMatchObject({
    'Browser inner width': 390,
    'Document scroll width': libraryOverflow,
    'Horizontal overflow': 0,
  });
  await page.getByRole('button', { name: 'Account', exact: true }).click();

  await openNewPrompt(page);
  await page.getByLabel('Title', { exact: true }).fill('Layout diagnosis draft');
  await page.getByLabel('Body', { exact: true }).fill('Long content\n'.repeat(40));
  const originalOverflowStyles = await page.evaluate(() => ({
    root: document.documentElement.style.overflow,
    body: document.body.style.overflow,
    width: document.documentElement.scrollWidth,
  }));
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByText('Layout details', { exact: true }).click();
  expect(await expectActualMeasurements(page)).toMatchObject({
    'Browser inner width': 390,
    'Document scroll width': originalOverflowStyles.width,
    'Horizontal overflow': 0,
  });
  expect(await page.evaluate(() => ({
    root: document.documentElement.style.overflow,
    body: document.body.style.overflow,
  }))).toEqual({ root: originalOverflowStyles.root, body: originalOverflowStyles.body });

  // A real DOM overflow is the negative control: diagnostics must expose it.
  await page.evaluate(() => {
    const overflowing = document.createElement('div');
    overflowing.id = 'layout-negative-control';
    overflowing.style.cssText = 'position:absolute;left:0;top:0;width:970px;height:1px;pointer-events:none;';
    document.body.append(overflowing);
  });
  await expect(page.getByLabel('Horizontal overflow', { exact: true })).toHaveText('580');
  await expectActualMeasurements(page);
  await page.evaluate(() => document.getElementById('layout-negative-control')!.remove());
  await expect(page.getByLabel('Horizontal overflow', { exact: true })).toHaveText('0');

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByLabel('Browser inner width', { exact: true })).toHaveText('1024');
  expect(await expectActualMeasurements(page)).toMatchObject({
    'Browser inner width': 1024,
    'Browser inner height': 768,
    'Horizontal overflow': 0,
  });
  await page.getByRole('button', { name: 'Refresh measurements', exact: true }).click();
  await expectActualMeasurements(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Account' })).toHaveCount(0);
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Layout diagnosis draft');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'All Prompts', exact: true })).toBeVisible();
});

test('layout details remain reachable in a short landscape viewport', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await startLocalLibrary(page);
  const originalOverflowStyles = await page.evaluate(() => ({
    root: document.documentElement.style.overflow,
    body: document.body.style.overflow,
  }));
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  const popover = page.getByRole('dialog', { name: 'Account', exact: true });
  await page.getByText('Layout details', { exact: true }).click();
  const refresh = page.getByRole('button', { name: 'Refresh measurements', exact: true });
  await refresh.scrollIntoViewIfNeeded();
  await expect(refresh).toBeInViewport();
  await refresh.click();
  expect(await expectActualMeasurements(page)).toMatchObject({
    'Browser inner width': 844,
    'Browser inner height': 390,
    'Horizontal overflow': 0,
  });
  const bounds = await popover.evaluate((element) => ({
    bottom: element.getBoundingClientRect().bottom,
    top: element.getBoundingClientRect().top,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    scrollTop: element.scrollTop,
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.bottom).toBeLessThanOrEqual(390);
  expect(bounds.scrollHeight).toBeGreaterThan(bounds.clientHeight);
  expect(bounds.scrollTop).toBeGreaterThan(0);
  expect(bounds.scrollWidth).toBe(bounds.clientWidth);
  expect(await page.evaluate(() => ({
    root: document.documentElement.style.overflow,
    body: document.body.style.overflow,
  }))).toEqual(originalOverflowStyles);
  await page.keyboard.press('Escape');
  await expect(popover).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Account', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'New Prompt', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Prompt', exact: true })).toBeVisible();
});
