import { describe, it, expect } from 'vitest';

import { addressPreStep } from '../address-prestep';

describe('addressPreStep', () => {
  it('has the expected stable step id', () => {
    expect(addressPreStep.id).toBe('postcode_prestep');
  });

  it('has exactly one field (postcode only — full contact moved to end-of-wizard step)', () => {
    expect(addressPreStep.fields).toHaveLength(1);
  });

  it('field is type text', () => {
    expect(addressPreStep.fields[0]!.type).toBe('text');
  });

  it('field is required', () => {
    expect(addressPreStep.fields[0]!.required).toBe(true);
  });

  it('field key is "postcode" — triggers UK postcode format validation via FORMAT_VALIDATORS', () => {
    expect(addressPreStep.fields[0]!.key).toBe('postcode');
  });
});
