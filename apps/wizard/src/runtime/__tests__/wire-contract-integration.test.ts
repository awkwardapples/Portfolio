import { describe, it, expect, vi } from 'vitest';
import { CONTRACT_VERSION } from '@/domain/config/public-config';
import { httpSubmissionPort } from '@/runtime/http-submission-port';

/**
 * Wire contract integration test.
 *
 * Asserts the payload emitted by httpSubmissionPort matches what PHP
 * SubmissionController accepts. This is the cross-layer test that unit tests
 * within each layer cannot provide.
 *
 * Per ADR-0018, this file is a mandatory gate for wire contract changes. If
 * CONTRACT_VERSION drifts between TS and PHP, the canary test below fails
 * immediately — that is intentional, not accidental brittleness.
 */

function makePort(spy: ReturnType<typeof vi.fn>) {
  return httpSubmissionPort({
    restUrl: 'http://test.local/wp-json/qw/v1',
    restNonce: 'test-nonce',
    fetchImpl: spy as unknown as typeof fetch,
  });
}

function fakeOk(): Response {
  return new Response(JSON.stringify({ reference: 'GOQW-1' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('wire contract: TS submission payload → PHP SubmissionController shape', () => {
  it('canary: CONTRACT_VERSION matches the value PHP PublicConfig::CONTRACT_VERSION emits', () => {
    // This test hardcodes 3. If anyone bumps CONTRACT_VERSION in TS without
    // coordinating the PHP side, this fails immediately. That is the point.
    expect(CONTRACT_VERSION).toBe(3);
  });

  it('instant-quote submission contains all fields PHP controller requires', async () => {
    const spy = vi.fn().mockResolvedValue(fakeOk());
    await makePort(spy).submit({
      wizardId: 'fencing',
      schemaVersion: 1,
      quoteMode: 'instant',
      answers: {
        fence_type: 'closeboard',
        length_m: 10,
        contact_name: 'Test User',
        contact_email: 'test@example.com',
      },
      pricing: { totalPence: 35000, lowPence: 29750, highPence: 40250, currency: 'GBP' },
      clientTimestamp: '2026-06-08T00:00:00.000Z',
    });

    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string) as Record<
      string,
      unknown
    >;

    // Every field SubmissionController.validate() requires:
    expect(body).toMatchObject({
      contractVersion: CONTRACT_VERSION,
      quoteMode: 'instant',
      wizardId: 'fencing',
      answers: expect.any(Object) as unknown,
      pricing: expect.objectContaining({
        totalPence: expect.any(Number) as unknown,
        lowPence: expect.any(Number) as unknown,
        highPence: expect.any(Number) as unknown,
        currency: 'GBP',
      }) as unknown,
      clientTimestamp: expect.any(String) as unknown,
    });
  });

  it('manual-quote submission contains required fields; pricing is null', async () => {
    const spy = vi.fn().mockResolvedValue(fakeOk());
    await makePort(spy).submit({
      wizardId: 'painting',
      schemaVersion: 1,
      quoteMode: 'manual',
      answers: { description: 'repaint kitchen', contact_name: 'Test' },
      clientTimestamp: '2026-06-08T00:00:00.000Z',
    });

    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string) as Record<
      string,
      unknown
    >;

    expect(body['contractVersion']).toBe(CONTRACT_VERSION);
    expect(body['quoteMode']).toBe('manual');
    expect(body['wizardId']).toBe('painting');
    expect(body['answers']).toBeDefined();
    // PHP controller ignores pricing when quoteMode is manual; we still emit
    // null to keep the shape explicit rather than omitting the key.
    expect(body['pricing']).toBeNull();
  });
});
