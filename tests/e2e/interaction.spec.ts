import { expect, test } from '@playwright/test';

test('language switcher preserves the current page', async ({ page }) => {
  await page.goto('/en/experience');
  await page.getByRole('group', { name: 'Language' }).getByRole('link', { name: 'ಕನ್ನಡ' }).click();
  await expect(page).toHaveURL(/\/kn\/experience$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'kn');
  await page.getByRole('group', { name: 'ಭಾಷೆ' }).getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/experience$/);
});

test('hero CTAs lead to valid destinations', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('link', { name: 'Explore My Journey' }).click();
  await expect(page).toHaveURL(/\/en\/experience$/);
  await page.goto('/en');
  await page.getByRole('link', { name: 'Leadership Vision', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/vision$/);
});

test('desktop dropdown is keyboard operable', async ({ page }) => {
  await page.goto('/en');
  const nav = page.getByRole('navigation', { name: 'Primary' });
  const journey = nav.getByRole('button', { name: 'Journey' });
  await journey.focus();
  await page.keyboard.press('Enter');
  await expect(journey).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'Education' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(journey).toHaveAttribute('aria-expanded', 'false');
  await expect(journey).toBeFocused();

  await journey.click();
  await nav.getByRole('link', { name: 'Experience' }).click();
  await expect(page).toHaveURL(/\/en\/experience$/);
  await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Journey' })).toHaveAttribute('aria-expanded', 'false');
});

test('skip link moves focus to the main content', async ({ page }) => {
  await page.goto('/en/about');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test('vision diagram links to each priority section', async ({ page }) => {
  await page.goto('/en/vision');
  const diagram = page.getByRole('navigation', { name: 'Seven stated priorities' });
  await expect(diagram.getByRole('link')).toHaveCount(7);
  await diagram.getByRole('link', { name: /Rural health outreach/ }).click();
  await expect(page).toHaveURL(/#rural-outreach$/);
  await expect(page.getByRole('heading', { name: 'Rural health outreach', level: 2 })).toBeInViewport();
});

test('publications and media show honest empty states', async ({ page }) => {
  await page.goto('/en/publications');
  await expect(page.getByText('Academic publications and contributions are being compiled for this section.')).toBeVisible();
  await page.goto('/en/media');
  await expect(page.getByText('Approved photographs and media will appear here.')).toBeVisible();
  await expect(page.getByText(/Development preview/)).toHaveCount(0);
});

test('contact page has no non-functional form', async ({ page }) => {
  await page.goto('/en/contact');
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('a[href^="mailto:"], a[href^="tel:"]')).toHaveCount(0);
});

test('content stays visible with reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/en');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  expect(await page.locator('[data-reveal="hidden"]').count()).toBe(0);
  await expect(page.getByRole('heading', { name: /Knowledge in medicine grows/ })).toBeVisible();
  await context.close();
});

test('content is readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/en/experience');
  await expect(page.getByRole('heading', { name: 'Vice Chancellor', level: 3 })).toBeVisible();
  await page.goto('/kn');
  await expect(page.locator('h1')).toContainText('ವೈದ್ಯಕೀಯ ಶಿಕ್ಷಣದ ಪ್ರಗತಿ');
  await context.close();
});

test('header becomes solid after scrolling', async ({ page }) => {
  await page.goto('/en');
  const header = page.locator('header').first();
  await expect(header).toHaveClass(/bg-transparent/);
  await page.mouse.wheel(0, 600);
  await expect(header).toHaveClass(/bg-midnight/);
});
