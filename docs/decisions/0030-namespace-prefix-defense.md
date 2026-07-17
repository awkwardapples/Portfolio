# ADR-0030: Namespace Prefix Defense + Admin-Includes Ordering

**Status:** Accepted (Step 5.14.1, 2026-07-17)

## Context

SCB pilot testing surfaced a real photo-upload failure: `PhotoStorage::store_photo()`
called `wp_tempnam()` before `ensure_upload_functions_loaded()` had run, so the
`wp-admin/includes/file.php` require that declares `wp_tempnam()` hadn't executed yet
on a REST request (WordPress does not autoload wp-admin functions outside wp-admin
requests). Investigating this bug (`AUDIT-5.14.1-admin-includes.md`) led to a second,
broader finding: every namespaced PHP file in the plugin calls WordPress core
functions unqualified (`get_option(...)` rather than `\get_option(...)`), relying on
PHP's namespace-then-global function-resolution fallback. That fallback is correct but
one lookup slower than a fully-qualified call, and offers no protection if a
same-named function is ever added to the plugin's own namespace.

Two further gaps surfaced in the same pilot pass, unrelated to PHP but sharing the
"environmental robustness" theme: the client never handled an HTTP 429 rate-limit
response distinctly from a generic server error, and `docs/onboarding.md` had no
section on LocalWP's non-standard MySQL port.

## Decision

**Fix the ordering bug directly.** `ensure_upload_functions_loaded()` now runs first
in `store_photo()`, before `write_temp_file()` (and therefore before any call that
depends on `wp-admin/includes/file.php` or `image.php`) can be reached.

**Backslash-prefix every WordPress core function call in namespaced plugin PHP.**
Applied across all 33 files with WordPress function calls under
`plugins/quote-wizard/src/` plus the plugin bootstrap `quote-wizard.php`. Scoped to
WordPress-specific functions only (per `AUDIT-5.14.1-admin-includes.md`'s function
list) — generic PHP built-ins (`is_array`, `strlen`, `json_decode`, etc.) are
deliberately left alone, since this defense targets the actual ambiguity (a WordPress
function that could theoretically collide with a future plugin-namespace function of
the same name), not blanket micro-optimization of every global call in the codebase.
`tests/` is excluded — Pest tests run in the global namespace and the prefix is a
no-op there. `uninstall.php` is excluded — it has no namespace declaration at all, so
the fallback this ADR is defending against doesn't apply.

`SitemapGenerator::add_rewrite_rule()` — the class's own public static method, which
happens to share its name with the global `add_rewrite_rule()` WordPress function it
calls internally — is deliberately **not** prefixed at its call sites
(`Activator.php`, `SitemapGenerator`'s own `add_action( 'init', ... )` registration).
Only the real global function call inside its body is prefixed.

**Client: treat HTTP 429 as its own error code, not a fallthrough to `server_error`.**
`SubmissionErrorCode` gains `'rate_limited'`; `httpSubmissionPort` extracts
`retryAfterSeconds` from the response body and builds a "Please try again in N
minute(s)" message; the error is `retryable: false` since an immediate retry cannot
succeed within the rate-limit window. `FailureScreen` shows "Please wait a moment"
instead of "Something went wrong" for this code.

**Documentation: fill the DB_HOST and OpCache onboarding gaps.** `docs/onboarding.md`
gains a "LocalWP MySQL Port Configuration" section (Step 3) and a "Plugin
Development — OpCache Awareness" subsection (Step 5.2 deployment section).

## Implementation

`PhotoStorage::store_photo()`'s first statement is now
`$this->ensure_upload_functions_loaded();`, moved ahead of `decode()` and
`write_temp_file()`. `write_temp_file()`'s `wp_tempnam()` call is now guaranteed to
run after `wp-admin/includes/file.php` is loaded, regardless of how the method is
refactored later, since the require happens before any other work in `store_photo()`.

The prefix sweep was applied mechanically (matched against an explicit function-name
list, skipping comment lines and `::`/`->`-qualified method calls) and verified with
`php -l`, `composer test` (identical pass count before/after — Brain\Monkey's function
mocking is unaffected by the backslash, which only changes compile-time name
resolution, not the resolved symbol), and `composer analyse` (PHPStan level 8, clean).

`httpSubmissionPort.mapResponse()` gained a `response.status === 429` branch,
`extractRetryAfterSeconds()`, and `buildRateLimitMessage()` helpers, following the
same "server sends codes and numbers, client owns prose" pattern already used for
`MSG_FALLBACK`/`MSG_FORWARDER`.

## Deviations from the spec

- **No `Admin/SettingsPage.php` changes.** The spec's Phase 0 audit script covered the
  whole plugin, but `Admin/SettingsPage.php` is still an unimplemented stub (no
  WordPress function calls exist there to prefix).
- **`wp_update_attachment_metadata` and `update_post_meta` added to the prefix list.**
  Not in the spec's own `$wpFunctions` example array, but both are called in
  `PhotoStorage.php` and are unambiguously WordPress core — omitting them would leave
  the exact class this step is fixing only partially covered.
- **`rest_url`, `get_query_var`, `get_edit_post_link`, `esc_html__`, `esc_url_raw`,
  `wp_add_inline_style`, `is_singular`, `get_posts`, `wp_clear_scheduled_hook`,
  `plugin_dir_path`, `plugin_dir_url`, `register_activation_hook`,
  `register_deactivation_hook` added.** Found during the comprehensive Audit A sweep;
  the spec's example function list was illustrative, not exhaustive, and the audit
  brief explicitly calls for a comprehensive search.

## Consequences

**Positive:**

- The wp_tempnam ordering bug cannot recur silently — `ensure_upload_functions_loaded()`
  is now unconditionally first, not dependent on call-site ordering within the method.
- Every WordPress function call in the plugin resolves via a single, explicit lookup;
  no plugin-namespace function can ever silently shadow a WordPress core function.
- A rate-limited user sees an accurate, actionable message instead of a generic error
  with a retry button that would just fail again.
- New engineers no longer hit an undocumented DB_HOST failure or unexplained stale-PHP
  behavior during LocalWP setup.

**Negative / accepted tradeoffs:**

- The prefix sweep is a large mechanical diff (208 call sites across 33 files) with no
  behavioral change of its own — reviewable primarily by spot-checking rather than
  reading every line, since the transformation is uniform.
- Future WordPress function calls added to the plugin must remember the `\` prefix by
  convention; nothing enforces it automatically (no custom PHPCS sniff was added — out
  of scope for this step).

## Not in scope

- A PHPCS sniff or CI check enforcing the prefix convention going forward.
- Changes to bot protection, duplicate detection, consent handling, or pricing.
- Any change to the Make.com/WhatsApp/Sheets wire contract.

## Cross-references

- ADR-0008 (PSR-4 over wp.org conventions — establishes the plugin's namespace
  discipline this ADR extends)
- ADR-0026 (photo URL storage — introduced `ensure_upload_functions_loaded()` /
  `PhotoStorage` in Step 5.13e)
- `AUDIT-5.14.1-admin-includes.md`, `AUDIT-5.14.1-rate-limit-ux.md`,
  `AUDIT-5.14.1-onboarding.md`
