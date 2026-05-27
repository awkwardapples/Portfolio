import type { AnswerMap } from '@/domain/runtime/answer-types';

// ---------------------------------------------------------------------------
// PersistenceAdapter
// ---------------------------------------------------------------------------

/**
 * Interface for persisting and restoring wizard answers across page loads.
 *
 * The adapter is injected into createWizardStore so implementations can be
 * swapped without touching state-machine logic. The domain layer never sees
 * this interface — it belongs exclusively to the effects layer.
 */
export interface PersistenceAdapter {
  /** Load any previously saved answers for this wizard. Returns {} on miss. */
  load(wizardId: string): AnswerMap;
  /** Persist the current answer snapshot. Fire-and-forget; errors are swallowed. */
  save(wizardId: string, answers: AnswerMap): void;
  /** Remove all persisted data for this wizard (e.g. after a successful submission). */
  clear(wizardId: string): void;
}

// ---------------------------------------------------------------------------
// Implementations
// ---------------------------------------------------------------------------

const storageKey = (wizardId: string) => `wizard:${wizardId}:answers`;

/**
 * SessionStorage-backed adapter. Data survives page reload within the browser
 * tab but is cleared when the tab closes. Safe to use; errors (storage full,
 * private-browsing restrictions) are swallowed and treated as a cold start.
 */
export const sessionStorageAdapter: PersistenceAdapter = {
  load(wizardId) {
    try {
      const raw = sessionStorage.getItem(storageKey(wizardId));
      if (raw === null) return {};
      return JSON.parse(raw) as AnswerMap;
    } catch {
      return {};
    }
  },

  save(wizardId, answers) {
    try {
      sessionStorage.setItem(storageKey(wizardId), JSON.stringify(answers));
    } catch {
      // Storage quota exceeded or unavailable — answers remain in memory.
    }
  },

  clear(wizardId) {
    try {
      sessionStorage.removeItem(storageKey(wizardId));
    } catch {
      // Ignore — worst case: stale data on next load, which load() handles.
    }
  },
};

/**
 * No-op adapter. Useful in tests, SSR, or any context where persistence
 * should be disabled. Every call is a safe, instant no-op.
 */
export const nullAdapter: PersistenceAdapter = {
  load: () => ({}),
  save: () => undefined,
  clear: () => undefined,
};
