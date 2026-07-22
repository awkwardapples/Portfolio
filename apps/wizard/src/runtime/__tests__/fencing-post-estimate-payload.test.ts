import { describe, it, expect } from 'vitest';

import { fencingWizardConfig, fencingPricingConfig } from '@/domain/fixtures/fencing.config';
import { createWizardStore } from '@/runtime/WizardStore';
import { nullAdapter } from '@/runtime/persistence';
import type { SubmissionPort } from '@/runtime/submission';

/**
 * 6.2: confirms terrain/post_material/gravel_boards answers reach wizard
 * state unfiltered, the same way every other field's answer does —
 * WizardStore.buildRequest() spreads state.answers wholesale into the
 * submission payload with no per-field allowlist (see
 * AUDIT-6.2-validation-pattern.md), so landing in state.answers is
 * sufficient proof the fields reach the wire payload.
 */
describe('fencing-details submission payload plumbing (6.2)', () => {
  it('answers set on the fencing-details fields land in wizard state unfiltered', () => {
    const nullPort: SubmissionPort = {
      submit: () => new Promise(() => undefined), // never resolves; not exercised here
    };
    const store = createWizardStore(
      { wizard: fencingWizardConfig, pricing: fencingPricingConfig },
      nullAdapter,
      nullPort,
    );

    store.hydrate();
    store.dispatch({ type: 'ANSWER_SET', fieldKey: 'terrain', value: 'concrete' });
    store.dispatch({ type: 'ANSWER_SET', fieldKey: 'post_material', value: 'concrete' });
    store.dispatch({ type: 'ANSWER_SET', fieldKey: 'gravel_boards', value: 'yes' });

    const answers = store.getSnapshot().answers;
    expect(answers.terrain).toBe('concrete');
    expect(answers.post_material).toBe('concrete');
    expect(answers.gravel_boards).toBe('yes');
  });
});
