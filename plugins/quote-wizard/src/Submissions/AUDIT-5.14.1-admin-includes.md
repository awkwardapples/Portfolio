# Audit A/B — WordPress Function Call Prefixing + Admin Includes Ordering (5.14.1)

_Performed: 2026-07-17_

## Background

SCB pilot testing surfaced a real bug in `PhotoStorage::store_photo()`: photo
uploads failed with an undefined-function error on `wp_tempnam()`. Investigating it
led to two separate findings, both addressed in this step.

## Finding 1 — `wp_tempnam()` was called before its admin include was loaded

`PhotoStorage` already had `ensure_upload_functions_loaded()`, which
`require_once`s `wp-admin/includes/file.php` and `wp-admin/includes/image.php` —
added in Step 5.13e specifically because REST requests don't autoload wp-admin
functions (see `AUDIT-5.13e-wp-media-integration.md`). But the _call order_ in
`store_photo()` was wrong:

```php
// Before (buggy order)
public function store_photo( ... ): array {
    $raw_bytes = $this->decode( $base64_data );
    ...
    $tmp_path = $this->write_temp_file( $raw_bytes );   // calls wp_tempnam() internally
    ...
    $this->ensure_upload_functions_loaded();              // loads file.php — too late
    ...
    $result = wp_handle_upload( $file, ... );
}
```

`write_temp_file()` calls `wp_tempnam()` — which is declared in
`wp-admin/includes/file.php`, the _same file_ `ensure_upload_functions_loaded()`
requires — but `write_temp_file()` runs before that require happens. On a REST
request (no wp-admin context), `wp_tempnam()` is undefined at that point and the
call fatals.

The 5.13e audit covered `wp_handle_upload()` and
`wp_generate_attachment_metadata()`, both of which were already called _after_
`ensure_upload_functions_loaded()` — so those worked. `wp_tempnam()` was missed
because it's used inside a private helper (`write_temp_file()`) called earlier in
the same method, not adjacent to the other admin-only calls.

**Fix:** move the `ensure_upload_functions_loaded()` call to the top of
`store_photo()`, before `write_temp_file()` runs. See
[PhotoStorage.php](PhotoStorage.php#L43).

## Finding 2 — Admin-include requirement table (confirms Audit B)

| Function                            | Core file                     | Loaded on frontend/REST? |
| ----------------------------------- | ----------------------------- | ------------------------ |
| `wp_tempnam()`                      | `wp-admin/includes/file.php`  | No — must `require_once` |
| `wp_handle_upload()`                | `wp-admin/includes/file.php`  | No — must `require_once` |
| `wp_insert_attachment()`            | `wp-includes/post.php`        | Yes (always loaded)      |
| `wp_generate_attachment_metadata()` | `wp-admin/includes/image.php` | No — must `require_once` |
| `wp_update_attachment_metadata()`   | `wp-includes/post.php`        | Yes (always loaded)      |
| `wp_get_attachment_url()`           | `wp-includes/post.php`        | Yes (always loaded)      |
| `wp_delete_attachment()`            | `wp-includes/post.php`        | Yes (always loaded)      |

No other admin-only functions are called from a non-admin request path anywhere
else in the plugin (`Activator::create_or_update_schema()` already
`require_once`s `wp-admin/includes/upgrade.php` before calling `dbDelta()`, and
that call only ever runs during plugin activation, which is always an admin
request).

## Finding 3 — Namespace prefix defense (Audit A)

Every plugin PHP file under `plugins/quote-wizard/src/` (and the plugin bootstrap
`quote-wizard.php`) declares `namespace Agency\QuoteWizard...`. Inside a
namespaced file, PHP resolves an unqualified function call (`get_option(...)`) by
first checking the current namespace for a function of that name, then falling
back to the global namespace only if none exists. This fallback is reliable for
functions — but it is one more lookup than a fully-qualified call
(`\get_option(...)`), and defensively prefixing removes any ambiguity if a
same-named function is ever added to the plugin's own namespace (unlikely, but
free to prevent).

A comprehensive search of the plugin (excluding `tests/`, which run in the
global namespace under Pest and don't need prefixing, and `uninstall.php`, which
has no namespace declaration at all) found 213 unprefixed WordPress core function
calls across 33 files. Full list of functions prefixed:

```
wp_tempnam, wp_handle_upload, wp_upload_dir, wp_insert_attachment,
wp_generate_attachment_metadata, wp_update_attachment_metadata,
wp_get_attachment_url, wp_delete_attachment, wp_mkdir_p, wp_remote_post,
wp_remote_get, wp_remote_retrieve_body, wp_remote_retrieve_response_code,
wp_schedule_event, wp_next_scheduled, wp_insert_post, wp_delete_post,
wp_clear_scheduled_hook, get_option, update_option, add_option, delete_option,
get_post, get_posts, get_transient, set_transient, delete_transient, add_action,
add_filter, remove_filter, esc_html, esc_attr, esc_url, esc_url_raw,
esc_html__, sanitize_text_field, wp_verify_nonce, wp_create_nonce, current_time,
gmdate, dbDelta, is_wp_error, sanitize_key, sanitize_file_name, wp_unslash,
current_user_can, is_admin, is_singular, get_bloginfo, home_url, admin_url,
get_the_ID, get_edit_post_link, get_query_var, rest_url, wp_add_inline_script,
wp_add_inline_style, wp_enqueue_script, wp_enqueue_style, add_shortcode,
register_rest_route, flush_rewrite_rules, add_rewrite_rule, wp_json_encode,
plugin_dir_path, plugin_dir_url, register_activation_hook,
register_deactivation_hook, update_post_meta
```

**Deliberate exclusion:** `SitemapGenerator::add_rewrite_rule()` — the class's
own public static method, called via `SitemapGenerator::add_rewrite_rule()` in
`Activator.php` and registered as an `init` callback in `SitemapGenerator`'s own
constructor — is not the global `add_rewrite_rule()` WordPress function and must
not be prefixed. Its _body_ does call the real global function
(`\add_rewrite_rule( '^sitemap\.xml$', ... )`), which is prefixed.

**Deliberate exclusion:** generic PHP built-ins (`is_array`, `is_string`,
`strlen`, `file_exists`, `json_decode`, etc.) are out of scope — this defense
targets WordPress-specific functions per the audit brief, not the whole PHP
standard library.

## Verification

- `php -l` on every modified file: no syntax errors.
- `composer test`: 233 passed, 4 skipped (unchanged from pre-5.14.1 baseline —
  Brain\Monkey's function mocking works identically for `\`-prefixed calls, since
  the backslash only changes name resolution at compile time, not the resolved
  symbol).
- `composer analyse` (PHPStan level 8): no errors.
- `composer lint` (PHPCS): no new warnings/errors on any touched file.
  `quote-wizard.php` carries pre-existing, unrelated lint drift documented since
  5.13e (see `docs/current-state.md`); this step does not add to it.
