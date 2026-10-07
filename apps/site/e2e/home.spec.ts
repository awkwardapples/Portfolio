import type { Page } from '@playwright/test';

import { expectNoSeriousViolations } from './axe';
import { expect, test } from './fixtures';

/**
 * The homepage threshold and the intent it remembers (spec G.0, G.1, N.1;
 * Pass 4 acceptance).
 */

const threshold = (page: Page) => page.locator('[data-threshold]');
const option = (page: Page, value: string) => page.locator(`a[data-intent-option="${value}"]`);

async function storedIntent(page: Page): Promise<string | null> {
  const raw = await page.evaluate(() => localStorage.getItem('jl:intent'));
  return raw ? (JSON.parse(raw) as { value: string }).value : null;
}

/** Answer the question in an earlier visit, then load `path` as a returning visitor. */
async function returnAs(page: Page, value: string, path = '/'): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    (stored) => localStorage.setItem('jl:intent', JSON.stringify({ value: stored, at: '' })),
    value,
  );
  await page.goto(path);
}

test.describe('the threshold', () => {
  test('shows on a first visit with the name as the page heading', async ({ page }) => {
    await page.goto('/');
    await expect(threshold(page)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Josh Lennon');
    await expect(page.getByRole('heading', { name: 'What brings you here?' })).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-intent');
  });

  test('choosing "Research" lands on #research with focus on its heading', async ({ page }) => {
    await page.goto('/');
    await option(page, 'research').click();
    const heading = page.locator('#research-heading');
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();
    await expect(threshold(page)).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('data-intent', 'research');
    expect(await storedIntent(page)).toBe('research');
  });

  test('chooses instantly when the visitor asks for less motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await option(page, 'hiring').click();
    // No transition states are ever set.
    await expect(threshold(page)).not.toHaveAttribute('data-choosing');
    await expect(page.locator('#selected-work-heading')).toBeFocused();
  });

  test('stays hidden after a reload, with no flash', async ({ page }) => {
    await page.goto('/');
    await option(page, 'research').click();
    await expect(page.locator('#research-heading')).toBeFocused();

    // Record whether html[data-intent] was already set when the parser reached the threshold:
    // the stylesheet in <head> then hides it before the first paint.
    await page.addInitScript(() => {
      new MutationObserver((_records, observer) => {
        if (!document.querySelector('[data-threshold]')) return;
        (window as unknown as { intentAtParse: string | null }).intentAtParse =
          document.documentElement.dataset.intent ?? null;
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await page.reload();

    expect(
      await page.evaluate(
        () => (window as unknown as { intentAtParse: string | null }).intentAtParse,
      ),
    ).toBe('research');
    await expect(threshold(page)).toBeHidden();
    // The intro carries the page's h1 for returning visitors.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Josh Lennon');
    await expect(page.locator('#intro-heading')).toBeVisible();
  });

  test('"Choose again" forgets the answer and brings the threshold back', async ({ page }) => {
    await returnAs(page, 'hiring');
    await expect(threshold(page)).toBeHidden();
    await page.getByRole('link', { name: "Not what you're after? Choose again" }).click();
    await expect(threshold(page)).toBeVisible();
    await expect(page.locator('#threshold-question')).toBeFocused();
    expect(await storedIntent(page)).toBeNull();
    await page.reload();
    await expect(threshold(page)).toBeVisible();
  });

  test('the footer offers the same on other pages, and goes home', async ({ page }) => {
    await returnAs(page, 'research', '/a-page-that-does-not-exist');
    await page.getByRole('link', { name: 'Change what brought you here' }).click();
    await expect(page).toHaveURL(/\/#threshold$/);
    await expect(threshold(page)).toBeVisible();
    expect(await storedIntent(page)).toBeNull();
  });

  test('never appears on any other route', async ({ page }) => {
    for (const path of ['/work/kerr-microscopy-dissertation', '/a-page-that-does-not-exist']) {
      await page.goto(path);
      await expect(threshold(page), path).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'What brings you here?' })).toHaveCount(0);
    }
  });

  test('passes axe for first and returning visitors', async ({ page }) => {
    await page.goto('/');
    await expectNoSeriousViolations(page);
    await returnAs(page, 'research');
    await expectNoSeriousViolations(page);
  });

  test('has no horizontal scroll at 320 px for returning visitors', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await returnAs(page, 'hiring');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('the intro', () => {
  const visibleCtas = (page: Page) => page.locator('[data-cta-for]:visible');

  test('shows exactly one set of calls to action for each answer', async ({ page }) => {
    await page.goto('/');
    await expect(visibleCtas(page)).toHaveCount(1);
    await expect(visibleCtas(page)).toHaveAttribute('data-cta-for', 'looking');

    // Every answer the threshold offers has its own set (Music is not an answer).
    const answers = await page
      .locator('a[data-intent-option]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('data-intent-option') ?? ''));
    expect(answers).toEqual(['hiring', 'research', 'experience', 'looking']);
    for (const answer of answers) {
      await returnAs(page, answer);
      await expect(visibleCtas(page), answer).toHaveCount(1);
      await expect(visibleCtas(page), answer).toHaveAttribute('data-cta-for', answer);
    }

    await returnAs(page, 'research');
    await expect(visibleCtas(page).getByRole('link').first()).toHaveText('Read the research');
    await returnAs(page, 'experience');
    await expect(visibleCtas(page).getByRole('link').first()).toHaveText('See GrowTrades');
  });

  test('links only to destinations that exist', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('[data-cta-for] a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
    for (const href of new Set(hrefs)) {
      if (href.startsWith('#')) {
        await expect(page.locator(href), href).toHaveCount(1);
      } else {
        expect((await request.get(href)).status(), href).toBe(200);
      }
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the threshold is a set of links to the homepage sections', async ({ page }) => {
    await page.goto('/');
    await expect(threshold(page)).toBeVisible();
    await option(page, 'research').click();
    await expect(page).toHaveURL(/#research$/);
    await expect(page.locator('#research-heading')).toBeInViewport();
    // Nothing is hidden for visitors without JavaScript.
    await expect(page.locator('#selected-work')).toBeVisible();
    await expect(page.locator('[data-cta-for="looking"]')).toBeVisible();
  });
});
