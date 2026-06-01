import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { deckingWizardConfig, deckingPricingConfig } from '@/domain/fixtures/decking.config';

describe('decking reference config', () => {
  it('passes wizard validation', () => {
    const result = validateWizardConfig(deckingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    const result = validatePricingConfig(deckingPricingConfig, deckingWizardConfig);
    expect(result.ok).toBe(true);
  });
});
