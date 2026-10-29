import { expect, test } from '@playwright/test';

test('mobile menu opens, navigates and closes', async ({ page }) => {
  await page.goto('/en');
  const toggle = page.getByRole('button', { name: 'Open menu' });
  await toggle.click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link')).toHaveCount(9); // 8 pages + the other-language link
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(toggle).toBeFocused();

  await toggle.click();
  await page.getByRole('dialog').getByRole('link', { name: /Education/ }).click();
  await expect(page).toHaveURL(/\/en\/education$/);
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('mobile menu switches language and preserves the page', async ({ page }) => {
  await page.goto('/en/vision');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'ಕನ್ನಡ' }).click();
  await expect(page).toHaveURL(/\/kn\/vision$/);
});

test('touch targets in the header are at least 44px', async ({ page }) => {
  await page.goto('/en');
  const box = await page.getByRole('button', { name: 'Open menu' }).boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
});
