import type { WizardEvent } from '@/domain/runtime/events';
import type { SessionConfig, WizardState } from '@/domain/runtime/state';
import { transition } from '@/domain/runtime/transition';

/**
 * Replays an event sequence over an initial state and returns the final state.
 *
 * Determinism guarantee: given the same initialState, events, and config, this
 * function always returns the same result. It is a strict left-fold; no
 * accumulation of side effects, no mutation.
 */
export function replay(
  initialState: WizardState,
  events: ReadonlyArray<WizardEvent>,
  config: SessionConfig,
): WizardState {
  return events.reduce((state, event) => transition(state, event, config), initialState);
}
