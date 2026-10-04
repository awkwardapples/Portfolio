/**
 * Bindings and configuration available to the Worker (wrangler.jsonc).
 *
 * Secrets are set with `wrangler secret put` and never committed (spec Q.3,
 * U.8; docs/deployment.md). They are optional in the type because the
 * Worker degrades safely without them: no Turnstile secret skips that check
 * (as the plugin did), and no webhook keeps submissions pending in D1 until
 * one is set, when the cron forwards them.
 */
export interface Env {
  /** The built site in apps/site/dist. */
  ASSETS: Fetcher;
  /** Submissions and rate-limit counters (migrations/). */
  DB: D1Database;

  SITE_ORIGIN: string;
  RATE_LIMIT_PER_HOUR: string;
  RETENTION_DAYS: string;
  TURNSTILE_EXPECTED_HOSTNAME: string;

  MAKE_WEBHOOK_URL?: string;
  MAKE_WEBHOOK_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  RATE_LIMIT_SALT?: string;
}
