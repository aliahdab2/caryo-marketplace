import { test, expect } from '@playwright/test';

/**
 * SEO/SSR smoke tests — guard the server-rendering guarantees restored in
 * the July 2026 SEO work (site-wide SSR, lang/dir, Vehicle JSON-LD, dynamic
 * sitemap, security headers). These assert on the RAW server response, not
 * the hydrated DOM, so a regression to client-only rendering fails loudly.
 */

async function firstListingId(request: import('@playwright/test').APIRequestContext): Promise<number> {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:8080';
  const response = await request.get(`${apiUrl}/api/v1/listings?page=0&size=1`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.content.length).toBeGreaterThan(0);
  return body.content[0].id;
}

test.describe('SEO-001: server-rendered HTML', () => {
  test('English pages SSR with lang=en dir=ltr and real content', async ({ request }) => {
    const response = await request.get('/en');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('<html lang="en" dir="ltr"');
    expect(html).toContain('<h1');
  });

  test('Arabic pages SSR with lang=ar dir=rtl', async ({ request }) => {
    const response = await request.get('/ar');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('<html lang="ar" dir="rtl"');
    expect(html).toContain('<h1');
  });

  test('listing page SSRs Vehicle JSON-LD', async ({ request }) => {
    const id = await firstListingId(request);
    const response = await request.get(`/en/listings/${id}`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"Vehicle"');
    expect(html).toContain('<h1');
  });
});

test.describe('SEO-002: dynamic sitemap', () => {
  test('server-sitemap.xml serves listing URLs in both locales', async ({ request }) => {
    const response = await request.get('/server-sitemap.xml');
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('/en/listings/');
    expect(xml).toContain('/ar/listings/');
  });

  test('sitemap is not locale-redirected', async ({ request }) => {
    const response = await request.get('/server-sitemap.xml', { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });
});

test.describe('SEO-003: security headers', () => {
  test('pages carry the security header set', async ({ request }) => {
    const response = await request.get('/en');
    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['content-security-policy-report-only']).toBeTruthy();
  });
});

test.describe('SEO-004: hydrated document state', () => {
  test('Arabic page hydrates without losing rtl and shows Arabic UI', async ({ page }) => {
    await page.goto('/ar', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    // Navbar must render translated Arabic, not raw keys
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('تسجيل الدخول');
    expect(bodyText).not.toMatch(/header[A-Z][a-zA-Z]+/);
  });
});
