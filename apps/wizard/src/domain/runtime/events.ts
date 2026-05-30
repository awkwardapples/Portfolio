import type { AnswerMap, AnswerValue } from '@/domain/runtime/answer-types';
import type { SubmissionErrorInfo } from '@/domain/runtime/state';

// ---------------------------------------------------------------------------
// Individual event types
// ---------------------------------------------------------------------------

/**
 * Trigger wizard hydration from idle.
 *
 * The provider loads any persisted answers (from sessionStorage via the
 * PersistenceAdapter) before dispatching this event, so hydration completes
 * in a single transition. Pass an empty AnswerMap when there is nothing to
 * restore.
 */
export type HydrateEvent = {
  readonly type: 'HYDRATE';
  readonly restoredAnswers: AnswerMap;
};

/**
 * Record a single field answer. The key is field.key (stable answer slot),
 * not field.id. Dispatched on every field change.
 */
export type AnswerSetEvent = {
  readonly type: 'ANSWER_SET';
  readonly fieldKey: string;
  readonly value: AnswerValue;
};

/** Advance to the next visible step after the current one. */
export type StepNextEvent = {
  readonly type: 'STEP_NEXT';
};

/** Return to the previous visible step. */
export type StepBackEvent = {
  readonly type: 'STEP_BACK';
};

/**
 * Jump directly to a named step (e.g. from a step-progress indicator).
 * Transition is a no-op if the target step is not currently visible.
 */
export type StepGotoEvent = {
  readonly type: 'STEP_GOTO';
  readonly stepId: string;
};

/**
 * Trigger validation for the given step without advancing. Writes a
 * StepValidationSnapshot into validationByStep[stepId]. Typically
 * dispatched by the provider immediately before STEP_NEXT.
 */
export type ValidateStepEvent = {
  readonly type: 'VALIDATE_STEP';
  readonly stepId: string;
};

/**
 * Begin submission of collected answers.
 *
 * Under optimistic UI (ADR-0012 §6) the provider may present an optimistic
 * success state immediately. SUBMIT_SUCCEEDED or SUBMIT_FAILED will confirm
 * or roll back. The server-side durability guarantee (ADR-0001) and
 * synchronous forwarder (ADR-0005) are unaffected by this client-side
 * optimism.
 */
export type SubmitRequestedEvent = {
  readonly type: 'SUBMIT_REQUESTED';
};

/**
 * Server confirmed the submission was persisted and forwarded successfully.
 */
export type SubmitSucceededEvent = {
  readonly type: 'SUBMIT_SUCCEEDED';
  readonly submissionId: string;
};

/**
 * Server reported a submission failure.
 *
 * The error.code discriminant drives the UI path:
 *   'forwarder_unavailable'  show submissionId + fallback contact details (ADR-0005)
 *   'network_unreachable'    show offline/retry message
 *   'request_timeout'        show timeout/retry message
 *   'server_error'           show generic error + retry option
 */
export type SubmitFailedEvent = {
  readonly type: 'SUBMIT_FAILED';
  readonly error: SubmissionErrorInfo;
};

/** Retry a failed submission. Transitions submit_failure → submitting. */
export type SubmitRetryEvent = {
  readonly type: 'SUBMIT_RETRY';
};

// ---------------------------------------------------------------------------
// Union type
// ---------------------------------------------------------------------------

export type WizardEvent =
  | HydrateEvent
  | AnswerSetEvent
  | StepNextEvent
  | StepBackEvent
  | StepGotoEvent
  | ValidateStepEvent
  | SubmitRequestedEvent
  | SubmitSucceededEvent
  | SubmitFailedEvent
  | SubmitRetryEvent;

/** Discriminant string-literal union over all wizard event types. */
export type WizardEventType = WizardEvent['type'];
