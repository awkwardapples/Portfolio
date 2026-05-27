import type { Step, WizardConfig } from '@/domain/config/wizard-config';

import type { AnswerMap } from '@/domain/runtime/answer-types';
import { evaluateCondition } from '@/domain/runtime/condition-evaluator';

// ---------------------------------------------------------------------------
// Step visibility
// ---------------------------------------------------------------------------

/**
 * Single source of truth for step visibility.
 *
 * A step with no condition is always visible. A step with a condition is
 * visible only when that condition evaluates true against the current answers.
 *
 * All other navigation helpers delegate to this function — no duplicate
 * condition logic exists elsewhere in this module.
 */
export function isStepVisible(
  step: Step,
  answers: AnswerMap,
  fieldKeyById: ReadonlyMap<string, string>,
): boolean {
  if (step.condition === undefined) return true;
  return evaluateCondition(step.condition, answers, fieldKeyById);
}

// ---------------------------------------------------------------------------
// Visible step list
// ---------------------------------------------------------------------------

/**
 * Returns the ordered subset of config steps that are currently visible.
 *
 * A thin reducer over isStepVisible — contains no condition logic of its own.
 * Result ordering mirrors config.steps ordering.
 */
export function getVisibleSteps(
  config: WizardConfig,
  answers: AnswerMap,
  fieldKeyById: ReadonlyMap<string, string>,
): ReadonlyArray<Step> {
  return config.steps.filter((step) => isStepVisible(step, answers, fieldKeyById));
}

// ---------------------------------------------------------------------------
// Forward navigation
// ---------------------------------------------------------------------------

/**
 * Returns the ID of the next visible step after the current one.
 *
 * Navigation is based on config order, not visited history. Visited history
 * is irrelevant for forward navigation and is not a parameter here.
 *
 * Behaviour by case:
 *
 *   currentStepId = null
 *     Returns the first visible step's ID. Used during hydration to find the
 *     starting step: getNextStepId(config, answers, map, null).
 *     Returns null if no visible step exists.
 *
 *   currentStepId found in config
 *     Scans forward from that step's config position and returns the next
 *     visible step's ID, or null if none remain.
 *     If the current step itself is now hidden (answers changed), the scan
 *     still starts from its position — deterministic regardless of its
 *     own visibility.
 *
 *   currentStepId not found in config
 *     Returns null. The caller is in an invalid state and should not advance.
 */
export function getNextStepId(
  config: WizardConfig,
  answers: AnswerMap,
  fieldKeyById: ReadonlyMap<string, string>,
  currentStepId: string | null,
): string | null {
  const steps = config.steps;

  if (currentStepId === null) {
    for (const step of steps) {
      if (isStepVisible(step, answers, fieldKeyById)) return step.id;
    }
    return null;
  }

  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  if (currentIndex === -1) return null;

  for (let i = currentIndex + 1; i < steps.length; i++) {
    const step = steps[i];
    if (step !== undefined && isStepVisible(step, answers, fieldKeyById)) {
      return step.id;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Backward navigation
// ---------------------------------------------------------------------------

/**
 * Returns the ID of the step to navigate back to.
 *
 * Strictly history-based: does NOT consult config order or recompute
 * visibility. This is a deliberate design choice — if the user navigated
 * through a step that is now conditionally hidden, pressing back still
 * returns them to where they actually were. Recomputing "previous visible"
 * would cause jumps that violate the user's mental model of the session.
 *
 * Behaviour by case:
 *
 *   currentStepId = null            → null
 *   currentStepId not in history   → null (no history entry to return to)
 *   currentStepId is first entry   → null (nothing before it)
 *   otherwise                      → the step immediately before the last
 *                                    occurrence of currentStepId in history
 *
 * The "last occurrence" rule handles back-and-forth navigation correctly:
 * if history is [A, B, A, B] and current is B, the step before the final B
 * is A (index 2), which is returned.
 */
export function getPreviousStepId(
  currentStepId: string | null,
  visitedStepIds: ReadonlyArray<string>,
): string | null {
  if (currentStepId === null) return null;

  // Scan from the end to find the last occurrence of currentStepId
  let lastIdx = -1;
  for (let i = visitedStepIds.length - 1; i >= 0; i--) {
    if (visitedStepIds[i] === currentStepId) {
      lastIdx = i;
      break;
    }
  }

  if (lastIdx <= 0) return null; // Not found (lastIdx === -1) or first entry (lastIdx === 0)

  return visitedStepIds[lastIdx - 1] ?? null;
}
