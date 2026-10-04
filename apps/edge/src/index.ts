/**
 * The portfolio's Cloudflare Worker (spec U.1, ADR-0040, ADR-0043).
 *
 * Only `/api/*` runs this code first (`run_worker_first` in wrangler.jsonc);
 * every other request is answered by the asset handler from apps/site/dist.
 *
 *   GET  /api/health   liveness
 *   POST /api/submit   the contact pipeline (src/submit.ts)
 *
 * Cron triggers retry pending forwards and prune old data (src/scheduled.ts).
 */
import type { Env } from './env';
import { json } from './http';
import { RateLimiter, clientKey } from './security/rate-limit';
import { turnstileMatches, verifyTurnstile } from './security/turnstile';
import { PRUNE_CRON, pruneExpired, retryPendingForwards } from './scheduled';
import { forward } from './submissions/forwarder';
import { newReference } from './submissions/reference';
import { D1RateLimitStore, D1SubmissionRepository } from './submissions/repository';
import { handleSubmit } from './submit';

/** The Turnstile action the contact form sends (apps/site/src/islands/ContactWizard.tsx). */
const TURNSTILE_ACTION = 'contact-submit';

const webhookOf = (env: Env) => ({ url: env.MAKE_WEBHOOK_URL, secret: env.MAKE_WEBHOOK_SECRET });

export async function handleRequest(
  request: Request,
  env: Env,
  ctx: Pick<ExecutionContext, 'waitUntil'>,
): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname === '/api/health') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json(405, { errorCode: 'method_not_allowed' }, { allow: 'GET, HEAD' });
    }
    return json(200, { status: 'ok' });
  }

  if (pathname === '/api/submit') {
    const secret = env.TURNSTILE_SECRET_KEY;
    return handleSubmit(request, {
      repository: new D1SubmissionRepository(env.DB),
      rateLimiter: new RateLimiter(
        new D1RateLimitStore(env.DB),
        Number(env.RATE_LIMIT_PER_HOUR) || 5,
      ),
      verifyToken: secret
        ? (token) => verifyTurnstile(token, request.headers.get('cf-connecting-ip') ?? '', secret)
        : null,
      tokenMatches: (result) =>
        turnstileMatches(result, {
          // The configured hostnames, and the one this request arrived on (the
          // workers.dev address before the domain is attached).
          hostnames: [
            ...env.TURNSTILE_EXPECTED_HOSTNAME.split(',').map((name) => name.trim()),
            new URL(request.url).hostname,
          ],
          action: TURNSTILE_ACTION,
        }),
      forward: (input) => forward(input, webhookOf(env)),
      waitUntil: (promise) => ctx.waitUntil(promise),
      siteOrigin: env.SITE_ORIGIN,
      clientKey: (ip) => clientKey(ip, env.RATE_LIMIT_SALT ?? ''),
      newReference: () => newReference(),
    });
  }

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return json(404, { errorCode: 'not_found' });
  }

  // Not reached while only /api/* runs the Worker first, but keeps the Worker
  // correct if that routing ever changes.
  return env.ASSETS.fetch(request);
}

export async function handleScheduled(cron: string, env: Env): Promise<void> {
  if (cron === PRUNE_CRON) {
    const rateLimits = new D1RateLimitStore(env.DB);
    const result = await pruneExpired({
      repository: new D1SubmissionRepository(env.DB),
      deleteExpiredRateLimits: (now) => rateLimits.deleteExpired(now),
      retentionDays: Number(env.RETENTION_DAYS) || 90,
    });
    console.log(
      `prune: ${result.submissions} submissions, ${result.rateLimits} rate-limit windows`,
    );
    return;
  }
  // Without a webhook there is nowhere to forward to: rows wait, attempts unspent.
  if (!env.MAKE_WEBHOOK_URL) return;
  const result = await retryPendingForwards({
    repository: new D1SubmissionRepository(env.DB),
    forward: (input) => forward(input, webhookOf(env)),
  });
  if (result.forwarded + result.failed > 0) {
    console.log(`retry: ${result.forwarded} forwarded, ${result.failed} failed`);
  }
}

export default {
  fetch: (request, env, ctx) => handleRequest(request, env, ctx),
  scheduled: (controller, env, ctx) => ctx.waitUntil(handleScheduled(controller.cron, env)),
} satisfies ExportedHandler<Env>;
