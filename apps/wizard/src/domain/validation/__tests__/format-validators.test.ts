import { describe, it, expect } from 'vitest';

import { validatePostcode } from '../address-validator';
import { validateEmail } from '../email-validator';
import { validatePhone } from '../phone-validator';
import { FORMAT_VALIDATORS } from '../format-validators';

// ---------------------------------------------------------------------------
// validatePostcode
// ---------------------------------------------------------------------------

describe('validatePostcode', () => {
  it('returns invalid for empty string', () => {
    expect(validatePostcode('').valid).toBe(false);
    expect(validatePostcode('').errorMessage).toMatch(/postcode/i);
  });

  it('returns invalid for whitespace-only input', () => {
    expect(validatePostcode('   ').valid).toBe(false);
  });

  it('accepts standard London postcode with space', () => {
    expect(validatePostcode('SW1A 1AA').valid).toBe(true);
  });

  it('accepts postcode without space', () => {
    expect(validatePostcode('SW1A1AA').valid).toBe(true);
  });

  it('accepts lowercase postcode (normalised internally)', () => {
    expect(validatePostcode('sw1a 1aa').valid).toBe(true);
  });

  it('accepts single-letter area code (e.g. M1 1AA)', () => {
    expect(validatePostcode('M1 1AA').valid).toBe(true);
  });

  it('accepts two-letter area code (e.g. CR2 6XH)', () => {
    expect(validatePostcode('CR2 6XH').valid).toBe(true);
  });

  it('returns invalid for plainly wrong input', () => {
    expect(validatePostcode('INVALID').valid).toBe(false);
    expect(validatePostcode('12345').valid).toBe(false);
    expect(validatePostcode('ABCDE').valid).toBe(false);
  });

  it('error message mentions UK postcode format', () => {
    const result = validatePostcode('bad');
    expect(result.valid).toBe(false);
    expect(result.errorMessage).toMatch(/UK postcode/i);
  });
});

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------

describe('validateEmail', () => {
  it('returns invalid for empty string', () => {
    expect(validateEmail('').valid).toBe(false);
    expect(validateEmail('').errorMessage).toMatch(/email/i);
  });

  it('returns invalid for whitespace-only input', () => {
    expect(validateEmail('   ').valid).toBe(false);
  });

  it('accepts standard email address', () => {
    expect(validateEmail('user@example.com').valid).toBe(true);
  });

  it('accepts email with subdomain', () => {
    expect(validateEmail('user@mail.example.co.uk').valid).toBe(true);
  });

  it('accepts email with plus addressing', () => {
    expect(validateEmail('user+tag@example.com').valid).toBe(true);
  });

  it('returns invalid when @ is missing', () => {
    expect(validateEmail('notanemail.com').valid).toBe(false);
  });

  it('returns invalid when domain is missing', () => {
    expect(validateEmail('user@').valid).toBe(false);
  });

  it('returns invalid when TLD is missing', () => {
    expect(validateEmail('user@domain').valid).toBe(false);
  });

  it('returns invalid for plainly wrong input', () => {
    expect(validateEmail('not-an-email').valid).toBe(false);
  });

  it('error message mentions email address', () => {
    const result = validateEmail('bad');
    expect(result.valid).toBe(false);
    expect(result.errorMessage).toMatch(/email/i);
  });
});

// ---------------------------------------------------------------------------
// validatePhone
// ---------------------------------------------------------------------------

describe('validatePhone', () => {
  it('returns invalid for empty string', () => {
    expect(validatePhone('').valid).toBe(false);
    expect(validatePhone('').errorMessage).toMatch(/phone/i);
  });

  it('returns invalid for whitespace-only input', () => {
    expect(validatePhone('   ').valid).toBe(false);
  });

  it('accepts UK mobile with space', () => {
    expect(validatePhone('07712 345678').valid).toBe(true);
  });

  it('accepts UK mobile without space', () => {
    expect(validatePhone('07712345678').valid).toBe(true);
  });

  it('accepts UK landline with space', () => {
    expect(validatePhone('01234 567890').valid).toBe(true);
  });

  it('accepts international format +44', () => {
    expect(validatePhone('+44 7712 345678').valid).toBe(true);
  });

  it('accepts international format +44 without spaces', () => {
    expect(validatePhone('+447712345678').valid).toBe(true);
  });

  it('returns invalid for too few digits', () => {
    expect(validatePhone('12345').valid).toBe(false);
  });

  it('returns invalid for too many digits', () => {
    expect(validatePhone('012345678901234').valid).toBe(false);
  });

  it('error message mentions UK phone number', () => {
    const result = validatePhone('bad');
    expect(result.valid).toBe(false);
    expect(result.errorMessage).toMatch(/phone/i);
  });
});

// ---------------------------------------------------------------------------
// FORMAT_VALIDATORS map
// ---------------------------------------------------------------------------

describe('FORMAT_VALIDATORS', () => {
  it('contains postcode validator keyed by "postcode"', () => {
    expect(FORMAT_VALIDATORS.has('postcode')).toBe(true);
    expect(FORMAT_VALIDATORS.get('postcode')!('SW1A 1AA').valid).toBe(true);
    expect(FORMAT_VALIDATORS.get('postcode')!('bad').valid).toBe(false);
  });

  it('contains email validator keyed by "contact_email"', () => {
    expect(FORMAT_VALIDATORS.has('contact_email')).toBe(true);
    expect(FORMAT_VALIDATORS.get('contact_email')!('user@example.com').valid).toBe(true);
    expect(FORMAT_VALIDATORS.get('contact_email')!('bad').valid).toBe(false);
  });

  it('contains phone validator keyed by "contact_phone"', () => {
    expect(FORMAT_VALIDATORS.has('contact_phone')).toBe(true);
    expect(FORMAT_VALIDATORS.get('contact_phone')!('07712 345678').valid).toBe(true);
    expect(FORMAT_VALIDATORS.get('contact_phone')!('12345').valid).toBe(false);
  });
});
