import type { Page } from '@playwright/test';

import { expectNoSeriousViolations } from './axe';
import { expect, test } from './fixtures';

/**
 * Arbiter on the site (Pass 11, F; G.1, G.2, G.4, G.9): the homepage
 * section, the case study, and the console in its frame, on desktop and on
 * a phone. The console on its own page is arbiter-demo.spec.ts.
 */

const QUILLFEATHER = 'Quillfeather Payroll Cloud Ltd';
const BRIEF =
  'Escalate to the TPRM lead: Quillfeather Payroll Cloud Ltd says EU, but its contract (CTR-30007) shows US.';
// The captured run of Quillfeather (apps/arbiter-demo/public/data/index.json).
const RUN = 'run-6d3315765358';
const ENDORSEMENT = 'https://lnkd.in/p/eQA8-Kin';

/** Until the frame hydrates, its button simply opens the demo (the no-JavaScript fallback). */
async function hydrated(page: Page): Promise<void> {
  await expect(
    page.locator('astro-island[component-export="SiteFrame"]:not([ssr])').first(),
  ).toBeAttached();
}

test.describe('the homepage section', () => {
  test('follows Selected work, and loads nothing of the demo or the video until asked', async ({
    page,
  }) => {
    const asked: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/demo/arbiter/') || /youtube|ytimg|googlevideo/.test(url)) asked.push(url);
    });
    await page.goto('/');
    const order = await page
      .locator('main section[id]')
      .evaluateAll((sections) => sections.map((section) => section.id));
    expect(order.indexOf('arbiter')).toBe(order.indexOf('selected-work') + 1);
    const section = page.locator('#arbiter');
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('heading', { level: 2 })).toHaveText('Arbiter');
    await expect(section).toContainText(
      'Open Agent Hackathon 2026, built solo in five days: 28th in the Reasoning Architecture track.',
    );
    await expect(section.getByRole('link', { name: /^Try the live demo/ }).first()).toBeVisible();
    await expect(section.getByRole('link', { name: /^Play video/ })).toBeVisible();
    // The endorsement links to its public source, in a new tab, and says so.
    // The endorsement is the comment's screenshot, linked to it, with its words in the alt text.
    const comment = section.locator('a[data-endorsement-link]');
    await expect(comment).toHaveAttribute('href', ENDORSEMENT);
    await expect(comment).toHaveAttribute('target', '_blank');
    await expect(comment).toHaveAccessibleName(
      /^Frederick Newbrough II, VP of Global Pre-Sales, Zetaris.*"Agents that verify a vendor's security claims.*opens the comment on LinkedIn in a new tab/,
    );
    await expect(comment.locator('img')).toBeVisible();
    await expect(section.getByText('View the comment on LinkedIn')).toHaveCount(0);
    expect(asked).toEqual([]);
    await expectNoSeriousViolations(page, '#arbiter');
  });

  test('Selected work leads with Arbiter, and its demo link stays on the page', async ({
    page,
  }) => {
    await page.goto('/');
    const first = page.locator('#selected-work li').first();
    await expect(first.getByRole('heading', { level: 3 })).toHaveText('Arbiter');
    const actions = first.locator('ul a');
    await expect(actions).toHaveText([
      'Try the live demo',
      'Watch the demo video',
      'Code on GitHub',
    ]);
    // Both stay on the page: the demo and the video are in the Arbiter section.
    await expect(actions.nth(0)).toHaveAttribute('href', '#arbiter');
    await expect(actions.nth(1)).toHaveAttribute('href', '#arbiter-video');
    await expect(page.locator('#arbiter-video')).toHaveCount(1);
  });
});

test.describe('the case study', () => {
  test('has the demo, the video, the endorsement, its reasoning and its evaluation', async ({
    page,
  }) => {
    await page.goto('/work/arbiter');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Arbiter');
    await expect(page.locator('#live-demo')).toContainText('Fig. 1.');
    for (const heading of [
      'The demo video',
      'What it does',
      'How it reasons',
      'Under the hood',
      'How well it works',
      'Credits',
    ]) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.locator('a[data-endorsement-link] img')).toBeVisible();
    // "Watch the demo video" plays it here, at Fig. 2, not on YouTube.
    await expect(page.getByRole('link', { name: 'Watch the demo video' })).toHaveAttribute(
      'href',
      '#demo-video',
    );
    await expect(page.locator('figure#demo-video')).toContainText('Fig. 2.');
    // Every Under the hood link points at the pinned commit, never main.
    const code = await page
      .locator('[data-under-the-hood] a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
    expect(code.length).toBeGreaterThanOrEqual(8);
    for (const href of code) {
      expect(href).toMatch(
        /^https:\/\/github\.com\/awkwardapples\/Arbiter\/blob\/745098876d169e7ae146fc7af9a94d4f0aa85b84\/.+#L\d+/,
      );
    }
    await expect(page.getByRole('link', { name: 'Start a conversation' }).last()).toHaveAttribute(
      'href',
      '/contact?intent=hiring',
    );
    await expectNoSeriousViolations(page);
  });
});

test.describe('the console in its frame', () => {
  test('runs Quillfeather to its ruling, with the address bar following, and nothing leaves the site', async ({
    page,
    baseURL,
    isMobile,
  }) => {
    test.skip(isMobile, 'Phones open the console in a dialog (next test).');
    test.setTimeout(150_000);
    const origin = new URL(baseURL ?? '').origin;
    const foreign: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (/^https?:/.test(url) && new URL(url).origin !== origin) foreign.push(url);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/work/arbiter');
    const figure = page.locator('#live-demo');
    await figure.scrollIntoViewIfNeeded();
    await hydrated(page);
    await expect(figure.getByText('localhost:8000/console/').first()).toBeVisible();
    await figure.getByRole('link', { name: /^Try the live demo/ }).click();
    const console_ = figure.locator('iframe').contentFrame();
    await console_.getByRole('button', { name: `Start assessment of ${QUILLFEATHER}` }).click();
    const ruling = console_.getByTestId('ruling-card');
    await expect(ruling).toContainText('Escalate', { timeout: 90_000 });
    await expect(ruling).toContainText(BRIEF);
    await expect(figure.getByText(`localhost:8000/console/runs/${RUN}`).first()).toBeVisible();
    await ruling.getByRole('link', { name: 'Open the case' }).click();
    await expect(console_.getByText("The vendor's word").first()).toBeVisible();
    await expect(console_.getByText('EU', { exact: true }).first()).toBeVisible();
    await expect(console_.getByText('US', { exact: true }).first()).toBeVisible();
    await expect(figure.getByText('localhost:8000/console/cases/CASE-0007').first()).toBeVisible();

    expect(foreign, 'requests to other hosts').toEqual([]);
    expect(failed, 'failed requests').toEqual([]);
    expect(errors, 'console errors').toEqual([]);
  });

  test('on a phone, opens the console at 844 px, scaled, and fits it when turned sideways', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Phone layout only.');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/work/arbiter');
    const figure = page.locator('#live-demo');
    await figure.scrollIntoViewIfNeeded();
    await hydrated(page);
    const trigger = figure.getByRole('link', { name: /^Try the live demo/ }).last();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Arbiter console (demo)' });
    await expect(dialog).toBeVisible();
    const frame = dialog.locator('iframe');
    await expect(frame).toHaveAttribute('style', /width: 844px/);
    await expect(frame).toHaveAttribute('style', /scale\(0\.\d+\)/);
    await expect(dialog.getByText('Best with your phone turned sideways.')).toBeVisible();
    await expect(
      frame.contentFrame().getByRole('heading', { name: 'Assess a vendor' }),
    ).toBeVisible();

    // Escape closes it and returns focus to the button.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    // Turned sideways (844 by 390), the console runs at its own width and fits.
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(frame).not.toHaveAttribute('style', /scale/);
    await expect(dialog.getByText('Best with your phone turned sideways.')).toHaveCount(0);
    const console_ = frame.contentFrame();
    await expect(console_.getByRole('heading', { name: 'Assess a vendor' })).toBeVisible();
    const overflow = await frame.evaluate(
      (element) =>
        (element as HTMLIFrameElement).contentDocument!.documentElement.scrollWidth -
        (element as HTMLIFrameElement).clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // The close button closes it too, and focus goes back to the button.
    await page.setViewportSize({ width: 390, height: 844 });
    await dialog.getByRole('button', { name: 'Close the demo' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
