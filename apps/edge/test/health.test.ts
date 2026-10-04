import { describe, expect, it } from 'vitest';

import type { Env } from '../src/env';
import worker, { handleRequest } from '../src/index';

function makeEnv(): Env {
  return {
    ASSETS: {
      fetch: async () => new Response('asset body', { status: 200 }),
    } as unknown as Fetcher,
    DB: {} as D1Database,
    SITE_ORIGIN: 'https://joshlennon.com',
    RATE_LIMIT_PER_HOUR: '5',
    RETENTION_DAYS: '90',
    TURNSTILE_EXPECTED_HOSTNAME: 'joshlennon.com',
  };
}

const ctx = { waitUntil: () => undefined };

const request = (path: string, method = 'GET') =>
  new Request(`https://joshlennon.com${path}`, { method });

describe('GET /api/health', () => {
  it('returns 200 with a JSON status body', async () => {
    const res = await handleRequest(request('/api/health'), makeEnv(), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('accepts HEAD', async () => {
    const res = await handleRequest(request('/api/health', 'HEAD'), makeEnv(), ctx);
    expect(res.status).toBe(200);
  });

  it('rejects other methods with 405 and an Allow header', async () => {
    const res = await handleRequest(request('/api/health', 'POST'), makeEnv(), ctx);
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, HEAD');
    expect(await res.json()).toEqual({ errorCode: 'method_not_allowed' });
  });
});

describe('routing', () => {
  it('answers unknown API paths with a JSON 404', async () => {
    const res = await handleRequest(request('/api/nope'), makeEnv(), ctx);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ errorCode: 'not_found' });
  });

  it('hands every non-API path to the asset handler', async () => {
    const res = await handleRequest(request('/work'), makeEnv(), ctx);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('asset body');
  });

  it('exposes the handler as the default export', async () => {
    const res = await worker.fetch(
      request('/api/health') as Parameters<typeof worker.fetch>[0],
      makeEnv(),
      ctx as unknown as ExecutionContext,
    );
    expect(res.status).toBe(200);
  });
});
