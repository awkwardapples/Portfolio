# Audit D — Database Query Patterns (Step 6.6)

## Command

```powershell
Get-ChildItem -Path "plugins/quote-wizard/src" -Recurse -Include "*.php" |
  Select-String "wpdb|query|get_row|get_var|get_results" -List
```

## Result (files matching) and per-file verification

- `Cron/PruneSubmissions.php` — no direct SQL; delegates to
  `SubmissionRepository::delete_older_than()` (below). Safe by
  construction.
- `Plugin.php` — `global $wpdb;` only, to construct `SubmissionRepository`.
  No queries.
- `Submissions/Repository.php` — dead Step 3D stub (`Repository::insert()`
  always throws `LogicException`), never called. No live SQL. (Superseded
  by `SubmissionRepository`; see Audit B for the "dead stub" note.)
- `Submissions/Schema.php` — not read in detail here; contains
  `CREATE TABLE` DDL run only on activation, no user input involved.
- `Submissions/SubmissionRepository.php` — the only class issuing live
  queries against user-influenced data. Four methods:

| Method                     | Query                                                                                                                                                         | Prepared?                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `insert()`                 | `$wpdb->insert($table, $data, $format)`                                                                                                                       | Yes — `$wpdb->insert()` internally parameterizes every value against the explicit `$format` array (`%s`/`%d`); this is WordPress's standard safe-insert API, equivalent to a prepared statement.                                                                                                                                                                                                                                                                                                                                        |
| `find_recent_by_contact()` | `$wpdb->get_row($wpdb->prepare("SELECT ... WHERE ... AND (...)", $window_start, $normalized_email, $normalized_email, $normalized_phone, $normalized_phone))` | Yes — every user-influenced value (`$normalized_email`, `$normalized_phone`) is passed as a `%s` placeholder to `prepare()`, never interpolated into the SQL string. The table name (`{$wpdb->prefix}goqw_submissions`) is interpolated directly, but `$wpdb->prefix` is a WordPress-internal constant, not user input — this is the one pattern `WordPress.DB.PreparedSQL` recognizes as safe for a dynamic table name inside a `prepare()`'d template (documented in the existing code comment, referencing `AUDIT-5.13g-schema.md`). |
| `mark_forwarded()`         | `$wpdb->update($table, $data, $where, $format, $where_format)`                                                                                                | Yes — same parameterized-API pattern as `insert()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `mark_forward_failed()`    | `$wpdb->update(...)`                                                                                                                                          | Yes — same. `$error_message` is truncated to 1000 chars but is otherwise a system-generated string (HTTP status / transport error), not user input.                                                                                                                                                                                                                                                                                                                                                                                     |
| `delete_older_than()`      | `$wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}goqw_submissions WHERE created_at < %s", $cutoff))`                                                  | Yes — `$cutoff` is a server-computed MySQL datetime string (`Settings::retention_days()` arithmetic), not user input, but is still passed through `prepare()` as a `%s` placeholder.                                                                                                                                                                                                                                                                                                                                                    |

## Conclusion

**Every query that touches user-influenced data uses a parameterized API**
(`$wpdb->insert()`/`$wpdb->update()` with explicit format arrays, or
`$wpdb->prepare()` with placeholders). No query string-concatenates a raw
user value. SQL injection risk: **confirmed LOW**, consistent with the
spec's own risk table — no code changes required for this vector. This
audit is verification-only, matching the spec's intent ("Static audit
verification").
