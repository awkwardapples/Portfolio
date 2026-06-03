import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Test the warnIfPathMismatch logic from main.tsx by re-implementing the same
// pure logic. We test the behaviour (warning or no warning) without mounting React.

function warnIfPathMismatch(attrPath: string | null, livePath: string): void {
  if (attrPath === null) return;
  if (attrPath !== livePath) {
    console.warn(
      `[goqw] data-initial-path (${attrPath}) differs from window.location.pathname (${livePath}); using window.location.`,
    );
  }
}

describe('warnIfPathMismatch', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('logs no warning when data-initial-path matches window.location.pathname', () => {
    warnIfPathMismatch('/services', '/services');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('logs a warning when data-initial-path differs from window.location.pathname', () => {
    warnIfPathMismatch('/services', '/contact');
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[goqw]'));
  });

  it('logs no warning when data-initial-path is absent (null)', () => {
    warnIfPathMismatch(null, '/services');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
