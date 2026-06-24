import { describe, it, expect } from 'vitest';

import { addressPreStep } from '../address-prestep';

describe('addressPreStep', () => {
  it('has the expected stable step id', () => {
    expect(addressPreStep.id).toBe('contact-and-address');
  });

  it('has exactly four fields', () => {
    expect(addressPreStep.fields).toHaveLength(4);
  });

  it('all fields use type text (no tel or email field types)', () => {
    for (const field of addressPreStep.fields) {
      expect(field.type).toBe('text');
    }
  });

  it('all fields are required', () => {
    for (const field of addressPreStep.fields) {
      expect(field.required).toBe(true);
    }
  });

  it('field keys are the shared contact keys that trigger auto-fill and format validation', () => {
    const keys = addressPreStep.fields.map((f) => f.key);
    expect(keys).toContain('contact_name');
    expect(keys).toContain('postcode');
    expect(keys).toContain('contact_phone');
    expect(keys).toContain('contact_email');
  });
});
