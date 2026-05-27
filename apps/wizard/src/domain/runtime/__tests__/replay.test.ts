import { describe, expect, it } from 'vitest';

import type { PricingConfig } from '@/domain/config/pricing';
import type { WizardConfig } from '@/domain/config/wizard-config';
import type { WizardEvent } from '@/domain/runtime/events';
import { replay } from '@/domain/runtime/replay';
import { createInitialState } from '@/domain/runtime/state';
import type { SessionConfig } from '@/domain/runtime/state';
import { transition } from '@/domain/runtime/transition';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const wizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'replay-test',
  title: 'Replay test',
  steps: [
    {
      id: 's1',
      title: 'Step 1',
      fields: [{ id: 'f-a', key: 'a', type: 'text', label: 'A', required: true }],
    },
    {
      id: 's2',
      title: 'Step 2',
      fields: [{ id: 'f-b', key: 'b', type: 'number', label: 'B', required: false }],
    },
  ],
};

const pricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: { label: 'Base', perUnitPence: 1000, unit: 'item', quantityFieldId: 'f-b' },
  modifiers: [],
  extras: [],
  bounds: { minPence: 0, maxPence: 999999, rounding: { mode: 'nearest', toPence: 100 } },
  rangeSpreadBasisPoints: 0,
};

const config: SessionConfig = { wizard: wizardConfig, pricing: pricingConfig };
const initial = createInitialState(wizardConfig);

// ---------------------------------------------------------------------------
// replay
// ---------------------------------------------------------------------------

describe('replay', () => {
  it('empty event list returns the initial state unchanged', () => {
    const result = replay(initial, [], config);
    expect(result).toBe(initial);
  });

  it('produces the same final state as applying transitions one at a time', () => {
    const events: WizardEvent[] = [
      { type: 'HYDRATE', restoredAnswers: {} },
      { type: 'ANSWER_SET', fieldKey: 'a', value: 'hello' },
      { type: 'STEP_NEXT' },
      { type: 'ANSWER_SET', fieldKey: 'b', value: 42 },
    ];

    // Replay result
    const replayed = replay(initial, events, config);

    // Sequential result
    let sequential = initial;
    for (const event of events) {
      sequential = transition(sequential, event, config);
    }

    expect(replayed.phase).toBe(sequential.phase);
    expect(replayed.currentStepId).toBe(sequential.currentStepId);
    expect(replayed.answers).toEqual(sequential.answers);
    expect(replayed.visitedStepIds).toEqual(sequential.visitedStepIds);
  });

  it('is deterministic: same inputs always produce the same output', () => {
    const events: WizardEvent[] = [
      { type: 'HYDRATE', restoredAnswers: { a: 'stored' } },
      { type: 'ANSWER_SET', fieldKey: 'a', value: 'overwritten' },
      { type: 'STEP_NEXT' },
    ];

    const r1 = replay(initial, events, config);
    const r2 = replay(initial, events, config);

    expect(r1.answers).toEqual(r2.answers);
    expect(r1.currentStepId).toBe(r2.currentStepId);
    expect(r1.visitedStepIds).toEqual(r2.visitedStepIds);
  });

  it('does not mutate the initial state', () => {
    const events: WizardEvent[] = [
      { type: 'HYDRATE', restoredAnswers: {} },
      { type: 'ANSWER_SET', fieldKey: 'a', value: 'x' },
    ];
    replay(initial, events, config);
    expect(initial.phase).toBe('idle');
    expect(initial.answers).toEqual({});
  });
});
