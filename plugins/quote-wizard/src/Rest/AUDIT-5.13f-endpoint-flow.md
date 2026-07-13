# Audit A — Current REST Endpoint Request Flow (5.13f)

_Performed: 2026-07-13_

## File examined

`plugins/quote-wizard/src/Rest/SubmissionController.php`

Note: the spec referenced `Submit.php`; the actual file is `SubmissionController.php`
(same drift already documented in `AUDIT-5.12b-submit-buffering.md` and
`AUDIT-5.13e-photo-handling.md` — the spec has never been updated to the real name).

## Where the submission enters the handler

`SubmissionController::handle( WP_REST_Request $request ): WP_REST_Response`
([SubmissionController.php:59](SubmissionController.php#L59)), registered in
`Plugin::boot()` as the callback for `POST /wp-json/qw/v1/submit`. The whole body runs
inside `ob_start()`/`finally { ob_end_clean(); }` (Step 5.12b output-buffering fix) —
any new check added here must stay inside that `try` block to keep the same guarantee.

## Current validation order (as of Step 5.13e)

1. **Shape validation** — `validate($payload)` (payload keys, contract version, quote
   mode, wizardId, answers, pricing). Failure → 400 `validation_failed`, nothing
   persisted.
2. **Media validation** — `MediaValidator::validate($answers)` (size, MIME, magic-byte,
   dimensions). Failure → 400 `media_validation_failed` + `mediaIssues`, nothing
   persisted.
3. **Photo storage** — `store_photos($answers)` (Step 5.13e) — saves photos to the
   media library, replaces `dataBase64` with `url`/`attachmentId`. Cannot fail the
   request (per-photo failures are dropped and logged, D5).
4. **Persist** — `SubmissionRepository::insert()`. Failure → 500, cleans up any
   orphaned photo attachments (D6).
5. **Forward** — `Forwarder::forward()` to Make.com. Failure → 502 `forwarder_unavailable`,
   row already persisted.
6. **Respond** — 200 `{ reference }`.

## Where BotProtection should be inserted

Before step 1 (shape validation) — a bot's payload may not even pass shape validation
(fine either way, since honeypot/rate-limit/Turnstile checks are cheaper than JSON shape
validation and should short-circuit first per the spec's own cost-ordering rationale:
honeypot is a single array-key check, rate limiting is one transient read, Turnstile is
the only network call of the three — cheapest-first, same principle `MediaValidator`
already uses). Concretely: immediately after `$payload = $request->get_json_params();`
and before `$validated = $this->validate($payload);`.

The client IP is not currently extracted anywhere in this codebase — `grep`
for `REMOTE_ADDR` / `getClientIp` / `X-Forwarded-For` returns nothing. A minimal helper
reading `$_SERVER['REMOTE_ADDR']` is introduced in this step; proxy/CDN
`X-Forwarded-For` trust is explicitly out of scope (no reverse-proxy configuration
exists yet in this template) and would need a trusted-proxy allowlist to do safely —
noted as a follow-up in ADR-0027, not built here.

## Return format for validation errors

Every failure path returns `new WP_REST_Response(['errorCode' => ..., ...], $status)`,
never throws to the REST layer, and never reveals internal detail beyond an `errorCode`
string (`AUDIT-5.13e-photo-handling.md` established this pattern already applies
uniformly). Bot-protection failures follow the same shape: `errorCode` plus, only for
the rate-limit case, a `retryAfterSeconds` integer the frontend can use to compute a
user-facing wait time — mirroring how `502` responses already carry `submissionId` and
`400` media failures already carry `mediaIssues`.
