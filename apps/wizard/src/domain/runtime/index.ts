/**
 * Runtime domain public surface.
 *
 * Single import point for all types and pure functions produced by the
 * domain/runtime layer. Downstream callers (React adapter, tests, effects
 * layer) import from here rather than from individual module files.
 */

// Answer primitives
export type { AnswerValue, AnswerMap } from './answer-types';

// Condition evaluation
export { buildFieldKeyMap, evaluateCondition } from './condition-evaluator';

// State shapes, session config, and initial state factory
export type {
  WizardPhase,
  StepValidationFieldIssue,
  StepValidationSnapshot,
  SubmissionErrorCode,
  SubmissionErrorInfo,
  SubmissionResult,
  ConfigMeta,
  WizardState,
  SessionConfig,
} from './state';
export { createInitialState } from './state';

// Event union and individual event types
export type {
  HydrateEvent,
  AnswerSetEvent,
  StepNextEvent,
  StepBackEvent,
  StepGotoEvent,
  ValidateStepEvent,
  SubmitRequestedEvent,
  SubmitSucceededEvent,
  SubmitFailedEvent,
  SubmitRetryEvent,
  WizardEvent,
  WizardEventType,
} from './events';
