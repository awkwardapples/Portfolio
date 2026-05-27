import { describe, expect, it } from 'vitest';

import type { WizardConfig } from '@/domain/config/wizard-config';
import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';
import {
  getNextStepId,
  getPreviousStepId,
  getVisibleSteps,
  isStepVisible,
} from '@/domain/runtime/navigation';

// ---------------------------------------------------------------------------
// Test fixture: mixed conditional config
//
//   step-a   always visible
//   step-b   visible when field-choice equals 'show'
//   step-c   always visible
//   step-d   visible when field-text is notEmpty
//
// Fields used in conditions live in step-a so they're answered first.
// ---------------------------------------------------------------------------

const conditionalConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'nav-test',
  title: 'Navigation test',
  steps: [
    {
      id: 'step-a',
      title: 'Step A',
      fields: [
        {
          id: 'field-choice',
          key: 'choice',
          type: 'select',
          label: 'Choice',
          required: false,
          options: [
            { value: 'show', label: 'Show' },
            { value: 'hide', label: 'Hide' },
          ],
        },
        {
          id: 'field-text',
          key: 'text_input',
          type: 'text',
          label: 'Text',
          required: false,
        },
      ],
    },
    {
      id: 'step-b',
      title: 'Step B',
      condition: { operator: 'equals', fieldId: 'field-choice', value: 'show' },
      fields: [{ id: 'field-b1', key: 'b_answer', type: 'text', label: 'B', required: false }],
    },
    {
      id: 'step-c',
      title: 'Step C',
      fields: [{ id: 'field-c1', key: 'c_answer', type: 'text', label: 'C', required: false }],
    },
    {
      id: 'step-d',
      title: 'Step D',
      condition: { operator: 'notEmpty', fieldId: 'field-text' },
      fields: [{ id: 'field-d1', key: 'd_answer', type: 'text', label: 'D', required: false }],
    },
  ],
};

// ---------------------------------------------------------------------------
// Test fixture: all-hidden config
//
//   step-x   visible only when trigger === 'show' (never set in tests)
//   step-y   visible only when trigger === 'show'
// ---------------------------------------------------------------------------

const allHiddenConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'all-hidden',
  title: 'All hidden',
  steps: [
    {
      id: 'step-x',
      title: 'X',
      condition: { operator: 'equals', fieldId: 'field-trigger', value: 'show' },
      fields: [
        {
          id: 'field-trigger',
          key: 'trigger',
          type: 'text',
          label: 'Trigger',
          required: false,
        },
      ],
    },
    {
      id: 'step-y',
      title: 'Y',
      condition: { operator: 'equals', fieldId: 'field-trigger', value: 'show' },
      fields: [{ id: 'field-y1', key: 'y_answer', type: 'text', label: 'Y', required: false }],
    },
  ],
};

// Pre-built maps (built once per config, as at hydration)
const condMap = buildFieldKeyMap(conditionalConfig);
const hiddenMap = buildFieldKeyMap(allHiddenConfig);

// Convenience answer sets for the conditional config
const noAnswers = {};
const choiceShow = { choice: 'show' };
const choiceHide = { choice: 'hide' };
const textFilled = { text_input: 'hello' };
const bothVisible = { choice: 'show', text_input: 'hello' };

// ---------------------------------------------------------------------------
// isStepVisible
// ---------------------------------------------------------------------------

describe('isStepVisible', () => {
  it('returns true when step has no condition', () => {
    const step = conditionalConfig.steps[0]!;
    expect(isStepVisible(step, noAnswers, condMap)).toBe(true);
  });

  it('returns true when equals condition matches current answer', () => {
    const step = conditionalConfig.steps[1]!; // requires choice === 'show'
    expect(isStepVisible(step, choiceShow, condMap)).toBe(true);
  });

  it('returns false when equals condition does not match', () => {
    const step = conditionalConfig.steps[1]!;
    expect(isStepVisible(step, choiceHide, condMap)).toBe(false);
  });

  it('returns false when equals condition answer is missing', () => {
    const step = conditionalConfig.steps[1]!;
    expect(isStepVisible(step, noAnswers, condMap)).toBe(false);
  });

  it('returns true when notEmpty condition has a filled answer', () => {
    const step = conditionalConfig.steps[3]!; // requires text_input notEmpty
    expect(isStepVisible(step, textFilled, condMap)).toBe(true);
  });

  it('returns false when notEmpty condition answer is missing', () => {
    const step = conditionalConfig.steps[3]!;
    expect(isStepVisible(step, noAnswers, condMap)).toBe(false);
  });

  it('returns false when notEmpty condition answer is empty string', () => {
    const step = conditionalConfig.steps[3]!;
    expect(isStepVisible(step, { text_input: '' }, condMap)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getVisibleSteps
// ---------------------------------------------------------------------------

describe('getVisibleSteps', () => {
  it('returns all steps when none have conditions', () => {
    const cfg: WizardConfig = {
      schemaVersion: 1,
      id: 'plain',
      title: 'Plain',
      steps: [
        {
          id: 's1',
          title: 'S1',
          fields: [{ id: 'f1', key: 'k1', type: 'text', label: 'F1', required: false }],
        },
        {
          id: 's2',
          title: 'S2',
          fields: [{ id: 'f2', key: 'k2', type: 'text', label: 'F2', required: false }],
        },
      ],
    };
    const m = buildFieldKeyMap(cfg);
    const visible = getVisibleSteps(cfg, {}, m);
    expect(visible).toHaveLength(2);
    expect(visible.map((s) => s.id)).toEqual(['s1', 's2']);
  });

  it('excludes a conditional step whose condition is false', () => {
    const visible = getVisibleSteps(conditionalConfig, choiceHide, condMap);
    const ids = visible.map((s) => s.id);
    expect(ids).not.toContain('step-b');
  });

  it('includes a conditional step when its condition is true', () => {
    const visible = getVisibleSteps(conditionalConfig, choiceShow, condMap);
    const ids = visible.map((s) => s.id);
    expect(ids).toContain('step-b');
  });

  it('preserves config order in the result', () => {
    const visible = getVisibleSteps(conditionalConfig, bothVisible, condMap);
    const ids = visible.map((s) => s.id);
    expect(ids).toEqual(['step-a', 'step-b', 'step-c', 'step-d']);
  });

  it('returns empty array when all steps are hidden', () => {
    const visible = getVisibleSteps(allHiddenConfig, {}, hiddenMap);
    expect(visible).toHaveLength(0);
  });

  it('reflects answer changes: step disappears when condition flips to false', () => {
    const before = getVisibleSteps(conditionalConfig, choiceShow, condMap);
    const after = getVisibleSteps(conditionalConfig, choiceHide, condMap);
    expect(before.map((s) => s.id)).toContain('step-b');
    expect(after.map((s) => s.id)).not.toContain('step-b');
  });

  it('reflects answer changes: step reappears when condition flips to true', () => {
    const hidden = getVisibleSteps(conditionalConfig, noAnswers, condMap);
    const visible = getVisibleSteps(conditionalConfig, choiceShow, condMap);
    expect(hidden.map((s) => s.id)).not.toContain('step-b');
    expect(visible.map((s) => s.id)).toContain('step-b');
  });
});

// ---------------------------------------------------------------------------
// getNextStepId — currentStepId = null (find first visible step)
// ---------------------------------------------------------------------------

describe('getNextStepId — currentStepId = null', () => {
  it('returns the first step id when it is visible', () => {
    // step-a has no condition → always visible
    expect(getNextStepId(conditionalConfig, noAnswers, condMap, null)).toBe('step-a');
  });

  it('skips the first step when it is hidden and returns the next visible', () => {
    // allHiddenConfig: both hidden with empty answers; let's make step-x visible
    // Use a config where step 0 is conditionally hidden and step 1 is unconditional
    const cfg: WizardConfig = {
      schemaVersion: 1,
      id: 'first-hidden',
      title: 'First hidden',
      steps: [
        {
          id: 'hidden-first',
          title: 'Hidden first',
          condition: { operator: 'equals', fieldId: 'trigger-field', value: 'show' },
          fields: [
            { id: 'trigger-field', key: 'trigger', type: 'text', label: 'T', required: false },
          ],
        },
        {
          id: 'visible-second',
          title: 'Visible second',
          fields: [{ id: 'fv', key: 'val', type: 'text', label: 'V', required: false }],
        },
      ],
    };
    const m = buildFieldKeyMap(cfg);
    expect(getNextStepId(cfg, {}, m, null)).toBe('visible-second');
  });

  it('returns null when all steps are hidden', () => {
    expect(getNextStepId(allHiddenConfig, {}, hiddenMap, null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getNextStepId — normal forward navigation
// ---------------------------------------------------------------------------

describe('getNextStepId — forward navigation', () => {
  it('returns the next visible step id in config order', () => {
    // step-a → step-b (choice = 'show')
    expect(getNextStepId(conditionalConfig, choiceShow, condMap, 'step-a')).toBe('step-b');
  });

  it('skips a hidden intermediate step', () => {
    // step-a → skip step-b (hidden) → step-c
    expect(getNextStepId(conditionalConfig, choiceHide, condMap, 'step-a')).toBe('step-c');
  });

  it('returns null when at the last visible step', () => {
    // step-d is the last visible step (with textFilled); no steps after it
    expect(getNextStepId(conditionalConfig, textFilled, condMap, 'step-d')).toBeNull();
  });

  it('returns null when all remaining steps after current are hidden', () => {
    // At step-c; step-d is hidden (no text_input). Nothing visible after step-c.
    expect(getNextStepId(conditionalConfig, noAnswers, condMap, 'step-c')).toBeNull();
  });

  it('returns null when current is the last config step', () => {
    expect(getNextStepId(conditionalConfig, bothVisible, condMap, 'step-d')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getNextStepId — edge cases
// ---------------------------------------------------------------------------

describe('getNextStepId — edge cases', () => {
  it('returns null when currentStepId is not in config', () => {
    expect(getNextStepId(conditionalConfig, noAnswers, condMap, 'does-not-exist')).toBeNull();
  });

  it('when currentStepId is now hidden, still returns the next visible after its position', () => {
    // User was on step-b (visible when choice='show').
    // Answer changes to choice='hide' → step-b becomes hidden.
    // Next from step-b's position should be step-c (the next visible in config order).
    expect(getNextStepId(conditionalConfig, choiceHide, condMap, 'step-b')).toBe('step-c');
  });

  it('returns null when currentStepId is hidden and no visible steps follow it', () => {
    // From step-d's position with no answers → step-d is hidden, nothing follows.
    expect(getNextStepId(conditionalConfig, noAnswers, condMap, 'step-d')).toBeNull();
  });

  it('returns null for all-hidden config regardless of currentStepId', () => {
    expect(getNextStepId(allHiddenConfig, {}, hiddenMap, 'step-x')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getNextStepId — determinism
// ---------------------------------------------------------------------------

describe('getNextStepId — determinism', () => {
  it('produces the same result across repeated calls with same inputs', () => {
    const r1 = getNextStepId(conditionalConfig, choiceShow, condMap, 'step-a');
    const r2 = getNextStepId(conditionalConfig, choiceShow, condMap, 'step-a');
    const r3 = getNextStepId(conditionalConfig, choiceShow, condMap, 'step-a');
    expect(r1).toBe('step-b');
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });

  it('different answers produce different results (pure function of inputs)', () => {
    const withShow = getNextStepId(conditionalConfig, choiceShow, condMap, 'step-a');
    const withHide = getNextStepId(conditionalConfig, choiceHide, condMap, 'step-a');
    expect(withShow).toBe('step-b');
    expect(withHide).toBe('step-c');
  });
});

// ---------------------------------------------------------------------------
// getPreviousStepId
// ---------------------------------------------------------------------------

describe('getPreviousStepId', () => {
  it('returns null when currentStepId is null', () => {
    expect(getPreviousStepId(null, ['step-a', 'step-b'])).toBeNull();
  });

  it('returns null when visitedStepIds is empty', () => {
    expect(getPreviousStepId('step-a', [])).toBeNull();
  });

  it('returns null when currentStepId is not in visitedStepIds', () => {
    expect(getPreviousStepId('step-z', ['step-a', 'step-b'])).toBeNull();
  });

  it('returns null when currentStepId is the first entry in history', () => {
    expect(getPreviousStepId('step-a', ['step-a', 'step-b'])).toBeNull();
  });

  it('returns the step immediately before current in history', () => {
    expect(getPreviousStepId('step-c', ['step-a', 'step-b', 'step-c'])).toBe('step-b');
  });

  it('returns the step before the LAST occurrence of current (back-and-forth)', () => {
    // History: A → B → A → B; current = B
    // Last B is at index 3; step before it (index 2) is A
    expect(getPreviousStepId('step-b', ['step-a', 'step-b', 'step-a', 'step-b'])).toBe('step-a');
  });

  it('returns the step before the last occurrence of A when current = A and history has multiple A entries', () => {
    // History: A → B → A; current = A
    // Last A is at index 2; step before it (index 1) is B
    expect(getPreviousStepId('step-a', ['step-a', 'step-b', 'step-a'])).toBe('step-b');
  });

  it('is strictly history-based: works correctly even when currentStepId is hidden', () => {
    // step-b was visited but is now conditionally hidden.
    // getPreviousStepId must not consult visibility — returns step-a.
    const visited = ['step-a', 'step-b'];
    expect(getPreviousStepId('step-b', visited)).toBe('step-a');
  });

  it('works with a single-entry history where current is that entry', () => {
    expect(getPreviousStepId('step-a', ['step-a'])).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getPreviousStepId — determinism
// ---------------------------------------------------------------------------

describe('getPreviousStepId — determinism', () => {
  it('produces the same result across repeated calls', () => {
    const visited = ['step-a', 'step-b', 'step-c'];
    const r1 = getPreviousStepId('step-c', visited);
    const r2 = getPreviousStepId('step-c', visited);
    expect(r1).toBe('step-b');
    expect(r1).toBe(r2);
  });
});
