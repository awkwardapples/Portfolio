import { describe, expect, it, vi } from 'vitest';

import { EVENT_GAP_MS, NOT_IN_DEMO, NOT_SAVED, PREFIXES, createShim, dossierFile } from './shim';

/** The demo's API stand-in (Pass 11, E.3). */

const ORIGIN = 'https://joshlennon.com';
const DATA = '/demo/arbiter/data/';
const INDEX = {
  sha: '745098876d169e7ae146fc7af9a94d4f0aa85b84',
  captured_at: '2026-11-11T03:28:10Z',
  runs: { 'VND-0007': { run_id: 'run-6d3315765358', case_id: 'CASE-0007', outcome: 'ESCALATE' } },
};
const CAPTURE = {
  events: [
    { seq: 0, kind: 'run_started' },
    { seq: 1, kind: 'agent' },
    { seq: 2, kind: 'ruling' },
  ],
  done: { run_id: 'run-6d3315765358', case_id: 'CASE-0007', outcome: 'ESCALATE' },
};

/** A snapshot in memory: file path under the data folder -> body. */
function setup(files: Record<string, unknown> = {}) {
  const all: Record<string, unknown> = {
    'index.json': INDEX,
    'vendors.json': [{ vendor_id: 'VND-0007' }],
    'runs/VND-0007.json': CAPTURE,
    'cases/CASE-0007/replay.json': { matches: true },
    'cases/CASE-0007/dossier.md': '# Dossier',
    'cases/CASE-0007/dossier.htm': '<h1>Dossier</h1>',
    'audit/recent.json': [],
    ...files,
  };
  const requested: string[] = [];
  const realFetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    requested.push(url);
    const file = url.startsWith(DATA) ? url.slice(DATA.length) : undefined;
    if (file === undefined) return new Response('elsewhere', { status: 200 });
    if (!(file in all)) return new Response('Not found', { status: 404 });
    const body = all[file];
    const type =
      typeof body === 'string' && body.startsWith('<!doctype') ? 'text/html' : 'text/plain';
    return typeof body === 'string'
      ? new Response(body, { status: 200, headers: { 'content-type': type } })
      : new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
  }) as unknown as typeof fetch;
  // Timers run only when the test says so.
  const timers = new Map<number, { at: number; callback: () => void }>();
  let next = 1;
  const shim = createShim({
    data: DATA,
    origin: ORIGIN,
    realFetch,
    setTimer: (callback, ms) => {
      timers.set(next, { at: ms, callback });
      return next++;
    },
    clearTimer: (id) => void timers.delete(id),
    now: () => new Date('2026-11-11T12:00:00Z'),
  });
  const runTimers = () => {
    for (const [id, timer] of [...timers.entries()].sort((a, b) => a[1].at - b[1].at)) {
      if (!timers.has(id)) continue;
      timers.delete(id);
      timer.callback();
    }
  };
  return { shim, requested, realFetch, timers, runTimers };
}

const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

describe('which requests the demo answers', () => {
  it('answers every console API prefix on this origin, and nothing else', () => {
    const { shim } = setup();
    for (const prefix of PREFIXES) {
      expect(shim.apiPath(`${prefix}`), prefix).toBe(prefix);
      expect(shim.apiPath(`${ORIGIN}${prefix}/x?y=1`), prefix).toBe(`${prefix}/x?y=1`);
    }
    expect(shim.apiPath('/demo/arbiter/assets/index.js')).toBeNull();
    expect(shim.apiPath('/vendorsx')).toBeNull();
    expect(shim.apiPath('https://example.com/vendors')).toBeNull();
  });

  it('passes everything else to the browser', async () => {
    const { shim, requested } = setup();
    await shim.fetch('/demo/arbiter/arbiter_logo.png');
    expect(requested).toEqual(['/demo/arbiter/arbiter_logo.png']);
  });
});

describe('reads', () => {
  it('map to the snapshot, with the query left out', async () => {
    const { shim, requested } = setup();
    expect(await (await shim.fetch('/vendors')).json()).toEqual([{ vendor_id: 'VND-0007' }]);
    await shim.fetch('/audit/recent?limit=50');
    expect(requested).toEqual([`${DATA}vendors.json`, `${DATA}audit/recent.json`]);
  });

  it("answer 404 in the API's own error shape when the snapshot has no file", async () => {
    const { shim } = setup();
    const response = await shim.fetch('/cases/CASE-9999');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { type: 'not_found', message: 'Not in this demo.' },
    });
  });

  it("treat a static host's HTML fallback page as missing", async () => {
    const { shim } = setup({ 'questions.json': '<!doctype html><title>Not found</title>' });
    expect((await shim.fetch('/questions')).status).toBe(404);
  });

  it('map dossiers to dossier.md and dossier.htm', async () => {
    const { shim } = setup();
    expect(await (await shim.fetch('/cases/CASE-0007/dossier?format=md')).text()).toBe('# Dossier');
    expect(await (await shim.fetch('/cases/CASE-0007/dossier?format=html')).text()).toBe(
      '<h1>Dossier</h1>',
    );
    expect(dossierFile('CASE-0007', 'html')).toBe('cases/CASE-0007/dossier.htm');
    expect(dossierFile('CASE-0007', 'md')).toBe('cases/CASE-0007/dossier.md');
  });
});

describe('runs', () => {
  it("start with the captured run's own id, so the case recognises its run", async () => {
    const { shim } = setup();
    const response = await shim.fetch('/runs', post({ vendor_id: 'VND-0007' }));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({
      run_id: 'run-6d3315765358',
      events_url: '/runs/run-6d3315765358/events',
      status_url: '/runs/run-6d3315765358',
    });
    expect(await (await shim.fetch('/runs')).json()).toEqual([
      { run_id: 'run-6d3315765358', state: 'done', started_at: '2026-11-11T12:00:00.000Z' },
    ]);
    expect((await shim.fetch('/runs/run-6d3315765358')).status).toBe(200);
    expect((await shim.fetch('/runs/run-unknown')).status).toBe(404);
  });

  it('refuse a vendor or questionnaire that was not captured, saying why', async () => {
    const { shim } = setup();
    for (const body of [{ vendor_id: 'VND-9999' }, { submission: { legal_name: 'New Ltd' } }]) {
      const response = await shim.fetch('/runs', post(body));
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        error: { type: 'not_in_demo', message: NOT_IN_DEMO },
      });
    }
  });
});

describe('writes', () => {
  it('replay a case from the captured replay', async () => {
    const { shim } = setup();
    const response = await shim.fetch('/cases/CASE-0007/replay', { method: 'POST' });
    expect(await response.json()).toEqual({ matches: true });
  });

  it('never save a review decision or a contract approval', async () => {
    const { shim } = setup();
    for (const path of ['/cases/CASE-0007/review', '/contracts/CTR-1/approve']) {
      const response = await shim.fetch(path, post({ decision: 'approve' }));
      expect(response.status, path).toBe(409);
      expect(await response.json()).toEqual({ error: { type: 'not_in_demo', message: NOT_SAVED } });
    }
  });
});

describe('the event stream', () => {
  async function opened(shim: ReturnType<typeof setup>['shim'], runId = 'run-6d3315765358') {
    const source = new shim.EventSource(`/runs/${runId}/events`);
    const log: string[] = [];
    source.onopen = () => log.push('onopen');
    source.addEventListener('open', () => log.push('open'));
    source.addEventListener('trace', (event) => {
      const message = event as MessageEvent<string>;
      log.push(`trace ${message.lastEventId} ${JSON.parse(message.data).kind}`);
    });
    source.addEventListener('done', (event) =>
      log.push(`done ${JSON.parse((event as MessageEvent<string>).data).outcome}`),
    );
    source.addEventListener('error', (event) =>
      log.push(`error ${(event as MessageEvent<string>).data}`),
    );
    await vi.waitFor(() => expect(source.readyState).not.toBe(0));
    return { source, log };
  }

  it('replays the captured events in order, 20 ms apart, then done, and closes', async () => {
    const { shim, timers, runTimers } = setup();
    const { source, log } = await opened(shim);
    expect([...timers.values()].map((timer) => timer.at)).toEqual([
      0,
      EVENT_GAP_MS,
      2 * EVENT_GAP_MS,
      4 * EVENT_GAP_MS,
    ]);
    runTimers();
    expect(log).toEqual([
      'onopen',
      'open',
      'trace 0 run_started',
      'trace 1 agent',
      'trace 2 ruling',
      'done ESCALATE',
    ]);
    expect(source.readyState).toBe(2);
  });

  it('stops when closed', async () => {
    const { shim, timers } = setup();
    const { source, log } = await opened(shim);
    source.close();
    expect(timers.size).toBe(0);
    expect(log).toEqual(['onopen', 'open']);
  });

  it('reports an unknown run as an error', async () => {
    const { shim } = setup();
    const { source, log } = await opened(shim, 'run-unknown');
    expect(log).toEqual([`error ${JSON.stringify({ message: 'This run is not in the demo.' })}`]);
    expect(source.readyState).toBe(2);
  });
});

describe('dossier links', () => {
  it('point at the snapshot when clicked', () => {
    const { shim } = setup();
    const anchor = document.createElement('a');
    anchor.href = '/cases/CASE-0007/dossier?format=html';
    document.body.append(anchor);
    shim.onClick({ target: anchor } as unknown as Event);
    expect(new URL(anchor.href).pathname).toBe('/demo/arbiter/data/cases/CASE-0007/dossier.htm');
    anchor.remove();
  });
});
