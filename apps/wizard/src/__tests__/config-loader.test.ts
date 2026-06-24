/**
 * Config-loader tests.
 *
 * config-loader.ts reads window.GOQW_CONFIG at module-import time, so each
 * test that needs a specific global state must isolate itself via vi.stubGlobal
 * and reset in afterEach. Node environment; no DOM.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { FALLBACK_VERTICAL_ID } from '@/domain/registry';

// Helper — build a minimal valid v3 config object.
function validV3Config(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    contractVersion: 3,
    wizardId: 'fencing',
    businessName: 'Test Biz',
    businessPhone: '01234 567890',
    businessEmail: 'test@test.test',
    primaryColor: '#0F4C81',
    calendlyUrl: '',
    restNamespace: 'qw/v1',
    restUrl: 'https://example.test/wp-json/qw/v1',
    restNonce: 'abc123',
    pluginVersion: '0.1.0',
    buildTimestamp: '2026-05-29T00:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('config-loader', () => {
  it('returns wizardId equal to FALLBACK_VERTICAL_ID when window.GOQW_CONFIG is absent', async () => {
    vi.stubGlobal('window', {});
    const { config } = await import('@/config-loader');
    expect(config.wizardId).toBe(FALLBACK_VERTICAL_ID);
  });

  it('logs a warning and returns defaults when window.GOQW_CONFIG is malformed', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('window', { GOQW_CONFIG: { contractVersion: 2 } });

    const { config } = await import('@/config-loader');

    expect(warnSpy).toHaveBeenCalled();
    expect(config.wizardId).toBe(FALLBACK_VERTICAL_ID);
    warnSpy.mockRestore();
  });

  it('merges a valid v3 payload and preserves its wizardId', async () => {
    vi.stubGlobal('window', { GOQW_CONFIG: validV3Config({ wizardId: 'fencing' }) });

    const { config } = await import('@/config-loader');

    expect(config.wizardId).toBe('fencing');
    expect(config.contractVersion).toBe(3);
    expect(config.businessName).toBe('Test Biz');
  });

  it('enableCategoryNavigation defaults to false in dev mode (no injected config)', async () => {
    // The JS default is false (dev/local mode). The PHP plugin default is true
    // (canonical WordPress install, ADR-0017 amendment, 5.9-R1).
    vi.stubGlobal('window', {});
    const { config } = await import('@/config-loader');
    expect(config.enableCategoryNavigation).toBe(false);
  });

  it('enableCategoryNavigation is true when the injected payload sets it', async () => {
    vi.stubGlobal('window', {
      GOQW_CONFIG: validV3Config({ enableCategoryNavigation: true }),
    });
    const { config } = await import('@/config-loader');
    expect(config.enableCategoryNavigation).toBe(true);
  });
});
