import type { Page } from '@playwright/test';

import { vocabularyProblems } from '../src/lib/testing/schema-org';

import { expect, test } from './fixtures';

/**
 * SEO foundations (spec S; Pass 10 acceptance): every public page has one
 * structured-data graph that uses schema.org correctly, a canonical URL,
 * a unique title and description, and a share image that loads; robots.txt
 * and the icons exist; the sitemap lists public pages only.
 */

const SITE = 'https://joshlennon.com';

async function pages(page: Page): Promise<string[]> {
  const xml = await (await page.request.get('/sitemap-0.xml')).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1] ?? '/').pathname,
  );
}

test.describe('search engines (spec S)', () => {
  test.skip(({ isMobile }) => isMobile, 'The head is the same on every device.');

  test('every page has one valid graph with Josh in it, and work pages their breadcrumbs', async ({
    page,
  }) => {
    test.slow(); // visits every page
    for (const path of await pages(page)) {
      await page.goto(path);
      const blocks = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((scripts) => scripts.map((script) => script.textContent ?? ''));
      expect(blocks, path).toHaveLength(1);
      const data = JSON.parse(blocks[0] ?? '{}') as {
        '@context': string;
        '@graph': Record<string, unknown>[];
      };
      expect(data['@context'], path).toBe('https://schema.org');
      expect(vocabularyProblems(data['@graph']), path).toEqual([]);
      const types = data['@graph'].map((node) => node['@type']);
      expect(types, path).toContain('Person');
      const josh = data['@graph'].find((node) => node['@type'] === 'Person');
      expect(josh, path).toMatchObject({
        '@id': `${SITE}/#person`,
        name: 'Josh Lennon',
        alternateName: ['Joshua Lennon', 'Joshua Michael Lennon'],
      });
      expect(josh, path).not.toHaveProperty('jobTitle');
      if (path.startsWith('/work/')) {
        expect(types, path).toContain('BreadcrumbList');
        expect(
          types.some((type) =>
            ['Thesis', 'ScholarlyArticle', 'CreativeWork'].includes(String(type)),
          ),
          path,
        ).toBe(true);
      }
      if (path === '/') expect(types, path).toContain('WebSite');
      if (path === '/about') expect(types, path).toContain('ProfilePage');
    }
  });

  test('every page has a canonical URL, a unique title and description, and a share image that loads', async ({
    page,
  }) => {
    test.slow(); // visits every page
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const images = new Set<string>();
    for (const path of await pages(page)) {
      await page.goto(path);
      const head = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        image: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        alt: document.querySelector('meta[property="og:image:alt"]')?.getAttribute('content'),
        card: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
      }));
      expect(head.canonical, path).toBe(`${SITE}${path}`);
      expect(head.description?.length ?? 0, path).toBeGreaterThan(40);
      expect(titles.has(head.title), `${path}: the title "${head.title}" is used twice`).toBe(
        false,
      );
      expect(
        descriptions.has(head.description ?? ''),
        `${path}: the description is used twice`,
      ).toBe(false);
      titles.add(head.title);
      descriptions.add(head.description ?? '');
      expect(head.image, path).toMatch(/^https:\/\/joshlennon\.com\//);
      expect(head.alt, path).toBeTruthy();
      expect(head.card, path).toBe('summary_large_image');
      images.add(new URL(head.image ?? '').pathname);
    }
    // The share images are served from this site (the canonical origin is not running here).
    for (const image of images) {
      const response = await page.request.get(image);
      expect(response.status(), image).toBe(200);
      expect(response.headers()['content-type'], image).toMatch(/^image\/(png|jpeg)$/);
    }
  });

  test('robots.txt keeps crawlers out of the editor and the API and names the sitemap', async ({
    request,
  }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('User-agent: *');
    expect(text).toContain('Disallow: /admin');
    expect(text).toContain('Disallow: /api/');
    expect(text).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  });

  test('the icons exist', async ({ request }) => {
    for (const [path, type] of [
      ['/favicon.ico', 'image/'],
      ['/favicon-32.png', 'image/png'],
      ['/apple-touch-icon.png', 'image/png'],
    ] as const) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()['content-type'], path).toContain(type);
    }
  });
});
