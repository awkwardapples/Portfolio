import type { AnyStep } from '@/domain/config/wizard-config';

import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';
import { getNextStepId, getPreviousStepId, getVisibleSteps } from '@/domain/runtime/navigation';
import type { SessionConfig, StepValidationSnapshot, WizardState } from '@/domain/runtime/state';

// ---------------------------------------------------------------------------
// Selectors
//
// Pure derivations from (WizardState, SessionConfig). No mutation, no cache.
// Each call to a selector that requires visibility recomputes the fieldKeyById
// map from config — acceptable at this stage; memoisation can be layered on
// top later without changing the selector signatures.
// ---------------------------------------------------------------------------

/**
 * Returns the ordered list of steps that are currently visible given the
 * current answers. Pure function of (state.answers, config.wizard).
 */
export function selectVisibleSteps(
  state: WizardState,
  config: SessionConfig,
): ReadonlyArray<AnyStep> {
  const fieldKeyById = buildFieldKeyMap(config.wizard);
  return getVisibleSteps(config.wizard, state.answers, fieldKeyById);
}

/**
 * Returns the Step object for the current step, or null when no step is
 * active (idle, terminal phases).
 */
export function selectCurrentStep(state: WizardState, config: SessionConfig): AnyStep | null {
  if (state.currentStepId === null) return null;
  return config.wizard.steps.find((s) => s.id === state.currentStepId) ?? null;
}

/**
 * Returns the completion percentage (0–100, integer) based on the current
 * step's position within the visible step list.
 *
 * Returns 0 when there is no current step or no visible steps.
 */
export function selectCompletionPercent(state: WizardState, config: SessionConfig): number {
  if (state.currentStepId === null) return 0;
  const fieldKeyById = buildFieldKeyMap(config.wizard);
  const visible = getVisibleSteps(config.wizard, state.answers, fieldKeyById);
  if (visible.length === 0) return 0;
  const idx = visible.findIndex((s) => s.id === state.currentStepId);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / visible.length) * 100);
}

/**
 * Returns how many visible steps have been visited (answered) vs. the total
 * number of currently visible steps.
 */
export function selectAnsweredCounts(
  state: WizardState,
  config: SessionConfig,
): { readonly answered: number; readonly total: number } {
  const fieldKeyById = buildFieldKeyMap(config.wizard);
  const visible = getVisibleSteps(config.wizard, state.answers, fieldKeyById);
  const visited = new Set(state.visitedStepIds);
  const answered = visible.filter((s) => visited.has(s.id)).length;
  return { answered, total: visible.length };
}

/**
 * Returns the stored validation snapshot for a step, or null if that step has
 * not yet been validated this session.
 */
export function selectStepValidation(
  state: WizardState,
  stepId: string,
): StepValidationSnapshot | null {
  return state.validationByStep[stepId] ?? null;
}

/**
 * Returns true when there is a previous step in the visit history to go back
 * to. Delegates to getPreviousStepId (history-based, never re-evaluates
 * visibility).
 */
export function selectCanGoBack(state: WizardState): boolean {
  return getPreviousStepId(state.currentStepId, state.visitedStepIds) !== null;
}

/**
 * Returns true when there is at least one more visible step after the current
 * one in config order. Delegates to getNextStepId (config-order forward scan).
 */
export function selectCanGoNext(state: WizardState, config: SessionConfig): boolean {
  if (state.currentStepId === null) return false;
  const fieldKeyById = buildFieldKeyMap(config.wizard);
  return getNextStepId(config.wizard, state.answers, fieldKeyById, state.currentStepId) !== null;
}
