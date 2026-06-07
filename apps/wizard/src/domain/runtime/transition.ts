import { validateStep } from '@/domain/runtime/answer-validation';
import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';
import { computePrice } from '@/domain/pricing/pricing-engine';
import type {
  AnswerSetEvent,
  CategorySelectedEvent,
  HydrateEvent,
  StepGotoEvent,
  SubmitFailedEvent,
  SubmitSucceededEvent,
  ValidateStepEvent,
  WizardEvent,
} from '@/domain/runtime/events';
import {
  getNextStepId,
  getPreviousStepId,
  getVisibleSteps,
  isStepVisible,
} from '@/domain/runtime/navigation';
import type { SessionConfig, StepValidationSnapshot, WizardState } from '@/domain/runtime/state';

// ---------------------------------------------------------------------------
// Per-event handlers
//
// Each handler receives the pre-built fieldKeyById map so no handler scans
// the wizard config for IDs on its own. All visibility logic is delegated to
// the navigation helpers — zero condition logic lives here.
// ---------------------------------------------------------------------------

function handleHydrate(
  state: WizardState,
  event: HydrateEvent,
  config: SessionConfig,
  fieldKeyById: ReadonlyMap<string, string>,
): WizardState {
  if (state.phase !== 'idle') return state;
  const firstId = getNextStepId(config.wizard, event.restoredAnswers, fieldKeyById, null);
  return {
    ...state,
    phase: 'answering',
    answers: event.restoredAnswers,
    currentStepId: firstId,
    visitedStepIds: firstId !== null ? [firstId] : [],
  };
}

function handleAnswerSet(state: WizardState, event: AnswerSetEvent): WizardState {
  if (state.phase !== 'answering' && state.phase !== 'validating') return state;

  // Clear the current step's validation snapshot — it is now stale.
  // Any other step's snapshot is left in place; it will be recomputed before
  // the next action that depends on it (STEP_NEXT or SUBMIT_REQUESTED).
  const currentStepId = state.currentStepId;
  const validationByStep: Record<string, StepValidationSnapshot> = {};
  for (const [key, val] of Object.entries(state.validationByStep)) {
    if (key !== currentStepId) validationByStep[key] = val;
  }

  return {
    ...state,
    phase: 'answering',
    answers: { ...state.answers, [event.fieldKey]: event.value },
    validationByStep,
  };
}

function handleStepNext(
  state: WizardState,
  config: SessionConfig,
  fieldKeyById: ReadonlyMap<string, string>,
): WizardState {
  if (state.phase !== 'answering' && state.phase !== 'validating') return state;
  if (state.currentStepId === null) return state;

  const currentStep = config.wizard.steps.find((s) => s.id === state.currentStepId);
  if (currentStep === undefined) return state;

  const snapshot = validateStep(currentStep, state.answers, fieldKeyById);
  const validationByStep = { ...state.validationByStep, [snapshot.stepId]: snapshot };

  if (!snapshot.valid) {
    // Current step has errors; show them but do not advance.
    return { ...state, phase: 'answering', validationByStep };
  }

  const nextId = getNextStepId(config.wizard, state.answers, fieldKeyById, state.currentStepId);
  if (nextId === null) {
    // Already at the last visible step; validate it in place.
    return { ...state, phase: 'answering', validationByStep };
  }

  return {
    ...state,
    phase: 'answering',
    validationByStep,
    currentStepId: nextId,
    visitedStepIds: [...state.visitedStepIds, nextId],
  };
}

function handleStepBack(state: WizardState): WizardState {
  if (state.phase !== 'answering' && state.phase !== 'validating') return state;

  const prevId = getPreviousStepId(state.currentStepId, state.visitedStepIds);
  if (prevId === null) return state;

  return {
    ...state,
    phase: 'answering',
    currentStepId: prevId,
    visitedStepIds: [...state.visitedStepIds, prevId],
  };
}

function handleStepGoto(
  state: WizardState,
  event: StepGotoEvent,
  config: SessionConfig,
  fieldKeyById: ReadonlyMap<string, string>,
): WizardState {
  if (state.phase !== 'answering' && state.phase !== 'validating') return state;

  // Guard 1: target must have been visited this session.
  if (!state.visitedStepIds.includes(event.stepId)) return state;

  // Guard 2: target must be currently visible (answers may have changed since visit).
  const targetStep = config.wizard.steps.find((s) => s.id === event.stepId);
  if (targetStep === undefined) return state;
  if (!isStepVisible(targetStep, state.answers, fieldKeyById)) return state;

  return {
    ...state,
    phase: 'answering',
    currentStepId: event.stepId,
    visitedStepIds: [...state.visitedStepIds, event.stepId],
  };
}

function handleValidateStep(
  state: WizardState,
  event: ValidateStepEvent,
  config: SessionConfig,
  fieldKeyById: ReadonlyMap<string, string>,
): WizardState {
  if (state.phase !== 'answering' && state.phase !== 'validating') return state;

  const step = config.wizard.steps.find((s) => s.id === event.stepId);
  if (step === undefined) return state;

  const snapshot = validateStep(step, state.answers, fieldKeyById);
  // Phase unchanged — VALIDATE_STEP writes a snapshot without navigating.
  return {
    ...state,
    validationByStep: { ...state.validationByStep, [snapshot.stepId]: snapshot },
  };
}

function handleCategorySelected(state: WizardState, event: CategorySelectedEvent): WizardState {
  if (state.phase === 'category_selection') {
    return { ...state, phase: 'answering', selectedCategoryId: event.categoryId };
  }
  if (state.phase === 'answering') {
    return { ...state, selectedCategoryId: event.categoryId };
  }
  return state;
}

function handleSubmitRequested(
  state: WizardState,
  config: SessionConfig,
  fieldKeyById: ReadonlyMap<string, string>,
): WizardState {
  // validating + SUBMIT_REQUESTED → submitting.
  // For 'instant' quoteMode the pricing engine gates the transition; for
  // 'manual' the pricing gate is bypassed entirely (ADR-0017).
  if (state.phase === 'validating') {
    const quoteMode = config.wizard.quoteMode ?? 'instant';
    if (quoteMode === 'manual') {
      return { ...state, phase: 'submitting' };
    }
    const pricingResult = computePrice(state.answers, config.wizard, config.pricing);
    if (!pricingResult.valid) {
      return { ...state, phase: 'answering' };
    }
    return { ...state, phase: 'submitting' };
  }

  if (state.phase !== 'answering') return state;

  // Validate all currently visible steps in config order.
  const visibleSteps = getVisibleSteps(config.wizard, state.answers, fieldKeyById);
  const validationByStep: Record<string, StepValidationSnapshot> = { ...state.validationByStep };
  let allValid = true;

  for (const step of visibleSteps) {
    const snapshot = validateStep(step, state.answers, fieldKeyById);
    validationByStep[step.id] = snapshot;
    if (!snapshot.valid) allValid = false;
  }

  if (allValid) {
    // All visible steps pass → enter validating (pricing gate stub).
    return { ...state, phase: 'validating', validationByStep };
  }

  // At least one step is invalid → stay in answering with errors visible.
  return { ...state, validationByStep };
}

function handleSubmitSucceeded(state: WizardState, event: SubmitSucceededEvent): WizardState {
  if (state.phase !== 'submitting') return state;
  return {
    ...state,
    phase: 'submit_success',
    currentStepId: null,
    submissionResult: { outcome: 'success', submissionId: event.submissionId },
  };
}

function handleSubmitFailed(state: WizardState, event: SubmitFailedEvent): WizardState {
  if (state.phase !== 'submitting') return state;
  return {
    ...state,
    phase: 'submit_failure',
    submissionResult: { outcome: 'failure', error: event.error },
  };
}

function handleSubmitRetry(state: WizardState): WizardState {
  if (state.phase !== 'submit_failure') return state;
  return {
    ...state,
    phase: 'submitting',
    submissionResult: null,
  };
}

// ---------------------------------------------------------------------------
// Public API — the state machine's single transition function
// ---------------------------------------------------------------------------

/**
 * Pure, total state machine transition.
 *
 * Given a current state, an event, and the session configuration, returns the
 * next state. Never mutates the input. Never throws. Never produces side
 * effects. Illegal (phase, event) pairs are no-ops that return the same state
 * object reference unchanged.
 *
 * The fieldKeyById map is rebuilt once at the start of each call so all
 * handlers receive a consistent map without scanning config in loops.
 */
export function transition(
  state: WizardState,
  event: WizardEvent,
  config: SessionConfig,
): WizardState {
  const fieldKeyById = buildFieldKeyMap(config.wizard);

  switch (event.type) {
    case 'HYDRATE':
      return handleHydrate(state, event, config, fieldKeyById);
    case 'ANSWER_SET':
      return handleAnswerSet(state, event);
    case 'CATEGORY_SELECTED':
      return handleCategorySelected(state, event);
    case 'STEP_NEXT':
      return handleStepNext(state, config, fieldKeyById);
    case 'STEP_BACK':
      return handleStepBack(state);
    case 'STEP_GOTO':
      return handleStepGoto(state, event, config, fieldKeyById);
    case 'VALIDATE_STEP':
      return handleValidateStep(state, event, config, fieldKeyById);
    case 'SUBMIT_REQUESTED':
      return handleSubmitRequested(state, config, fieldKeyById);
    case 'SUBMIT_SUCCEEDED':
      return handleSubmitSucceeded(state, event);
    case 'SUBMIT_FAILED':
      return handleSubmitFailed(state, event);
    case 'SUBMIT_RETRY':
      return handleSubmitRetry(state);
  }
}
