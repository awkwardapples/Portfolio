# ADR-0028: Duplicate Submission Prevention

**Status:** Accepted (Step 5.13g, 2026-07-14)

## Context

Same-person duplicate submissions (a user resubmitting, or the same lead filling the
form twice) cause noise for the business owner and waste WhatsApp/Sheets forwarding
resources (ADR-0027 already spends effort keeping bots off that path — a real,
non-malicious duplicate deserves the same courtesy). Before this step nothing detected
duplicates: every submission that passed validation and bot protection was persisted
and forwarded, regardless of how recently the same contact had already submitted.

## Decision

Duplicate detection at submission time, inside `SubmissionController::handle()` between
shape validation (Step 1) and persistence (Step 2):

- **Match criteria:** normalized `contact_email` (lowercase, trimmed) OR normalized
  `contact_phone` (digits-only) matches a **non-duplicate** submission created within
  the last 24 hours (D1, D2).
- **Handling:** the submission is still fully accepted, persisted, and (for photo
  fields) has its photos saved exactly as a normal submission would — only
  `is_duplicate`/`duplicate_of` differ (D3).
- **User feedback:** the response is still `200` with a `reference`, plus
  `isDuplicate: true`; the client (not the server) owns the "already received" copy
  shown on `SuccessScreen` (see Deviations).
- **Business owner:** sees the duplicate flag on the row directly in the database;
  surfacing it in the Google Sheets forward specifically is out of scope here since
  duplicates never reach the forwarder at all (D6/D7 — see Deviations).
- **WhatsApp / Make.com:** never triggered for a duplicate (D7) — `Forwarder::forward()`
  is simply never called.

## Implementation

Schema addition (via the existing `dbDelta` mechanism, not a new migration path):

- `is_duplicate` TINYINT(1) DEFAULT 0
- `duplicate_of` BIGINT UNSIGNED NULL
- `idx_duplicate_lookup (created_at, is_duplicate)` composite index

`DuplicateDetector` normalizes the two contact fields and delegates the lookup to a new
`SubmissionRepository::find_recent_by_contact()` query
(`JSON_UNQUOTE(JSON_EXTRACT(answers_json, '$.contact_email'))`/`'$.contact_phone'`,
`is_duplicate = 0`, `created_at >= window_start`). `SubmissionController` runs the check
right after validation, carries the result through photo storage/persistence, and — for
a duplicate — returns immediately after the DB insert, never calling `Forwarder`.

## Deviations from the spec

Recorded here because they reflect real architectural constraints discovered during
Phase 0 audits, not arbitrary preference:

- **No dedicated columns for `contact_email`/`contact_phone`.** The spec's own
  "Undocumented Assumption Check" assumed these were queryable columns; they are keys
  inside `answers_json` (`AUDIT-5.13g-schema.md`). `find_recent_by_contact()` uses
  `JSON_UNQUOTE(JSON_EXTRACT(...))` rather than a bare `JSON_EXTRACT()` comparison — the
  latter compares against a quoted JSON string and relies on implicit-cast semantics
  that are a well-known correctness footgun.
- **Schema change goes through `dbDelta`, not a hand-rolled `SHOW COLUMNS`/`ALTER TABLE`
  check in `Activator`.** The plugin already has an idempotent migration mechanism for
  this exact table (`Schema::submissions_table_sql()`); adding the new columns/index to
  that CREATE TABLE definition is sufficient, and simpler than the spec's proposal.
- **`Forwarder.php` is unmodified.** The spec's Implementation Plan proposed teaching
  `Forwarder::forward()` to load the submission by ID and check `is_duplicate`.
  `Forwarder` has no DB access and no by-ID lookup today, and the controller already
  holds the duplicate-check result at the exact point it decides whether to call
  `forward()` at all (`AUDIT-5.13g-forwarder.md`) — adding a lookup capability to
  `Forwarder` purely to re-derive an answer the caller already has would duplicate
  `SubmissionRepository`'s job and cost an extra DB round-trip per submission.
- **No server-supplied "message" string in the response.** The spec's client-side
  section assumed `response.message` would be displayed verbatim. This codebase's
  existing convention (`http-submission-port.ts`'s `MSG_FALLBACK`/`MSG_FORWARDER`,
  `SuccessScreen.tsx`'s hardcoded copy) is that user-facing text is always client-owned;
  the server only ever contributes typed flags (`errorCode`, `mediaIssues`,
  `retryAfterSeconds`, and now `isDuplicate`). The duplicate response carries just the
  boolean; `SuccessScreen` supplies its own "We already have your request" copy.
- **Full client trace is deeper than the spec anticipated.** The spec hedged with
  "`apps/wizard/src/` (or wherever the submission response is handled)". The actual
  trace: `SubmissionPortResult` → `WizardStore.runSubmission()` →
  `SubmitSucceededEvent.isDuplicate` → `transition.ts`'s `handleSubmitSucceeded` →
  `SubmissionResult.isDuplicate` → `WizardShell.tsx` → `SuccessScreen.tsx`. `isDuplicate`
  is optional on the wire-facing types (`SubmissionPortResult`, `SubmitSucceededEvent`)
  so pre-5.13g call sites/tests don't need updating, but non-optional (always resolved
  to a concrete boolean) on `SubmissionResult` once the reducer normalizes it.
- **`DuplicateDetector` is not `final`.** Every other `SubmissionController` dependency
  (`Forwarder`, `PhotoStorage`, `MediaValidator`, `BotProtection`,
  `SubmissionRepository`) is a plain `class` specifically so tests can extend it as an
  anonymous spy double, per this codebase's established test-double convention.
  `DuplicateDetector` follows the same convention.
- **Window computed in UTC (`gmdate`), not local server time.** The spec's own
  pseudo-code used `date()`. `created_at` is stored via `current_time('mysql', true)`
  (GMT); comparing against a local-timezone window start would silently shift the
  24-hour boundary by the server's UTC offset.

## Consequences

**Positive:**

- No WhatsApp/Sheets noise for genuine repeat submissions within 24 hours.
- No data loss — a duplicate is fully persisted, including its photos, and traceable
  back to the original submission via `duplicate_of`.
- User is told their earlier submission was received, rather than silently ignored or
  met with an error.

**Negative / accepted tradeoffs:**

- Email/phone matching is an approximation of "same person" — a household sharing one
  phone number, or the same person using two different emails, are known false-positive
  and false-negative cases respectively (documented, not solved here).
- The JSON-path query cannot use a real index on the JSON values themselves (only on
  `created_at`/`is_duplicate`); acceptable at the lead volumes this template targets, but
  would need a generated/virtual column if volume grows significantly.
- No automated test exercises the raw SQL (`JSON_UNQUOTE(JSON_EXTRACT(...))`,
  `dbDelta` idempotency) against a real MySQL/MariaDB instance — there is no reachable
  database in this environment. `DuplicateDetector`'s business logic (normalization,
  window computation, delegation) is fully unit-tested against a fake
  `SubmissionRepository`; the query's real-DB correctness is a pending operational
  verification item, consistent with how 5.13e/5.13f's own live-site items were
  deferred.

## Not in scope

- Bot/spam protection changes (ADR-0027, unchanged).
- Photo storage changes (ADR-0026, unchanged).
- Wizard engine/FSM changes beyond the additive `isDuplicate` field.
- Spam scoring beyond duplicate detection.
- Surfacing the duplicate flag inside the Make.com/Sheets forward — moot, since
  duplicates never reach the forwarder.
- Data protection / regulatory compliance (Step 5.14).

## Cross-references

- ADR-0001 (thin WP REST endpoint), ADR-0005 (synchronous forwarder), ADR-0015
  (submission pipeline), ADR-0026 (photo URL storage), ADR-0027 (bot protection — the
  prior step establishing the "Step N" short-circuit pattern this step reuses)
- `AUDIT-5.13g-schema.md`, `AUDIT-5.13g-response-format.md`, `AUDIT-5.13g-forwarder.md`,
  `AUDIT-5.13g-existing-data.md`
