import type { MediaIssue, SubmissionErrorInfo } from '@/domain/runtime/state';
import type { SubmissionPort, SubmissionPortResult, SubmissionRequest } from '@/runtime/submission';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface HttpPortOptions {
  /** REST namespace base URL from PublicConfig (e.g. https://example.com/wp-json/qw/v1).
   *  The port appends the per-endpoint path; see ADR-0015 amendment 2026-06-05. */
  readonly restUrl: string;
  /** WP REST nonce from PublicConfig. */
  readonly restNonce: string;
  /** Override for tests; defaults to global fetch. */
  readonly fetchImpl?: typeof fetch;
  /** Override for tests; default 30 000 ms. */
  readonly timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Wire payload
// ---------------------------------------------------------------------------

interface WirePayload {
  readonly wizardId: string;
  readonly schemaVersion: number;
  readonly contractVersion: 2;
  readonly answers: Record<string, unknown>;
  readonly pricing: {
    readonly totalPence: number;
    readonly lowPence: number;
    readonly highPence: number;
    readonly currency: 'GBP';
  } | null;
  readonly clientTimestamp: string;
}

// ---------------------------------------------------------------------------
// Error constants
// ---------------------------------------------------------------------------

const ERR_NETWORK = 'network_unreachable' as const;
const ERR_TIMEOUT = 'request_timeout' as const;
const ERR_BAD_RESPONSE = 'bad_response' as const;
const ERR_VALIDATION = 'validation_failed' as const;
const ERR_UNAUTHORIZED = 'unauthorized' as const;
const ERR_FORWARDER = 'forwarder_unavailable' as const;
const ERR_SERVER = 'server_error' as const;

const MSG_FALLBACK = 'Submission could not be completed. Please try again.';
const MSG_FORWARDER =
  'Your submission was saved. We could not notify our team automatically. Please try again or call us directly.';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * HTTP submission adapter. Implements SubmissionPort against the WordPress
 * REST endpoint POST /wp-json/qw/v1/submit (ADR-0015).
 *
 * Never throws — all HTTP responses and network failures are mapped to a
 * typed SubmissionPortResult so the WizardStore can dispatch deterministically.
 *
 * No retries: retry is a user-initiated FSM event (SUBMIT_RETRY). Silent
 * port-level retry risks creating duplicate persisted rows on transient errors.
 */
export function httpSubmissionPort(options: HttpPortOptions): SubmissionPort {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 30_000;

  return {
    async submit(request: SubmissionRequest): Promise<SubmissionPortResult> {
      const payload = buildPayload(request);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      // PHP emits the namespace base (qw/v1); we own the per-endpoint path.
      const endpointUrl = options.restUrl.endsWith('/')
        ? `${options.restUrl}submit`
        : `${options.restUrl}/submit`;

      let response: Response;
      try {
        response = await fetchImpl(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': options.restNonce,
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'same-origin',
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timeout);
        const aborted =
          err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));
        return aborted ? err_(ERR_TIMEOUT, MSG_FALLBACK) : err_(ERR_NETWORK, MSG_FALLBACK);
      }

      clearTimeout(timeout);
      return mapResponse(response);
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPayload(request: SubmissionRequest): WirePayload {
  return {
    wizardId: request.wizardId,
    schemaVersion: request.schemaVersion ?? 1,
    contractVersion: 2,
    answers: request.answers as Record<string, unknown>,
    pricing: request.pricing ?? null,
    clientTimestamp: request.clientTimestamp ?? new Date().toISOString(),
  };
}

async function mapResponse(response: Response): Promise<SubmissionPortResult> {
  let body: unknown = null;
  try {
    const text = await response.text();
    body = text.length > 0 ? (JSON.parse(text) as unknown) : null;
  } catch {
    body = null;
  }

  if (response.status === 200) {
    const reference = extractReference(body);
    if (reference === null) return err_(ERR_BAD_RESPONSE, MSG_FALLBACK);
    return { ok: true, reference };
  }

  if (response.status === 502) {
    return err_(ERR_FORWARDER, MSG_FORWARDER, true);
  }

  if (response.status === 400 || response.status === 422) {
    const mediaIssues = extractMediaIssues(body);
    return err_(ERR_VALIDATION, MSG_FALLBACK, false, null, mediaIssues);
  }

  if (response.status === 401 || response.status === 403) {
    return err_(ERR_UNAUTHORIZED, MSG_FALLBACK, false);
  }

  return err_(ERR_SERVER, MSG_FALLBACK);
}

function extractReference(body: unknown): string | null {
  if (body !== null && typeof body === 'object' && 'reference' in body) {
    const ref = (body as { reference: unknown }).reference;
    if (typeof ref === 'string' && ref.length > 0) return ref;
  }
  return null;
}

function extractMediaIssues(body: unknown): readonly MediaIssue[] | undefined {
  if (body === null || typeof body !== 'object') return undefined;
  const issues = (body as Record<string, unknown>)['mediaIssues'];
  if (!Array.isArray(issues)) return undefined;
  return issues
    .filter(
      (item): item is { fileIndex: number; code: string } =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>)['fileIndex'] === 'number' &&
        typeof (item as Record<string, unknown>)['code'] === 'string',
    )
    .map((item) => ({ fileIndex: item.fileIndex, code: item.code }));
}

function err_(
  code: SubmissionErrorInfo['code'],
  message: string,
  retryable = true,
  submissionId: string | null = null,
  mediaIssues?: readonly MediaIssue[],
): SubmissionPortResult {
  return { ok: false, error: { code, message, submissionId, retryable, mediaIssues } };
}
