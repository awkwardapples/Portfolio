import { describe, expect, it } from 'vitest';

import { CONTRACT_VERSION, PublicConfigSchema } from '@/domain/config/public-config';

const validBase = {
  contractVersion: 3 as const,
  wizardId: 'fencing',
  enableCategoryNavigation: false,
  businessName: 'Acme Fencing',
  businessPhone: '01234 567890',
  businessEmail: 'hello@acme.example',
  primaryColor: '#0F4C81',
  calendlyUrl: '',
  turnstileSiteKey: '',
  restNamespace: 'qw/v1' as const,
  restUrl: 'https://example.com/wp-json/qw/v1',
  restNonce: 'abc123',
  pluginVersion: '1.0.0',
  buildTimestamp: '2026-06-07T00:00:00Z',
};

describe('CONTRACT_VERSION', () => {
  it('is 3', () => {
    expect(CONTRACT_VERSION).toBe(3);
  });
});

describe('PublicConfigSchema — contractVersion', () => {
  it('accepts contractVersion 3', () => {
    const result = PublicConfigSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('rejects contractVersion 2 (v2 wire contract no longer accepted)', () => {
    const result = PublicConfigSchema.safeParse({ ...validBase, contractVersion: 2 });
    expect(result.success).toBe(false);
  });
});

describe('PublicConfigSchema — turnstileSiteKey', () => {
  it('accepts an empty string (Turnstile not configured)', () => {
    const result = PublicConfigSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.turnstileSiteKey).toBe('');
    }
  });

  it('accepts a configured site key', () => {
    const result = PublicConfigSchema.safeParse({
      ...validBase,
      turnstileSiteKey: '0x4AAAAAAD08xGwhMXvPs1CQ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.turnstileSiteKey).toBe('0x4AAAAAAD08xGwhMXvPs1CQ');
    }
  });

  it('rejects a non-string value', () => {
    const result = PublicConfigSchema.safeParse({ ...validBase, turnstileSiteKey: 123 });
    expect(result.success).toBe(false);
  });
});

describe('PublicConfigSchema — enableCategoryNavigation', () => {
  it('defaults to false when the field is absent', () => {
    const withoutFlag = Object.fromEntries(
      Object.entries(validBase).filter(([k]) => k !== 'enableCategoryNavigation'),
    );
    const result = PublicConfigSchema.safeParse(withoutFlag);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enableCategoryNavigation).toBe(false);
    }
  });

  it('passes through true when explicitly set', () => {
    const result = PublicConfigSchema.safeParse({ ...validBase, enableCategoryNavigation: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enableCategoryNavigation).toBe(true);
    }
  });
});
