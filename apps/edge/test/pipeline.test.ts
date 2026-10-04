/**
 * The forwarder, the cron jobs and the D1 repository (spec Q.2, Q.3;
 * ADR-0043). The retry test is the Pass 6 acceptance case: a webhook that
 * fails and then succeeds. The D1 tests run the real migrations and SQL on
 * Node's built-in SQLite.
 */
import { describe, expect, it, vi } from 'vitest';

import { pruneExpired, retryPendingForwards } from '../src/scheduled';
import {
  MAX_FORWARD_ATTEMPTS,
  forward,
  nextAttemptAfter,
  webhookPayload,
  type ForwardInput,
  type ForwardResult,
} from '../src/submissions/forwarder';
import { REFERENCE_PATTERN, newReference } from '../src/submissions/reference';
import {
  D1RateLimitStore,
  D1SubmissionRepository,
  type NewSubmission,
} from '../src/submissions/repository';

import { memoryRepository, sqliteD1 } from './helpers';

const input: ForwardInput = {
  id: 12,
  reference: 'JL-ABCDEFGH',
  intent: 'hiring',
  schemaVersion: 1,
  answers: {
    contact_name: '=cmd|/c calc',
    message: '<img src=x onerror=alert(1)>Hello',
    priorities: ['more-enquiries'],
    data_processing_consent: ['agreed'],
  },
  clientTimestamp: '2026-10-04T12:00:00.000Z',
};

describe('the webhook payload (spec Q.3)', () => {
  it('keeps the plugin contract and adds reference and intent_label', () => {
    expect(webhookPayload(input)).toEqual({
      submission_id: 12,
      reference: 'JL-ABCDEFGH',
      wizard_id: 'hiring',
      intent_label: "I'm hiring",
      schema_version: 1,
      quote_mode: 'manual',
      answers: {
        contact_name: "'=cmd|/c calc",
        message: 'Hello',
        priorities: ['more-enquiries'],
        data_processing_consent: ['agreed'],
      },
      pricing: null,
      media: null,
      client_timestamp: '2026-10-04T12:00:00.000Z',
    });
  });

  it('sanitizes every formula-trigger character class', () => {
    const answers = webhookPayload({
      ...input,
      answers: { a: '=1', b: '+1', c: '-1', d: '@1' },
    }).answers;
    expect(answers).toEqual({ a: "'=1", b: "'+1", c: "'-1", d: "'@1" });
  });
});

describe('forward()', () => {
  it('posts JSON with the shared secret header', async () => {
    const fetchImpl = vi.fn(async () => new Response('Accepted', { status: 200 }));
    expect(
      await forward(input, { url: 'https://hook.example/abc', secret: 's3cret' }, fetchImpl),
    ).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://hook.example/abc');
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Webhook-Secret': 's3cret',
    });
    expect(JSON.parse(String(init.body)).reference).toBe('JL-ABCDEFGH');
  });

  it('reports a non-2xx status, a transport error, and a missing webhook', async () => {
    expect(
      await forward(
        input,
        { url: 'https://h.example' },
        vi.fn(async () => new Response('', { status: 503 })),
      ),
    ).toEqual({
      ok: false,
      error: 'http_status_503',
    });
    const throwing = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    expect(await forward(input, { url: 'https://h.example' }, throwing)).toEqual({
      ok: false,
      error: 'transport_error: TypeError',
    });
    expect(await forward(input, {})).toEqual({ ok: false, error: 'webhook_not_configured' });
  });

  it('backs off 15, 30, 60 and 120 minutes, then gives up after the fifth attempt', () => {
    const now = Date.parse('2026-10-04T12:00:00.000Z');
    expect([1, 2, 3, 4].map((n) => nextAttemptAfter(n, now))).toEqual([
      '2026-10-04T12:15:00.000Z',
      '2026-10-04T12:30:00.000Z',
      '2026-10-04T13:00:00.000Z',
      '2026-10-04T14:00:00.000Z',
    ]);
    expect(nextAttemptAfter(MAX_FORWARD_ATTEMPTS, now)).toBeNull();
  });
});

describe('references', () => {
  it('are JL- and eight unambiguous characters, never sequential', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const reference = newReference();
      expect(reference).toMatch(REFERENCE_PATTERN);
      seen.add(reference);
    }
    expect(seen.size).toBe(200);
  });
});

function pendingRow(overrides: Partial<NewSubmission> = {}): NewSubmission {
  return {
    reference: newReference(),
    intent: 'hiring',
    schemaVersion: 1,
    answersJson: JSON.stringify(input.answers),
    contactEmailNorm: 'jane@example.com',
    isDuplicate: false,
    duplicateOf: null,
    consentTimestamp: '2026-10-04T12:00:00.000Z',
    status: 'pending',
    nextAttemptAt: '2026-10-04T12:15:00.000Z',
    clientTimestamp: '2026-10-04T12:00:00.000Z',
    createdAt: '2026-10-04T12:00:00.000Z',
    ...overrides,
  };
}

describe('the retry cron', () => {
  it('forwards a row whose webhook failed, then succeeded (spec Pass 6 acceptance)', async () => {
    const { repository, rows } = memoryRepository();
    await repository.insert(pendingRow());
    let clock = Date.parse('2026-10-04T12:16:00.000Z');
    const webhook = vi
      .fn<(input: ForwardInput) => Promise<ForwardResult>>()
      .mockResolvedValueOnce({ ok: false, error: 'http_status_500' })
      .mockResolvedValueOnce({ ok: true });

    expect(await retryPendingForwards({ repository, forward: webhook, now: () => clock })).toEqual({
      forwarded: 0,
      failed: 1,
    });
    expect(rows[0]).toMatchObject({
      status: 'pending',
      forwardAttempts: 1,
      nextAttemptAt: '2026-10-04T12:31:00.000Z',
    });

    // Not due yet: nothing happens.
    clock = Date.parse('2026-10-04T12:20:00.000Z');
    expect(await retryPendingForwards({ repository, forward: webhook, now: () => clock })).toEqual({
      forwarded: 0,
      failed: 0,
    });

    clock = Date.parse('2026-10-04T12:31:00.000Z');
    expect(await retryPendingForwards({ repository, forward: webhook, now: () => clock })).toEqual({
      forwarded: 1,
      failed: 0,
    });
    expect(rows[0]).toMatchObject({ status: 'forwarded', nextAttemptAt: null });
    expect(webhook).toHaveBeenCalledTimes(2);
    expect(webhook.mock.calls[0]?.[0]).toMatchObject({
      reference: rows[0]!.reference,
      intent: 'hiring',
    });
  });

  it('gives up after five attempts and marks the row forward_failed', async () => {
    const { repository, rows } = memoryRepository();
    await repository.insert(pendingRow());
    rows[0]!.forwardAttempts = MAX_FORWARD_ATTEMPTS - 1;
    await retryPendingForwards({
      repository,
      forward: async () => ({ ok: false, error: 'http_status_500' }),
      now: () => Date.parse('2026-10-05T00:00:00.000Z'),
    });
    expect(rows[0]).toMatchObject({
      status: 'forward_failed',
      nextAttemptAt: null,
      forwardAttempts: 5,
    });
  });

  it('leases each row before forwarding so overlapping runs never send it twice', async () => {
    const { repository, calls } = memoryRepository();
    await repository.insert(pendingRow());
    await retryPendingForwards({
      repository,
      forward: async () => ({ ok: true }),
      now: () => Date.parse('2026-10-04T13:00:00.000Z'),
    });
    expect(calls.indexOf('lease')).toBeLessThan(calls.indexOf('markForwarded'));
  });

  it('never retries duplicates or forwarded rows', async () => {
    const { repository } = memoryRepository();
    await repository.insert(pendingRow({ status: 'duplicate_not_forwarded', nextAttemptAt: null }));
    await repository.insert(pendingRow({ status: 'forwarded', nextAttemptAt: null }));
    const webhook = vi.fn(async () => ({ ok: true as const }));
    await retryPendingForwards({
      repository,
      forward: webhook,
      now: () => Date.parse('2026-10-06T00:00:00.000Z'),
    });
    expect(webhook).not.toHaveBeenCalled();
  });
});

describe('pruning (PruneSubmissions)', () => {
  const now = Date.parse('2026-10-04T12:00:00.000Z');

  it('deletes rows older than the configured retention period', async () => {
    const { repository, rows } = memoryRepository();
    await repository.insert(pendingRow({ createdAt: '2026-06-01T00:00:00.000Z' }));
    await repository.insert(pendingRow({ createdAt: '2026-10-01T00:00:00.000Z' }));
    const result = await pruneExpired({
      repository,
      deleteExpiredRateLimits: async () => 0,
      retentionDays: 90,
      now: () => now,
    });
    expect(result.submissions).toBe(1);
    expect(rows.map((row) => row.createdAt)).toEqual(['2026-10-01T00:00:00.000Z']);
  });

  it('computes a cutoff Settings::retention_days() (default 90) before now, in UTC', async () => {
    const deleteOlderThan = vi.fn(async () => 0);
    await pruneExpired({
      repository: { deleteOlderThan },
      deleteExpiredRateLimits: async () => 0,
      retentionDays: 90,
      now: () => now,
    });
    expect(deleteOlderThan).toHaveBeenCalledWith('2026-07-06T12:00:00.000Z');
  });

  it('uses a shorter cutoff when retention is configured to a smaller value', async () => {
    const deleteOlderThan = vi.fn(async () => 0);
    await pruneExpired({
      repository: { deleteOlderThan },
      deleteExpiredRateLimits: async () => 0,
      retentionDays: 30,
      now: () => now,
    });
    expect(deleteOlderThan).toHaveBeenCalledWith('2026-09-04T12:00:00.000Z');
  });

  it('new: also removes rate-limit windows that have ended', async () => {
    const deleteExpiredRateLimits = vi.fn(async () => 3);
    const result = await pruneExpired({
      repository: { deleteOlderThan: async () => 0 },
      deleteExpiredRateLimits,
      retentionDays: 90,
      now: () => now,
    });
    expect(deleteExpiredRateLimits).toHaveBeenCalledWith(now / 1000);
    expect(result.rateLimits).toBe(3);
  });
});

describe('D1 repository on the real schema', () => {
  it('inserts, finds recent non-duplicates by email, and refuses a repeated reference', async () => {
    const repository = new D1SubmissionRepository(sqliteD1());
    const first = await repository.insert(pendingRow({ reference: 'JL-AAAAAAAA' }));
    await repository.insert(
      pendingRow({ reference: 'JL-BBBBBBBB', isDuplicate: true, duplicateOf: first }),
    );
    expect(first).toBe(1);
    expect(
      await repository.findRecentByContact('jane@example.com', '', '2026-10-03T12:00:00.000Z'),
    ).toBe(1);
    expect(
      await repository.findRecentByContact('jane@example.com', '', '2026-10-05T00:00:00.000Z'),
    ).toBeNull();
    expect(await repository.findRecentByContact('', '', '2026-10-01T00:00:00.000Z')).toBeNull();
    await expect(repository.insert(pendingRow({ reference: 'JL-AAAAAAAA' }))).rejects.toThrow();
  });

  it('lists due rows, records failures and successes, leases, and prunes', async () => {
    const repository = new D1SubmissionRepository(sqliteD1());
    const id = await repository.insert(pendingRow());
    expect(await repository.listDue('2026-10-04T12:00:00.000Z', 10)).toEqual([]);
    const [due] = await repository.listDue('2026-10-04T12:15:00.000Z', 10);
    expect(due).toMatchObject({
      id,
      intent: 'hiring',
      forwardAttempts: 0,
      clientTimestamp: '2026-10-04T12:00:00.000Z',
    });

    await repository.recordForwardFailure(
      id,
      'http_status_500',
      '2026-10-04T12:30:00.000Z',
      'pending',
    );
    expect((await repository.listDue('2026-10-04T12:30:00.000Z', 10))[0]?.forwardAttempts).toBe(1);
    await repository.lease(id, '2026-10-04T13:00:00.000Z');
    expect(await repository.listDue('2026-10-04T12:45:00.000Z', 10)).toEqual([]);
    await repository.markForwarded(id);
    expect(await repository.listDue('2026-10-05T00:00:00.000Z', 10)).toEqual([]);

    expect(await repository.deleteOlderThan('2026-10-05T00:00:00.000Z')).toBe(1);
  });

  it('stores rate-limit windows and removes ended ones', async () => {
    const db = sqliteD1();
    const store = new D1RateLimitStore(db);
    await store.put('k', { count: 1, expiresAt: 2000 });
    await store.put('k', { count: 2, expiresAt: 2000 });
    expect(await store.get('k')).toEqual({ count: 2, expiresAt: 2000 });
    expect(await store.get('missing')).toBeNull();
    expect(await store.deleteExpired(2000)).toBe(1);
    expect(await store.get('k')).toBeNull();
  });
});
