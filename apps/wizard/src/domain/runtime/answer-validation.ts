import type { Field, Step } from '@/domain/config/wizard-config';

import type { AnswerMap, AnswerValue } from '@/domain/runtime/answer-types';
import { evaluateCondition } from '@/domain/runtime/condition-evaluator';
import { isStepVisible } from '@/domain/runtime/navigation';
import type { StepValidationFieldIssue, StepValidationSnapshot } from '@/domain/runtime/state';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** null/undefined/''/whitespace-only/[] are empty; false and 0 are not. */
function isEmpty(answer: AnswerValue | undefined): boolean {
  if (answer === null || answer === undefined) return true;
  if (typeof answer === 'string') return answer.trim().length === 0;
  if (Array.isArray(answer)) return (answer as ReadonlyArray<unknown>).length === 0;
  return false; // boolean (incl. false) and number (incl. 0) are non-empty
}

/**
 * Validates a single visible field against the current answer.
 * Returns the first issue message, or null when the field is valid.
 */
function validateField(field: Field, answer: AnswerValue | undefined): string | null {
  if (field.required && isEmpty(answer)) {
    return 'This field is required.';
  }

  if (isEmpty(answer)) return null;

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'photo':
      if (typeof answer !== 'string') return 'Expected a text value.';
      return null;

    case 'select':
    case 'radio': {
      if (typeof answer !== 'string') return 'Expected a text value.';
      if (field.options !== undefined && !field.options.some((o) => o.value === answer)) {
        return 'Please select a valid option.';
      }
      return null;
    }

    case 'checkbox': {
      if (typeof answer !== 'boolean' && !Array.isArray(answer)) {
        return 'Expected a boolean or list of values.';
      }
      if (Array.isArray(answer) && field.options !== undefined) {
        const validValues = new Set(field.options.map((o) => o.value));
        const arr = answer as ReadonlyArray<string>;
        if (!arr.every((v) => validValues.has(v))) {
          return 'Please select valid options only.';
        }
      }
      return null;
    }

    case 'number':
    case 'dimensions':
      if (typeof answer !== 'number') return 'Expected a numeric value.';
      return null;

    case 'review':
      return null; // display-only; no answer to validate
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates all visible fields in a step against current answers.
 *
 * Returns a StepValidationSnapshot recording per-field issues and an
 * aggregate valid flag. The snapshot is deterministic: same inputs always
 * produce identical output, in config order.
 *
 * Visibility contract:
 *   - If the step itself is hidden (isStepVisible returns false), returns a
 *     clean valid snapshot with no issues — hidden steps cannot fail.
 *   - Fields with their own condition are individually skipped when hidden;
 *     they do not appear in issues and do not affect valid.
 *
 * Required semantics: null, undefined, '', whitespace-only, and [] are
 * treated as absent. false and 0 are considered valid non-empty answers.
 */
export function validateStep(
  step: Step,
  answers: AnswerMap,
  fieldKeyById: ReadonlyMap<string, string>,
): StepValidationSnapshot {
  if (!isStepVisible(step, answers, fieldKeyById)) {
    return { stepId: step.id, valid: true, issues: [] };
  }

  const issues: StepValidationFieldIssue[] = [];

  for (const field of step.fields) {
    if (
      field.condition !== undefined &&
      !evaluateCondition(field.condition, answers, fieldKeyById)
    ) {
      continue;
    }

    const answer = answers[field.key];
    const message = validateField(field, answer);
    if (message !== null) {
      issues.push({ fieldKey: field.key, message });
    }
  }

  return {
    stepId: step.id,
    valid: issues.length === 0,
    issues,
  };
}
