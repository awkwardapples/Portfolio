/**
 * Vertical resolution smoke tests — no React mount.
 *
 * Proves the logic App.tsx executes when resolving a vertical at startup.
 * Tests are pure resolution-layer calls; no components or DOM required.
 */

import { describe, it, expect } from 'vitest';
import { resolveVertical, resolveFallbackVertical, FALLBACK_VERTICAL_ID } from '@/domain/registry';

describe('App vertical resolution logic', () => {
  it("configured vertical 'fencing' resolves to a non-null SessionConfig", () => {
    const result = resolveVertical('fencing');
    expect(result).not.toBeNull();
    expect(result?.wizard.id).toBe('fencing');
  });

  it('unknown configured vertical falls back to fencing via the nullish chain', () => {
    const result = resolveVertical('made-up') ?? resolveFallbackVertical();
    expect(result).not.toBeNull();
    expect(result?.id).toBe(FALLBACK_VERTICAL_ID);
  });

  it('resolveVertical alone returns null for an unknown id, confirming the App fallback is necessary', () => {
    expect(resolveVertical('anything-not-in-registry')).toBeNull();
  });
});
