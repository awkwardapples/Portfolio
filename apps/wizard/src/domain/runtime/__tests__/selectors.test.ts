import { describe, expect, it } from 'vitest';

import type { PricingConfig } from '@/domain/config/pricing';
import type { WizardConfig } from '@/domain/config/wizard-config';
import {
  selectAnsweredCounts,
  selectCanGoBack,
  selectCanGoNext,
  selectCompletionPercent,
  selectCurrentStep,
  selectStepValidation,
  selectVisibleSteps,
} from '@/domain/runtime/selectors';
import { createInitialState } from '@/domain/runtime/state';
import type { SessionConfig, WizardState } from '@/domain/runtime/state';
import { transition } from '@/domain/runtime/transition';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const wizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'selector-test',
  title: 'Selector test',
  steps: [
    {
      id: 's1',
      title: 'Step 1',
      fields: [
        { id: 'f-a', key: 'a', type: 'text', label: 'A', required: false },
        { id: 'f-switch', key: 'sw', type: 'text', label: 'Switch', required: false },
      ],
    },
    {
      id: 's2',
      title: 'Step 2',
      condition: { operator: 'equals', fieldId: 'f-switch', value: 'on' },
      fields: [{ id: 'f-b', key: 'b', type: 'text', label: 'B', required: false }],
    },
    {
      id: 's3',
      title: 'Step 3',
      fields: [{ id: 'f-c', key: 'c', type: 'text', label: 'C', required: false }],
    },
  ],
};

const pricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: { label: 'Base', perUnitPence: 1000, unit: 'item', quantityFieldId: 'f-a' },
  modifiers: [],
  extras: [],
  bounds: { minPence: 0, maxPence: 999999, rounding: { mode: 'nearest', toPence: 100 } },
  rangeSpreadBasisPoints: 0,
};

const config: SessionConfig = { wizard: wizardConfig, pricing: pricingConfig };
const idle = createInitialState(wizardConfig);

function answering(): WizardState {
  return transition(idle, { type: 'HYDRATE', restoredAnswers: {} }, config);
}

function onS3(): WizardState {
  // s1 → s3 (s2 hidden, sw not set)
  return transition(answering(), { type: 'STEP_NEXT' }, config);
}

// ---------------------------------------------------------------------------
// selectVisibleSteps
// ---------------------------------------------------------------------------

describe('selectVisibleSteps', () => {
  it('returns all unconditional steps when no answers set', () => {
    const visible = selectVisibleSteps(answering(), config);
    expect(visible.map((s) => s.id)).toEqual(['s1', 's3']);
  });

  it('includes conditional step when its condition is met', () => {
    const state = transition(
      answering(),
      { type: 'ANSWER_SET', fieldKey: 'sw', value: 'on' },
      config,
    );
    expect(selectVisibleSteps(state, config).map((s) => s.id)).toEqual(['s1', 's2', 's3']);
  });

  it('excludes conditional step when its condition is not met', () => {
    const visible = selectVisibleSteps(answering(), config);
    expect(visible.map((s) => s.id)).not.toContain('s2');
  });
});

// ---------------------------------------------------------------------------
// selectCurrentStep
// ---------------------------------------------------------------------------

describe('selectCurrentStep', () => {
  it('returns the Step object for the current step', () => {
    const step = selectCurrentStep(answering(), config);
    expect(step?.id).toBe('s1');
  });

  it('returns null when currentStepId is null (idle)', () => {
    expect(selectCurrentStep(idle, config)).toBeNull();
  });

  it('returns null when currentStepId is not found in config', () => {
    const state = { ...answering(), currentStepId: 'does-not-exist' };
    expect(selectCurrentStep(state, config)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// selectCompletionPercent
// ---------------------------------------------------------------------------

describe('selectCompletionPercent', () => {
  it('returns 0 when there is no current step', () => {
    expect(selectCompletionPercent(idle, config)).toBe(0);
  });

  it('returns 50 when on the first of two visible steps', () => {
    // Visible: [s1, s3]; on s1 → 1/2 = 50%
    expect(selectCompletionPercent(answering(), config)).toBe(50);
  });

  it('returns 100 when on the last visible step', () => {
    expect(selectCompletionPercent(onS3(), config)).toBe(100);
  });

  it('returns 33 when on step 1 of 3 visible steps', () => {
    const withSwitch = transition(
      answering(),
      { type: 'ANSWER_SET', fieldKey: 'sw', value: 'on' },
      config,
    );
    expect(selectCompletionPercent(withSwitch, config)).toBe(33);
  });

  it('returns 0 when currentStepId is not in visible steps', () => {
    const state = { ...answering(), currentStepId: 'ghost-step' };
    expect(selectCompletionPercent(state, config)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// selectAnsweredCounts
// ---------------------------------------------------------------------------

describe('selectAnsweredCounts', () => {
  it('returns 0 answered and 2 total before any navigation', () => {
    // On s1 (visited), s3 visible but not visited
    const counts = selectAnsweredCounts(answering(), config);
    expect(counts.answered).toBe(1); // s1 is in visitedStepIds
    expect(counts.total).toBe(2);
  });

  it('answered increases as steps are visited', () => {
    const counts = selectAnsweredCounts(onS3(), config);
    expect(counts.answered).toBe(2); // s1 and s3 both visited
    expect(counts.total).toBe(2);
  });

  it('total reflects visible steps only', () => {
    const withSwitch = transition(
      answering(),
      { type: 'ANSWER_SET', fieldKey: 'sw', value: 'on' },
      config,
    );
    expect(selectAnsweredCounts(withSwitch, config).total).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// selectStepValidation
// ---------------------------------------------------------------------------

describe('selectStepValidation', () => {
  it('returns null before any validation has run', () => {
    expect(selectStepValidation(answering(), 's1')).toBeNull();
  });

  it('returns the snapshot after VALIDATE_STEP', () => {
    const state = transition(answering(), { type: 'VALIDATE_STEP', stepId: 's1' }, config);
    const snapshot = selectStepValidation(state, 's1');
    expect(snapshot).not.toBeNull();
    expect(snapshot?.stepId).toBe('s1');
  });

  it('returns null for an unknown stepId', () => {
    expect(selectStepValidation(answering(), 'no-step')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// selectCanGoBack
// ---------------------------------------------------------------------------

describe('selectCanGoBack', () => {
  it('returns false on the first step (no history before it)', () => {
    expect(selectCanGoBack(answering())).toBe(false);
  });

  it('returns true after navigating to a second step', () => {
    expect(selectCanGoBack(onS3())).toBe(true);
  });

  it('returns false in idle state', () => {
    expect(selectCanGoBack(idle)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// selectCanGoNext
// ---------------------------------------------------------------------------

describe('selectCanGoNext', () => {
  it('returns true on the first of multiple visible steps', () => {
    expect(selectCanGoNext(answering(), config)).toBe(true);
  });

  it('returns false on the last visible step', () => {
    expect(selectCanGoNext(onS3(), config)).toBe(false);
  });

  it('returns false in idle state', () => {
    expect(selectCanGoNext(idle, config)).toBe(false);
  });
});
