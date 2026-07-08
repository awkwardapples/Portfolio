import type { Condition, WizardConfig } from '@/domain/config/wizard-config';
import { isFieldStep } from '@/domain/config/wizard-config';

import type { AnswerMap } from '@/domain/runtime/answer-types';

/**
 * Builds a map of fieldId → answerKey from a WizardConfig.
 *
 * For classic field steps: field.id → field.key (may differ).
 * For VisualCardSelectorStep: answerKey → answerKey (identity mapping).
 * For SizeBracketSelectorStep: answerKey → answerKey plus each exactField.id → exactField.id.
 *
 * This allows the pricing engine and condition evaluator to resolve answer
 * keys from all step types, not only classic field steps.
 *
 * Create once at hydration and pass to evaluateCondition; avoids scanning
 * the config on every evaluation. The map is sealed after construction and
 * does not retain a reference to the config.
 */
export function buildFieldKeyMap(config: WizardConfig): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const step of config.steps) {
    if (!isFieldStep(step)) {
      if (step.stepKind === 'visual-card-selector') {
        map.set(step.answerKey, step.answerKey);
      } else if (step.stepKind === 'size-bracket-selector') {
        map.set(step.answerKey, step.answerKey);
        for (const ef of step.exactFields) {
          map.set(ef.id, ef.id);
        }
      }
      continue;
    }
    for (const field of step.fields) {
      map.set(field.id, field.key);
    }
  }
  return map;
}

/**
 * Evaluates a declarative Condition against the current answers.
 *
 * Fail-closed: returns false when the condition's fieldId is not in the map,
 * rather than throwing. All comparisons use strict equality (===); no type
 * coercion, no locale-sensitive comparisons.
 *
 * notEmpty semantics:
 *   - null, undefined, '', and [] are empty.
 *   - Whitespace-only strings (' ') are empty.
 *   - Numeric 0 and boolean false are valid non-empty answers.
 *
 * in / notIn with array answers:
 *   - Membership is evaluated element-wise against the condition values.
 *   - For `in`: true if any element is in the list.
 *   - For `notIn`: true only if no element is in the list.
 */
export function evaluateCondition(
  condition: Condition,
  answers: AnswerMap,
  fieldKeyById: ReadonlyMap<string, string>,
): boolean {
  const key = fieldKeyById.get(condition.fieldId);
  if (key === undefined) return false;

  // noUncheckedIndexedAccess: answer is AnswerValue | undefined
  const answer = answers[key];

  switch (condition.operator) {
    case 'equals':
      return answer === condition.value;

    case 'notEquals':
      return answer !== condition.value;

    case 'in': {
      if (Array.isArray(answer)) {
        const arr = answer as ReadonlyArray<string>;
        return arr.some((v) => condition.values.includes(v));
      }
      return typeof answer === 'string' && condition.values.includes(answer);
    }

    case 'notIn': {
      if (Array.isArray(answer)) {
        const arr = answer as ReadonlyArray<string>;
        return arr.every((v) => !condition.values.includes(v));
      }
      if (typeof answer === 'string') return !condition.values.includes(answer);
      // Non-string scalar (number, boolean, null, undefined) cannot be in a
      // string list, so notIn is vacuously true. Unknown fieldId is handled
      // above and returns false before reaching here.
      return true;
    }

    case 'notEmpty': {
      if (Array.isArray(answer)) return answer.length > 0;
      if (answer === null || answer === undefined) return false;
      if (typeof answer === 'string') return answer.trim().length > 0;
      // number 0 and boolean false are valid non-empty answers
      return true;
    }
  }
}
