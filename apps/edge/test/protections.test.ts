/**
 * Parity with the plugin's protection tests (plugins/quote-wizard/tests/Unit,
 * deleted once these passed; see git history before the Pass 6 merge and ADR-0043): each case below is ported from the PHP test of the same name,
 * noted in its title. Additions for the port are marked "new".
 */
import { describe, expect, it, vi } from 'vitest';

import { checkBotProtection } from '../src/security/bot-protection';
import { isConsentGiven } from '../src/security/consent';
import { HOUR_SECONDS, RateLimiter, clientKey } from '../src/security/rate-limit';
import { sanitizeForOutbound, sanitizeSubmissionPayload } from '../src/security/sanitize';
import { turnstileMatches, verifyTurnstile } from '../src/security/turnstile';
import { checkDuplicate, DUPLICATE_WINDOW_MS } from '../src/submissions/duplicates';

import { memoryRateLimits } from './helpers';

describe('ConsentValidator', () => {
  it('accepts consent when the field holds the expected checked value', () => {
    expect(isConsentGiven({ data_processing_consent: ['agreed'] })).toBe(true);
  });
  it('accepts consent alongside other unrelated answers', () => {
    expect(
      isConsentGiven({ contact_email: 'jane@example.com', data_processing_consent: ['agreed'] }),
    ).toBe(true);
  });
  it('rejects a missing consent field', () => {
    expect(isConsentGiven({ contact_email: 'jane@example.com' })).toBe(false);
  });
  it('rejects an empty array (checkbox unchecked)', () => {
    expect(isConsentGiven({ data_processing_consent: [] })).toBe(false);
  });
  it('rejects a non-array value even if truthy', () => {
    expect(isConsentGiven({ data_processing_consent: 'agreed' })).toBe(false);
    expect(isConsentGiven({ data_processing_consent: true })).toBe(false);
  });
  it('rejects an array that does not contain the expected value', () => {
    expect(isConsentGiven({ data_processing_consent: ['yes'] })).toBe(false);
  });
});

describe('DuplicateDetector', () => {
  const now = Date.parse('2026-10-04T12:00:00.000Z');
  const repo = (returns: number | null) => {
    const queries: { emailNorm: string; phoneNorm: string; windowStart: string }[] = [];
    return {
      queries,
      repository: {
        findRecentByContact: async (emailNorm: string, phoneNorm: string, windowStart: string) => {
          queries.push({ emailNorm, phoneNorm, windowStart });
          return returns;
        },
      },
    };
  };

  it('reports a duplicate when the repository finds a matching email', async () => {
    const { repository } = repo(7);
    expect(await checkDuplicate(repository, 'jane@example.com', '', now)).toEqual({
      isDuplicate: true,
      originalSubmissionId: 7,
    });
  });
  it('reports a duplicate when the repository finds a matching phone', async () => {
    const { repository } = repo(9);
    expect(await checkDuplicate(repository, '', '07700 900123', now)).toEqual({
      isDuplicate: true,
      originalSubmissionId: 9,
    });
  });
  it('reports no duplicate when the repository finds nothing', async () => {
    const { repository } = repo(null);
    expect(await checkDuplicate(repository, 'jane@example.com', '', now)).toEqual({
      isDuplicate: false,
    });
  });
  it('normalizes email to lowercase and trims whitespace before querying', async () => {
    const { repository, queries } = repo(null);
    await checkDuplicate(repository, '  Jane@Example.COM ', '', now);
    expect(queries[0]?.emailNorm).toBe('jane@example.com');
  });
  it('normalizes phone to digits-only before querying', async () => {
    const { repository, queries } = repo(null);
    await checkDuplicate(repository, '', '+44 (0)7700-900 123', now);
    expect(queries[0]?.phoneNorm).toBe('4407700900123');
  });
  it('computes a window start 24 hours before now (UTC)', async () => {
    const { repository, queries } = repo(null);
    await checkDuplicate(repository, 'jane@example.com', '', now);
    expect(queries[0]?.windowStart).toBe(new Date(now - DUPLICATE_WINDOW_MS).toISOString());
    expect(queries[0]?.windowStart).toBe('2026-10-03T12:00:00.000Z');
  });
  it('skips the query entirely when both email and phone are empty', async () => {
    const { repository, queries } = repo(5);
    expect(await checkDuplicate(repository, '  ', '', now)).toEqual({ isDuplicate: false });
    expect(queries).toHaveLength(0);
  });
});

describe('RateLimiter', () => {
  const at = (seconds: number) => () => seconds;

  it('allows a fresh IP with no prior transient', async () => {
    const limiter = new RateLimiter(memoryRateLimits(), 5, HOUR_SECONDS, at(1000));
    expect(await limiter.check('a')).toEqual({ allowed: true, remaining: 5 });
  });
  it('allows an IP under the limit and reports remaining count', async () => {
    const store = memoryRateLimits();
    store.entries.set('a', { count: 3, expiresAt: 2000 });
    expect(await new RateLimiter(store, 5, HOUR_SECONDS, at(1000)).check('a')).toEqual({
      allowed: true,
      remaining: 2,
    });
  });
  it('denies an IP at the limit with a positive retryAfterSeconds', async () => {
    const store = memoryRateLimits();
    store.entries.set('a', { count: 5, expiresAt: 2500 });
    expect(await new RateLimiter(store, 5, HOUR_SECONDS, at(1000)).check('a')).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 1500,
    });
  });
  it('tracks independent counters for different IPs', async () => {
    const store = memoryRateLimits();
    const limiter = new RateLimiter(store, 5, HOUR_SECONDS, at(1000));
    await limiter.record('a');
    await limiter.record('a');
    await limiter.record('b');
    expect(store.entries.get('a')?.count).toBe(2);
    expect(store.entries.get('b')?.count).toBe(1);
  });
  it('preserves the original window expiry across multiple record() calls', async () => {
    const store = memoryRateLimits();
    let now = 1000;
    const limiter = new RateLimiter(store, 5, HOUR_SECONDS, () => now);
    await limiter.record('a');
    now = 1500;
    await limiter.record('a');
    now = 2000;
    await limiter.record('a');
    expect(store.entries.get('a')).toEqual({ count: 3, expiresAt: 1000 + HOUR_SECONDS });
  });
  it('treats a missing transient as a naturally expired window (allowed again)', async () => {
    const store = memoryRateLimits();
    store.entries.set('a', { count: 5, expiresAt: 900 });
    const limiter = new RateLimiter(store, 5, HOUR_SECONDS, at(1000));
    expect(await limiter.check('a')).toEqual({ allowed: true, remaining: 5 });
    await limiter.record('a');
    expect(store.entries.get('a')).toEqual({ count: 1, expiresAt: 1000 + HOUR_SECONDS });
  });
  it('does not increment the count when checking, only when recording', async () => {
    const store = memoryRateLimits();
    const limiter = new RateLimiter(store, 5, HOUR_SECONDS, at(1000));
    await limiter.check('a');
    await limiter.check('a');
    expect(store.entries.size).toBe(0);
  });
  it('uses the configured window length for a fresh record', async () => {
    const store = memoryRateLimits();
    await new RateLimiter(store, 5, 120, at(1000)).record('a');
    expect(store.entries.get('a')).toEqual({ count: 1, expiresAt: 1120 });
  });
  it('new: keys the limit by an HMAC of the address, never the address itself', async () => {
    const key = await clientKey('203.0.113.7', 'salt');
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain('203');
    expect(await clientKey('203.0.113.7', 'salt')).toBe(key);
    expect(await clientKey('203.0.113.7', 'other salt')).not.toBe(key);
  });
});

describe('BotProtection', () => {
  const ok = { success: true, errorCodes: [] as string[] };
  const deps = (overrides: Partial<Parameters<typeof checkBotProtection>[2]> = {}) => {
    const store = memoryRateLimits();
    return {
      store,
      deps: {
        rateLimiter: new RateLimiter(store, 5, HOUR_SECONDS, () => 1000),
        verifyToken: null,
        ...overrides,
      },
    };
  };

  it('allows everything when bot protection is disabled, even a filled honeypot', async () => {
    const { deps: d } = deps({ enabled: false });
    expect(await checkBotProtection({ honeypotValue: 'bot' }, 'k', d)).toEqual({ allowed: true });
  });
  it('rejects a filled honeypot before checking the rate limit', async () => {
    const { deps: d, store } = deps();
    store.entries.set('k', { count: 5, expiresAt: 5000 });
    expect(await checkBotProtection({ honeypotValue: 'bot' }, 'k', d)).toEqual({
      allowed: false,
      errorCode: 'honeypot_filled',
    });
  });
  it('proceeds past the honeypot check when it is empty', async () => {
    const { deps: d } = deps();
    expect(await checkBotProtection({ honeypotValue: '' }, 'k', d)).toEqual({ allowed: true });
  });
  it('rejects a rate-limited IP with retryAfterSeconds', async () => {
    const { deps: d, store } = deps();
    store.entries.set('k', { count: 5, expiresAt: 1600 });
    expect(await checkBotProtection({}, 'k', d)).toEqual({
      allowed: false,
      errorCode: 'rate_limited',
      retryAfterSeconds: 600,
    });
  });
  it('allows the submission when Turnstile is not configured (null client)', async () => {
    const { deps: d } = deps({ verifyToken: null });
    expect(await checkBotProtection({ turnstileToken: null }, 'k', d)).toEqual({ allowed: true });
  });
  it('rejects a missing Turnstile token when Turnstile is configured', async () => {
    const verifyToken = vi.fn(async () => ok);
    const { deps: d } = deps({ verifyToken });
    expect(await checkBotProtection({ turnstileToken: '' }, 'k', d)).toEqual({
      allowed: false,
      errorCode: 'turnstile_missing',
    });
    expect(verifyToken).not.toHaveBeenCalled();
  });
  it('rejects an invalid Turnstile token', async () => {
    const { deps: d, store } = deps({
      verifyToken: async () => ({ success: false, errorCodes: ['invalid-input-response'] }),
    });
    expect(await checkBotProtection({ turnstileToken: 'bad' }, 'k', d)).toEqual({
      allowed: false,
      errorCode: 'turnstile_invalid',
    });
    expect(store.entries.size).toBe(0);
  });
  it('allows and records the rate limit when the Turnstile token is valid', async () => {
    const { deps: d, store } = deps({ verifyToken: async () => ok });
    expect(await checkBotProtection({ turnstileToken: 'good' }, 'k', d)).toEqual({ allowed: true });
    expect(store.entries.get('k')?.count).toBe(1);
  });
  it('new: rejects a valid token issued for another site or form', async () => {
    const { deps: d } = deps({
      verifyToken: async () => ({ ...ok, hostname: 'evil.example', action: 'contact-submit' }),
      tokenMatches: (result) =>
        turnstileMatches(result, { hostnames: ['joshlennon.com'], action: 'contact-submit' }),
    });
    expect(await checkBotProtection({ turnstileToken: 'stolen' }, 'k', d)).toEqual({
      allowed: false,
      errorCode: 'turnstile_invalid',
    });
  });
});

describe('TurnstileClient', () => {
  const respond = (body: unknown, status = 200) =>
    vi.fn(
      async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }),
    );

  it('returns success for a valid token', async () => {
    const fetchImpl = respond({
      success: true,
      'error-codes': [],
      hostname: 'joshlennon.com',
      action: 'contact-submit',
    });
    expect(await verifyTurnstile('t', '203.0.113.7', 'secret', fetchImpl)).toEqual({
      success: true,
      errorCodes: [],
      hostname: 'joshlennon.com',
      action: 'contact-submit',
    });
    const body = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData;
    expect(body.get('secret')).toBe('secret');
    expect(body.get('response')).toBe('t');
    expect(body.get('remoteip')).toBe('203.0.113.7');
  });
  it('returns failure with error codes for an invalid token', async () => {
    const result = await verifyTurnstile(
      't',
      '',
      's',
      respond({ success: false, 'error-codes': ['invalid-input-response'] }),
    );
    expect(result).toMatchObject({ success: false, errorCodes: ['invalid-input-response'] });
  });
  it('returns timeout-or-duplicate for an already-used token', async () => {
    const result = await verifyTurnstile(
      't',
      '',
      's',
      respond({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
    );
    expect(result.errorCodes).toEqual(['timeout-or-duplicate']);
  });
  it('handles a network failure gracefully', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    expect(await verifyTurnstile('t', '', 's', fetchImpl)).toEqual({
      success: false,
      errorCodes: ['network_error'],
    });
  });
  it('handles a malformed (non-JSON) response body gracefully', async () => {
    expect(await verifyTurnstile('t', '', 's', respond('<html>'))).toEqual({
      success: false,
      errorCodes: ['invalid_response'],
    });
  });
  it('new: matches only the expected hostname and action', () => {
    const result = {
      success: true,
      errorCodes: [],
      hostname: 'joshlennon.com',
      action: 'contact-submit',
    };
    const expected = {
      hostnames: ['joshlennon.com', 'joshlennon-site.example.workers.dev'],
      action: 'contact-submit',
    };
    expect(turnstileMatches(result, expected)).toBe(true);
    expect(
      turnstileMatches({ ...result, hostname: 'joshlennon-site.example.workers.dev' }, expected),
    ).toBe(true);
    expect(turnstileMatches({ ...result, hostname: 'x.com' }, expected)).toBe(false);
    expect(turnstileMatches({ ...result, action: 'login' }, expected)).toBe(false);
    expect(turnstileMatches({ ...result, success: false }, expected)).toBe(false);
  });
});

describe('InputSanitizer', () => {
  it('prefix-escapes a value starting with an equals sign', () => {
    expect(sanitizeForOutbound('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
  });
  it('prefix-escapes a value starting with a plus sign', () => {
    expect(sanitizeForOutbound('+44 7700')).toBe("'+44 7700");
  });
  it('prefix-escapes a value starting with a minus sign', () => {
    expect(sanitizeForOutbound('-1')).toBe("'-1");
  });
  it('prefix-escapes a value starting with an at sign', () => {
    expect(sanitizeForOutbound('@SUM(1)')).toBe("'@SUM(1)");
  });
  it('prefix-escapes a value whose leading whitespace hides a formula trigger', () => {
    expect(sanitizeForOutbound('\t=SUM(1,2)')).toBe("'=SUM(1,2)");
  });
  it('does not prefix-escape an ordinary string', () => {
    expect(sanitizeForOutbound('Jane Doe')).toBe('Jane Doe');
  });
  it('strips HTML tags from a string value', () => {
    expect(sanitizeForOutbound('<script>alert(1)</script>hello')).toBe('hello');
  });
  it('strips a bare script tag down to no markup', () => {
    const result = sanitizeForOutbound('<img src=x onerror=alert(1)>') as string;
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });
  it('strips null bytes from a string value', () => {
    expect(sanitizeForOutbound('hello\0world')).toBe('helloworld');
  });
  it('leaves an empty string unchanged', () => {
    expect(sanitizeForOutbound('')).toBe('');
  });
  it('preserves integers unchanged', () => {
    expect(sanitizeForOutbound(42)).toBe(42);
  });
  it('preserves floats unchanged', () => {
    expect(sanitizeForOutbound(3.14)).toBe(3.14);
  });
  it('preserves booleans unchanged', () => {
    expect(sanitizeForOutbound(true)).toBe(true);
    expect(sanitizeForOutbound(false)).toBe(false);
  });
  it('preserves null unchanged', () => {
    expect(sanitizeForOutbound(null)).toBeNull();
  });
  it('recursively sanitizes a flat array of strings', () => {
    expect(sanitizeForOutbound(['=1+1', 'safe', '@evil'])).toEqual(["'=1+1", 'safe', "'@evil"]);
  });
  it('recursively sanitizes a nested associative structure', () => {
    expect(
      sanitizeForOutbound({
        contact_name: '=cmd|/c calc',
        files: [{ originalName: '+HYPERLINK("http://evil")', mimeType: 'image/jpeg' }],
      }),
    ).toEqual({
      contact_name: "'=cmd|/c calc",
      files: [{ originalName: '\'+HYPERLINK("http://evil")', mimeType: 'image/jpeg' }],
    });
  });
  it('preserves array keys and nesting shape for already-safe values', () => {
    const value = { area_size: 42, brackets: ['small', 'medium'] };
    expect(sanitizeForOutbound(value)).toEqual(value);
  });
  it('sanitize_submission_payload sanitizes an answers map end-to-end', () => {
    expect(
      sanitizeSubmissionPayload({
        contact_name: 'Jane Doe',
        additional_notes: '=1+1',
        quantity: 3,
      }),
    ).toEqual({ contact_name: 'Jane Doe', additional_notes: "'=1+1", quantity: 3 });
  });
  it('new: keeps a lone "<" that is not a tag, and collapses whitespace', () => {
    expect(sanitizeForOutbound('x < y\n\n  and  z')).toBe('x < y and z');
  });
});
