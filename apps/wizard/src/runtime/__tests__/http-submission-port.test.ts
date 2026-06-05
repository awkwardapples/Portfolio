import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpSubmissionPort } from '@/runtime/http-submission-port';
import type { SubmissionRequest } from '@/runtime/submission';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const BASE_OPTIONS = {
  restUrl: 'https://example.test/wp-json/qw/v1',
  restNonce: 'test-nonce-123',
};

const VALID_REQUEST: SubmissionRequest = {
  wizardId: 'fencing',
  schemaVersion: 1,
  answers: { fence_type: 'wooden', length_m: 10 },
  pricing: { totalPence: 50000, lowPence: 45000, highPence: 55000, currency: 'GBP' },
  clientTimestamp: '2026-05-29T12:00:00.000Z',
};

function fakeResponse(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
}

function portWithMock(mockFn: ReturnType<typeof vi.fn>) {
  return httpSubmissionPort({
    ...BASE_OPTIONS,
    fetchImpl: mockFn as unknown as typeof fetch,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('httpSubmissionPort — success path', () => {
  it('200 with reference → ok:true with reference string', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(fakeResponse(200, JSON.stringify({ reference: 'GOQW-42' })));
    const result = await portWithMock(mock).submit(VALID_REQUEST);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reference).toBe('GOQW-42');
  });

  it('200 with missing reference → bad_response', async () => {
    const mock = vi.fn().mockResolvedValue(fakeResponse(200, JSON.stringify({})));
    const result = await portWithMock(mock).submit(VALID_REQUEST);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('bad_response');
  });
});

describe('httpSubmissionPort — server error paths', () => {
  it('502 → forwarder_unavailable with operational message', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(
        fakeResponse(502, JSON.stringify({ errorCode: 'forwarder_unavailable', submissionId: 7 })),
      );
    const result = await portWithMock(mock).submit(VALID_REQUEST);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('forwarder_unavailable');
      expect(result.error.message).toContain('saved');
    }
  });

  it('400 → validation_failed, not retryable', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(fakeResponse(400, JSON.stringify({ errorCode: 'validation_failed' })));
    const result = await portWithMock(mock).submit(VALID_REQUEST);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation_failed');
      expect(result.error.retryable).toBe(false);
    }
  });

  it('401 → unauthorized, not retryable', async () => {
    const mock = vi.fn().mockResolvedValue(fakeResponse(401, ''));
    const result = await portWithMock(mock).submit(VALID_REQUEST);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('unauthorized');
      expect(result.error.retryable).toBe(false);
    }
  });

  it('500 → server_error', async () => {
    const mock = vi.fn().mockResolvedValue(fakeResponse(500, ''));
    const result = await portWithMock(mock).submit(VALID_REQUEST);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('server_error');
  });
});

describe('httpSubmissionPort — network failure paths', () => {
  it('network rejection → network_unreachable', async () => {
    const err = Object.assign(new Error('Failed to fetch'), { name: 'TypeError' });
    const mock = vi.fn().mockRejectedValue(err);
    const result = await portWithMock(mock).submit(VALID_REQUEST);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('network_unreachable');
  });

  it('AbortError → request_timeout', async () => {
    const err = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
    const mock = vi.fn().mockRejectedValue(err);
    const result = await portWithMock(mock).submit(VALID_REQUEST);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('request_timeout');
  });
});

describe('httpSubmissionPort — mediaIssues extraction', () => {
  it('400 with mediaIssues array parses fileIndex and code', async () => {
    const body = JSON.stringify({
      errorCode: 'media_validation_failed',
      mediaIssues: [{ fileIndex: 2, code: 'too_large' }],
    });
    const mock = vi.fn().mockResolvedValue(fakeResponse(400, body));
    const result = await portWithMock(mock).submit(VALID_REQUEST);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation_failed');
      expect(result.error.mediaIssues).toHaveLength(1);
      expect(result.error.mediaIssues?.[0]).toEqual({ fileIndex: 2, code: 'too_large' });
    }
  });

  it('400 without mediaIssues returns undefined mediaIssues', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(fakeResponse(400, JSON.stringify({ errorCode: 'validation_failed' })));
    const result = await portWithMock(mock).submit(VALID_REQUEST);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.mediaIssues).toBeUndefined();
    }
  });
});

describe('httpSubmissionPort — wire contract', () => {
  let spy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    spy = vi.fn().mockResolvedValue(fakeResponse(200, JSON.stringify({ reference: 'GOQW-1' })));
  });

  it('sends X-WP-Nonce and Content-Type headers', async () => {
    await portWithMock(spy).submit(VALID_REQUEST);
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-WP-Nonce']).toBe('test-nonce-123');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('payload includes contractVersion:2, wizardId, answers, pricing, clientTimestamp', async () => {
    await portWithMock(spy).submit(VALID_REQUEST);
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['contractVersion']).toBe(2);
    expect(body['wizardId']).toBe('fencing');
    expect(body['answers']).toEqual(VALID_REQUEST.answers);
    expect(body['pricing']).toEqual(VALID_REQUEST.pricing);
    expect(body['clientTimestamp']).toBe(VALID_REQUEST.clientTimestamp);
  });

  it('fetch is called exactly once per submit (no internal retry)', async () => {
    const errMock = vi.fn().mockRejectedValue(new Error('network fail'));
    await portWithMock(errMock).submit(VALID_REQUEST);
    expect(errMock).toHaveBeenCalledTimes(1);
  });
});

describe('httpSubmissionPort — URL construction (F5 regression)', () => {
  it('POSTs to {restUrl}/submit, not directly to restUrl', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(fakeResponse(200, JSON.stringify({ reference: 'GOQW-1' })));
    const port = httpSubmissionPort({
      restUrl: 'http://example.com/wp-json/qw/v1',
      restNonce: 'nonce123',
      fetchImpl: fetchSpy as unknown as typeof fetch,
    });
    await port.submit(VALID_REQUEST);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [calledUrl] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('http://example.com/wp-json/qw/v1/submit');
  });

  it('handles restUrl with trailing slash (no double-slash in result)', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(fakeResponse(200, JSON.stringify({ reference: 'GOQW-1' })));
    const port = httpSubmissionPort({
      restUrl: 'http://example.com/wp-json/qw/v1/',
      restNonce: 'nonce123',
      fetchImpl: fetchSpy as unknown as typeof fetch,
    });
    await port.submit(VALID_REQUEST);
    const [calledUrl] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('http://example.com/wp-json/qw/v1/submit');
    expect(calledUrl).not.toContain('//submit');
  });
});
