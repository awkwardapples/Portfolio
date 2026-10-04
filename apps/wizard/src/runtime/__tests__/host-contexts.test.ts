import { describe, it, expect, vi } from 'vitest';

import { DEFAULT_WIZARD_COPY, resolveCopy } from '@/runtime/copy';
import { httpSubmissionPort } from '@/runtime/http-submission-port';
import type { SubmissionRequest } from '@/runtime/submission';

/**
 * The host-facing additions (portfolio spec I.5, I.6; ADR-0042): copy with
 * the SCB strings as defaults, and the submission port's endpoint option.
 */

describe('DEFAULT_WIZARD_COPY', () => {
  it('keeps the SCB quote wizard wording, so a host that provides nothing sees no change', () => {
    expect(DEFAULT_WIZARD_COPY).toMatchObject({
      successTitle: 'Quote request received',
      successBody: 'We will be in touch shortly with your personalised quote.',
      duplicateTitle: 'We already have your request',
      failureTitle: 'Something went wrong',
      rateLimitedTitle: 'Please wait a moment',
      retryLabel: 'Try again',
      backLabel: 'Back',
      nextLabel: 'Next',
      submitLabel: 'Submit',
      skipAndSubmitLabel: 'Skip and Submit',
      selectorHeading: 'What would you like a quote for?',
      screenHeadingLevel: 'h1',
    });
  });

  it('resolves copy that depends on the answers', () => {
    const body = (answers: Record<string, unknown>) =>
      `I'll reply to ${String(answers.contact_email)}.`;
    expect(resolveCopy(body, { contact_email: 'a@example.com' })).toBe(
      "I'll reply to a@example.com.",
    );
    expect(resolveCopy('Plain', {})).toBe('Plain');
  });
});

describe('httpSubmissionPort with endpointUrl (portfolio)', () => {
  const request: SubmissionRequest = {
    wizardId: 'hiring',
    schemaVersion: 1,
    quoteMode: 'manual',
    answers: { contact_email: 'a@example.com' },
    clientTimestamp: '2026-10-04T12:00:00.000Z',
  };

  it('posts to the endpoint as given and sends no nonce header', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ reference: 'JL-ABCDEFGH' }), { status: 200 }),
      );
    const port = httpSubmissionPort({ endpointUrl: '/api/submit', fetchImpl });
    const result = await port.submit(request);

    expect(result).toEqual({ ok: true, reference: 'JL-ABCDEFGH', isDuplicate: false });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/submit');
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      wizardId: 'hiring',
      contractVersion: 3,
      quoteMode: 'manual',
      pricing: null,
    });
  });

  it('still sends the nonce when one is given (the SCB deployment)', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ reference: 'GOQW-1' }), { status: 200 }));
    await httpSubmissionPort({
      restUrl: 'https://x.test/wp-json/qw/v1',
      restNonce: 'n',
      fetchImpl,
    }).submit(request);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://x.test/wp-json/qw/v1/submit');
    expect((init.headers as Record<string, string>)['X-WP-Nonce']).toBe('n');
  });

  it('reports the wait in minutes when rate limited (spec Pass 6 acceptance)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errorCode: 'rate_limited', retryAfterSeconds: 1500 }), {
        status: 429,
      }),
    );
    const result = await httpSubmissionPort({ endpointUrl: '/api/submit', fetchImpl }).submit(
      request,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('rate_limited');
      expect(result.error.message).toBe('Please try again in 25 minutes.');
    }
  });
});
