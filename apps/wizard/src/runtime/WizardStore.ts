import { computePrice } from '@/domain/pricing/pricing-engine';
import { transition } from '@/domain/runtime/transition';
import type { WizardEvent } from '@/domain/runtime/events';
import { createInitialState } from '@/domain/runtime/state';
import type { SessionConfig, WizardState } from '@/domain/runtime/state';

import type { PersistenceAdapter } from '@/runtime/persistence';
import type { SubmissionPort, SubmissionRequest } from '@/runtime/submission';
import { toSubmissionError } from '@/runtime/submission';

// ---------------------------------------------------------------------------
// WizardStore
// ---------------------------------------------------------------------------

/**
 * The useSyncExternalStore-compatible store that bridges the pure domain
 * state machine with the React adapter layer.
 *
 * RESPONSIBILITIES (this file only):
 *   - Hold the current WizardState.
 *   - Dispatch events through transition().
 *   - Auto-advance the validating phase to submitting (pricing gate stub).
 *   - Trigger persistence and submission side effects.
 *   - Notify React subscribers via a listener set.
 *
 * EXPLICITLY NOT HERE:
 *   - No business logic. No navigation logic. No validation logic.
 *   - No condition evaluation. No field-key lookups.
 *   All of that lives in the domain layer.
 */
export interface WizardStore {
  getSnapshot(): WizardState;
  getConfig(): SessionConfig;
  subscribe(listener: () => void): () => void;
  dispatch(event: WizardEvent): void;
  hydrate(): void;
}

export function createWizardStore(
  config: SessionConfig,
  persistence: PersistenceAdapter,
  submission: SubmissionPort,
): WizardStore {
  let state: WizardState = createInitialState(config.wizard);
  const listeners = new Set<() => void>();

  function notify(): void {
    listeners.forEach((l) => l());
  }

  function dispatch(event: WizardEvent): void {
    const prev = state;
    state = transition(prev, event, config);

    // Pricing gate: transition() handles the validating → submitting check.
    // If pricing is invalid the gate returns answering; otherwise submitting.
    // Either way, dispatching again here is correct — answering re-enters the
    // answer loop and submitting proceeds to submission.
    if (state.phase === 'validating') {
      state = transition(state, { type: 'SUBMIT_REQUESTED' }, config);
    }

    notify();

    // Persist answers whenever they change (fire-and-forget, errors swallowed).
    if (state.answers !== prev.answers) {
      persistence.save(config.wizard.id, state.answers);
    }

    // Submission side effect: trigger exactly once when entering submitting.
    if (state.phase === 'submitting' && prev.phase !== 'submitting') {
      void runSubmission();
    }

    // Clear persisted state after a successful submission.
    if (state.phase === 'submit_success' && prev.phase !== 'submit_success') {
      persistence.clear(config.wizard.id);
    }
  }

  async function runSubmission(): Promise<void> {
    const request = buildRequest(state, config);
    try {
      const result = await submission.submit(request);
      if (result.ok) {
        dispatch({
          type: 'SUBMIT_SUCCEEDED',
          submissionId: result.reference,
          isDuplicate: result.isDuplicate ?? false,
        });
      } else {
        dispatch({ type: 'SUBMIT_FAILED', error: result.error });
      }
    } catch (error) {
      dispatch({ type: 'SUBMIT_FAILED', error: toSubmissionError(error) });
    }
  }

  return {
    getSnapshot: () => state,
    getConfig: () => config,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch,
    hydrate() {
      const restoredAnswers = persistence.load(config.wizard.id);
      dispatch({ type: 'HYDRATE', restoredAnswers });
    },
  };
}

// ---------------------------------------------------------------------------
// Request builder
// ---------------------------------------------------------------------------

function buildRequest(state: WizardState, config: SessionConfig): SubmissionRequest {
  const quoteMode = config.wizard.quoteMode ?? 'instant';

  let pricingPayload: SubmissionRequest['pricing'];
  if (quoteMode === 'instant') {
    const pricing = computePrice(state.answers, config.wizard, config.pricing);
    if (
      pricing.valid &&
      pricing.totalPence !== null &&
      pricing.rangeMinPence !== null &&
      pricing.rangeMaxPence !== null
    ) {
      pricingPayload = {
        totalPence: pricing.totalPence,
        lowPence: pricing.rangeMinPence,
        highPence: pricing.rangeMaxPence,
        currency: 'GBP',
      };
    }
  }

  return {
    wizardId: state.configMeta.wizardId,
    schemaVersion: state.configMeta.schemaVersion,
    quoteMode,
    answers: state.answers,
    pricing: pricingPayload,
    clientTimestamp: new Date().toISOString(),
  };
}
