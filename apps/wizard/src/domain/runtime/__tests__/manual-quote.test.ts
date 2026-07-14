import { describe, expect, it } from 'vitest';

import type { PricingConfig } from '@/domain/config/pricing';
import type { WizardConfig } from '@/domain/config/wizard-config';
import type { SessionConfig, WizardState } from '@/domain/runtime/state';
import { createInitialState } from '@/domain/runtime/state';
import { transition } from '@/domain/runtime/transition';

// ---------------------------------------------------------------------------
// Shared fixtures — minimal wizard with one required text field so we can
// control whether validation passes or fails.
// ---------------------------------------------------------------------------

function makeWizardConfig(quoteMode?: 'instant' | 'manual'): WizardConfig {
  return {
    schemaVersion: 1,
    id: 'manual-test',
    title: 'Manual quote test',
    quoteMode,
    steps: [
      {
        id: 's1',
        title: 'Step 1',
        fields: [{ id: 'f-name', key: 'name', type: 'text', label: 'Name', required: true }],
      },
    ],
  };
}

// A pricing config whose quantity field ('qty') is NOT answered, so computePrice
// always returns invalid for an empty AnswerMap. Used to confirm that 'manual'
// mode bypasses this gate.
const pricingConfigAlwaysInvalid: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: { label: 'Base', perUnitPence: 1000, unit: 'item', quantityFieldId: 'qty' },
  modifiers: [],
  extras: [],
  bounds: { minPence: 500, maxPence: 100000, rounding: { mode: 'nearest', toPence: 100 } },
  rangeSpreadBasisPoints: 0,
};

function makeConfig(quoteMode?: 'instant' | 'manual'): SessionConfig {
  return { wizard: makeWizardConfig(quoteMode), pricing: pricingConfigAlwaysInvalid };
}

function validatingState(config: SessionConfig): WizardState {
  const idle = createInitialState(config.wizard);
  const hydrated = transition(idle, { type: 'HYDRATE', restoredAnswers: {} }, config);
  const answered = transition(
    hydrated,
    { type: 'ANSWER_SET', fieldKey: 'name', value: 'Alice' },
    config,
  );
  // answering + SUBMIT_REQUESTED with a valid step → validating
  return transition(answered, { type: 'SUBMIT_REQUESTED' }, config);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('quoteMode: manual — pricing gate bypass', () => {
  it('in validating phase transitions directly to submitting without calling computePrice', () => {
    const config = makeConfig('manual');
    const validating = validatingState(config);
    expect(validating.phase).toBe('validating');

    const next = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(next.phase).toBe('submitting');
  });

  it('still enforces step validation before reaching validating', () => {
    const config = makeConfig('manual');
    const idle = createInitialState(config.wizard);
    const hydrated = transition(idle, { type: 'HYDRATE', restoredAnswers: {} }, config);
    // required 'name' is blank — step is invalid
    const next = transition(hydrated, { type: 'SUBMIT_REQUESTED' }, config);
    expect(next.phase).toBe('answering');
  });

  it('yields phase submitting after two SUBMIT_REQUESTED dispatches (answering → validating → submitting)', () => {
    const config = makeConfig('manual');
    const idle = createInitialState(config.wizard);
    const hydrated = transition(idle, { type: 'HYDRATE', restoredAnswers: {} }, config);
    const answered = transition(
      hydrated,
      { type: 'ANSWER_SET', fieldKey: 'name', value: 'Bob' },
      config,
    );
    const validating = transition(answered, { type: 'SUBMIT_REQUESTED' }, config);
    expect(validating.phase).toBe('validating');
    const submitting = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(submitting.phase).toBe('submitting');
  });
});

describe('quoteMode: instant — pricing gate still applies', () => {
  it('from validating with an unanswered quantity field, returns to answering', () => {
    const config = makeConfig('instant');
    const validating = validatingState(config);
    expect(validating.phase).toBe('validating');

    const next = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(next.phase).toBe('answering');
  });
});

describe("quoteMode: undefined — defaults to 'instant' behaviour", () => {
  it('from validating with an invalid price, returns to answering', () => {
    const config = makeConfig(undefined);
    const validating = validatingState(config);
    expect(validating.phase).toBe('validating');

    const next = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(next.phase).toBe('answering');
  });
});

describe('quoteMode value on WizardConfig', () => {
  it("'instant' and 'manual' are the only accepted literal values (schema proof)", () => {
    const instant = makeWizardConfig('instant');
    const manual = makeWizardConfig('manual');
    const absent = makeWizardConfig(undefined);
    expect(instant.quoteMode).toBe('instant');
    expect(manual.quoteMode).toBe('manual');
    expect(absent.quoteMode).toBeUndefined();
  });
});

describe('manual mode submitting phase is terminal-safe', () => {
  it('submitting phase after manual bypass can receive SUBMIT_SUCCEEDED', () => {
    const config = makeConfig('manual');
    const validating = validatingState(config);
    const submitting = transition(validating, { type: 'SUBMIT_REQUESTED' }, config);
    expect(submitting.phase).toBe('submitting');

    const succeeded = transition(
      submitting,
      { type: 'SUBMIT_SUCCEEDED', submissionId: 'abc-123' },
      config,
    );
    expect(succeeded.phase).toBe('submit_success');
    expect(succeeded.submissionResult).toEqual({
      outcome: 'success',
      submissionId: 'abc-123',
      isDuplicate: false,
    });
  });
});
