/**
 * Integration tests: FSM + WizardStore + httpSubmissionPort (stubbed fetch).
 *
 * These tests run without React and without real network — they verify that
 * the full lifecycle from dispatch to submit_success / submit_failure works
 * end-to-end with the real store and the real HTTP port.
 */
import { describe, it, expect, vi } from 'vitest';

import type { PricingConfig } from '@/domain/config/pricing';
import type { WizardConfig } from '@/domain/config/wizard-config';
import { createWizardStore } from '@/runtime/WizardStore';
import { httpSubmissionPort } from '@/runtime/http-submission-port';
import { nullAdapter } from '@/runtime/persistence';

// ---------------------------------------------------------------------------
// Shared fixture — minimal 1-step wizard that satisfies the pricing gate
// ---------------------------------------------------------------------------

const wizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'lifecycle-test',
  title: 'Lifecycle test wizard',
  steps: [
    {
      id: 'step-1',
      title: 'Step 1',
      fields: [{ id: 'f-qty', key: 'qty', type: 'number', label: 'Qty', required: true }],
    },
  ],
};

const pricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: { label: 'Base', perUnitPence: 10000, unit: 'item', quantityFieldId: 'f-qty' },
  modifiers: [],
  extras: [],
  bounds: { minPence: 0, maxPence: 10_000_000, rounding: { mode: 'nearest', toPence: 100 } },
  rangeSpreadBasisPoints: 1000,
};

const SESSION_CONFIG = { wizard: wizardConfig, pricing: pricingConfig };

function fakeResponse(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
}

async function reachSubmitting(fetchMock: ReturnType<typeof vi.fn>) {
  const port = httpSubmissionPort({
    restUrl: 'https://test.local/wp-json/qw/v1/submit',
    restNonce: 'nonce',
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
  const store = createWizardStore(SESSION_CONFIG, nullAdapter, port);

  store.hydrate();
  store.dispatch({ type: 'ANSWER_SET', fieldKey: 'qty', value: 3 });
  store.dispatch({ type: 'SUBMIT_REQUESTED' });

  // Wait one microtask tick for the async submission to complete.
  await new Promise((r) => setTimeout(r, 0));

  return store;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('submission lifecycle — success path', () => {
  it('200 POST → submit_success with server reference', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(fakeResponse(200, JSON.stringify({ reference: 'GOQW-42' })));

    const store = await reachSubmitting(mock);
    const state = store.getSnapshot();

    expect(state.phase).toBe('submit_success');
    expect(state.submissionResult).toEqual({
      outcome: 'success',
      submissionId: 'GOQW-42',
      isDuplicate: false,
    });
  });

  it('200 with isDuplicate:true → submit_success with isDuplicate flag set', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(
        fakeResponse(200, JSON.stringify({ reference: 'GOQW-43', isDuplicate: true })),
      );

    const store = await reachSubmitting(mock);
    const state = store.getSnapshot();

    expect(state.phase).toBe('submit_success');
    expect(state.submissionResult).toEqual({
      outcome: 'success',
      submissionId: 'GOQW-43',
      isDuplicate: true,
    });
  });
});

describe('submission lifecycle — 502 forwarder failure', () => {
  it('502 POST → submit_failure with forwarder_unavailable; answers preserved', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(
        fakeResponse(502, JSON.stringify({ errorCode: 'forwarder_unavailable', submissionId: 7 })),
      );

    const store = await reachSubmitting(mock);
    const state = store.getSnapshot();

    expect(state.phase).toBe('submit_failure');
    expect(state.submissionResult?.outcome).toBe('failure');
    if (state.submissionResult?.outcome === 'failure') {
      expect(state.submissionResult.error.code).toBe('forwarder_unavailable');
    }
    expect(state.answers['qty']).toBe(3);
  });
});

describe('submission lifecycle — retry after failure', () => {
  it('SUBMIT_RETRY after failure → second submit succeeds', async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(
        fakeResponse(502, JSON.stringify({ errorCode: 'forwarder_unavailable' })),
      )
      .mockResolvedValueOnce(fakeResponse(200, JSON.stringify({ reference: 'GOQW-99' })));

    const store = await reachSubmitting(mock);
    expect(store.getSnapshot().phase).toBe('submit_failure');

    store.dispatch({ type: 'SUBMIT_RETRY' });
    await new Promise((r) => setTimeout(r, 0));

    const state = store.getSnapshot();
    expect(state.phase).toBe('submit_success');
    expect(mock).toHaveBeenCalledTimes(2);
  });
});

describe('submission lifecycle — network failure', () => {
  it('network error → submit_failure with network_unreachable', async () => {
    const err = Object.assign(new Error('Failed to fetch'), { name: 'TypeError' });
    const mock = vi.fn().mockRejectedValue(err);

    const store = await reachSubmitting(mock);
    const state = store.getSnapshot();

    expect(state.phase).toBe('submit_failure');
    if (state.submissionResult?.outcome === 'failure') {
      expect(state.submissionResult.error.code).toBe('network_unreachable');
    }
  });
});
