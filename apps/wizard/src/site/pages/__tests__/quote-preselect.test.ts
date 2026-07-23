import { describe, it, expect } from 'vitest';
import { resolvePreselectedServiceId } from '../quote-preselect';

const availableServiceIds = ['fencing', 'driveway', 'painting', 'jetwash', 'plumbing'];

describe('resolvePreselectedServiceId', () => {
  it('returns the requested service id when present and available', () => {
    expect(resolvePreselectedServiceId('?service=fencing', availableServiceIds)).toBe('fencing');
  });

  it('returns null when the query string has no service param', () => {
    expect(resolvePreselectedServiceId('', availableServiceIds)).toBeNull();
    expect(resolvePreselectedServiceId('?foo=bar', availableServiceIds)).toBeNull();
  });

  it('returns null when the requested service id is not in the available list', () => {
    expect(resolvePreselectedServiceId('?service=unknown-service', availableServiceIds)).toBeNull();
  });

  it('returns null when the requested service id is disabled for this client', () => {
    expect(resolvePreselectedServiceId('?service=carpentry', availableServiceIds)).toBeNull();
  });

  it('ignores extra query params and still resolves service', () => {
    expect(
      resolvePreselectedServiceId('?utm_source=google&service=jetwash', availableServiceIds),
    ).toBe('jetwash');
  });

  it('is case-sensitive — does not normalise casing', () => {
    expect(resolvePreselectedServiceId('?service=Fencing', availableServiceIds)).toBeNull();
  });
});
