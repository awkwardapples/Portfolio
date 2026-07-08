import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePublicConfig } from '@/domain/validation/validate';
import { fencingWizardConfig } from '@/domain/fixtures/fencing.config';
import { asStep } from './_helpers';

/** Words/phrases banned from validation messaging (4.1 requirement #9). */
const BANNED_TONE = [
  'oops',
  'something went wrong',
  'looks like',
  "let's fix",
  'lets fix',
  'whoops',
  'uh oh',
  'sorry',
  // marketing words (shared discipline with the lint rule)
  'empower',
  'unleash',
  'seamless',
  'cutting-edge',
  'next-gen',
];

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/u;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

describe('validation error tone', () => {
  it('messages contain no banned conversational or marketing language', () => {
    // Produce a broad spread of errors.
    const bad = clone(fencingWizardConfig) as Record<string, unknown>;
    bad.schemaVersion = 99;
    (bad as { extra?: unknown }).extra = true;
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;

    for (const issue of result.issues) {
      const lower = issue.message.toLowerCase();
      for (const banned of BANNED_TONE) {
        expect(
          lower.includes(banned),
          `message contained banned phrase "${banned}": ${issue.message}`,
        ).toBe(false);
      }
      expect(EMOJI_RE.test(issue.message), `message contained emoji: ${issue.message}`).toBe(false);
    }
  });

  it('messages are non-empty and end with terminal punctuation (stable formatting)', () => {
    const bad = clone(fencingWizardConfig);
    asStep(bad.steps[4]).fields[0].label = '';
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;

    for (const issue of result.issues) {
      expect(issue.message.length).toBeGreaterThan(0);
      expect(/[.!?]$/.test(issue.message)).toBe(true);
    }
  });
});

describe('PublicConfig validation + fallback contract', () => {
  const valid = {
    contractVersion: 3,
    wizardId: 'fencing',
    businessName: 'Test Fencing',
    businessPhone: '01234 567890',
    businessEmail: 'hello@test.test',
    primaryColor: '#0F4C81',
    calendlyUrl: '',
    restNamespace: 'qw/v1',
    restUrl: 'https://example.test/wp-json/qw/v1',
    restNonce: 'abc123',
    pluginVersion: '0.1.0',
    buildTimestamp: '2026-05-25T00:00:00.000Z',
  };

  it('accepts a well-formed v3 public config', () => {
    expect(validatePublicConfig(valid).ok).toBe(true);
  });

  it('tolerates forward-compatible extra keys (non-strict)', () => {
    const withExtra = { ...valid, futureField: 'ignored' };
    expect(validatePublicConfig(withExtra).ok).toBe(true);
  });

  it('rejects contractVersion v2 (superseded by v3)', () => {
    const bad = { ...valid, contractVersion: 2 };
    expect(validatePublicConfig(bad).ok).toBe(false);
  });

  it('rejects a payload missing wizardId', () => {
    const bad = { ...valid } as Record<string, unknown>;
    delete bad.wizardId;
    expect(validatePublicConfig(bad).ok).toBe(false);
  });

  it('rejects wizardId as an empty string', () => {
    const bad = { ...valid, wizardId: '' };
    expect(validatePublicConfig(bad).ok).toBe(false);
  });

  it('rejects a wrong restNamespace', () => {
    const bad = { ...valid, restNamespace: 'qw/v2' };
    expect(validatePublicConfig(bad).ok).toBe(false);
  });

  it('rejects a missing required field', () => {
    const bad = { ...valid } as Record<string, unknown>;
    delete bad.businessName;
    expect(validatePublicConfig(bad).ok).toBe(false);
  });

  it('rejects a non-object input (defensive)', () => {
    expect(validatePublicConfig(null).ok).toBe(false);
    expect(validatePublicConfig('nope').ok).toBe(false);
    expect(validatePublicConfig(undefined).ok).toBe(false);
  });

  it('accepts enabledServiceIds as an array of non-empty strings', () => {
    const withIds = { ...valid, enabledServiceIds: ['fencing', 'decking'] };
    expect(validatePublicConfig(withIds).ok).toBe(true);
  });

  it('accepts a payload omitting enabledServiceIds (field is optional)', () => {
    expect(validatePublicConfig(valid).ok).toBe(true);
  });

  it('accepts enabledServiceIds as an empty array (logical meaning: all services)', () => {
    const withEmpty = { ...valid, enabledServiceIds: [] };
    expect(validatePublicConfig(withEmpty).ok).toBe(true);
  });

  it('rejects enabledServiceIds containing an empty string', () => {
    const bad = { ...valid, enabledServiceIds: [''] };
    expect(validatePublicConfig(bad).ok).toBe(false);
  });

  it('rejects enabledServiceIds as a plain string (must be an array)', () => {
    const bad = { ...valid, enabledServiceIds: 'fencing' };
    expect(validatePublicConfig(bad).ok).toBe(false);
  });

  it('rejects enabledServiceIds containing a non-string element', () => {
    const bad = { ...valid, enabledServiceIds: ['fencing', 123] };
    expect(validatePublicConfig(bad).ok).toBe(false);
  });
});
