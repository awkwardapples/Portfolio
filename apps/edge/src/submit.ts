/**
 * POST /api/submit (spec Q.2, Q.3; ADR-0043): the plugin's
 * SubmissionController ported to the Worker, in the same order, with the
 * spec's additions.
 *
 *   1. Same-origin request with a JSON content type, else 403 unauthorized
 *      (replaces the WordPress nonce).
 *   2. Body at most 16 kB, else 413 payload_too_large.
 *   3. Valid JSON, else 400 validation_failed.
 *   4. Bot protection: honeypot (400), rate limit (429), Turnstile (403).
 *   5. Shape: contract version, intent, an answers object (400).
 *   6. Consent (400 consent_required); nothing is stored without it.
 *   6a. The answers against the intent's WizardConfig (400).
 *   7. Duplicate check: a duplicate is stored, flagged, never forwarded.
 *   8. Persist (500 persistence_failed if it fails), then answer 200.
 *   9. Forward to Make.com after responding (ctx.waitUntil); a failure is
 *      retried by the cron, so the visitor never sees one.
 *
 * Every dependency is passed in, so test/submit.test.ts drives each case.
 */
import { json } from './http';
import { checkBotProtection, type BotProtectionDeps } from './security/bot-protection';
import { isConsentGiven } from './security/consent';
import { checkDuplicate, normaliseEmail } from './submissions/duplicates';
import { nextAttemptAfter, type ForwardInput, type ForwardResult } from './submissions/forwarder';
import type { SubmissionRepository } from './submissions/repository';
import { validateAnswers, validateSubmission } from './submissions/validate';

export const MAX_BODY_BYTES = 16 * 1024;
/** How long the immediate forward holds a row before the cron may retry it. */
export const FORWARD_LEASE_MS = 5 * 60_000;

export interface SubmitDeps extends Omit<BotProtectionDeps, 'enabled'> {
  repository: SubmissionRepository;
  forward: (input: ForwardInput) => Promise<ForwardResult>;
  waitUntil: (promise: Promise<unknown>) => void;
  siteOrigin: string;
  /** HMAC of the client address for the rate limit (src/security/rate-limit.ts). */
  clientKey: (ip: string) => Promise<string>;
  newReference: () => string;
  now?: () => number;
  log?: (message: string) => void;
}

function isSameOrigin(request: Request, siteOrigin: string): boolean {
  const origin = request.headers.get('origin');
  if (origin !== null && origin === siteOrigin) return true;
  return request.headers.get('sec-fetch-site') === 'same-origin';
}

/** Reads the body, refusing anything over the limit without buffering more of it. */
async function readLimited(request: Request, limit: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > limit) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function handleSubmit(request: Request, deps: SubmitDeps): Promise<Response> {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? ((message: string) => console.log(message));

  if (request.method !== 'POST') {
    return json(405, { errorCode: 'method_not_allowed' }, { allow: 'POST' });
  }
  const contentType = request.headers.get('content-type') ?? '';
  if (!isSameOrigin(request, deps.siteOrigin) || !/^application\/json\b/i.test(contentType)) {
    return json(403, { errorCode: 'unauthorized' });
  }

  const body = await readLimited(request, MAX_BODY_BYTES);
  if (body === null) return json(413, { errorCode: 'payload_too_large' });

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return json(400, { errorCode: 'validation_failed' });
  }

  // Bot protection runs before validation, as in the plugin: it is cheaper.
  const botPayload =
    payload !== null && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const bot = await checkBotProtection(botPayload, await deps.clientKey(ip), deps);
  if (!bot.allowed) {
    if (bot.errorCode === 'rate_limited') {
      return json(429, { errorCode: 'rate_limited', retryAfterSeconds: bot.retryAfterSeconds });
    }
    if (bot.errorCode === 'honeypot_filled') {
      log('submit: honeypot filled');
      return json(400, { errorCode: 'validation_failed' });
    }
    return json(403, { errorCode: 'bot_verification_failed' });
  }

  const validated = validateSubmission(payload);
  if (!validated.ok) {
    log(`submit: validation failed (${validated.reason})`);
    return json(400, { errorCode: 'validation_failed' });
  }
  const { intent, schemaVersion, answers, clientTimestamp } = validated.value;

  if (!isConsentGiven(answers)) return json(400, { errorCode: 'consent_required' });

  const answersValid = validateAnswers(intent, answers);
  if (!answersValid.ok) {
    log(`submit: validation failed (${answersValid.reason})`);
    return json(400, { errorCode: 'validation_failed' });
  }

  const email = typeof answers.contact_email === 'string' ? answers.contact_email : '';
  const phone = typeof answers.contact_phone === 'string' ? answers.contact_phone : '';
  const duplicate = await checkDuplicate(deps.repository, email, phone, now());

  const createdAt = new Date(now()).toISOString();
  const row = {
    intent,
    schemaVersion,
    answersJson: JSON.stringify(answers),
    contactEmailNorm: email ? normaliseEmail(email) : null,
    isDuplicate: duplicate.isDuplicate,
    duplicateOf: duplicate.isDuplicate ? duplicate.originalSubmissionId : null,
    consentTimestamp: createdAt,
    status: duplicate.isDuplicate ? ('duplicate_not_forwarded' as const) : ('pending' as const),
    nextAttemptAt: duplicate.isDuplicate ? null : new Date(now() + FORWARD_LEASE_MS).toISOString(),
    clientTimestamp,
    createdAt,
  };

  let id: number;
  let reference = deps.newReference();
  try {
    try {
      id = await deps.repository.insert({ ...row, reference });
    } catch {
      // A reference collision is astronomically unlikely; one fresh try covers it.
      reference = deps.newReference();
      id = await deps.repository.insert({ ...row, reference });
    }
  } catch (error) {
    log(`submit: persist failed (${error instanceof Error ? error.message : 'unknown'})`);
    return json(500, { errorCode: 'persistence_failed' });
  }

  if (duplicate.isDuplicate) {
    log(`submit: ${reference} duplicates #${duplicate.originalSubmissionId}; not forwarded`);
    return json(200, { reference, isDuplicate: true });
  }

  deps.waitUntil(
    (async () => {
      const result = await deps.forward({
        id,
        reference,
        intent,
        schemaVersion,
        answers,
        clientTimestamp,
      });
      if (result.ok) {
        await deps.repository.markForwarded(id);
        return;
      }
      const next = nextAttemptAfter(1, now());
      await deps.repository.recordForwardFailure(
        id,
        result.error,
        next,
        next ? 'pending' : 'forward_failed',
      );
      log(`submit: ${reference} stored; forward failed (${result.error}), retry scheduled`);
    })(),
  );

  return json(200, { reference });
}
