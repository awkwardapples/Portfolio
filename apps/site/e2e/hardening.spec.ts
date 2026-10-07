import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';

/**
 * Hardening (spec O, P.1, Q.4, R; Pass 9 acceptance). The fixture already
 * fails any test whose pages break the Content Security Policy; these tests
 * add every page in the sitemap, the viewport matrix, touch targets, input
 * sizes, visible keyboard focus and the homepage's byte budget.
 */

const WIDTHS = [320, 375, 390, 768, 1024, 1280, 1440];

/** Every public page, from the sitemap (so new pages are covered), and a missing one. */
async function routes(page: Page): Promise<string[]> {
  const xml = await (await page.request.get('/sitemap-0.xml')).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1] ?? '/').pathname,
  );
  expect(paths.length).toBeGreaterThan(5);
  return [...paths, '/not-a-page'];
}

/** Scrolls to the bottom in steps, so lazy images and visible islands load. */
async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
}

/** Sets the stored intent, so the homepage shows the intro instead of the threshold. */
async function returning(page: Page): Promise<void> {
  await page.evaluate(() =>
    localStorage.setItem('jl:intent', JSON.stringify({ value: 'hiring', at: '' })),
  );
}

test.describe('the Content Security Policy (spec Q.4)', () => {
  test('every page carries the enforced policy and runs without a violation', async ({ page }) => {
    test.slow(); // visits every page
    for (const path of await routes(page)) {
      const response = await page.goto(path);
      expect(response?.headers()['content-security-policy'], path).toBe("frame-ancestors 'none'");
      expect(response?.headers()['content-security-policy-report-only'], path).toBeUndefined();
      const policy =
        (await page
          .locator('meta[http-equiv="content-security-policy"]')
          .getAttribute('content')) ?? '';
      expect(policy, path).toMatch(
        /script-src 'self' https:\/\/challenges\.cloudflare\.com https:\/\/static\.cloudflareinsights\.com 'sha256-/,
      );
      expect(policy, path).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/);
      expect(policy, path).toContain("object-src 'none'");
      await scrollThrough(page);
      // The lightbox, wherever a page has a zoomable image.
      const zoom = page.locator('[data-lightbox]').first();
      if ((await zoom.count()) > 0 && (await zoom.isVisible())) {
        await zoom.click();
        await expect(page.locator('dialog[open]')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('dialog[open]')).toHaveCount(0);
      }
    }
  });

  test('the content editor has its own policy and stays out of search', async ({ request }) => {
    const response = await request.get('/admin');
    const policy = response.headers()['content-security-policy'] ?? '';
    expect(policy).toContain("script-src 'self' https://unpkg.com;");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(response.headers()['x-robots-tag']).toBe('noindex');
  });
});

test.describe('the viewport matrix (spec O)', () => {
  test.skip(({ isMobile }) => isMobile, 'Each width is set explicitly; one project is enough.');

  for (const width of WIDTHS) {
    test(`no page scrolls sideways at ${width} px`, async ({ page }) => {
      test.slow(); // visits every page
      await page.setViewportSize({ width, height: 800 });
      const overflowing: string[] = [];
      const check = async (label: string) => {
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        if (overflow > 0) overflowing.push(`${label} (+${overflow} px)`);
      };
      for (const path of await routes(page)) {
        await page.goto(path);
        await check(path);
      }
      // The homepage as a returning visitor sees it, and the contact wizard's details step.
      await returning(page);
      await page.goto('/');
      await check('/ (returning)');
      await toDetails(page);
      await check('/contact (details)');
      expect(overflowing).toEqual([]);
    });
  }
});

/**
 * What can be pressed, with its size. Links inside a run of text are exempt,
 * as in WCAG 2.5.8; a checkbox or radio is measured by its label, which is
 * what a finger presses.
 */
async function smallTargets(page: Page, minimum: number): Promise<string[]> {
  return page.evaluate((min) => {
    const selector =
      'a[href], button, summary, select, textarea, input:not([type="hidden"]), [role="button"], [tabindex]:not([tabindex="-1"])';
    const small: string[] = [];
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden' || element.closest('[hidden], [inert], .sr-only')) continue;
      let target: HTMLElement = element;
      if (element instanceof HTMLInputElement && /^(checkbox|radio)$/.test(element.type)) {
        target = element.closest('label') ?? (element.labels?.[0] as HTMLElement) ?? element;
      }
      const box = target.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1) continue; // visually hidden until focused
      const inText =
        style.display === 'inline' &&
        (element.parentElement?.textContent ?? '').trim().length >
          (element.textContent ?? '').trim().length;
      if (inText) continue;
      if (box.width < min || box.height < min) {
        const name =
          element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 40) ?? '';
        small.push(
          `${element.tagName.toLowerCase()} "${name}" ${Math.round(box.width)}x${Math.round(box.height)}`,
        );
      }
    }
    return small;
  }, minimum);
}

/** The contact wizard's details step, by the shortest route. */
async function toDetails(page: Page): Promise<void> {
  await page.goto('/contact?intent=other');
  await page
    .getByRole('textbox', { name: 'What would you like to talk about?' })
    .fill('A question.');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Send Josh a message' }).click();
  await expect(page.getByRole('heading', { name: 'Your details' })).toBeVisible();
}

test.describe('touch (spec O)', () => {
  test.skip(({ isMobile }) => !isMobile, 'Touch sizes are checked on the phone project.');

  test('every target is at least 44 by 44 px', async ({ page }) => {
    test.slow(); // visits every page
    const found: string[] = [];
    for (const path of await routes(page)) {
      await page.goto(path);
      found.push(...(await smallTargets(page, 44)).map((target) => `${path}: ${target}`));
    }
    await returning(page);
    await page.goto('/');
    found.push(...(await smallTargets(page, 44)).map((target) => `/ (returning): ${target}`));
    await page.getByRole('button', { name: 'Menu' }).click();
    found.push(...(await smallTargets(page, 44)).map((target) => `menu: ${target}`));
    // The contact wizard's screens: the intents (with no answer stored), a choice step and the details.
    await page.evaluate(() => localStorage.clear());
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: 'What brings you here?' })).toBeVisible();
    found.push(...(await smallTargets(page, 44)).map((target) => `wizard intents: ${target}`));
    await page.goto('/contact?intent=music');
    await expect(page.getByLabel('A booking or a gig')).toBeVisible();
    found.push(...(await smallTargets(page, 44)).map((target) => `wizard choice: ${target}`));
    await toDetails(page);
    found.push(...(await smallTargets(page, 44)).map((target) => `wizard details: ${target}`));
    expect([...new Set(found)]).toEqual([]);
  });

  test('form fields use at least 16 px text, so phones do not zoom', async ({ page }) => {
    await toDetails(page);
    const sizes = await page
      .locator(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, select',
      )
      .evaluateAll((fields) =>
        fields.map((field) => ({
          name: field.getAttribute('name') ?? field.id,
          size: parseFloat(getComputedStyle(field).fontSize),
        })),
      );
    expect(sizes.length).toBeGreaterThan(1);
    expect(sizes.filter((field) => field.size < 16)).toEqual([]);
  });

  test('help text is tied to its field, choices included (spec R)', async ({ page }) => {
    await toDetails(page);
    await expect(
      page.getByLabel('I agree to my details being used to reply to this message.'),
    ).toHaveAccessibleDescription(/stored for 90 days/);
  });
});

test.describe('keyboard (spec R)', () => {
  test.skip(({ isMobile }) => isMobile, 'Keyboard passes run on the desktop project.');

  /** Tabs through the page and reports every stop without a visible focus indicator. */
  async function tabThrough(page: Page, label: string): Promise<string[]> {
    const problems: string[] = [];
    const seen = new Set<string>();
    for (let stop = 0; stop < 120; stop += 1) {
      await page.keyboard.press('Tab');
      const focus = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
        const ring = style.boxShadow !== 'none';
        const path: string[] = [];
        for (
          let node: Element | null = element;
          node && node !== document.body;
          node = node.parentElement
        ) {
          path.unshift(`${node.tagName}${[...(node.parentElement?.children ?? [])].indexOf(node)}`);
        }
        return {
          key: path.join('>'),
          name: (element.getAttribute('aria-label') ?? element.textContent ?? '')
            .trim()
            .slice(0, 40),
          visible: box.width > 0 && box.height > 0 && style.visibility !== 'hidden',
          indicated: outline || ring,
          inFrame: element.tagName === 'IFRAME',
        };
      });
      if (!focus) break;
      if (seen.has(focus.key)) break;
      seen.add(focus.key);
      if (focus.inFrame) continue;
      if (!focus.visible || !focus.indicated) {
        problems.push(
          `${label}: "${focus.name}" ${focus.visible ? 'has no focus indicator' : 'is focused while invisible'}`,
        );
      }
    }
    expect(seen.size, `${label}: tab stops`).toBeGreaterThan(3);
    return problems;
  }

  test('every tab stop on every page shows where focus is', async ({ page }) => {
    test.slow(); // visits every page
    const problems: string[] = [];
    for (const path of await routes(page)) {
      await page.goto(path);
      problems.push(...(await tabThrough(page, path)));
    }
    await returning(page);
    await page.goto('/');
    problems.push(...(await tabThrough(page, '/ (returning)')));
    expect(problems).toEqual([]);
  });

  test('the skip link is the first stop and moves focus to the main content', async ({ page }) => {
    await page.goto('/about');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  /** Presses Tab until `target` has focus, as a keyboard user would, checking each stop shows it. */
  async function tabTo(page: Page, target: Locator, limit = 80): Promise<void> {
    for (let stop = 0; stop < limit; stop += 1) {
      await page.keyboard.press('Tab');
      if (await target.evaluate((element) => element === document.activeElement)) {
        const shown = await target.evaluate((element) => {
          const style = getComputedStyle(element);
          return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
        });
        expect(shown, 'focus indicator').toBe(true);
        return;
      }
    }
    throw new Error(`Tab never reached ${target.toString()}`);
  }

  test('the threshold, by keyboard alone', async ({ page }) => {
    await page.goto('/');
    await tabTo(page, page.locator('a[data-intent-option="research"]'));
    await page.keyboard.press('Enter');
    await expect(page.locator('#research-heading')).toBeFocused();
  });

  test('the contact wizard, from the first question to sent, by keyboard alone', async ({
    page,
  }) => {
    // Its own client address and email, as in contact.spec.ts, so no limit is shared.
    const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
    await page.setExtraHTTPHeaders({
      'cf-connecting-ip': `198.18.251.${Math.floor(Math.random() * 250) + 1}`,
    });
    await page.goto('/contact?intent=music');
    const choice = page.getByLabel('A booking or a gig');
    await expect(choice).toBeVisible();
    await tabTo(page, choice);
    await page.keyboard.press('Space');
    await expect(choice).toBeChecked();
    await tabTo(page, page.getByRole('button', { name: 'Next', exact: true }));
    await page.keyboard.press('Enter');

    // The music result: the music on the site, before any details.
    await expect(page.getByRole('heading', { name: 'Music' })).toBeFocused();
    await tabTo(page, page.getByRole('button', { name: 'Send Josh a message' }));
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: 'Your details' })).toBeFocused();
    await tabTo(page, page.getByRole('textbox', { name: 'Your name' }));
    await page.keyboard.type('Keyboard Visitor');
    await tabTo(page, page.getByRole('textbox', { name: 'Email address' }));
    await page.keyboard.type(`keyboard-${id}@example.com`);
    await tabTo(page, page.getByRole('textbox', { name: /Your message|Anything to add/ }));
    await page.keyboard.type('Sent without a mouse.');
    const consent = page.getByLabel('I agree to my details being used to reply to this message.');
    await tabTo(page, consent);
    await page.keyboard.press('Space');
    await expect(consent).toBeChecked();
    await tabTo(page, page.getByRole('button', { name: 'Next', exact: true }));
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: 'Anything else?' })).toBeFocused();
    await tabTo(page, page.getByRole('button', { name: 'Skip and send' }));
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Message sent' })).toBeVisible();
  });

  test('the document viewer and the video facade, by keyboard alone', async ({ page }) => {
    await page.route(/youtube-nocookie\.com/, (route) => route.abort());
    await page.goto('/work/kerr-microscopy-dissertation');
    const read = page.getByRole('button', { name: 'Read here' }).first();
    await tabTo(page, read);
    await page.keyboard.press('Enter');
    await expect(page.locator('.document-viewer iframe').first()).toBeVisible();
    const close = page.getByRole('button', { name: 'Close the document' });
    await tabTo(page, close);
    await page.keyboard.press('Enter');
    await expect(page.locator('.document-viewer iframe')).toHaveCount(0);

    await page.goto('/work/neural-network-from-scratch');
    await tabTo(page, page.getByRole('link', { name: /^Play video/ }));
    await page.keyboard.press('Enter');
    await expect(
      page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/wWAGaOdlyMw"]'),
    ).toBeFocused();
  });
});

test.describe('weight (spec P.1)', () => {
  test('the homepage loads 500 kB or less before any video, everything scrolled into view', async ({
    page,
  }) => {
    const sizes: Promise<{ url: string; bytes: number }>[] = [];
    page.on('requestfinished', (request) => {
      if (request.resourceType() === 'media') return;
      sizes.push(
        request.sizes().then((size) => ({
          url: request.url(),
          bytes: size.responseBodySize + size.responseHeadersSize,
        })),
      );
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await scrollThrough(page);
    await page.waitForLoadState('networkidle');
    const loaded = await Promise.all(sizes);
    const total = loaded.reduce((sum, entry) => sum + entry.bytes, 0);
    console.log(
      `homepage: ${Math.round(total / 1024)} kB in ${loaded.length} requests (uncompressed by wrangler dev)`,
    );
    expect(total).toBeLessThanOrEqual(500 * 1024);
  });
});
