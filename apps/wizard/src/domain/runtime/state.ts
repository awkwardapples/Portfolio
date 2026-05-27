import type { PricingConfig } from '@/domain/config/pricing';
import type { WizardConfig } from '@/domain/config/wizard-config';

import type { AnswerMap } from '@/domain/runtime/answer-types';

// ---------------------------------------------------------------------------
// Phase
// ---------------------------------------------------------------------------

/**
 * The complete set of phases the wizard state machine can occupy.
 *
 * Linear progression (the mental model; transition logic is in transition.ts):
 *   idle → hydrating → answering → validating → submitting → submit_success
 *                                                           → submit_failure
 *
 * No numeric ordinal is encoded here; the transition layer owns phase logic.
 */
export type WizardPhase =
  | 'idle'
  | 'hydrating'
  | 'answering'
  | 'validating'
  | 'submitting'
  | 'submit_success'
  | 'submit_failure';

// ---------------------------------------------------------------------------
// Validation snapshot
// ---------------------------------------------------------------------------

/** A single field-level validation issue within a step. */
export interface StepValidationFieldIssue {
  readonly fieldKey: string;
  readonly message: string;
}

/**
 * Validation result for one step. Written into validationByStep[stepId] by
 * the VALIDATE_STEP transition; read by answer-validation selectors.
 */
export interface StepValidationSnapshot {
  readonly stepId: string;
  readonly valid: boolean;
  readonly issues: ReadonlyArray<StepValidationFieldIssue>;
}

// ---------------------------------------------------------------------------
// Submission result
// ---------------------------------------------------------------------------

/**
 * Discriminated code for submission failures.
 *
 *   forwarder_failed  HTTP 502 from ADR-0005 sync Make.com forwarder.
 *                     The submission was persisted (submissionId non-null) but
 *                     forwarding failed. Show submissionId + fallback contact.
 *   network_error     No response received (offline or timeout).
 *   server_error      Non-502 HTTP error from the REST endpoint.
 */
export type SubmissionErrorCode = 'forwarder_failed' | 'network_error' | 'server_error';

/**
 * Data-only error descriptor for failed submissions.
 *
 * No Error objects, no stack traces, no non-serializable values. Safe to
 * persist, replay, and display directly.
 */
export interface SubmissionErrorInfo {
  readonly code: SubmissionErrorCode;
  readonly message: string;
  /**
   * Non-null only when code is 'forwarder_failed' (ADR-0005). The submission
   * was recorded in WordPress even though forwarding failed — show this to the
   * user so they can quote it when contacting support.
   */
  readonly submissionId: string | null;
  readonly retryable: boolean;
}

/**
 * The terminal outcome of a submission attempt.
 * Stored in WizardState.submissionResult once submission completes.
 */
export type SubmissionResult =
  | { readonly outcome: 'success'; readonly submissionId: string }
  | { readonly outcome: 'failure'; readonly error: SubmissionErrorInfo };

// ---------------------------------------------------------------------------
// Config provenance
// ---------------------------------------------------------------------------

/**
 * Immutable provenance metadata extracted from WizardConfig at hydration.
 *
 * Set once by createInitialState(); transition logic must never modify this
 * field. Its presence lets any snapshot or persisted state identify which
 * wizard version produced it.
 */
export interface ConfigMeta {
  readonly wizardId: string;
  readonly schemaVersion: number;
}

// ---------------------------------------------------------------------------
// Core state shape
// ---------------------------------------------------------------------------

/**
 * The complete, serializable state of the wizard at any point in time.
 *
 * All fields are readonly. Transitions produce a new WizardState object via
 * transition(); they never mutate an existing instance.
 *
 * Serialization contract: every field must be representable as JSON. No
 * functions, no class instances, no Symbols, no circular references.
 */
export interface WizardState {
  /** Current phase. Drives legal transitions and what the UI renders. */
  readonly phase: WizardPhase;
  /**
   * The step currently displayed to the user.
   * Null in idle and in terminal phases (submit_success, submit_failure).
   */
  readonly currentStepId: string | null;
  /** All field answers collected this session, keyed by field.key. */
  readonly answers: AnswerMap;
  /**
   * Validation results per step, keyed by stepId.
   * Initialises to {} and is never undefined at runtime — selector code
   * can rely on stable presence without null-checks on the object itself.
   */
  readonly validationByStep: Readonly<Record<string, StepValidationSnapshot>>;
  /**
   * Steps visited during this session, in order of first visit.
   * Append-only from the machine's perspective; may contain duplicates.
   * Deduplication and history logic belong in the transition/selector layers.
   */
  readonly visitedStepIds: ReadonlyArray<string>;
  /** Null until a submission attempt completes (success or failure). */
  readonly submissionResult: SubmissionResult | null;
  /**
   * Immutable provenance set at construction by createInitialState().
   * Transitions must treat this field as read-only forever after.
   */
  readonly configMeta: ConfigMeta;
}

// ---------------------------------------------------------------------------
// Session config (companion to state; never stored inside state)
// ---------------------------------------------------------------------------

/**
 * Runtime session configuration passed as the third argument to
 * transition(state, event, config).
 *
 * IMPORTANT: SessionConfig is never stored inside WizardState. Keeping it
 * external preserves two invariants:
 *   1. Replay determinism: the same event sequence + the same config always
 *      produces the same final state, regardless of when replay runs.
 *   2. Lean snapshots: persisted state is answers + phase metadata, not a
 *      full copy of the wizard/pricing config.
 */
export interface SessionConfig {
  readonly wizard: WizardConfig;
  readonly pricing: PricingConfig;
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

/**
 * Creates the canonical initial WizardState from a WizardConfig.
 *
 * This is the single constructor for WizardState. All other state values
 * are produced exclusively by transition(). No ad-hoc state literals exist
 * elsewhere in the codebase.
 *
 * Determinism guarantees:
 *   - No Date.now(), Math.random(), or environment reads.
 *   - Output is a function of the explicit config argument only.
 *   - Returns a fresh object on every call (no shared references).
 */
export function createInitialState(config: WizardConfig): WizardState {
  return {
    phase: 'idle',
    currentStepId: null,
    answers: {},
    validationByStep: {},
    visitedStepIds: [],
    submissionResult: null,
    configMeta: {
      wizardId: config.id,
      schemaVersion: config.schemaVersion,
    },
  };
}
