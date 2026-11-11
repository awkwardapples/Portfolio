/**
 * The demo's stand-in for Arbiter's API (Pass 11, E.3; ADR-0050). It
 * answers the console's requests from the snapshot captured from Arbiter's
 * own engine in sample mode (public/data, scripts/arbiter/capture.py), so
 * nothing leaves the page:
 *
 * - GET paths map to the snapshot; a missing file answers 404 in the API's
 *   own error shape.
 * - POST /runs for a captured vendor answers 202 with the captured run's own
 *   id (the case record names its run, and the ruling card links to the case
 *   only when they match); anything else answers 409 with a plain reason.
 * - GET /runs and /runs/{id} answer from the runs started in this page.
 * - POST /cases/{id}/replay answers with the captured replay.
 * - Review decisions and contract approvals answer 409: nothing is saved.
 * - An EventSource on /runs/{id}/events replays the captured events
 *   unchanged, 20 ms apart (the console's own pacer sets the viewing pace),
 *   then `done`.
 *
 * Pure apart from the timers it is given, so it is unit-tested
 * (shim.test.ts); api-shim.ts installs it on the window.
 */

/** The console's API prefixes (upstream vite.config.ts). */
export const PREFIXES = [
  '/runs',
  '/cases',
  '/contracts',
  '/health',
  '/vendors',
  '/questions',
  '/memory',
  '/audit',
  '/eval',
  '/registry',
  '/usl',
  '/evidence',
  '/recordings',
  '/agents',
];

export const NOT_IN_DEMO =
  "This demo replays recorded runs of Arbiter's engine, so it can't assess a new questionnaire. Pick an existing vendor, or run Arbiter locally in sample mode.";
export const NOT_SAVED =
  "In this demo, decisions are not saved. In Arbiter, this records the TPRM lead's decision.";
export const EVENT_GAP_MS = 20;

export interface CapturedRun {
  run_id: string;
  case_id: string;
  outcome: string;
}

export interface SnapshotIndex {
  runs: Record<string, CapturedRun>;
  sha: string;
  captured_at: string;
}

interface ShimOptions {
  /** Where the snapshot is served, ending in a slash, e.g. /demo/arbiter/data/. */
  data: string;
  /** The page's origin: only same-origin API paths are answered. */
  origin: string;
  /** The browser's own fetch, for the snapshot's files and everything else. */
  realFetch: typeof fetch;
  setTimer?: (callback: () => void, ms: number) => number;
  clearTimer?: (id: number) => void;
  now?: () => Date;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const refused = (message: string) => json({ error: { type: 'not_in_demo', message } }, 409);
const notFound = () => json({ error: { type: 'not_found', message: 'Not in this demo.' } }, 404);

/** The snapshot file for a dossier: dossier.md, or dossier.htm (the Worker redirects .html). */
export function dossierFile(caseId: string, format: string | null): string {
  return `cases/${caseId}/dossier.${format === 'html' ? 'htm' : 'md'}`;
}

export function createShim(options: ShimOptions) {
  const { data, origin, realFetch } = options;
  const setTimer = options.setTimer ?? ((callback, ms) => window.setTimeout(callback, ms));
  const clearTimer = options.clearTimer ?? ((id) => window.clearTimeout(id));
  const now = options.now ?? (() => new Date());
  const started = new Map<string, { runId: string; vendorId: string; startedAt: string }>();
  let index: Promise<SnapshotIndex> | undefined;
  const loadIndex = () =>
    (index ??= realFetch(`${data}index.json`).then(
      (response) => response.json() as Promise<SnapshotIndex>,
    ));

  /** The API path a request names (pathname and query), or null if it is not the API's. */
  function apiPath(input: RequestInfo | URL): string | null {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(href, `${origin}/`);
    if (url.origin !== origin) return null;
    const isApi = PREFIXES.some(
      (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
    );
    return isApi ? url.pathname + url.search : null;
  }

  /** The vendor whose captured run has this id, if any. */
  async function vendorOfRun(runId: string): Promise<string | undefined> {
    const known = started.get(runId);
    if (known) return known.vendorId;
    const { runs } = await loadIndex();
    return Object.entries(runs).find(([, run]) => run.run_id === runId)?.[0];
  }

  async function snapshotFile(file: string): Promise<Response> {
    const response = await realFetch(`${data}${file}`);
    // A static host's fallback page is not a snapshot file.
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok || (file.endsWith('.json') && type.includes('text/html'))) return notFound();
    return response;
  }

  async function get(path: string): Promise<Response> {
    const [pathname = '', query = ''] = path.split('?');
    const dossier = pathname.match(/^\/cases\/([^/]+)\/dossier$/);
    if (dossier)
      return snapshotFile(
        dossierFile(decodeURIComponent(dossier[1] ?? ''), new URLSearchParams(query).get('format')),
      );
    if (pathname === '/runs') {
      return json(
        [...started.values()].map((run) => ({
          run_id: run.runId,
          state: 'done',
          started_at: run.startedAt,
        })),
      );
    }
    const status = pathname.match(/^\/runs\/([^/]+)$/);
    if (status) {
      const runId = decodeURIComponent(status[1] ?? '');
      if (!(await vendorOfRun(runId))) return notFound();
      return json({
        run_id: runId,
        state: 'done',
        n_events: 0,
        started_at: started.get(runId)?.startedAt ?? '',
      });
    }
    return snapshotFile(`${pathname.replace(/^\//, '')}.json`);
  }

  async function startRun(body: unknown): Promise<Response> {
    const vendorId = (body as { vendor_id?: unknown } | null)?.vendor_id;
    const { runs } = await loadIndex();
    const run = typeof vendorId === 'string' ? runs[vendorId] : undefined;
    if (!run || typeof vendorId !== 'string') return refused(NOT_IN_DEMO);
    started.set(run.run_id, { runId: run.run_id, vendorId, startedAt: now().toISOString() });
    return json(
      {
        run_id: run.run_id,
        events_url: `/runs/${run.run_id}/events`,
        status_url: `/runs/${run.run_id}`,
      },
      202,
    );
  }

  async function shimFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const path = apiPath(input);
    if (!path) return realFetch(input, init);
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();
    if (method === 'GET') return get(path);
    const pathname = path.split('?')[0] ?? '';
    if (method === 'POST' && pathname === '/runs') {
      let body: unknown = null;
      try {
        body = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
      } catch {
        body = null;
      }
      return startRun(body);
    }
    const replay = pathname.match(/^\/cases\/([^/]+)\/replay$/);
    if (method === 'POST' && replay) {
      return snapshotFile(`cases/${decodeURIComponent(replay[1] ?? '')}/replay.json`);
    }
    return refused(NOT_SAVED);
  }

  /** EventSource for /runs/{id}/events, replaying the captured run. */
  class DemoEventSource extends EventTarget {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSED = 2;
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSED = 2;
    readonly withCredentials = false;
    readyState = 0;
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    private timers: number[] = [];

    constructor(readonly url: string) {
      super();
      const runId = decodeURIComponent(url.match(/\/runs\/([^/?]+)\/events/)?.[1] ?? '');
      void this.play(runId);
    }

    private fail(message: string): void {
      this.readyState = 2;
      const event = new MessageEvent('error', { data: JSON.stringify({ message }) });
      this.onerror?.(event);
      this.dispatchEvent(event);
    }

    private async play(runId: string): Promise<void> {
      const vendorId = await vendorOfRun(runId);
      if (this.readyState === 2) return;
      if (!vendorId) {
        this.fail('This run is not in the demo.');
        return;
      }
      const capture = (await realFetch(`${data}runs/${vendorId}.json`).then((response) =>
        response.json(),
      )) as {
        events: unknown[];
        done: unknown;
      };
      if (this.readyState === 2) return;
      this.readyState = 1;
      const open = new Event('open');
      this.onopen?.(open);
      this.dispatchEvent(open);
      capture.events.forEach((event, i) => {
        this.timers.push(
          setTimer(() => {
            this.dispatchEvent(
              new MessageEvent('trace', { data: JSON.stringify(event), lastEventId: String(i) }),
            );
          }, EVENT_GAP_MS * i),
        );
      });
      this.timers.push(
        setTimer(
          () => {
            this.dispatchEvent(new MessageEvent('done', { data: JSON.stringify(capture.done) }));
            this.close();
          },
          EVENT_GAP_MS * (capture.events.length + 1),
        ),
      );
    }

    close(): void {
      this.readyState = 2;
      for (const timer of this.timers) clearTimer(timer);
      this.timers = [];
    }
  }

  /** Points the dossier download links, plain anchors, at the snapshot's files. */
  function onClick(event: Event): void {
    const target = event.target as Element | null;
    const anchor = target?.closest?.('a[href*="/dossier?format="]') as HTMLAnchorElement | null;
    if (!anchor) return;
    const url = new URL(anchor.href, `${origin}/`);
    const match = url.pathname.match(/\/cases\/([^/]+)\/dossier$/);
    if (match)
      anchor.href = `${data}${dossierFile(decodeURIComponent(match[1] ?? ''), url.searchParams.get('format'))}`;
  }

  return { fetch: shimFetch, EventSource: DemoEventSource, onClick, apiPath };
}
