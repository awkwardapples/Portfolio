import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

/**
 * The SCB demo and the GrowTrades case study (spec J; Pass 7 acceptance):
 * the demo runs at /demo/scb-handyman with no request to any submission
 * endpoint, reports its pages to the framing page, cannot be framed by
 * another origin, and keeps every SCB image. The case-study tests run once
 * the GrowTrades entry is published; until then the page does not exist in
 * a production build and they are skipped.
 */

const DEMO = '/demo/scb-handyman';
const SUBMISSION = /\/api\/submit|wp-json|hook\.[a-z0-9]+\.make\.com|admin-ajax/;

function watchSubmissions(page: Page): string[] {
  const sent: string[] = [];
  page.on('request', (request) => {
    if (SUBMISSION.test(request.url())) sent.push(request.url());
  });
  return sent;
}

test.describe('the SCB demo', () => {
  test('runs a whole quote request and sends nothing anywhere', async ({ page }) => {
    const sent = watchSubmissions(page);
    await page.goto(`${DEMO}?path=%2Fquote`);
    await expect(page.getByRole('note')).toHaveText(
      'Demo of the SCB Handyman site. Nothing you enter is sent anywhere.',
    );
    await page.getByRole('button', { name: /General repairs/ }).click();

    const next = () => page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByLabel('Your postcode').fill('GU1 1AA');
    await next();
    await page
      .getByRole('textbox', { name: 'Please describe the repair work you need' })
      .fill('A sticking door.');
    await next();
    await page
      .getByRole('combobox', { name: 'How soon do you need this?' })
      .selectOption('flexible');
    await next();
    await page.getByRole('combobox', { name: 'Property type' }).selectOption('residential');
    await next();
    await next(); // photos are optional
    await page.getByLabel('Email').check();
    await next();
    await page.getByRole('textbox', { name: 'Your name' }).fill('Demo Visitor');
    await page.getByRole('textbox', { name: 'Email address' }).fill('demo@example.com');
    await next();
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Demo: nothing was sent' })).toBeVisible();
    expect(sent).toEqual([]);
  });

  test('is framable by this site only, and kept out of search', async ({ request }) => {
    const response = await request.get(DEMO);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-frame-options']).toBeUndefined();
    // Its own policy (ADR-0048): framed by this site only, no inline script.
    const policy = response.headers()['content-security-policy'] ?? '';
    expect(policy).toContain("frame-ancestors 'self'");
    expect(policy).toContain("script-src 'self';");
    expect(response.headers()['x-robots-tag']).toBe('noindex');
    expect(await response.text()).toContain('<meta name="robots" content="noindex"');
  });

  test('refuses to load inside a page from another origin', async ({ page, baseURL }) => {
    // A blank page has an opaque origin, so it is never "this site".
    await page.setContent(`<iframe id="probe" src="${baseURL}${DEMO}"></iframe>`);
    await page.waitForTimeout(1500);
    await expect(page.frameLocator('#probe').getByRole('note')).toHaveCount(0);
  });

  test('tells the page that frames it where it is, on every navigation', async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      'The same messages on every device; the desktop navigation is easiest to click.',
    );
    await page.goto('/privacy');
    await page.evaluate((src) => {
      (window as unknown as { demoMessages: unknown[] }).demoMessages = [];
      window.addEventListener('message', (event) =>
        (window as unknown as { demoMessages: unknown[] }).demoMessages.push(event.data),
      );
      const frame = document.createElement('iframe');
      frame.src = src;
      frame.id = 'demo';
      frame.style.width = '1280px';
      frame.style.height = '800px';
      document.body.append(frame);
    }, DEMO);
    const demo = page.frameLocator('#demo');
    await demo.getByRole('link', { name: 'Services', exact: true }).first().click();
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { demoMessages: unknown[] }).demoMessages),
      )
      .toEqual([
        { type: 'scb-demo:navigate', path: '/' },
        { type: 'scb-demo:navigate', path: '/services' },
      ]);
  });

  test('keeps every SCB image', async ({ page }) => {
    const images: string[] = [];
    page.on('response', (response) => {
      if (response.request().resourceType() === 'image' && response.status() === 200) {
        images.push(new URL(response.url()).pathname);
      }
    });
    for (const path of [
      '/',
      '/services/fence-panel-repair-guildford',
      '/services/block-paving-guildford',
      '/services/high-ceiling-painter-decorator-guildford',
      '/services/driveway-decking-pressure-washing-guildford',
      '/services/emergency-plumbing-leak-repair-surrey',
    ]) {
      await page.goto(`${DEMO}?path=${encodeURIComponent(path)}`, { waitUntil: 'networkidle' });
    }
    for (const name of [
      'logo-scb-handyman-white',
      'service-hero-fencing',
      'service-hero-driveway',
      'service-hero-painting',
      'service-hero-jetwash',
      'service-hero-plumbing',
    ]) {
      expect(
        images.some((image) => image.includes(name)),
        name,
      ).toBe(true);
    }
  });
});

test.describe('the GrowTrades case study', () => {
  test.beforeEach(async ({ request }) => {
    const response = await request.get('/work/growtrades');
    test.skip(
      response.status() === 404,
      'GrowTrades is still a draft; these run once it is published.',
    );
  });

  test('loads nothing of the demo until asked, then follows it in the address bar', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The phone layout opens the demo in a dialog (next test).');
    const demoRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes(DEMO)) demoRequests.push(request.url());
    });
    await page.goto('/work/growtrades');
    await page.locator('.site-frame').first().scrollIntoViewIfNeeded();
    expect(demoRequests).toEqual([]);
    await page
      .getByRole('link', { name: /^Try the live site/ })
      .first()
      .click();
    const demo = page.locator('.site-frame iframe').first().contentFrame();
    await demo.getByRole('link', { name: 'Services', exact: true }).first().click();
    // The address bar (the frame also announces the address to screen readers).
    await expect(
      page.locator('.site-frame').getByText('scbhandyman.co.uk/services').first(),
    ).toBeVisible();
  });

  test('on phones, opens the demo full screen and returns focus on close', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Phone layout only.');
    await page.goto('/work/growtrades');
    const trigger = page.getByRole('link', { name: /^Try the live site/ }).last();
    // Until the frame hydrates, the link simply opens the demo (its no-JavaScript fallback).
    await trigger.scrollIntoViewIfNeeded();
    await expect(
      page.locator('astro-island[component-export="SiteFrame"]').first(),
    ).not.toHaveAttribute('ssr', '');
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'SCB Handyman site (demo)' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
});
