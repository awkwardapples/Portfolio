# Audit A — Current Submission Schema (5.13g)

Date: 2026-07-14
Step: 5.13g Phase 0 Audit A

## No live WordPress/MySQL install available

There is no running `wp` CLI or MySQL/MariaDB instance in this environment (confirmed:
no `wp-env.json`/`docker-compose.yml` for this plugin), so `wp db columns
wp_goqw_submissions` cannot be executed. The schema is instead read from its single
source of truth in this codebase: `src/Submissions/Schema.php`, which is the SQL passed
to `dbDelta()` on activation (`Activator::create_or_update_schema()`).

## Current columns (`Schema::submissions_table_sql()`)

| Column                 | Type            | Notes                                        |
| ---------------------- | --------------- | -------------------------------------------- |
| `id`                   | BIGINT UNSIGNED | PK, auto-increment                           |
| `wizard_id`            | VARCHAR(191)    |                                              |
| `schema_version`       | INT             | default 1                                    |
| `answers_json`         | LONGTEXT        | the full answers map, JSON-encoded           |
| `pricing_json`         | LONGTEXT NULL   |                                              |
| `media_json`           | LONGTEXT NULL   | photo entries (Step 5.13e)                   |
| `client_timestamp`     | VARCHAR(64)     | default `''`                                 |
| `status`               | VARCHAR(32)     | `persisted` / `forwarded` / `forward_failed` |
| `created_at`           | DATETIME        | UTC (`current_time('mysql', true)`)          |
| `forwarded_at`         | DATETIME NULL   |                                              |
| `forward_attempted_at` | DATETIME NULL   |                                              |
| `forward_error`        | TEXT NULL       |                                              |

## Existing indices

`idx_created_at (created_at)`, `idx_status (status)`, `idx_wizard_id (wizard_id)`.

## `contact_email` / `contact_phone`: JSON, not columns — corrects a spec assumption

The spec's Undocumented Assumption Check #1 states these are queryable **columns**. They
are not — they are keys inside `answers_json` (a JSON-encoded map of the wizard's answer
values), confirmed against `AUDIT-5.13c-contact-collection.md` and
`apps/wizard/src/domain/fixtures/steps.config.ts`. Every instant-quote and manual-quote
wizard collects them under the field keys `contact_email` and `contact_phone` at the
top level of the answers map (not nested), so `JSON_EXTRACT(answers_json, '$.contact_email')`
is a valid path — but there is no dedicated column and no index on these values today.

**Correction to spec's proposed query**: raw `JSON_EXTRACT()` returns a quoted JSON
string (`"foo@bar.com"`), not a plain SQL string. Comparing it directly against a
PHP-supplied unquoted string relies on MySQL's implicit JSON-cast comparison semantics,
which is a well-known footgun. `find_recent_by_contact()` (Commit 2) uses
`JSON_UNQUOTE(JSON_EXTRACT(...))` explicitly instead, which is unambiguous and portable
across MySQL 5.7+/8.0 and MariaDB 10.2+.

## Migration mechanism: dbDelta, not manual ALTER TABLE — corrects a spec assumption

The spec's Implementation Plan §4.2 proposes a hand-rolled `SHOW COLUMNS ... LIKE` /
`ALTER TABLE` idempotency check inside `Activator::activate()`. This duplicates a
mechanism the plugin already has: `Schema::submissions_table_sql()` is a `dbDelta()`
CREATE TABLE definition, and `dbDelta()` is _designed_ to add missing columns/indices to
an existing table without dropping data (this is explicitly documented in
`Schema.php`'s own docblock: "dbDelta adds missing columns to existing tables but does
NOT drop or rename columns"). Adding `is_duplicate`/`duplicate_of`/the new index to
`submissions_table_sql()`'s CREATE TABLE string is sufficient — `Activator::activate()`
already calls `dbDelta()` unconditionally on every activation, so no new activation-time
code is needed at all. This is simpler than the spec's proposal and consistent with how
this table has always been evolved.

## Row-level index columns for the new query

`created_at` already has an index (`idx_created_at`). The new
`idx_duplicate_lookup (created_at, is_duplicate)` composite index (spec §4.2) speeds the
`WHERE is_duplicate = 0 AND created_at >= ?` predicate; the JSON path comparison itself
cannot be indexed by a generated column in this change (out of scope — see ADR-0028
"Negative" consequences).
