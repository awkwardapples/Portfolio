/**
 * Bot-protection-enriched submission port wrapper (Step 5.13f).
 *
 * Mirrors submission-media.ts exactly: the honeypot value and Turnstile
 * token live in a volatile BotProtectionStore (not FSM state — see
 * bot-protection-store.ts for why), and this wrapper merges them into the
 * outgoing SubmissionRequest immediately before the real port is called.
 *
 * Wrapping the port (not the store) keeps WizardStore unchanged and
 * collocates the enrichment point with the submission boundary, exactly
 * like createPhotoEnrichedPort.
 */

import type { BotProtectionStore } from '@/runtime/bot-protection-store';
import type { SubmissionPort, SubmissionRequest } from '@/runtime/submission';

/**
 * Wrap a SubmissionPort so honeypotValue/turnstileToken are merged in from
 * the BotProtectionStore before the request is forwarded to the real port.
 *
 * @param base  The real submission port to delegate to.
 * @param store The volatile BotProtectionStore owned by QuotePage.
 */
export function createBotProtectionEnrichedPort(
  base: SubmissionPort,
  store: BotProtectionStore,
): SubmissionPort {
  return {
    submit(request: SubmissionRequest) {
      return base.submit({
        ...request,
        honeypotValue: store.getHoneypotValue(),
        turnstileToken: store.getTurnstileToken(),
      });
    },
  };
}
