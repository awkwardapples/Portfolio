import { expectNoSeriousViolations } from './axe';
import { expect, test } from './fixtures';

/**
 * Third parties and the social sections (spec K.2, M, P.2; Pass 8
 * acceptance): no request leaves this site before the visitor asks, the
 * facades' thumbnails come from here, and GitHub renders from the snapshot.
 */

const ROUTES = [
  '/',
  '/work',
  '/work/kerr-microscopy-dissertation',
  '/work/neural-network-from-scratch',
  '/research',
  '/about',
  '/contact',
  '/privacy',
];

test('no page asks another host for anything before the visitor interacts', async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL ?? '').origin;
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.origin !== origin) foreign.push(`${request.url()}`);
  });
  for (const path of ROUTES) {
    await page.goto(path, { waitUntil: 'networkidle' });
    // Scroll through the page so lazy images and visible islands load too.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });
    await page.waitForLoadState('networkidle');
  }
  expect(foreign).toEqual([]);
});

test('the YouTube facade shows the real title and a thumbnail served from this site', async ({
  page,
}) => {
  await page.goto('/work/neural-network-from-scratch');
  const play = page.getByRole('link', { name: /^Play video/ });
  await expect(play).toHaveAccessibleName(/Output verification/);
  const poster = page.locator('[data-embed] img').first();
  await expect(poster).toHaveAttribute('src', /^\/_astro\//);
  await expect(page.getByText('Plays from YouTube.')).toBeVisible();
});

test.describe('Elsewhere', () => {
  test('shows GitHub from the build snapshot, with a summary and a table for screen readers', async ({
    page,
  }) => {
    await page.goto('/#elsewhere');
    const section = page.locator('#elsewhere');
    await expect(section.getByRole('heading', { name: 'GitHub' })).toBeVisible();
    await expect(section.getByText(/^[\d,]+ contributions in the last year$/)).toBeVisible();
    await expect(
      section.getByRole('table', { name: 'GitHub contributions by month' }),
    ).toBeAttached();
    await expect(section.getByText(/^Updated \d{1,2} \w+ \d{4}$/)).toBeVisible();
    await expect(section.getByRole('link', { name: 'View profile on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/awkwardapples',
    );
    // The avatar, if any, is served from this site.
    for (const src of await section
      .locator('img')
      .evaluateAll((images) => images.map((image) => image.getAttribute('src') ?? ''))) {
      expect(src).toMatch(/^\/_astro\//);
    }
  });

  test('passes axe', async ({ page }) => {
    await page.goto('/');
    await expectNoSeriousViolations(page, '#elsewhere');
  });
});
