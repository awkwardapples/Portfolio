import type { APIRequestContext, Page } from '@playwright/test';

import { expectNoSeriousViolations } from './axe';
import { expect, test } from './fixtures';

/**
 * "What brings you here?" end to end (spec I, Q; Pass 6 acceptance): every
 * intent through to success against `wrangler dev` with a local D1 and a
 * stub webhook, and the protections of Q.3 as a visitor or a script meets
 * them. Each test sends from its own made-up client address (the Worker
 * keys its rate limit on CF-Connecting-IP, which `wrangler dev` passes
 * through) and its own email address, so tests never share a limit or
 * count as each other's duplicates.
 */

const STUB = 'http://127.0.0.1:8799';
const run = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
let counter = 0;

// Each worker process counts up from a random point in 198.18.0.0/15 (addresses for
// benchmarking), so two tests never share a rate limit by chance.
const ipBase = Math.floor(Math.random() * 120_000);

function identity() {
  counter += 1;
  const n = ipBase + counter;
  return {
    ip: `198.${18 + ((n >> 16) & 1)}.${(n >> 8) & 255}.${n & 255}`,
    email: `visitor-${run}-${counter}@example.com`,
  };
}

async function as(page: Page, ip: string): Promise<void> {
  await page.setExtraHTTPHeaders({ 'cf-connecting-ip': ip });
}

interface Forward {
  secret: string | null;
  failed: boolean;
  payload: {
    reference: string;
    wizard_id: string;
    intent_label: string;
    answers: Record<string, unknown>;
  } | null;
}

async function forwardsFor(request: APIRequestContext, reference: string): Promise<Forward[]> {
  const all = (await (await request.get(`${STUB}/requests`)).json()) as Forward[];
  return all.filter((entry) => entry.payload?.reference === reference);
}

const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click();

async function details(page: Page, email: string, message = 'Hello from a browser test.') {
  // Intents with work to show put it first (spec I.2 step 3); go on past it.
  const onwards = page.getByRole('button', { name: 'Send Josh a message' });
  const heading = page.getByRole('heading', { name: 'Your details' });
  await expect(onwards.or(heading)).toBeVisible();
  if (await onwards.isVisible()) await onwards.click();
  await expect(heading).toBeFocused();
  await page.getByRole('textbox', { name: 'Your name' }).fill('Test Visitor');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  const messageField = page.getByRole('textbox', { name: /Your message|Anything to add/ });
  await messageField.fill(message);
  await page.getByLabel('I agree to my details being used to reply to this message.').check();
  await next(page);
}

async function send(page: Page) {
  await expect(page.getByRole('heading', { name: 'Anything else?' })).toBeFocused();
  await page.getByRole('button', { name: 'Skip and send' }).click();
}

async function reference(page: Page): Promise<string> {
  await expect(page.getByRole('heading', { name: 'Message sent' })).toBeVisible();
  const text = (await page.getByText(/^Reference: JL-/).textContent()) ?? '';
  const match = /JL-[0-9A-Z]{8}/.exec(text);
  expect(match, text).not.toBeNull();
  return match![0];
}

test.describe('each intent, through to success', () => {
  test('hiring: the role, the result with real work, details, sent', async ({ page, request }) => {
    const { ip, email } = identity();
    await as(page, ip);
    await page.goto('/contact?intent=hiring');
    await page.getByLabel('AI engineering').check();
    await page.getByLabel('Full-time').check();
    await next(page);
    await page.getByRole('textbox', { name: 'Organisation (optional)' }).fill('=Example Ltd');
    await page
      .getByRole('textbox', { name: 'Link to the role (optional)' })
      .fill('https://jobs.example.com/123');
    await next(page);
    // The result: published work, before any personal details (spec I.2 step 3).
    await expect(page.getByRole('heading', { name: 'Work to look at first' })).toBeFocused();
    await expect(
      page.getByRole('link', {
        name: 'Extracting magnetic information from Kerr Microscopy images',
      }),
    ).toHaveAttribute('href', '/work/kerr-microscopy-dissertation');
    await page.getByRole('button', { name: 'Send Josh a message' }).click();
    await details(page, email);
    await send(page);

    const ref = await reference(page);
    await expect(page.getByText(`I'll reply to ${email}.`)).toBeVisible();
    await expect.poll(async () => (await forwardsFor(request, ref)).length).toBe(1);
    const [forwarded] = await forwardsFor(request, ref);
    expect(forwarded?.secret).toBe('e2e-webhook-secret');
    expect(forwarded?.payload).toMatchObject({ wizard_id: 'hiring', intent_label: "I'm hiring" });
    // Formula injection is neutralised in the copy that reaches the spreadsheet.
    expect(forwarded?.payload?.answers.organisation).toBe("'=Example Ltd");
  });

  test('research', async ({ page, request }) => {
    const { ip, email } = identity();
    await as(page, ip);
    await page.goto('/contact?intent=research');
    await page.getByLabel('A collaboration').check();
    await next(page);
    await expect(page.getByRole('heading', { name: 'My research' })).toBeVisible();
    await page.getByRole('button', { name: 'Send Josh a message' }).click();
    await details(page, email);
    await send(page);
    const ref = await reference(page);
    await expect
      .poll(async () => (await forwardsFor(request, ref))[0]?.payload?.wizard_id)
      .toBe('research');
  });

  test('GrowTrades: an open question, then the case study, and nothing offered', async ({
    page,
    request,
  }) => {
    const { ip, email } = identity();
    await as(page, ip);
    await page.goto('/contact?intent=growtrades');
    await page
      .getByRole('textbox', { name: 'What would you like to know?' })
      .fill('How does the quote wizard work?');
    await next(page);
    await expect(page.getByRole('heading', { name: 'GrowTrades', level: 2 })).toBeFocused();
    await expect(page.getByRole('link', { name: 'GrowTrades', exact: true })).toHaveAttribute(
      'href',
      '/work/growtrades',
    );
    await page.getByRole('button', { name: 'Send Josh a message' }).click();
    await details(page, email);
    await send(page);
    const ref = await reference(page);
    await expect
      .poll(async () => (await forwardsFor(request, ref))[0]?.payload)
      .toMatchObject({
        wizard_id: 'growtrades',
        intent_label: "I'm interested in GrowTrades",
        answers: { growtrades_question: 'How does the quote wizard work?' },
      });
  });

  test('music', async ({ page, request }) => {
    const { ip, email } = identity();
    await as(page, ip);
    await page.goto('/contact?intent=music');
    await page.getByLabel('A booking or a gig').check();
    await next(page);
    await expect(page.getByRole('heading', { name: 'Music' })).toBeFocused();
    await page.getByRole('button', { name: 'Send Josh a message' }).click();
    await details(page, email);
    await send(page);
    const ref = await reference(page);
    await expect.poll(async () => (await forwardsFor(request, ref)).length).toBe(1);
  });

  test('something else, with the optional step filled in', async ({ page, request }) => {
    const { ip, email } = identity();
    await as(page, ip);
    await page.goto('/contact?intent=other');
    await page
      .getByRole('textbox', { name: 'What would you like to talk about?' })
      .fill('A question about the site.');
    await next(page);
    await page.getByRole('button', { name: 'Send Josh a message' }).click();
    await details(page, email, '');
    await page.getByRole('textbox', { name: 'Anything else I should know?' }).fill('No rush.');
    await page.getByLabel('This week').check();
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    const ref = await reference(page);
    await expect
      .poll(async () => (await forwardsFor(request, ref))[0]?.payload?.answers.reply_window)
      .toBe('this-week');
  });
});

test.describe('the journey', () => {
  test('without an intent, asks first and keeps the answer in the URL', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: 'What brings you here?' })).toBeFocused();
    await page.getByRole('button', { name: /^Research/ }).click();
    await expect(page).toHaveURL(/\/contact\?intent=research$/);
    await expect(page.getByRole('heading', { name: 'About your research question' })).toBeFocused();
    // Back on the first question returns to the choice.
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'What brings you here?' })).toBeVisible();
  });

  test('uses the answer already given on the homepage threshold', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[data-intent-option="hiring"]').click();
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: 'The role' })).toBeFocused();
  });

  test('"Keep exploring" leaves with the answers kept for later', async ({ page }) => {
    await page.goto('/contact?intent=research');
    await page.getByLabel('A collaboration').check();
    await next(page);
    await page.getByRole('button', { name: 'Keep exploring' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/contact?intent=research');
    await expect(page.getByLabel('A collaboration')).toBeChecked();
  });

  test('a second message the same day gets the duplicate copy and is not forwarded', async ({
    page,
    request,
  }) => {
    const { ip, email } = identity();
    await as(page, ip);
    for (const attempt of [1, 2]) {
      await page.goto('/contact?intent=music');
      await page.getByLabel('Just saying hello').check();
      await next(page);
      await details(page, email, `Attempt ${attempt}`);
      await send(page);
      if (attempt === 1) {
        await expect(page.getByRole('heading', { name: 'Message sent' })).toBeVisible();
      }
    }
    await expect(page.getByRole('heading', { name: 'I already have your message' })).toBeVisible();
    await expect(
      page.getByText("I already have a message from you today. I'll reply to both together."),
    ).toBeVisible();
    const text = (await page.getByText(/^Reference: JL-/).textContent()) ?? '';
    const duplicateRef = /JL-[0-9A-Z]{8}/.exec(text)?.[0] ?? '';
    expect(await forwardsFor(request, duplicateRef)).toEqual([]);
  });

  test('a webhook failure is invisible to the visitor: the message is stored for retry', async ({
    page,
    request,
  }) => {
    const { ip, email } = identity();
    await as(page, ip);
    await request.post(`${STUB}/fail?email=${encodeURIComponent(email)}`);
    await page.goto('/contact?intent=music');
    await page.getByLabel('Licensing or sync').check();
    await next(page);
    await details(page, email);
    await send(page);
    const ref = await reference(page);
    await expect.poll(async () => (await forwardsFor(request, ref))[0]?.failed).toBe(true);
  });
});

test.describe('protections (spec Q.3)', () => {
  const payload = (email: string, answers: Record<string, unknown> = {}) => ({
    wizardId: 'music',
    schemaVersion: 1,
    contractVersion: 3,
    quoteMode: 'manual',
    answers: {
      music_topic: 'hello',
      contact_name: 'Script',
      contact_email: email,
      message: 'Hi',
      data_processing_consent: ['agreed'],
      ...answers,
    },
    clientTimestamp: new Date().toISOString(),
    honeypotValue: '',
    turnstileToken: null,
  });
  const post = (request: APIRequestContext, body: unknown, headers: Record<string, string>) =>
    request.post('/api/submit', {
      headers: { 'content-type': 'application/json', origin: 'https://joshlennon.com', ...headers },
      data: typeof body === 'string' ? body : JSON.stringify(body),
    });

  test('the sixth message in an hour is refused, and the visitor is told how long to wait', async ({
    page,
    request,
  }) => {
    const { ip, email } = identity();
    for (let i = 0; i < 5; i += 1) {
      const response = await post(request, payload(`${i}-${email}`), { 'cf-connecting-ip': ip });
      expect(response.status()).toBe(200);
    }
    await as(page, ip);
    await page.goto('/contact?intent=music');
    await page.getByLabel('A collaboration').check();
    await next(page);
    await details(page, email);
    await send(page);
    await expect(page.getByRole('heading', { name: 'Please wait a moment' })).toBeVisible();
    await expect(page.getByText(/^Please try again in (59|60) minutes\.$/)).toBeVisible();
  });

  test('a filled honeypot fails quietly and nothing is forwarded', async ({ page, request }) => {
    const { ip, email } = identity();
    await as(page, ip);
    await page.goto('/contact?intent=music');
    await page.locator('input[name="goqw_website"]').fill('https://spam.example', { force: true });
    await page.getByLabel('A collaboration').check();
    await next(page);
    await details(page, email);
    await send(page);
    await expect(page.getByRole('heading', { name: 'Your message was not sent' })).toBeVisible();
    const all = (await (await request.get(`${STUB}/requests`)).json()) as Forward[];
    expect(all.some((entry) => entry.payload?.answers.contact_email === email)).toBe(false);
  });

  test('missing consent is refused with consent_required', async ({ request }) => {
    const { ip, email } = identity();
    const response = await post(request, payload(email, { data_processing_consent: [] }), {
      'cf-connecting-ip': ip,
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ errorCode: 'consent_required' });
  });

  test('another origin is refused with 403', async ({ request }) => {
    const { ip, email } = identity();
    const response = await post(request, payload(email), {
      'cf-connecting-ip': ip,
      origin: 'https://evil.example',
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ errorCode: 'unauthorized' });
  });

  test('a body over 16 kB is refused with 413', async ({ request }) => {
    const { ip, email } = identity();
    const response = await post(request, payload(email, { message: 'x'.repeat(17_000) }), {
      'cf-connecting-ip': ip,
    });
    expect(response.status()).toBe(413);
    expect(await response.json()).toEqual({ errorCode: 'payload_too_large' });
  });

  test('answers the browser would refuse are refused by the Worker too', async ({ request }) => {
    const { ip, email } = identity();
    const response = await post(request, payload(email, { music_topic: 'karaoke' }), {
      'cf-connecting-ip': ip,
    });
    expect(response.status()).toBe(400);
  });
});

test.describe('pages', () => {
  test('/contact and /privacy pass axe and fit 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ['/contact', '/contact?intent=hiring', '/privacy']) {
      await page.goto(path);
      await expectNoSeriousViolations(page);
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveCount(1);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('/contact offers the email address instead', async ({ page }) => {
      await page.goto('/contact');
      await expect(page.getByText('The questions need JavaScript.')).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'joshlennon71@gmail.com' }).first(),
      ).toBeVisible();
    });
  });
});
