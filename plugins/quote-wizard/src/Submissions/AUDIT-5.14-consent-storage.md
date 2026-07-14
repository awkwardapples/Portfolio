# Audit B — Consent Storage in Submissions (5.14)

Date: 2026-07-14
Step: 5.14 Phase 0 Audit B

## Files examined

`plugins/quote-wizard/src/Submissions/Schema.php`, `plugins/quote-wizard/src/Submissions/SubmissionRepository.php`,
`plugins/quote-wizard/src/Activator.php`.

## Columns, not `answers_json` — confirms the spec's own recommendation

The spec asks this question and already recommends the answer it wants confirmed: columns, not
JSON keys. This matches what Step 5.13g did for `is_duplicate` / `duplicate_of` — both are metadata
_about_ a submission (computed/recorded by the server), not user-authored answer data, so they live
as first-class columns rather than inside `answers_json`. Consent is the same kind of fact: it is
not something the business asked the customer as a "question" whose value flows through the wizard
config's field system for _display and forwarding_ purposes — it is compliance metadata the server
must be able to query independently (e.g. "how many submissions this month lack a consent
timestamp"). Columns confirmed.

Naming: `consent_given TINYINT(1) NOT NULL DEFAULT 0`, `consent_timestamp DATETIME NULL` — same
shape as `is_duplicate TINYINT(1) NOT NULL DEFAULT 0` / `duplicate_of BIGINT UNSIGNED NULL`.

## One nuance the spec's assumption check misses

Undocumented Assumption Check #1 says the wizard's final step is where "consent" naturally fits as
a UI element, and separately Audit B asks where `consent_timestamp` should be _stored_. These are
two different questions with two different answers:

- **Where the user checks a box**: a wizard **field**, so it flows through the existing
  `answers` map like any other field (see `AUDIT-5.14-consent-integration.md` for why the specific
  field key is `data_processing_consent`, and why the "optional-details" step is the wrong step).
- **Where the server records that consent was validated and persisted**: a **column**
  (`consent_given`, `consent_timestamp`), separate from whatever raw value happened to be in the
  `data_processing_consent` answer key.

Concretely: `SubmissionController` reads `$answers['data_processing_consent']` to decide
accept/reject (Step 1a-consent), then — once accepted — writes `consent_given = 1` and
`consent_timestamp = current_time('mysql', true)` onto `$validated` before `insert()`, exactly the
same shape `is_duplicate`/`duplicate_of` already use for the duplicate-detection result. The raw
`data_processing_consent` answer key also remains present inside `answers_json` (nothing strips it
out) since `SubmissionController` never deletes individual answer keys — this gives a redundant,
independently-inspectable copy inside the JSON blob for free, at zero extra code.

## Migration mechanism: dbDelta, not manual ALTER TABLE — same correction as 5.13g

The spec's §4.7 proposes a hand-rolled `SHOW COLUMNS ... LIKE` / `ALTER TABLE` idempotency check
inside `Activator::activate()` (a `columnExists()` helper). This duplicates the mechanism already
used for `is_duplicate`/`duplicate_of`: add `consent_given`/`consent_timestamp` to
`Schema::submissions_table_sql()`'s CREATE TABLE string and let the existing, unconditional
`dbDelta()` call in `Activator::create_or_update_schema()` handle it. No new activation-time code
needed.

## `SubmissionRepository::insert()`

Extend the existing `insert()` array/format-string pair (as 5.13g did for `is_duplicate`/
`duplicate_of`) rather than adding a second write path — `consent_given`/`consent_timestamp` are
written unconditionally on every insert (defaulting to `0`/`null` is never actually reached in
practice, since `SubmissionController` will have already rejected any submission that lacks valid
consent before `insert()` is called — but the defaults keep the column NOT NULL-safe and match the
`is_duplicate` precedent of "always pass an explicit value").
