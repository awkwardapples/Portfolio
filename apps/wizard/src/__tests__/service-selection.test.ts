import { describe, it, expect } from 'vitest';

import { listEnabledServiceIds } from '@/domain/registry/services';

/**
 * Pure logic tests for the service selection helpers.
 *
 * App.tsx uses these helpers to decide whether to show the ServiceSelector
 * or auto-bypass it. These tests verify the pure helpers in isolation; the
 * React state transitions require jsdom (deferred) and are covered by
 * manual smoke testing per the 4.7 acceptance criteria.
 */

describe('service selection helper logic', () => {
  it('returns all services when override is absent (all 11 registered services)', () => {
    const ids = listEnabledServiceIds();
    expect(ids.length).toBe(11);
    expect(ids[0]).toBe('fencing');
    expect(ids).toContain('decking');
    expect(ids).toContain('painting');
    expect(ids).toContain('general-repairs');
  });

  it('auto-bypass condition: length === 1 when override restricts to one service', () => {
    const ids = listEnabledServiceIds(['fencing']);
    expect(ids.length).toBe(1);
    expect(ids[0]).toBe('fencing');
  });

  it('selector condition: length > 1 when override is absent (both services enabled)', () => {
    const ids = listEnabledServiceIds();
    expect(ids.length).toBeGreaterThan(1);
  });

  it('empty override is equivalent to no override (all services returned)', () => {
    const withEmpty = listEnabledServiceIds([]);
    const withNone = listEnabledServiceIds();
    expect(withEmpty).toEqual(withNone);
  });

  it('unknown ids are filtered out: mixed override with one unknown returns only known', () => {
    const ids = listEnabledServiceIds(['fencing', 'sheds']);
    expect(ids).toEqual(['fencing']);
  });

  it('all-unknown override returns empty array — App defensive fallback path activates', () => {
    const ids = listEnabledServiceIds(['sheds', 'roofing']);
    expect(ids).toEqual([]);
    expect(ids.length).toBe(0);
  });
});
