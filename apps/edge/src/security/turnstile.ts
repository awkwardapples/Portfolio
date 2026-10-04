/**
 * Turnstile verification (spec Q.2; ported from the plugin's
 * TurnstileClient). Never throws: network failures and malformed responses
 * are failures with an error code.
 *
 * Beyond the plugin, a successful token must also come from the expected
 * hostname and carry the expected action ('contact-submit'), so a token
 * issued on another site or for another form is refused.
 */
export const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  success: boolean;
  errorCodes: string[];
  hostname?: string | undefined;
  action?: string | undefined;
}

export async function verifyTurnstile(
  token: string,
  remoteIp: string,
  secret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileResult> {
  let response: Response;
  try {
    const body = new FormData();
    body.set('secret', secret);
    body.set('response', token);
    if (remoteIp) body.set('remoteip', remoteIp);
    response = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { success: false, errorCodes: ['network_error'] };
  }

  let decoded: unknown;
  try {
    decoded = await response.json();
  } catch {
    return { success: false, errorCodes: ['invalid_response'] };
  }
  if (decoded === null || typeof decoded !== 'object' || Array.isArray(decoded)) {
    return { success: false, errorCodes: ['invalid_response'] };
  }
  const data = decoded as Record<string, unknown>;
  const errorCodes = Array.isArray(data['error-codes'])
    ? (data['error-codes'] as unknown[]).map(String)
    : [];
  return {
    success: data.success === true,
    errorCodes,
    hostname: typeof data.hostname === 'string' ? data.hostname : undefined,
    action: typeof data.action === 'string' ? data.action : undefined,
  };
}

/**
 * A verified token is acceptable only for this site and this form: its
 * hostname must be one of the expected hostnames (the configured ones and the
 * one the Worker is serving the request on), and its action must match.
 */
export function turnstileMatches(
  result: TurnstileResult,
  expected: { hostnames?: readonly string[] | undefined; action?: string | undefined },
): boolean {
  if (!result.success) return false;
  const hostnames = (expected.hostnames ?? []).filter(Boolean);
  if (hostnames.length > 0 && !hostnames.includes(result.hostname ?? '')) return false;
  if (expected.action && result.action !== expected.action) return false;
  return true;
}
