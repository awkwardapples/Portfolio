# Audit B — Current Submission Response Format (5.13g)

Date: 2026-07-14
Step: 5.13g Phase 0 Audit B

## No `Submit.php` — corrects a spec assumption

The spec refers to "`Submit.php` (or similar)". The actual, and only, REST handler is
`src/Rest/SubmissionController.php`, registered at `POST /wp-json/qw/v1/submit` from
`Plugin.php`. All responses are constructed inline in `SubmissionController::handle()`
and its private helper `bot_protection_error_response()`.

## Response matrix (as of Step 5.13f, before this step)

| Status | Body                                                           | Condition                                   |
| ------ | -------------------------------------------------------------- | ------------------------------------------- |
| 200    | `{ reference: "GOQW-<id>" }`                                   | persisted + forwarded successfully          |
| 400    | `{ errorCode: "validation_failed" }`                           | shape validation failed, or honeypot filled |
| 400    | `{ errorCode: "media_validation_failed", mediaIssues: [...] }` | photo magic-byte/dimension checks failed    |
| 403    | `{ errorCode: "bot_verification_failed" }`                     | Turnstile missing/invalid                   |
| 429    | `{ errorCode: "rate_limited", retryAfterSeconds: n }`          | per-IP rate limit exceeded                  |
| 500    | `{ errorCode: "persistence_failed" }`                          | DB insert threw                             |
| 502    | `{ errorCode: "forwarder_unavailable", submissionId: id }`     | persisted but webhook forward failed        |

## Chosen status for duplicates: 200, per spec's own recommendation

Confirmed against the client (`apps/wizard/src/runtime/http-submission-port.ts`):
`mapResponse()` branches on exact status codes (200 / 502 / 400·422 / 401·403 / else),
and a 200 is the only branch that produces `{ ok: true }`. A duplicate submission is, by
D3, still accepted and persisted — reusing 200 with an `isDuplicate` flag in the body
(rather than 409) means the existing success path in the client is reused almost as-is,
which is why the spec's own recommendation (200 + body flag, not 409) is followed as-is
— no drift here.

## Where responses are constructed

All inside `SubmissionController::handle()` (one large `try { ... } finally { ob_end_clean(); }`
block) and `bot_protection_error_response()`. There is no shared response-builder
helper; each `return new WP_REST_Response(...)` is inline. The duplicate-response branch
added in Commit 4 follows this same inline convention rather than introducing a new
abstraction for a single call site.

## Client-side response handling: no generic "message" passthrough — corrects a spec assumption

The spec's §4.5 assumes the client reads `response.message` and displays it verbatim.
In reality, `httpSubmissionPort`'s `mapResponse()` never surfaces server-supplied prose
to the user — every user-facing string in the client (`MSG_FALLBACK`, `MSG_FORWARDER` in
`http-submission-port.ts`, and the hardcoded copy in `SuccessScreen.tsx`) is owned
client-side; the server only ever contributes typed flags/codes (`errorCode`,
`mediaIssues`, `retryAfterSeconds`) that the client maps to its own copy. Duplicate
handling follows this same convention: the wire response carries a boolean
`isDuplicate` flag (not a message string), and the client owns the "already received"
copy shown in `SuccessScreen.tsx`. The full trace of files touched by this (deeper than
the spec's own uncertain "`apps/wizard/src/` (or wherever...)") is: `SubmissionPortResult`
→ `WizardStore.runSubmission()` → `SubmitSucceededEvent` → `SubmissionResult` →
`WizardShell.tsx` → `SuccessScreen.tsx`.
