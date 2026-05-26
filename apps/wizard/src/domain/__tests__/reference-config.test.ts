import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { FIELD_TYPES, isFieldType } from '@/domain/config/field-types';
import { fencingWizardConfig, fencingPricingConfig } from '@/domain/fixtures/fencing.config';

describe('canonical fencing reference config', () => {
  it('passes wizard validation', () => {
    const result = validateWizardConfig(fencingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    const wizard = validateWizardConfig(fencingWizardConfig);
    expect(wizard.ok).toBe(true);
    if (!wizard.ok) return;

    const pricing = validatePricingConfig(fencingPricingConfig, wizard.value);
    expect(pricing.ok).toBe(true);
  });
});

describe('field-type registry', () => {
  it('contains the expected canonical types', () => {
    expect(FIELD_TYPES).toEqual([
      'text',
      'textarea',
      'select',
      'radio',
      'checkbox',
      'number',
      'dimensions',
      'photo',
      'review',
    ]);
  });

  it('isFieldType accepts known and rejects unknown', () => {
    expect(isFieldType('select')).toBe(true);
    expect(isFieldType('slect')).toBe(false);
    expect(isFieldType('')).toBe(false);
  });
});
