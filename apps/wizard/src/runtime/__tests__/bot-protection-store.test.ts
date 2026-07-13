import { describe, it, expect, beforeEach } from 'vitest';

import { BotProtectionStore } from '@/runtime/bot-protection-store';

describe('BotProtectionStore', () => {
  let store: BotProtectionStore;

  beforeEach(() => {
    store = new BotProtectionStore();
  });

  it('starts with an empty honeypot value', () => {
    expect(store.getHoneypotValue()).toBe('');
  });

  it('starts with a null Turnstile token', () => {
    expect(store.getTurnstileToken()).toBeNull();
  });

  it('stores and retrieves the honeypot value', () => {
    store.setHoneypotValue('a bot filled this in');
    expect(store.getHoneypotValue()).toBe('a bot filled this in');
  });

  it('stores and retrieves the Turnstile token', () => {
    store.setTurnstileToken('token-abc');
    expect(store.getTurnstileToken()).toBe('token-abc');
  });

  it('allows resetting the Turnstile token back to null (expired-callback)', () => {
    store.setTurnstileToken('token-abc');
    store.setTurnstileToken(null);
    expect(store.getTurnstileToken()).toBeNull();
  });
});
