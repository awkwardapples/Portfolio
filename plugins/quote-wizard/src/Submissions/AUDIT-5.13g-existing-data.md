# Audit D — Existing Submission Records (5.13g)

Date: 2026-07-14
Step: 5.13g Phase 0 Audit D

## No live database — corrects a spec assumption

As in Audit A, there is no reachable MySQL/MariaDB instance in this environment, so
`wp db query "SELECT id, wizard_id, JSON_EXTRACT(...) ..."` cannot be run against real
rows. This mirrors the same limitation already recorded for the equivalent "operational
verification" items in the 5.13e and 5.13f evidence entries (no live WordPress
deployment access).

## Substitute: field-key provenance from the wizard config layer

In place of sampling real rows, `contact_email`/`contact_phone` population is verified
against the wizard configuration that produces every `answers_json` row
(`AUDIT-5.13c-contact-collection.md`, `apps/wizard/src/domain/fixtures/steps.config.ts`):

- Both keys are `type: 'text'` fields present in every wizard (instant- and
  manual-quote), collected either by the engine-level pre-step or the
  `contact`/`contact-and-address` step.
- Both have `FORMAT_VALIDATORS` entries (`validateEmail`, `validatePhone`) applied
  wherever they appear, so client-side validation already constrains their shape before
  a submission reaches the server — but the server does not re-validate or normalize
  them today (`SubmissionController::validate()` passes `answers` through untouched
  except for `wp_json_encode`).
- `contact_email`/`contact_phone` are marked `required: true` in the current
  (post-5.13c) end-of-wizard step for instant-quote services. For manual-quote services
  the pre-step reduction (5.13c) means these are filled directly at the `contact` step;
  their required-ness there was unchanged by 5.13c and predates this audit's scope to
  re-verify line-by-line, but the fixture-level format validators apply regardless of
  which step the field appears on.

## Consequence for `DuplicateDetector`

Because both fields are expected to be present and validator-constrained but are
**not** server-normalized before storage (no `strtolower()`/trim applied server-side
prior to 5.13g), `DuplicateDetector::check()` must perform its own normalization
(lowercase + trim for email, digit-stripping for phone) rather than assuming
consistent casing/whitespace in `answers_json` — matching the spec's own D-decision, now
with a concrete reason rather than an assumption.

## Typical submission counts

Not measurable without a live install; no volume assumption is load-bearing for this
step's correctness (the query is a single indexed point lookup regardless of table
size, bounded further by the `idx_duplicate_lookup` composite index added in Commit 2).

## Pending operational verification

Real-row inspection (casing consistency, actual submission volume, and end-to-end
JSON path correctness against a live MySQL/MariaDB instance) remains a pending
operational-verification item — see `docs/phase-5-evidence.md`, consistent with items
already deferred for 5.13e/5.13f.
