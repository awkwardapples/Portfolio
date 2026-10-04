/**
 * Forwarding to Make.com (spec Q.2, Q.3). The payload keeps the plugin's
 * documented contract (submission_id, wizard_id, schema_version, quote_mode,
 * answers, pricing, media, client_timestamp) plus reference and intent_label,
 * so the scenario only needs new Sheet columns. Answers are the sanitised
 * copy (src/security/sanitize.ts). The X-Webhook-Secret header lets the
 * scenario's first filter reject anything that did not come from here.
 *
 * Failures are scheduled for retry by the cron with exponential back-off:
 * 15 minutes, then 30, 60 and 120; after the fifth failed attempt the row is
 * marked forward_failed and left for Josh (docs/data-protection.md).
 */
import { sanitizeSubmissionPayload } from '../security/sanitize';
import { INTENT_LABELS, isContactIntent } from '../../../site/src/wizard/intents';

export const MAX_FORWARD_ATTEMPTS = 5;
const TIMEOUT_MS = 10_000;

export interface ForwardInput {
  id: number;
  reference: string;
  intent: string;
  schemaVersion: number;
  answers: Readonly<Record<string, unknown>>;
  clientTimestamp: string;
}

export type ForwardResult = { ok: true } | { ok: false; error: string };

export interface WebhookConfig {
  url?: string | undefined;
  secret?: string | undefined;
}

export function webhookPayload(input: ForwardInput): Record<string, unknown> {
  return {
    submission_id: input.id,
    reference: input.reference,
    wizard_id: input.intent,
    intent_label: isContactIntent(input.intent) ? INTENT_LABELS[input.intent] : input.intent,
    schema_version: input.schemaVersion,
    quote_mode: 'manual',
    answers: sanitizeSubmissionPayload(input.answers),
    pricing: null,
    media: null,
    client_timestamp: input.clientTimestamp,
  };
}

export async function forward(
  input: ForwardInput,
  webhook: WebhookConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<ForwardResult> {
  if (!webhook.url) return { ok: false, error: 'webhook_not_configured' };
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (webhook.secret) headers['X-Webhook-Secret'] = webhook.secret;
  try {
    const response = await fetchImpl(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookPayload(input)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status < 200 || response.status >= 300) {
      return { ok: false, error: `http_status_${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `transport_error: ${error instanceof Error ? error.name : 'unknown'}`,
    };
  }
}

/** When to try again after the given number of failed attempts, or null to give up. */
export function nextAttemptAfter(failedAttempts: number, now: number): string | null {
  if (failedAttempts >= MAX_FORWARD_ATTEMPTS) return null;
  const minutes = 15 * 2 ** Math.max(0, failedAttempts - 1);
  return new Date(now + minutes * 60_000).toISOString();
}
