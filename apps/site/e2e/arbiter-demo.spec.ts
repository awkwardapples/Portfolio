import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

/**
 * Arbiter's console as a demo, on its own page (Pass 11, E; G.2, G.3):
 * everything answers from the snapshot, nothing leaves this origin, and
 * nothing is missing. The framed flow, the address bar and phones are in
 * arbiter.spec.ts. The console is a desktop application, so these run on
 * the desktop project.
 */

const QUILLFEATHER = 'Quillfeather Payroll Cloud Ltd';
const BRIEF =
  'Escalate to the TPRM lead: Quillfeather Payroll Cloud Ltd says EU, but its contract (CTR-30007) shows US.';
const NOT_SAVED =
  "In this demo, decisions are not saved. In Arbiter, this records the TPRM lead's decision.";
const NOT_IN_DEMO =
  "This demo replays recorded runs of Arbiter's engine, so it can't assess a new questionnaire. Pick an existing vendor, or run Arbiter locally in sample mode.";

/** Records requests to other hosts, failed responses and console errors. */
function watch(page: Page, origin: string) {
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
  page.on('pageerror', (error) => errors.push(error.message));
  return {
    expectClean: () => {
      expect(foreign, 'requests to other hosts').toEqual([]);
      expect(failed, 'failed requests').toEqual([]);
      expect(errors, 'console errors').toEqual([]);
    },
  };
}

test.describe('the Arbiter demo', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'The console is a desktop application; phones use the frame.',
  );

  test('runs Quillfeather to its ruling and opens the case, from the snapshot alone', async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(150_000);
    const watcher = watch(page, new URL(baseURL ?? '').origin);
    await page.goto('/demo/arbiter');
    // Arbiter's own sample-mode label stays on screen, under the demo's banner.
    await expect(
      page.getByText('Sample mode: DuckDB mirror, deterministic fallback').first(),
    ).toBeVisible();
    await expect(page.getByText(/^Demo: assessments replay recorded runs/)).toBeVisible();
    await page.getByRole('button', { name: `Start assessment of ${QUILLFEATHER}` }).click();
    const ruling = page.getByTestId('ruling-card');
    await expect(ruling).toContainText('Escalate', { timeout: 90_000 });
    await expect(ruling).toContainText(BRIEF);
    await ruling.getByRole('link', { name: 'Open the case' }).click();
    // The claim against the record: the vendor's word EU, the contract US.
    await expect(page.getByText("The vendor's word").first()).toBeVisible();
    await expect(page.getByText('EU', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('US', { exact: true }).first()).toBeVisible();
    watcher.expectClean();
  });

  test('every page of the rail renders from the snapshot', async ({ page, baseURL }) => {
    const watcher = watch(page, new URL(baseURL ?? '').origin);
    await page.goto('/demo/arbiter');
    const pages: [link: string, heading: string][] = [
      ['Cases', 'Cases'],
      ['Memory', 'Memory'],
      ['Sources', 'Sources and semantic layer'],
      ['Provider', 'Provider'],
      ['Audit', 'Audit'],
      ['Evaluation', 'Evaluation'],
      ['Assess', 'Assess a vendor'],
    ];
    for (const [link, heading] of pages) {
      await page.getByRole('link', { name: link, exact: true }).first().click();
      await expect(page.getByRole('heading', { level: 1 }), link).toHaveText(heading);
    }
    watcher.expectClean();
  });

  test('a recorded live run plays, labelled as one', async ({ page, baseURL }) => {
    test.setTimeout(150_000);
    const watcher = watch(page, new URL(baseURL ?? '').origin);
    await page.goto('/demo/arbiter');
    await page
      .getByRole('button', { name: /^Watch Quillfeather.*recorded/ })
      .first()
      .click();
    await expect(page.getByText(/^Recorded live run, \d+ Oct 2026/).first()).toBeVisible();
    await expect(page.getByTestId('ruling-card')).toContainText('Escalate', { timeout: 120_000 });
    watcher.expectClean();
  });

  test('a review decision is not saved', async ({ page }) => {
    await page.goto('/demo/arbiter');
    await page.getByRole('link', { name: 'Cases', exact: true }).first().click();
    await page
      .getByTestId('cases-table')
      .getByRole('row', { name: new RegExp(QUILLFEATHER) })
      .click();
    await page.getByRole('tab', { name: 'Audit trail' }).click();
    await page.getByRole('link', { name: 'Open review' }).click();
    const form = page.getByTestId('review-form');
    await form.getByLabel('Reviewer').fill('Demo visitor');
    await form
      .getByLabel('Rationale')
      .fill('The contract places hosting in the US, which the questionnaire does not disclose.');
    await form.getByRole('button', { name: 'Submit review' }).click();
    await expect(page.getByText(NOT_SAVED)).toBeVisible();
  });

  test("a case's dossiers download from the snapshot", async ({ page, baseURL }) => {
    const watcher = watch(page, new URL(baseURL ?? '').origin);
    await page.goto('/demo/arbiter');
    await page.getByRole('link', { name: 'Cases', exact: true }).first().click();
    await page
      .getByTestId('cases-table')
      .getByRole('row', { name: new RegExp(QUILLFEATHER) })
      .click();
    await page.getByRole('tab', { name: 'Audit trail' }).click();
    for (const [label, name] of [
      ['Download dossier (HTML)', 'CASE-0007-dossier.html'],
      ['Download dossier (Markdown)', 'CASE-0007-dossier.md'],
    ]) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('link', { name: label }).click(),
      ]);
      expect(download.suggestedFilename()).toBe(name);
      expect(download.url()).toMatch(/\/demo\/arbiter\/data\/cases\/CASE-0007\/dossier\.(htm|md)$/);
      expect(await download.failure()).toBeNull();
    }
    watcher.expectClean();
  });

  test('a new questionnaire is not assessed, and the console says why', async ({ page }) => {
    await page.goto('/demo/arbiter');
    await page.getByRole('tab', { name: 'New vendor' }).click();
    await page.getByRole('link', { name: 'New vendor assessment' }).click();
    const preset = page.getByLabel('Load an example vendor');
    await preset.selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Start assessment', exact: true }).click();
    await expect(page.getByText(NOT_IN_DEMO)).toBeVisible();
  });
});
