import type { AnswerMap } from '@/domain/runtime/answer-types';
import type { SessionConfig, SubmissionErrorInfo } from '@/domain/runtime/state';

// ---------------------------------------------------------------------------
// SubmissionPort
// ---------------------------------------------------------------------------

/**
 * Interface for the async submission side effect.
 *
 * The domain state machine is pure — it never calls fetch. WizardStore
 * injects this port and calls it when the machine enters the `submitting`
 * phase. Implementations can hit a REST endpoint, write to localStorage for
 * testing, or resolve immediately in Storybook.
 */
export interface SubmissionPort {
  submit(answers: AnswerMap, config: SessionConfig): Promise<{ submissionId: string }>;
}

// ---------------------------------------------------------------------------
// Implementations
// ---------------------------------------------------------------------------

/**
 * Stub that always rejects. Use this as a placeholder during development;
 * replace with a real HTTP adapter before shipping.
 */
export const nullSubmissionPort: SubmissionPort = {
  submit: () => Promise.reject(new Error('No submission port configured.')),
};

// ---------------------------------------------------------------------------
// Error normalisation helper
// ---------------------------------------------------------------------------

/**
 * Maps an unknown thrown value to a serialisable SubmissionErrorInfo.
 *
 * The domain state machine accepts only SubmissionErrorInfo (no Error objects,
 * no stack traces). This function lives in the effects layer so the domain
 * never sees untyped exceptions.
 */
export function toSubmissionError(error: unknown): SubmissionErrorInfo {
  if (error instanceof Error) {
    return {
      code: 'network_error',
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
