import type { Page } from '@playwright/test';

import { expectNoSeriousViolations } from './axe';
import { expect, test } from './fixtures';

/**
 * The content routes (spec H.6, H.7, L; Pass 5 acceptance): every entry
 * renders, filters work with and without JavaScript, documents open and
 * download, citations are offered, and every route is clean under axe.
 */

const ROUTES = [
  '/work',
  '/work/kerr-microscopy-dissertation',
  '/work/neural-network-from-scratch',
  '/research',
  '/about',
];
const KERR = '/work/kerr-microscopy-dissertation';

async function workPagePaths(page: Page): Promise<string[]> {
  await page.goto('/work');
  const hrefs = await page
    .locator('main h3 a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
  return [...new Set(hrefs)];
}

test.describe('every route', () => {
  test('passes axe', async ({ page }) => {
    for (const path of ROUTES) {
      await page.goto(path);
      await expectNoSeriousViolations(page);
    }
  });

  test('has one h1 and no horizontal scroll at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ROUTES) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveCount(1);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('marks the current section in the navigation', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The bar shows no section links on phones.');
    await page.goto(KERR);
    await expect(
      page.locator('[data-site-header]').getByRole('link', { name: 'Work' }),
    ).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('/work', () => {
  test('lists every published entry, and each one renders', async ({ page, request }) => {
    const paths = await workPagePaths(page);
    expect(paths.length).toBeGreaterThanOrEqual(2);
    for (const path of paths) {
      expect((await request.get(path)).status(), path).toBe(200);
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }), path).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Authorship' }), path).toBeVisible();
    }
  });

  test('filters by kind instantly and mirrors the choice in the URL', async ({ page }) => {
    await page.goto('/work');
    const research = page.getByRole('heading', { level: 2, name: 'Research' });
    const software = page.getByRole('heading', { level: 2, name: 'Software' });
    await expect(research).toBeVisible();
    await expect(software).toBeVisible();

    await page.getByRole('button', { name: 'Software' }).click();
    await expect(page.getByRole('button', { name: 'Software' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(research).toBeHidden();
    await expect(software).toBeVisible();
    await expect(page).toHaveURL(/\?kind=software$/);

    await page.getByRole('button', { name: 'All' }).click();
    await expect(research).toBeVisible();
    await expect(page).toHaveURL(/\/work$/);
  });

  test('applies ?kind= on arrival', async ({ page }) => {
    await page.goto('/work?kind=research');
    await expect(page.getByRole('heading', { level: 2, name: 'Software' })).toBeHidden();
    await expect(page.getByRole('heading', { level: 2, name: 'Research' })).toBeVisible();
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('shows every entry grouped by kind, and no filter control', async ({ page }) => {
      await page.goto('/work?kind=research');
      await expect(page.getByRole('heading', { level: 2, name: 'Research' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Software' })).toBeVisible();
      await expect(page.getByRole('group', { name: 'Show work of one kind' })).toBeHidden();
    });
  });
});

test.describe('documents', () => {
  test('open in a new tab and download from their permanent URL', async ({ page, request }) => {
    await page.goto(KERR);
    const open = page.getByRole('link', { name: /^Open in a new tab/ }).first();
    await expect(open).toHaveAttribute('href', '/documents/kerr-microscopy-dissertation.pdf');
    await expect(open).toHaveAttribute('target', '_blank');
    const download = page.getByRole('link', { name: /^Download \(PDF, 2\.2 MB\)/ }).first();
    await expect(download).toHaveAttribute('download', '');

    const response = await request.get('/documents/kerr-microscopy-dissertation.pdf');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
    // Framable by this site only, for "Read here" (spec N.11).
    expect(response.headers()['x-frame-options']).toBeUndefined();
    expect(response.headers()['content-security-policy']).toBe("frame-ancestors 'self'");
  });

  test('"Read here" opens the PDF inline on wider screens', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Phones get Open and Download only (spec H.7).');
    await page.goto(KERR);
    const read = page.getByRole('button', { name: 'Read here' }).first();
    await read.click();
    const frame = page.locator('.document-viewer iframe').first();
    await expect(frame).toHaveAttribute('src', '/documents/kerr-microscopy-dissertation.pdf');
    await expect(page.getByRole('button', { name: 'Close the document' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await page.getByRole('button', { name: 'Close the document' }).click();
    await expect(frame).toHaveCount(0);
  });

  test('"Read here" is not offered on phones', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Phone-only check.');
    await page.goto(KERR);
    await expect(page.getByRole('button', { name: 'Read here' })).toBeHidden();
  });

  test('"Cite" shows plain-text and BibTeX citations with copy buttons', async ({ page }) => {
    await page.goto('/research');
    await page.locator('summary', { hasText: 'Cite' }).first().click();
    const panel = page.locator('details[open]').first();
    await expect(panel).toContainText('Lennon, J. (2025).');
    await expect(panel).toContainText('@thesis{lennon2025extracting,');
    await expect(panel).toContainText('type        = {BSc dissertation},');
    await expect(panel.getByRole('button', { name: /^Copy/ })).toHaveCount(2);
    await expectNoSeriousViolations(page);
  });
});

test.describe('media', () => {
  test('loads nothing from YouTube until Play is pressed', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      if (/youtube|ytimg|googlevideo/.test(new URL(request.url()).hostname)) {
        external.push(request.url());
      }
    });
    // The player itself is not needed to check the facade.
    await page.route(/youtube-nocookie\.com/, (route) => route.abort());
    await page.goto('/work/neural-network-from-scratch');
    await expect(page.getByRole('link', { name: /^Play video/ })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=wWAGaOdlyMw',
    );
    expect(external).toEqual([]);

    await page.getByRole('link', { name: /^Play video/ }).click();
    const frame = page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/wWAGaOdlyMw"]');
    await expect(frame).toBeFocused();
  });
});

test.describe('about', () => {
  test('shows the timeline newest first and the skills', async ({ page }) => {
    await page.goto('/about');
    const items = page.locator('.timeline > li h3');
    await expect(items.first()).toHaveText('MSc Artificial Intelligence');
    await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();
  });
});

test.describe('site files', () => {
  test('the sitemap lists the public pages and nothing else', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap-0.xml')).text();
    for (const path of ['/work', '/research', '/about', KERR]) {
      expect(sitemap, path).toContain(`${path}</loc>`);
    }
    expect(sitemap).not.toMatch(/\/(404|dev\/|admin)/);
  });

  test('the RSS feed is valid XML', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.status()).toBe(200);
    expect(await response.text()).toMatch(/^<\?xml[^>]*\?><rss/);
  });
});
