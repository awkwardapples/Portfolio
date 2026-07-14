import type { AnswerMap } from '@/domain/runtime/answer-types';
import type { SubmissionErrorCode, SubmissionErrorInfo } from '@/domain/runtime/state';

// ---------------------------------------------------------------------------
// SubmissionRequest
// ---------------------------------------------------------------------------

export interface SubmissionRequest {
  readonly wizardId: string;
  readonly schemaVersion?: number;
  /** Propagated from WizardConfig.quoteMode (ADR-0017). Absent is treated as 'instant' by the server. */
  readonly quoteMode: 'instant' | 'manual';
  readonly answers: AnswerMap;
  /**
   * Present for 'instant' quoteMode when the pricing engine produces a valid result.
   * Absent for 'manual' quoteMode — the contractor prices the job manually.
   */
  readonly pricing?: {
    readonly totalPence: number;
    readonly lowPence: number;
    readonly highPence: number;
    readonly currency: 'GBP';
  };
  readonly clientTimestamp?: string;
  /**
   * Honeypot field value (Step 5.13f, ADR-0027). Merged in by
   * createBotProtectionEnrichedPort at submission time — always empty for a
   * real user. Absent here means "not yet enriched", not "known empty";
   * the enriched port always sets it before the real port sees the request.
   */
  readonly honeypotValue?: string;
  /**
   * Cloudflare Turnstile token (Step 5.13f, ADR-0027). Null when Turnstile
   * isn't configured for this deployment or a token hasn't been issued yet.
   * Merged in by createBotProtectionEnrichedPort at submission time.
   */
  readonly turnstileToken?: string | null;
}

// ---------------------------------------------------------------------------
// SubmissionPortResult
// ---------------------------------------------------------------------------

/**
 * The return type of SubmissionPort.submit().
 *
 * Discriminated by `ok`. The port never throws — all outcomes (network
 * failure, server error, forwarder unavailable) are mapped to this type so
 * the WizardStore can dispatch deterministically without a try/catch.
 */
export type SubmissionPortResult =
  | { readonly ok: true; readonly reference: string; readonly isDuplicate?: boolean }
  | { readonly ok: false; readonly error: SubmissionErrorInfo };

// ---------------------------------------------------------------------------
// SubmissionPort
// ---------------------------------------------------------------------------

/**
 * Interface for the async submission side effect.
 *
 * The domain state machine is pure — it never calls fetch. WizardStore
 * injects this port and calls it when the machine enters the `submitting`
 * phase. Implementations must never throw; all failure conditions are
 * returned as { ok: false, error }.
 */
export interface SubmissionPort {
  submit(request: SubmissionRequest): Promise<SubmissionPortResult>;
}

// ---------------------------------------------------------------------------
// Built-in port implementations
// ---------------------------------------------------------------------------

/**
 * Port that always returns a server-error failure. Use as a placeholder
 * during development to ensure the wizard cannot accidentally submit.
 */
export const nullSubmissionPort: SubmissionPort = {
  submit: (): Promise<SubmissionPortResult> =>
    Promise.resolve({
      ok: false,
      error: {
        code: 'server_error' as SubmissionErrorCode,
        message: 'No submission port configured.',
        submissionId: null,
        retryable: false,
      },
    }),
};

// ---------------------------------------------------------------------------
// Error normalisation helper
// ---------------------------------------------------------------------------

/**
 * Maps an unknown caught value to a serialisable SubmissionErrorInfo.
 *
 * Used as a last-resort fallback in the store's submission effect for any
 * unexpected throws that escape the port boundary.
 */
export function toSubmissionError(error: unknown): SubmissionErrorInfo {
  if (error instanceof Error) {
    return {
      code: 'server_error',
      message: error.message,
      submissionId: null,
      retryable: true,
    };
  }
  return {
    code: 'server_error',
    message: 'An unexpected error occurred.',
    submissionId: null,
    retryable: true,
  };
}
