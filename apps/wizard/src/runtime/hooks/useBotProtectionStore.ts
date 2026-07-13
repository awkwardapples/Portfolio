import { useContext } from 'react';

import { BotProtectionStoreContext } from '@/runtime/WizardProvider';
import type { BotProtectionStore } from '@/runtime/bot-protection-store';

/**
 * Returns the per-session volatile BotProtectionStore from the nearest
 * WizardProvider, or null when none was provided.
 *
 * Null is a real, expected case in tests and standalone dev usage — callers
 * (HoneypotField, TurnstileWidget) should no-op rather than throw.
 */
export function useBotProtectionStore(): BotProtectionStore | null {
  return useContext(BotProtectionStoreContext);
}
