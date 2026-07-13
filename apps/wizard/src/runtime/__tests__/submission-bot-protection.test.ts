import { describe, it, expect, vi } from 'vitest';

import { BotProtectionStore } from '@/runtime/bot-protection-store';
import { createBotProtectionEnrichedPort } from '@/runtime/submission-bot-protection';
import type { SubmissionPort, SubmissionRequest } from '@/runtime/submission';

const BASE_REQUEST: SubmissionRequest = {
  wizardId: 'fencing',
  schemaVersion: 1,
  quoteMode: 'instant',
  answers: { fence_type: 'wooden' },
  clientTimestamp: '2026-05-29T12:00:00.000Z',
};

function spyPort(): { port: SubmissionPort; submit: ReturnType<typeof vi.fn> } {
  const submit = vi.fn().mockResolvedValue({ ok: true, reference: 'GOQW-1' });
  return { port: { submit }, submit };
}

describe('createBotProtectionEnrichedPort', () => {
  it('merges an empty honeypotValue and null turnstileToken by default', async () => {
    const { port, submit } = spyPort();
    const store = new BotProtectionStore();
    const enriched = createBotProtectionEnrichedPort(port, store);

    await enriched.submit(BASE_REQUEST);

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ honeypotValue: '', turnstileToken: null }),
    );
  });

  it('merges the current honeypot value from the store', async () => {
    const { port, submit } = spyPort();
    const store = new BotProtectionStore();
    store.setHoneypotValue('bot-filled-this');
    const enriched = createBotProtectionEnrichedPort(port, store);

    await enriched.submit(BASE_REQUEST);

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ honeypotValue: 'bot-filled-this' }),
    );
  });

  it('merges the current Turnstile token from the store', async () => {
    const { port, submit } = spyPort();
    const store = new BotProtectionStore();
    store.setTurnstileToken('good-token');
    const enriched = createBotProtectionEnrichedPort(port, store);

    await enriched.submit(BASE_REQUEST);

    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ turnstileToken: 'good-token' }));
  });

  it('preserves all other request fields unchanged', async () => {
    const { port, submit } = spyPort();
    const store = new BotProtectionStore();
    const enriched = createBotProtectionEnrichedPort(port, store);

    await enriched.submit(BASE_REQUEST);

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        wizardId: 'fencing',
        answers: { fence_type: 'wooden' },
      }),
    );
  });

  it('returns the underlying port result unchanged', async () => {
    const { port } = spyPort();
    const store = new BotProtectionStore();
    const enriched = createBotProtectionEnrichedPort(port, store);

    const result = await enriched.submit(BASE_REQUEST);

    expect(result).toEqual({ ok: true, reference: 'GOQW-1' });
  });
});
