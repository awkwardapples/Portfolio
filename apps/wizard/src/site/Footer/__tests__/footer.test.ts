import { describe, it, expect } from 'vitest';
import { hasAnySocial, formatPhoneHref } from '../Layout';

describe('hasAnySocial', () => {
  it('returns false when no social links are provided', () => {
    expect(hasAnySocial({})).toBe(false);
  });

  it('returns true when only facebook is provided', () => {
    expect(hasAnySocial({ facebook: 'https://facebook.com/test' })).toBe(true);
  });

  it('returns true when only instagram is provided', () => {
    expect(hasAnySocial({ instagram: 'https://instagram.com/test' })).toBe(true);
  });

  it('returns true when multiple social links are provided', () => {
    expect(
      hasAnySocial({
        twitter: 'https://twitter.com/test',
        linkedin: 'https://linkedin.com/company/test',
      }),
    ).toBe(true);
  });

  it('returns false when all values are undefined', () => {
    expect(
      hasAnySocial({
        facebook: undefined,
        instagram: undefined,
        twitter: undefined,
        linkedin: undefined,
      }),
    ).toBe(false);
  });
});

describe('formatPhoneHref', () => {
  it('strips spaces and prepends tel:', () => {
    expect(formatPhoneHref('01234 567890')).toBe('tel:01234567890');
  });

  it('handles number with no spaces', () => {
    expect(formatPhoneHref('01234567890')).toBe('tel:01234567890');
  });

  it('strips multiple internal spaces', () => {
    expect(formatPhoneHref('012 345 678 90')).toBe('tel:01234567890');
  });
});
