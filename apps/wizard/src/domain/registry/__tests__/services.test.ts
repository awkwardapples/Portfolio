import { describe, it, expect } from 'vitest';

import { listEnabledServiceIds, resolveService } from '@/domain/registry/services';

const ALL_SERVICE_IDS = [
  'fencing',
  'decking',
  'painting',
  'patio',
  'driveway',
  'steps',
  'jetwash',
  'general-repairs',
  'plumbing',
  'electrical',
  'carpentry',
];

describe('listEnabledServiceIds', () => {
  it('returns all 11 registered services when called with no argument', () => {
    expect(listEnabledServiceIds()).toEqual(ALL_SERVICE_IDS);
  });

  it('returns all 11 registered services when called with undefined', () => {
    expect(listEnabledServiceIds(undefined)).toEqual(ALL_SERVICE_IDS);
  });

  it('returns all 11 registered services when called with an empty array', () => {
    expect(listEnabledServiceIds([])).toEqual(ALL_SERVICE_IDS);
  });

  it("returns ['fencing'] when override is ['fencing']", () => {
    expect(listEnabledServiceIds(['fencing'])).toEqual(['fencing']);
  });

  it("returns ['decking', 'fencing'] (override order preserved) when override is ['decking', 'fencing']", () => {
    expect(listEnabledServiceIds(['decking', 'fencing'])).toEqual(['decking', 'fencing']);
  });

  it('returns manual-quote services when overridden to them', () => {
    expect(listEnabledServiceIds(['general-repairs', 'plumbing'])).toEqual([
      'general-repairs',
      'plumbing',
    ]);
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

  it.each(['painting', 'patio', 'driveway', 'steps', 'jetwash'])(
    "resolves '%s' (instant-quote) to a non-null SessionConfig",
    (id) => {
      const result = resolveService(id);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(id);
    },
  );

  it.each(['general-repairs', 'plumbing', 'electrical', 'carpentry'])(
    "resolves '%s' (manual-quote) to a non-null SessionConfig",
    (id) => {
      const result = resolveService(id);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(id);
    },
  );

  it('returns null for an unknown id', () => {
    expect(resolveService('unknown')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(resolveService('')).toBeNull();
  });
});
