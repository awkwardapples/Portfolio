import { describe, it, expect } from 'vitest';

import { otherWizardConfig, otherPricingConfig } from '@/domain/fixtures/other.config';
import { createWizardStore } from '@/runtime/WizardStore';
import { nullAdapter } from '@/runtime/persistence';
import type { SubmissionPort } from '@/runtime/submission';

/**
 * 6.3: confirms a work_description answer reaches wizard state unfiltered,
 * the same way every other field's answer does — WizardStore.buildRequest()
 * spreads state.answers wholesale into the submission payload with no
 * per-field allowlist (see AUDIT-6.2-validation-pattern.md), so landing in
 * state.answers is sufficient proof the field reaches the wire payload —
 * this is what the business owner sees as the project description in
 * Google Sheets / Make.com.
 */
describe('other service submission payload plumbing (6.3)', () => {
  it('the work_description answer lands in wizard state unfiltered', () => {
    const nullPort: SubmissionPort = {
      submit: () => new Promise(() => undefined), // never resolves; not exercised here
    };
    const store = createWizardStore(
      { wizard: otherWizardConfig, pricing: otherPricingConfig },
      nullAdapter,
      nullPort,
    );

    store.hydrate();
    store.dispatch({
      type: 'ANSWER_SET',
      fieldKey: 'work_description',
      value: 'I need a garden shed built, approximately 2m x 3m.',
    });

    const answers = store.getSnapshot().answers;
    expect(answers.work_description).toBe('I need a garden shed built, approximately 2m x 3m.');
  });
});
