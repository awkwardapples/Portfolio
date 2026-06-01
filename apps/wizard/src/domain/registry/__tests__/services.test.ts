import { describe, it, expect } from 'vitest';

import { listEnabledServiceIds, resolveService } from '@/domain/registry/services';

describe('listEnabledServiceIds', () => {
  it('returns all registered services when called with no argument', () => {
    expect(listEnabledServiceIds()).toEqual(['fencing', 'decking']);
  });

  it('returns all registered services when called with undefined', () => {
    expect(listEnabledServiceIds(undefined)).toEqual(['fencing', 'decking']);
  });

  it('returns all registered services when called with an empty array', () => {
    expect(listEnabledServiceIds([])).toEqual(['fencing', 'decking']);
  });

  it("returns ['fencing'] when override is ['fencing']", () => {
    expect(listEnabledServiceIds(['fencing'])).toEqual(['fencing']);
  });

  it("returns ['decking', 'fencing'] (override order preserved) when override is ['decking', 'fencing']", () => {
    expect(listEnabledServiceIds(['decking', 'fencing'])).toEqual(['decking', 'fencing']);
  });

  it('filters out unknown ids — unknown id alone returns empty array', () => {
    expect(listEnabledServiceIds(['unknown'])).toEqual([]);
  });

  it('filters out unknown ids while preserving known ones', () => {
    expect(listEnabledServiceIds(['fencing', 'unknown', 'decking'])).toEqual([
      'fencing',
      'decking',
    ]);
  });
});

describe('resolveService', () => {
  it("resolves 'fencing' to a non-null SessionConfig with id 'fencing'", () => {
    const result = resolveService('fencing');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('fencing');
  });

  it("resolves 'decking' to a non-null SessionConfig with id 'decking'", () => {
    const result = resolveService('decking');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('decking');
  });

  it('returns null for an unknown id', () => {
    expect(resolveService('unknown')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(resolveService('')).toBeNull();
  });
});
