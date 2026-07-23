import { describe, it, expect } from 'vitest';

import { isSubmissionBlocked } from '../submission-gate';

describe('isSubmissionBlocked', () => {
  it('is blocked when turnstileReady is false, even with no missing photos', () => {
    expect(isSubmissionBlocked({ hasMissingPhotos: false, turnstileReady: false })).toBe(true);
  });

  it('is blocked when hasMissingPhotos is true, even when turnstile is ready', () => {
    expect(isSubmissionBlocked({ hasMissingPhotos: true, turnstileReady: true })).toBe(true);
  });

  it('is blocked when both conditions are unmet', () => {
    expect(isSubmissionBlocked({ hasMissingPhotos: true, turnstileReady: false })).toBe(true);
  });

  it('is not blocked when there are no missing photos and turnstile is ready', () => {
    expect(isSubmissionBlocked({ hasMissingPhotos: false, turnstileReady: true })).toBe(false);
  });
});
