import { expect, test } from '@playwright/test';
import { allPaths, widths } from './helpers';

for (const width of widths) {
  test(`no horizontal overflow at ${width}px on any page`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of allPaths) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} @ ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}

test('primary navigation adapts: desktop links vs. mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/en');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  await page.setViewportSize({ width: 768, height: 800 });
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
});
