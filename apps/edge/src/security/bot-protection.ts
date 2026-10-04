/**
 * Bot protection, in the plugin's order (spec B.3, Q.2; ported from
 * BotProtection, ADR-0027): honeypot first, then the rate limit, then
 * Turnstile when it is configured. The rate limit is recorded only for a
 * submission that passes all three. A master switch can turn all three off
 * (tests and emergencies only; production keeps it on).
 */
import type { RateLimiter } from './rate-limit';
import type { TurnstileResult } from './turnstile';

export type BotCheck =
  | { allowed: true }
  | { allowed: false; errorCode: 'honeypot_filled' }
  | { allowed: false; errorCode: 'rate_limited'; retryAfterSeconds: number }
  | { allowed: false; errorCode: 'turnstile_missing' | 'turnstile_invalid' };

export interface BotProtectionDeps {
  rateLimiter: RateLimiter;
  /** Null when Turnstile is not configured: the check is skipped, as in the plugin. */
  verifyToken: ((token: string) => Promise<TurnstileResult>) | null;
  /** Hostname and action checks on a successful token (spec Q.2). */
  tokenMatches?: (result: TurnstileResult) => boolean;
  enabled?: boolean;
}

export async function checkBotProtection(
  payload: Readonly<Record<string, unknown>>,
  clientKey: string,
  deps: BotProtectionDeps,
): Promise<BotCheck> {
  if (deps.enabled === false) return { allowed: true };

  // Layer 1: a real visitor never fills the hidden field.
  if (String(payload.honeypotValue ?? '') !== '') {
    return { allowed: false, errorCode: 'honeypot_filled' };
  }

  // Layer 2: the rate limit.
  const rate = await deps.rateLimiter.check(clientKey);
  if (!rate.allowed) {
    return { allowed: false, errorCode: 'rate_limited', retryAfterSeconds: rate.retryAfterSeconds };
  }

  // Layer 3: Turnstile, only when configured.
  if (deps.verifyToken !== null) {
    const token = typeof payload.turnstileToken === 'string' ? payload.turnstileToken : '';
    if (token === '') return { allowed: false, errorCode: 'turnstile_missing' };
    const result = await deps.verifyToken(token);
    const matches = deps.tokenMatches ? deps.tokenMatches(result) : result.success;
    if (!matches) return { allowed: false, errorCode: 'turnstile_invalid' };
  }

  await deps.rateLimiter.record(clientKey);
  return { allowed: true };
}
