import { describe, expect, it } from 'vitest';

import type { PricingConfig } from '@/domain/config/pricing';
import type { WizardConfig } from '@/domain/config/wizard-config';
import type { SubmissionErrorInfo } from '@/domain/runtime/state';
import { createInitialState } from '@/domain/runtime/state';
import type { SessionConfig, WizardState } from '@/domain/runtime/state';
import { transition } from '@/domain/runtime/transition';

// ---------------------------------------------------------------------------
// Shared fixtures
//
//   s1  always visible — required text 'a', optional text 'trigger'
//   s2  visible only when trigger === 'show' — required text 'b'
//   s3  always visible — optional number 'c'
// ---------------------------------------------------------------------------

const wizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'test-wizard',
  title: 'Test wizard',
  steps: [
    {
      id: 's1',
      title: 'Step 1',
      fields: [
        { id: 'f-a', key: 'a', type: 'text', label: 'A', required: true },
        { id: 'f-trigger', key: 'trigger', type: 'text', label: 'Trigger', required: false },
      ],
    },
    {
      id: 's2',
      title: 'Step 2',
      condition: { operator: 'equals', fieldId: 'f-trigger', value: 'show' },
      fields: [{ id: 'f-b', key: 'b', type: 'text', label: 'B', required: true }],
    },
    {
      id: 's3',
      title: 'Step 3',
      fields: [{ id: 'f-c', key: 'c', type: 'number', label: 'C', required: false }],
    },
  ],
};

const pricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: { label: 'Base', perUnitPence: 4500, unit: 'item', quantityFieldId: 'f-c' },
  modifiers: [],
  extras: [],
  bounds: { minPence: 0, maxPence: 1000000, rounding: { mode: 'nearest', toPence: 100 } },
  rangeSpreadBasisPoints: 1500,
};

const config: SessionConfig = { wizard: wizardConfig, pricing: pricingConfig };
const idle = createInitialState(wizardConfig);

// Minimal error for use in submission failure tests
const serverError: SubmissionErrorInfo = {
  code: 'server_error',
  message: 'Oops',
  submissionId: null,
  retryable: true,
};

// Helper: reach answering phase on s1 with no restored answers
function hydratedState(): WizardState {
  return transition(idle, { type: 'HYDRATE', restoredAnswers: {} }, config);
}

// Helper: reach answering phase on s1 with 'a' filled (s1 valid)
function s1ValidState(): WizardState {
  return transition(hydratedState(), { type: 'ANSWER_SET', fieldKey: 'a', value: 'hello' }, config);
}

// Helper: advance past s1 to s3 (no trigger, so s2 is hidden)
function onS3State(): WizardState {
  return transition(s1ValidState(), { type: 'STEP_NEXT' }, config);
}

// Helper: reach submitting phase after all valid steps (quantity field 'c' must be
// set to a non-negative number so the pricing gate passes)
function submittingState(): WizardState {
  const atS3 = onS3State();
  const withQty = transition(atS3, { type: 'ANSWER_SET', fieldKey: 'c', value: 20 }, config);
  // SUBMIT_REQUESTED: answering → validating (all valid)
  const validating = transition(withQty, { type: 'SUBMIT_REQUESTED' }, config);
  // SUBMIT_REQUESTED: validating → submitting (pricing valid)
  return transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
}

// ---------------------------------------------------------------------------
// HYDRATE
// ---------------------------------------------------------------------------

describe('transition — HYDRATE', () => {
  it('idle + HYDRATE → answering on the first visible step', () => {
    const next = transition(idle, { type: 'HYDRATE', restoredAnswers: {} }, config);
    expect(next.phase).toBe('answering');
    expect(next.currentStepId).toBe('s1');
    expect(next.visitedStepIds).toEqual(['s1']);
  });

  it('restores provided answers into state', () => {
    const restored = { a: 'saved' };
    const next = transition(idle, { type: 'HYDRATE', restoredAnswers: restored }, config);
    expect(next.answers).toEqual(restored);
  });

  it('HYDRATE when first step is hidden starts at first visible step', () => {
    // Build a config where s1 is conditionally hidden
    const cfg: WizardConfig = {
      schemaVersion: 1,
      id: 'hidden-first',
      title: 'Hidden first',
      steps: [
        {
          id: 'h1',
          title: 'Hidden',
          condition: { operator: 'equals', fieldId: 'f-gate', value: 'show' },
          fields: [{ id: 'f-gate', key: 'gate', type: 'text', label: 'G', required: false }],
        },
        {
          id: 'h2',
          title: 'Visible',
          fields: [{ id: 'f-v', key: 'v', type: 'text', label: 'V', required: false }],
        },
      ],
    };
    const c: SessionConfig = { wizard: cfg, pricing: pricingConfig };
    const next = transition(createInitialState(cfg), { type: 'HYDRATE', restoredAnswers: {} }, c);
    expect(next.currentStepId).toBe('h2');
  });

  it('non-idle + HYDRATE is a no-op (identity)', () => {
    const answering = hydratedState();
    const after = transition(answering, { type: 'HYDRATE', restoredAnswers: { a: 'x' } }, config);
    expect(after).toBe(answering);
  });
});

// ---------------------------------------------------------------------------
// ANSWER_SET
// ---------------------------------------------------------------------------

describe('transition — ANSWER_SET', () => {
  it('updates answers in the state', () => {
    const next = transition(
      hydratedState(),
      { type: 'ANSWER_SET', fieldKey: 'a', value: 'hello' },
      config,
    );
    expect(next.answers['a']).toBe('hello');
  });

  it('stays in answering phase', () => {
    const next = transition(
      hydratedState(),
      { type: 'ANSWER_SET', fieldKey: 'a', value: 'x' },
      config,
    );
    expect(next.phase).toBe('answering');
  });

  it('clears the current step validation snapshot', () => {
    // First validate step s1
    const withSnapshot = transition(
      hydratedState(),
      { type: 'VALIDATE_STEP', stepId: 's1' },
      config,
    );
    expect(withSnapshot.validationByStep['s1']).toBeDefined();

    // Then change an answer — snapshot should be cleared
    const afterEdit = transition(
      withSnapshot,
      { type: 'ANSWER_SET', fieldKey: 'a', value: 'new' },
      config,
    );
    expect(afterEdit.validationByStep['s1']).toBeUndefined();
  });

  it('clears validating phase back to answering', () => {
    // Put state into validating (valid answers, SUBMIT_REQUESTED)
    const validating = transition(
      transition(s1ValidState(), { type: 'STEP_NEXT' }, config),
      { type: 'SUBMIT_REQUESTED' },
      config,
    );
    expect(validating.phase).toBe('validating');

    const afterEdit = transition(
      validating,
      { type: 'ANSWER_SET', fieldKey: 'a', value: 'changed' },
      config,
    );
    expect(afterEdit.phase).toBe('answering');
  });

  it('idle + ANSWER_SET is a no-op', () => {
    const after = transition(idle, { type: 'ANSWER_SET', fieldKey: 'a', value: 'x' }, config);
    expect(after).toBe(idle);
  });
});

// ---------------------------------------------------------------------------
// STEP_NEXT
// ---------------------------------------------------------------------------

describe('transition — STEP_NEXT', () => {
  it('advances to the next visible step when current step is valid', () => {
    const next = transition(s1ValidState(), { type: 'STEP_NEXT' }, config);
    expect(next.currentStepId).toBe('s3');
    expect(next.visitedStepIds).toContain('s3');
  });

  it('stays on current step when current step is invalid (writes error snapshot)', () => {
    // s1 is not filled yet — required 'a' is empty
    const next = transition(hydratedState(), { type: 'STEP_NEXT' }, config);
    expect(next.currentStepId).toBe('s1');
    expect(next.validationByStep['s1']?.valid).toBe(false);
  });

  it('skips a hidden intermediate step', () => {
    // trigger is not set, so s2 is hidden — s1 → s3 directly
    const next = transition(s1ValidState(), { type: 'STEP_NEXT' }, config);
    expect(next.currentStepId).toBe('s3');
  });

  it('includes the hidden step when trigger is set', () => {
    const withTrigger = transition(
      hydratedState(),
      { type: 'ANSWER_SET', fieldKey: 'a', value: 'hello' },
      config,
    );
    const withShow = transition(
      withTrigger,
      { type: 'ANSWER_SET', fieldKey: 'trigger', value: 'show' },
      config,
    );
    const next = transition(withShow, { type: 'STEP_NEXT' }, config);
    expect(next.currentStepId).toBe('s2');
  });

  it('stays on last step (validates in place, no phase change)', () => {
    const atS3 = onS3State();
    const after = transition(atS3, { type: 'STEP_NEXT' }, config);
    expect(after.currentStepId).toBe('s3');
    expect(after.phase).toBe('answering');
  });

  it('writes a validation snapshot even when invalid', () => {
    const next = transition(hydratedState(), { type: 'STEP_NEXT' }, config);
    expect(next.validationByStep['s1']).toBeDefined();
    expect(next.validationByStep['s1']?.issues.length).toBeGreaterThan(0);
  });

  it('appends the next step to visitedStepIds', () => {
    const next = transition(s1ValidState(), { type: 'STEP_NEXT' }, config);
    expect(next.visitedStepIds).toEqual(['s1', 's3']);
  });

  it('idle + STEP_NEXT is a no-op', () => {
    const after = transition(idle, { type: 'STEP_NEXT' }, config);
    expect(after).toBe(idle);
  });
});

// ---------------------------------------------------------------------------
// STEP_BACK
// ---------------------------------------------------------------------------

describe('transition — STEP_BACK', () => {
  it('returns to the previous step in visit history', () => {
    const atS3 = onS3State(); // history: [s1, s3]
    const back = transition(atS3, { type: 'STEP_BACK' }, config);
    expect(back.currentStepId).toBe('s1');
  });

  it('pops the current step from visitedStepIds (does not append)', () => {
    const atS3 = onS3State(); // history: [s1, s3]
    const back = transition(atS3, { type: 'STEP_BACK' }, config);
    expect(back.visitedStepIds).toEqual(['s1']);
  });

  it('is a no-op when there is no previous step in history', () => {
    const atS1 = hydratedState(); // visited only [s1]
    const after = transition(atS1, { type: 'STEP_BACK' }, config);
    expect(after.currentStepId).toBe('s1');
  });

  it('returns to answering phase from validating', () => {
    const validating = transition(
      transition(s1ValidState(), { type: 'STEP_NEXT' }, config),
      { type: 'SUBMIT_REQUESTED' },
      config,
    );
    expect(validating.phase).toBe('validating');
    const back = transition(validating, { type: 'STEP_BACK' }, config);
    expect(back.phase).toBe('answering');
  });

  it('handles back-and-forth correctly (pop keeps history clean)', () => {
    // s1 → s3 → back to s1 → s3 again; back from s3 should still return s1
    const s3a = transition(s1ValidState(), { type: 'STEP_NEXT' }, config); // [s1,s3]
    const backToS1 = transition(s3a, { type: 'STEP_BACK' }, config); // [s1] (popped s3)
    // Fill a again (cleared by navigation)
    const refilled = transition(
      backToS1,
      { type: 'ANSWER_SET', fieldKey: 'a', value: 'x' },
      config,
    );
    const s3b = transition(refilled, { type: 'STEP_NEXT' }, config); // [s1,s3]
    expect(s3b.currentStepId).toBe('s3');
    const back2 = transition(s3b, { type: 'STEP_BACK' }, config);
    expect(back2.currentStepId).toBe('s1');
  });

  it('idle + STEP_BACK is a no-op', () => {
    expect(transition(idle, { type: 'STEP_BACK' }, config)).toBe(idle);
  });

  it('second Back from s1 after returning is a no-op (history is [s1] after pop)', () => {
    // After popping, history is [s1]; pressing Back again from s1 should be a no-op.
    const s3a = transition(s1ValidState(), { type: 'STEP_NEXT' }, config); // [s1,s3]
    const backToS1 = transition(s3a, { type: 'STEP_BACK' }, config); // [s1]
    const secondBack = transition(backToS1, { type: 'STEP_BACK' }, config);
    expect(secondBack.currentStepId).toBe('s1'); // unchanged
    expect(secondBack.visitedStepIds).toEqual(['s1']); // unchanged
  });

  it('Back does not go forward when pressed twice in a row (the original bug)', () => {
    // Bug: appending prevId caused getPreviousStepId to find the appended entry
    // on a second press, navigating to s3 instead of staying at s1.
    const atS3 = onS3State(); // history: [s1, s3]
    const back1 = transition(atS3, { type: 'STEP_BACK' }, config); // should be s1, history [s1]
    expect(back1.currentStepId).toBe('s1');
    const back2 = transition(back1, { type: 'STEP_BACK' }, config); // no-op, still s1
    expect(back2.currentStepId).toBe('s1');
    expect(back2).toBe(back1); // same reference (no-op returns identical state)
  });

  it('visitedStepIds after NEXT→BACK is symmetric: same as before NEXT', () => {
    const before = s1ValidState(); // [s1]
    const afterNext = transition(before, { type: 'STEP_NEXT' }, config); // [s1, s3]
    const afterBack = transition(afterNext, { type: 'STEP_BACK' }, config); // [s1]
    expect(afterBack.visitedStepIds).toEqual(before.visitedStepIds);
  });

  it('multiple steps back reduces history one step at a time', () => {
    // Build history s1→s3 with a conditional step skipped.
    const atS3 = onS3State(); // [s1, s3]
    const back1 = transition(atS3, { type: 'STEP_BACK' }, config); // [s1]
    expect(back1.visitedStepIds).toEqual(['s1']);
    expect(back1.currentStepId).toBe('s1');
    // Can't go further back (s1 is the initial step).
    const back2 = transition(back1, { type: 'STEP_BACK' }, config);
    expect(back2.currentStepId).toBe('s1');
  });
});

// ---------------------------------------------------------------------------
// STEP_GOTO
// ---------------------------------------------------------------------------

describe('transition — STEP_GOTO', () => {
  it('jumps to a visited visible step', () => {
    const atS3 = onS3State(); // visited: [s1, s3]
    const goto = transition(atS3, { type: 'STEP_GOTO', stepId: 's1' }, config);
    expect(goto.currentStepId).toBe('s1');
  });

  it('appends the target to visitedStepIds', () => {
    const atS3 = onS3State();
    const goto = transition(atS3, { type: 'STEP_GOTO', stepId: 's1' }, config);
    expect(goto.visitedStepIds).toEqual(['s1', 's3', 's1']);
  });

  it('is a no-op when target is not in visited history', () => {
    const atS1 = hydratedState(); // visited: [s1] only
    const after = transition(atS1, { type: 'STEP_GOTO', stepId: 's3' }, config);
    expect(after.currentStepId).toBe('s1');
  });

  it('is a no-op when target step is now hidden', () => {
    // Visit s2 by setting trigger='show', then clear trigger so s2 is hidden
    const withTrigger = transition(
      transition(hydratedState(), { type: 'ANSWER_SET', fieldKey: 'a', value: 'x' }, config),
      { type: 'ANSWER_SET', fieldKey: 'trigger', value: 'show' },
      config,
    );
    const atS2 = transition(withTrigger, { type: 'STEP_NEXT' }, config); // to s2; visited: [s1,s2]
    const cleared = transition(
      atS2,
      { type: 'ANSWER_SET', fieldKey: 'trigger', value: '' },
      config,
    );
    // s2 is now hidden; GOTO to s2 should be no-op
    const after = transition(cleared, { type: 'STEP_GOTO', stepId: 's2' }, config);
    expect(after.currentStepId).toBe('s2'); // stays on s2 (current) since GOTO was no-op
  });

  it('idle + STEP_GOTO is a no-op', () => {
    expect(transition(idle, { type: 'STEP_GOTO', stepId: 's1' }, config)).toBe(idle);
  });
});

// ---------------------------------------------------------------------------
// VALIDATE_STEP
// ---------------------------------------------------------------------------

describe('transition — VALIDATE_STEP', () => {
  it('writes a validation snapshot without navigating', () => {
    const next = transition(hydratedState(), { type: 'VALIDATE_STEP', stepId: 's1' }, config);
    expect(next.currentStepId).toBe('s1');
    expect(next.validationByStep['s1']).toBeDefined();
  });

  it('snapshot reflects current answer state', () => {
    const valid = transition(s1ValidState(), { type: 'VALIDATE_STEP', stepId: 's1' }, config);
    expect(valid.validationByStep['s1']?.valid).toBe(true);

    const invalid = transition(hydratedState(), { type: 'VALIDATE_STEP', stepId: 's1' }, config);
    expect(invalid.validationByStep['s1']?.valid).toBe(false);
  });

  it('does not change phase', () => {
    const next = transition(hydratedState(), { type: 'VALIDATE_STEP', stepId: 's1' }, config);
    expect(next.phase).toBe('answering');
  });

  it('is a no-op for an unknown stepId', () => {
    const state = hydratedState();
    const after = transition(state, { type: 'VALIDATE_STEP', stepId: 'no-such-step' }, config);
    expect(after.validationByStep).toEqual(state.validationByStep);
  });
});

// ---------------------------------------------------------------------------
// SUBMIT_REQUESTED
// ---------------------------------------------------------------------------

describe('transition — SUBMIT_REQUESTED', () => {
  it('answering (all valid) → validating', () => {
    const atS3 = onS3State();
    const next = transition(atS3, { type: 'SUBMIT_REQUESTED' }, config);
    expect(next.phase).toBe('validating');
  });

  it('answering (invalid step) → stays answering with errors', () => {
    // s1 required field not filled
    const next = transition(hydratedState(), { type: 'SUBMIT_REQUESTED' }, config);
    expect(next.phase).toBe('answering');
    expect(next.validationByStep['s1']?.valid).toBe(false);
  });

  it('validating → submitting when pricing is valid', () => {
    const withQty = transition(
      onS3State(),
      { type: 'ANSWER_SET', fieldKey: 'c', value: 10 },
      config,
    );
    const validating = transition(withQty, { type: 'SUBMIT_REQUESTED' }, config);
    expect(validating.phase).toBe('validating');
    const submitting = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(submitting.phase).toBe('submitting');
  });

  it('validates ALL visible steps on submit attempt', () => {
    // s2 is hidden here; only s1 and s3 should be validated
    const atS3 = onS3State(); // s1 and s3 visible, s2 hidden
    const next = transition(atS3, { type: 'SUBMIT_REQUESTED' }, config);
    expect(next.validationByStep['s1']).toBeDefined();
    expect(next.validationByStep['s3']).toBeDefined();
    // s2 is hidden; should not be validated
    expect(next.validationByStep['s2']).toBeUndefined();
  });

  it('does not validate hidden steps', () => {
    const atS3WithTrigger = (() => {
      const base = transition(
        hydratedState(),
        { type: 'ANSWER_SET', fieldKey: 'a', value: 'hi' },
        config,
      );
      return transition(base, { type: 'ANSWER_SET', fieldKey: 'trigger', value: 'show' }, config);
    })();
    // s2 is now visible but b is empty → submit fails
    const next = transition(atS3WithTrigger, { type: 'SUBMIT_REQUESTED' }, config);
    expect(next.validationByStep['s2']?.valid).toBe(false);
  });

  it('submitting + SUBMIT_REQUESTED is a no-op', () => {
    const s = submittingState();
    const after = transition(s, { type: 'SUBMIT_REQUESTED' }, config);
    expect(after).toBe(s);
  });
});

// ---------------------------------------------------------------------------
// Pricing gate (validating → submitting)
// ---------------------------------------------------------------------------

describe('transition — pricing gate', () => {
  it('validating + SUBMIT_REQUESTED returns to answering when quantity is not set', () => {
    // 'c' (quantity field) is never filled → computePrice returns valid: false
    const validating = transition(onS3State(), { type: 'SUBMIT_REQUESTED' }, config);
    expect(validating.phase).toBe('validating');
    const blocked = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(blocked.phase).toBe('answering');
  });

  it('validating + SUBMIT_REQUESTED returns to answering when quantity is negative', () => {
    const withNegQty = transition(
      onS3State(),
      { type: 'ANSWER_SET', fieldKey: 'c', value: -5 },
      config,
    );
    const validating = transition(withNegQty, { type: 'SUBMIT_REQUESTED' }, config);
    expect(validating.phase).toBe('validating');
    const blocked = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(blocked.phase).toBe('answering');
  });

  it('validating + SUBMIT_REQUESTED advances to submitting when quantity is zero', () => {
    // qty=0 is a valid non-negative number — price is computed (possibly clamped to min)
    const withZero = transition(
      onS3State(),
      { type: 'ANSWER_SET', fieldKey: 'c', value: 0 },
      config,
    );
    const validating = transition(withZero, { type: 'SUBMIT_REQUESTED' }, config);
    expect(validating.phase).toBe('validating');
    const submitting = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(submitting.phase).toBe('submitting');
  });

  it('validating + SUBMIT_REQUESTED advances to submitting when pricing is valid', () => {
    const withQty = transition(
      onS3State(),
      { type: 'ANSWER_SET', fieldKey: 'c', value: 5 },
      config,
    );
    const validating = transition(withQty, { type: 'SUBMIT_REQUESTED' }, config);
    const submitting = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(submitting.phase).toBe('submitting');
  });
});

// ---------------------------------------------------------------------------
// SUBMIT_SUCCEEDED / SUBMIT_FAILED
// ---------------------------------------------------------------------------

describe('transition — SUBMIT_SUCCEEDED', () => {
  it('submitting + SUBMIT_SUCCEEDED → submit_success', () => {
    const next = transition(
      submittingState(),
      { type: 'SUBMIT_SUCCEEDED', submissionId: 'sub-1' },
      config,
    );
    expect(next.phase).toBe('submit_success');
    expect(next.submissionResult).toEqual({ outcome: 'success', submissionId: 'sub-1' });
    expect(next.currentStepId).toBeNull();
  });

  it('non-submitting + SUBMIT_SUCCEEDED is a no-op', () => {
    const state = hydratedState();
    const after = transition(state, { type: 'SUBMIT_SUCCEEDED', submissionId: 'sub-1' }, config);
    expect(after).toBe(state);
  });
});

describe('transition — SUBMIT_FAILED', () => {
  it('submitting + SUBMIT_FAILED → submit_failure', () => {
    const next = transition(
      submittingState(),
      { type: 'SUBMIT_FAILED', error: serverError },
      config,
    );
    expect(next.phase).toBe('submit_failure');
    expect(next.submissionResult).toEqual({ outcome: 'failure', error: serverError });
  });

  it('non-submitting + SUBMIT_FAILED is a no-op', () => {
    const state = hydratedState();
    const after = transition(state, { type: 'SUBMIT_FAILED', error: serverError }, config);
    expect(after).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// SUBMIT_RETRY
// ---------------------------------------------------------------------------

describe('transition — SUBMIT_RETRY', () => {
  it('submit_failure + SUBMIT_RETRY → submitting', () => {
    const failed = transition(
      submittingState(),
      { type: 'SUBMIT_FAILED', error: serverError },
      config,
    );
    const retried = transition(failed, { type: 'SUBMIT_RETRY' }, config);
    expect(retried.phase).toBe('submitting');
    expect(retried.submissionResult).toBeNull();
  });

  it('non-failure + SUBMIT_RETRY is a no-op', () => {
    const state = hydratedState();
    const after = transition(state, { type: 'SUBMIT_RETRY' }, config);
    expect(after).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// Illegal transitions — identity contract
// ---------------------------------------------------------------------------

describe('transition — illegal transitions return identity', () => {
  it('submit_success + any event returns same state', () => {
    const success = transition(
      submittingState(),
      { type: 'SUBMIT_SUCCEEDED', submissionId: 'x' },
      config,
    );
    const events = [
      { type: 'ANSWER_SET', fieldKey: 'a', value: 'y' } as const,
      { type: 'STEP_NEXT' } as const,
      { type: 'STEP_BACK' } as const,
      { type: 'SUBMIT_REQUESTED' } as const,
      { type: 'SUBMIT_RETRY' } as const,
    ];
    for (const event of events) {
      expect(transition(success, event, config)).toBe(success);
    }
  });

  it('submitting + navigation events return same state', () => {
    const s = submittingState();
    expect(transition(s, { type: 'STEP_NEXT' }, config)).toBe(s);
    expect(transition(s, { type: 'STEP_BACK' }, config)).toBe(s);
    expect(transition(s, { type: 'ANSWER_SET', fieldKey: 'a', value: 'x' }, config)).toBe(s);
  });
});

// ---------------------------------------------------------------------------
// Submission lifecycle — full round-trips
// ---------------------------------------------------------------------------

describe('submission lifecycle — success path', () => {
  it('HYDRATE → fill → STEP_NEXT → SUBMIT_REQUESTED → validating → SUBMIT_REQUESTED → submitting → SUBMIT_SUCCEEDED → submit_success', () => {
    const s0 = idle;
    const s1 = transition(s0, { type: 'HYDRATE', restoredAnswers: {} }, config);
    const s2 = transition(s1, { type: 'ANSWER_SET', fieldKey: 'a', value: 'hello' }, config);
    const s3 = transition(s2, { type: 'STEP_NEXT' }, config); // to s3
    expect(s3.currentStepId).toBe('s3');
    // fill the quantity field so the pricing gate passes
    const s3c = transition(s3, { type: 'ANSWER_SET', fieldKey: 'c', value: 10 }, config);

    const validating = transition(s3c, { type: 'SUBMIT_REQUESTED' }, config);
    expect(validating.phase).toBe('validating');

    const submitting = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(submitting.phase).toBe('submitting');

    const success = transition(
      submitting,
      { type: 'SUBMIT_SUCCEEDED', submissionId: 'sub-abc' },
      config,
    );
    expect(success.phase).toBe('submit_success');
    expect(
      (success.submissionResult as { outcome: string; submissionId: string }).submissionId,
    ).toBe('sub-abc');
  });
});

describe('submission lifecycle — failure and retry path', () => {
  it('submitting → SUBMIT_FAILED → submit_failure → SUBMIT_RETRY → submitting → SUBMIT_SUCCEEDED → submit_success', () => {
    const s = submittingState();
    const failed = transition(s, { type: 'SUBMIT_FAILED', error: serverError }, config);
    expect(failed.phase).toBe('submit_failure');

    const retried = transition(failed, { type: 'SUBMIT_RETRY' }, config);
    expect(retried.phase).toBe('submitting');

    const success = transition(
      retried,
      { type: 'SUBMIT_SUCCEEDED', submissionId: 'sub-retry' },
      config,
    );
    expect(success.phase).toBe('submit_success');
    expect(
      (success.submissionResult as { outcome: string; submissionId: string }).submissionId,
    ).toBe('sub-retry');
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('transition — determinism', () => {
  it('same inputs always produce the same output', () => {
    const state = hydratedState();
    const event = { type: 'ANSWER_SET' as const, fieldKey: 'a', value: 'test' };
    const r1 = transition(state, event, config);
    const r2 = transition(state, event, config);
    const r3 = transition(state, event, config);
    expect(r1.answers).toEqual(r2.answers);
    expect(r2.answers).toEqual(r3.answers);
  });

  it('does not mutate the input state', () => {
    const state = hydratedState();
    const before = { ...state.answers };
    transition(state, { type: 'ANSWER_SET', fieldKey: 'a', value: 'x' }, config);
    expect(state.answers).toEqual(before);
  });
});
