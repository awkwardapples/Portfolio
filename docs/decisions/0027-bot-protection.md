# ADR-0027: Bot & Spam Protection

**Status:** Accepted (Step 5.13f, 2026-07-13)

## Context

The submission pipeline forwards every accepted lead to Make.com, which fans out to
WhatsApp notifications and Google Sheets (`docs/make-com-integration.md`). WhatsApp
Business API messages are charged per send. Spam or bot submissions reaching the
endpoint would trigger real costs and pollute the lead sheet with noise. No protection
existed before this step — `SubmissionController` validated shape and media, but nothing
distinguished a real visitor from a scripted flood.

## Decision

Three-layer defense, all server-side, all running before shape validation
(`SubmissionController::handle()`, Step 0):

1. **Honeypot field** — an invisible `honeypotValue` field. A real user never fills it;
   a naive bot that fills every input on the page does. Filled → rejected with the same
   `errorCode`/status as an ordinary validation failure (`validation_failed`, 400) — a
   bot cannot distinguish "caught by honeypot" from "sent malformed JSON."
2. **Rate limiting** — `RateLimiter` (WordPress transients), default 5 successful
   submissions per IP per hour, configurable via `goqw_rate_limit_per_hour`. Counts
   successful submissions, not raw attempts — a honeypot-rejected request never consumes
   a slot.
3. **Cloudflare Turnstile** — `TurnstileClient` verifies a token server-side against
   `challenges.cloudflare.com/turnstile/v0/siteverify`. Only runs when both
   `goqw_turnstile_site_key` and `goqw_turnstile_secret_key` are configured
   (`Settings::turnstile_configured()`) — a deployment that hasn't set up Cloudflare yet
   still gets layers 1 and 2.

`BotProtection` runs all three in that order (cheapest first — honeypot is a single
array-key check, rate limiting is one transient read, Turnstile is the only network
call), matching the cost-ordering principle `MediaValidator` already applies to its own
checks. A single `goqw_bot_protection_enabled` option (default on) disables all three at
once without a code change.

**D1-D7 (from the confirmed decision set):** honeypot + rate limit + Turnstile as the
three layers; Turnstile in Managed mode (silent for most visitors); rate limit default
5/hour; bot protection on by default; per-client Turnstile setup; standard testing
discipline; keep the wire contract additive (two new optional fields, no breaking
change to existing submission shape).

## Deviations from the spec

Recorded here because they reflect real architectural constraints discovered during
Phase 0 audits, not arbitrary preference:

- **`Rest/Submit.php` → `Rest/SubmissionController.php`.** Same pre-existing naming
  drift documented in every prior step's audits (5.12b, 5.13e). The spec has never been
  corrected to the real name.
- **`Support/BotProtectionConfig.php` → extended `Support/Settings.php` instead.**
  `Settings` already owns "typed access to plugin settings" with a documented
  constant-over-option precedence chain (used for the webhook URL). A second class with
  the identical responsibility would fork that abstraction for no reason
  (`AUDIT-5.13f-options.md`).
- **Wire keys are camelCase (`honeypotValue`, `turnstileToken`), not the spec's
  snake_case (`website_field`, `turnstile_token`).** Every existing top-level payload
  key in this wire contract is camelCase (`wizardId`, `quoteMode`, `clientTimestamp`);
  snake_case would be the only inconsistent pair.
- **Bot-protection data lives in a volatile `BotProtectionStore`, not `WizardState`.**
  The spec's pseudo-code implied threading `honeypotValue`/`turnstileToken` through the
  FSM. `WizardStore`'s own docblock explicitly excludes anything but wizard-answer
  state, and — more concretely — the sessionStorage persistence adapter serializes
  `state.answers` wholesale; neither a honeypot value nor a single-use, ~5-minute
  Turnstile token should ever be written to disk. `BotProtectionStore` +
  `createBotProtectionEnrichedPort` mirror `PhotoStore` + `createPhotoEnrichedPort`
  (Step 4.8) exactly — the same problem (volatile, submission-time-only data) already
  had an established solution in this codebase.
- **The honeypot mounts once in `WizardShell`, not inside `StepRenderer`'s "final
  submission form."** `StepRenderer` remounts (fresh local state) on every step change
  via `key={step.id}`. A honeypot placed there would discard whatever a bot wrote into
  it before the user ever reaches the last step. `WizardShell`'s `<main>` is unkeyed
  across step transitions, so it stays mounted for the whole session
  (`AUDIT-5.13f-form-structure.md`).
- **The Turnstile SDK is not bundled.** `TurnstileWidget` dynamically injects
  `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js">` on mount, only
  when `config.turnstileSiteKey` is non-empty, and only once per page regardless of
  remounts. Bundle grew ~0.8 kB gzip (87.20 → 87.96 kB) instead of the spec's estimated
  10-15 kB, which assumed the SDK would ship inside the wizard bundle.
- **No dedicated component tests for `HoneypotField`/`TurnstileWidget`.** This codebase
  has zero `.test.tsx` files anywhere and no React Testing Library dependency;
  `vitest.config.ts` deliberately runs the domain/runtime suite in the `node`
  environment with no DOM, specifically to prove domain purity. Adding component-render
  tests here would be new test infrastructure, not consistency with an existing
  pattern — every other component in `src/components/` is verified operationally, and
  these two follow the same convention.

## Consequences

**Positive:**

- Bots never reach persistence, Make.com, WhatsApp, or Sheets — cost and noise
  protection with zero per-submission friction for real users in the common case.
- `goqw_bot_protection_enabled = 0` is a one-line rollback with no code change.
- Turnstile is entirely optional — a client without Cloudflare access still gets two of
  the three layers on day one.

**Negative / accepted tradeoffs:**

- `ClientIp::resolve()` reads `$_SERVER['REMOTE_ADDR']` only — no reverse-proxy /
  CDN header trust (`X-Forwarded-For`, `CF-Connecting-IP`). Behind a proxy that doesn't
  preserve the real client IP there, rate limiting keys off the proxy's IP instead.
  Trusting those headers safely needs a trusted-proxy allowlist this template doesn't
  have yet; noted as a follow-up, not built here.
- Rate limiting depends on WordPress transients, which delegate to an external object
  cache when one is configured — `RateLimiter` stores its own expiry timestamp inside
  the transient value specifically so `retryAfterSeconds` stays correct regardless of
  backend (see `RateLimiter`'s docblock).
- A honeypot-rejected request never increments the rate limit, so a bot that always
  fills the honeypot can retry indefinitely — mitigated by the fact that it never gets
  past Layer 1 in the first place.

## Not in scope

- CAPTCHA-style user challenges (Turnstile's Managed mode handles this internally).
- Behavioral analysis or spam scoring beyond the three layers.
- IP-based blocking beyond rate limiting.
- Duplicate-submission prevention (Step 5.13g).
- Consent tracking / privacy policy updates (Step 5.14).

## Cross-references

- ADR-0001 (thin WP REST endpoint), ADR-0015 (submission pipeline), ADR-0026 (photo URL
  storage — the prior step establishing the enriched-submission-port pattern this step
  reuses)
- `AUDIT-5.13f-endpoint-flow.md`, `AUDIT-5.13f-options.md`, `AUDIT-5.13f-form-structure.md`,
  `AUDIT-5.13f-turnstile-api.md`
