# Audit B — Current Sanitization State (Step 6.6)

## Command

```powershell
Get-ChildItem -Path "plugins/quote-wizard/src" -Recurse -Include "*.php" |
  Select-String "sanitize_|esc_html|esc_attr|esc_url|wp_kses" -List
```

## Result (files matching)

- `Frontend/AssetLoader.php`
- `Frontend/PublicConfig.php`
- `Frontend/Shortcode.php`
- `Rest/ClientIp.php`
- `Rest/Sanitiser.php`
- `Rest/SubmissionController.php`
- `Routing/FrontPagePolicy.php`
- `Routing/SiteRenderer.php`
- `SEO/SEOMetaEmitter.php`
- `SEO/SitemapGenerator.php`
- `Submissions/ImageHandler.php`
- `Submissions/PhotoStorage.php`
- `Submissions/SubmissionRepository.php`

## What's actually applied today, and where

| Location                               | Call                                                       | Purpose                                                                                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SubmissionController::validate()`     | `sanitize_key($wizard_id)`                                 | Normalizes `wizard_id` to a safe slug before it's used as a lookup/log key.                                                                                                                                           |
| `SubmissionController::validate()`     | `sanitize_text_field($client_ts)`                          | Normalizes `clientTimestamp` (informational only, never displayed/executed).                                                                                                                                          |
| `ClientIp::resolve()`                  | `sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR']))` | Normalizes the server-derived (not user-supplied) IP string.                                                                                                                                                          |
| `SubmissionRepository::insert()`       | `esc_html($this->wpdb->last_error)`                        | Escapes a DB error string before it's interpolated into a thrown exception message (defensive; that message is logged, not rendered as HTML, but this guards against it ever reaching an HTML context).               |
| `PhotoStorage.php`, `ImageHandler.php` | `sanitize_file_name()`                                     | Normalizes uploaded filenames before they touch the filesystem/media library (path-traversal defense — see Audit C).                                                                                                  |
| `Frontend/*`, `Routing/*`, `SEO/*`     | `esc_html`/`esc_attr`/`esc_url`                            | Output escaping for admin-notice HTML, rendered site markup, and meta tags — none of these touch user _submission_ data; they escape plugin-authored strings and WordPress core values (site URL, post titles, etc.). |

## The gap this step closes

**None of the above sanitizes the free-text answer values themselves**
(`contact_name`, `additional_notes`, `full_address`, photo `originalName`,
etc.) before they leave the plugin toward the Make.com webhook. The
`answers` array is validated for _shape_ only (`is_array($answers)` — see
`SubmissionController::validate()` line ~271-274) and is otherwise passed
through unmodified: encoded to `answers_json` for storage, then decoded
and re-encoded into the outbound webhook body by `Forwarder::forward()`.

**Corrected assumption:** the spec's Architecture Overview implies this is
uncharted territory ("New: central sanitization for outbound webhook
payloads"), which is accurate — but this audit also found two **dead stub
classes** from Step 3D that predate the real implementation and were never
removed, which matters for anyone reading this codebase looking for "the"
sanitizer:

- `Rest/Sanitiser.php` — `Sanitiser::sanitise()` always throws
  `LogicException` ("STUB FOR STEP 3D... real sanitisation rules land in
  Step 5.1"). Step 5.1 never actually used this class — the real
  validation/normalization that shipped lives inline in
  `SubmissionController::validate()` instead.
- `Rest/Validator.php` and `Submissions/Repository.php` — the same pattern:
  Step 3D stubs superseded by inline logic in `SubmissionController` and
  `SubmissionRepository` respectively, never deleted.

These three dead classes are out of scope for 6.6 (no code path calls
them; deleting them is unrelated cleanup, not a security fix) but are
flagged here so a future reader doesn't mistake `Rest/Sanitiser.php` for
where outbound sanitization happens. The new `Security\InputSanitizer`
class introduced in this step is deliberately named and namespaced
differently (`Security\InputSanitizer`, not `Rest\Sanitiser`) precisely to
avoid being confused with the dead stub.

## Sanitization boundary for this step

Chosen boundary: **`SubmissionController`, immediately before
`Forwarder::forward()` is called**, sanitizing a copy of the answers used
to build the outbound webhook JSON. The database row (`answers_json` as
inserted via `SubmissionRepository::insert()`) is left **unsanitized** —
storage keeps the raw, original value (matches the spec's Decision:
"Storage: Store raw... Webhook: sanitize before forwarding"). See
`AUDIT-6.6-data-flow.md` for the full hop-by-hop trace.
