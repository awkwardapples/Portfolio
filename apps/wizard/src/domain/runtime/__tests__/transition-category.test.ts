import { describe, expect, it } from 'vitest';

import type { PricingConfig } from '@/domain/config/pricing';
import type { WizardConfig } from '@/domain/config/wizard-config';
import type { SessionConfig, WizardState } from '@/domain/runtime/state';
import { createInitialState } from '@/domain/runtime/state';
import { transition } from '@/domain/runtime/transition';

const wizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'cat-test',
  title: 'Category test wizard',
  steps: [
    {
      id: 's1',
      title: 'Step 1',
      fields: [{ id: 'f-a', key: 'a', type: 'text', label: 'A', required: false }],
    },
  ],
};

const pricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: { label: 'Base', perUnitPence: 1000, unit: 'item', quantityFieldId: 'f-a' },
  modifiers: [],
  extras: [],
  bounds: { minPence: 0, maxPence: 100000, rounding: { mode: 'nearest', toPence: 100 } },
  rangeSpreadBasisPoints: 0,
};

const config: SessionConfig = { wizard: wizardConfig, pricing: pricingConfig };
const idle = createInitialState(wizardConfig);

function hydratedState(): WizardState {
  return transition(idle, { type: 'HYDRATE', restoredAnswers: {} }, config);
}

function categorySelectionState(): WizardState {
  return { ...idle, phase: 'category_selection' };
}

describe('selectedCategoryId initial value', () => {
  it('is null in the initial state produced by createInitialState', () => {
    expect(idle.selectedCategoryId).toBeNull();
  });
});

describe('CATEGORY_SELECTED from answering phase', () => {
  it('sets selectedCategoryId and stays in answering', () => {
    const answering = hydratedState();
    expect(answering.phase).toBe('answering');

    const next = transition(
      answering,
      { type: 'CATEGORY_SELECTED', categoryId: 'landscaping' },
      config,
    );

    expect(next.phase).toBe('answering');
    expect(next.selectedCategoryId).toBe('landscaping');
  });

  it('can be called twice; the second call overwrites the first', () => {
    const answering = hydratedState();
    const after1 = transition(
      answering,
      { type: 'CATEGORY_SELECTED', categoryId: 'fencing' },
      config,
    );
    const after2 = transition(after1, { type: 'CATEGORY_SELECTED', categoryId: 'decking' }, config);

    expect(after2.selectedCategoryId).toBe('decking');
  });
});

describe('CATEGORY_SELECTED from category_selection phase', () => {
  it('transitions to answering and records the categoryId', () => {
    const state = categorySelectionState();
    const next = transition(state, { type: 'CATEGORY_SELECTED', categoryId: 'decking' }, config);

    expect(next.phase).toBe('answering');
    expect(next.selectedCategoryId).toBe('decking');
  });
});

describe('CATEGORY_SELECTED no-op phases', () => {
  it('is a no-op in idle phase (returns same state)', () => {
    const next = transition(idle, { type: 'CATEGORY_SELECTED', categoryId: 'x' }, config);
    expect(next).toBe(idle);
  });

  it('is a no-op in submitting phase', () => {
    const submitting: WizardState = { ...idle, phase: 'submitting' };
    const next = transition(submitting, { type: 'CATEGORY_SELECTED', categoryId: 'x' }, config);
    expect(next).toBe(submitting);
  });
});

describe('SessionConfig enableCategoryNavigation', () => {
  it('is optional — a config without it still compiles and transitions cleanly', () => {
    const minimalConfig: SessionConfig = { wizard: wizardConfig, pricing: pricingConfig };
    const next = transition(idle, { type: 'HYDRATE', restoredAnswers: {} }, minimalConfig);
    expect(next.phase).toBe('answering');
  });
});
