import { expect, test } from '@playwright/test';
import { allPaths, locales, pages } from './helpers';

for (const path of allPaths) {
  test(`renders ${path} with correct language, metadata and no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    const locale = path.split('/')[1]!;
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main#main')).toBeVisible();

    // Canonical + hreflang alternates
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path}$`));
    for (const l of [...locales, 'x-default']) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${l}"]`)).toHaveCount(1);
    }
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);

    expect(errors).toEqual([]);
  });
}

test('every page has a unique title per locale', async ({ page }) => {
  for (const locale of locales) {
    const titles = new Set<string>();
    for (const p of pages) {
      await page.goto(`/${locale}${p}`);
      titles.add(await page.title());
    }
    expect(titles.size).toBe(pages.length);
  }
});

test('bare and unknown paths behave correctly', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
  await page.goto('/about');
  await expect(page).toHaveURL(/\/en\/about$/);
  const missing = await request.get('/en/does-not-exist');
  expect(missing.status()).toBe(404);
});

test('every internal link resolves', async ({ page, request }) => {
  const hrefs = new Set<string>();
  for (const path of allPaths) {
    await page.goto(path);
    for (const href of await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
      hrefs.add(href.split('#')[0]!);
    }
  }
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), href).toBeLessThan(400);
  }
});

test('in-page anchors point to existing targets', async ({ page }) => {
  for (const path of allPaths) {
    await page.goto(path);
    const missing = await page
      .locator('a[href^="#"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')!.slice(1)).filter((id) => id && id !== 'top' && !document.getElementById(id)));
    expect(missing, path).toEqual([]);
  }
});

test('external links open safely in a new tab', async ({ page }) => {
  await page.goto('/en/contact');
  const external = page.locator('a[href^="http"]');
  expect(await external.count()).toBeGreaterThan(0);
  for (const link of await external.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
});

test('sitemap and robots are served', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const path of allPaths) expect(xml).toContain(`<loc>http://localhost:3000${path}</loc>`);
  expect(xml).toContain('hreflang="kn"');
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
});

test('structured data is valid JSON with verified fields only', async ({ page }) => {
  await page.goto('/en');
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(raw!);
  const person = data['@graph'].find((n: { '@type': string }) => n['@type'] === 'Person');
  expect(person.name).toBe('Dr. Bhagavan B.C.');
  expect(person.sameAs).toEqual(['https://www.rguhs.ac.in/vcprofile.html']);
  expect(person.email).toBeUndefined();
  expect(person.telephone).toBeUndefined();
});

test('security headers are present', async ({ request }) => {
  const res = await request.get('/en');
  const headers = res.headers();
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-powered-by']).toBeUndefined();
});
