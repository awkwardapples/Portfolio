# ADR-0043: The submission pipeline, ported from the WordPress plugin to the Worker

**Status:** Accepted
**Date:** 2026-10-04 (Portfolio Pass 6)
**Supersedes for this repository:** ADR-0005 (synchronous forward). ADR-0001 (persist before forward), ADR-0027 (bot protection), ADR-0028 (duplicates), ADR-0029 (consent) and ADR-0037 (outbound sanitising) carry over, ported.

## Context

The GrowTrades plugin's `SubmissionController` was the most carefully built part of this repository: honeypot, rate limit, Turnstile, shape validation, consent, duplicate detection, persist before forward, formula-injection sanitising, and pruning, each with PHP tests (spec B.3). The portfolio has no WordPress (ADR-0039), so the pipeline moves to the Cloudflare Worker, `POST /api/submit` (spec Q.2, Q.3). The spec also names gaps to close in the port: no server-side validation of answers, no body size limit, no Turnstile hostname check, and the raw IP as the rate-limit key.

## Decision

**Same order, same behaviour, ported module by module** (`apps/edge/src/`):

| Plugin                       | Worker                                      |
| ---------------------------- | ------------------------------------------- |
| `BotProtection`              | `security/bot-protection.ts`                |
| `RateLimiter` (transients)   | `security/rate-limit.ts` (D1 `rate_limits`) |
| `TurnstileClient`            | `security/turnstile.ts`                     |
| `ConsentValidator`           | `security/consent.ts`                       |
| `InputSanitizer`             | `security/sanitize.ts`                      |
| `DuplicateDetector`          | `submissions/duplicates.ts`                 |
| `SubmissionRepository`       | `submissions/repository.ts` (D1)            |
| `Forwarder`                  | `submissions/forwarder.ts`                  |
| `PruneSubmissions` (WP cron) | `scheduled.ts` (Worker cron triggers)       |
| `SubmissionController`       | `submit.ts`                                 |

The order of checks is the plugin's: bot protection (honeypot, rate limit, Turnstile; the limit recorded only when all pass), shape, consent, duplicates, persist, forward. The response codes and bodies are the ones the wizard's HTTP port already understands (spec Q.3).

**Parity, proved case by case.** Every PHP test of the ported classes has a Vitest counterpart named after it (`apps/edge/test/protections.test.ts`, `submit.test.ts`, `pipeline.test.ts`). Cases with no counterpart are the plugin's photo handling (the portfolio accepts no uploads), its output buffering (the Worker writes nothing but its JSON) and WordPress settings resolution. Behaviour the spec changes is marked "changed" in the test titles; protections the port adds are marked "new". Once they passed, `plugins/quote-wizard/` was deleted; it remains in git history before this pass's merge.

**What changed, deliberately:**

- **Forwarding happens after the response.** The row is persisted, the visitor gets 200, and the forward to Make.com runs in `ctx.waitUntil`. A failure schedules a retry; a cron every 15 minutes retries pending rows with back-off (15, 30, 60, 120 minutes; five attempts), leasing each row first so two runs never send it twice. A portfolio enquiry is safe once stored, so a notification failure is not the visitor's problem. This supersedes ADR-0005 here.
- **No webhook, no lost messages.** Until `MAKE_WEBHOOK_URL` is set, rows stay pending without spending attempts, and the cron forwards them once it is.
- **Server-side answer validation.** The Worker imports the same `WizardConfig` objects as the island (`apps/site/src/wizard/intents.ts`) and the engine's own `validateStep`, so unknown intents, unknown answer keys, wrong options, bad formats and over-long strings are rejected with exactly the browser's rules. Wrangler's bundler resolves the engine's `@/` imports through the wizard's tsconfig; nothing is copied.
- **Consent is checked before the answers**, so a missing consent always reads as `consent_required` (spec Q.3), as it did when the plugin checked it straight after the shape.
- **An origin check replaces the WordPress nonce**: `Origin` must equal `SITE_ORIGIN`, or `Sec-Fetch-Site` must be `same-origin`, and the body must be JSON; otherwise 403.
- **A 16 kB body limit** (413), enforced while reading, whatever `Content-Length` claims.
- **Turnstile tokens must match** the expected hostname and the action `contact-submit`.
- **The rate-limit key is an HMAC-SHA-256** of `CF-Connecting-IP` with the secret `RATE_LIMIT_SALT`; no address is stored.
- **References are random** (`JL-` and eight Crockford base32 characters), not sequential ids.
- **The webhook carries `X-Webhook-Secret`**, which the scenario's first filter checks (`docs/make-com.md`), and adds `reference` and `intent_label` to the plugin's documented payload.
- **Retention**: rows older than `RETENTION_DAYS` (90) and ended rate-limit windows are deleted by a daily cron.

**Testing the storage for real.** The pipeline tests use an in-memory repository; the D1 repository's SQL runs against the actual migrations on Node 24's built-in SQLite (`test/helpers.ts`), so no Workers test pool dependency is needed. The browser tests run the whole pipeline on `wrangler dev` with a local D1 and a stub webhook (`apps/site/e2e/start-worker.mjs`, `webhook-stub.mjs`).

## Alternatives considered

- **Keeping the synchronous forward.** Rejected for the reason above; the spec asks for it to go.
- **A queue (Cloudflare Queues) instead of the cron.** Rejected: another binding and another moving part for a few messages a week; D1 rows already are the queue.
- **`@cloudflare/vitest-pool-workers` for D1 tests.** Approved by spec U.6 but heavier to run on Windows; Node's SQLite runs the same SQL with no new dependency. The browser tests cover the Worker runtime itself.
- **Keeping the plugin for reference.** Rejected once parity was proven; git history keeps it.

## Consequences

- The Worker needs four secrets (`MAKE_WEBHOOK_URL`, `MAKE_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SALT`) and the site one variable (`PUBLIC_TURNSTILE_SITE_KEY`): `docs/deployment.md`. The Turnstile secret and site key must be set together: a secret without the widget refuses every message, and a widget without the secret is not checked.
- Josh exports or deletes a person's data, and handles a leaked secret, with `docs/data-protection.md`.
- Rows the cron gives up on stay as `forward_failed`, visible with one query, and are still pruned after 90 days.
