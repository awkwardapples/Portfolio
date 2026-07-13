# Audit C — WordPress Media Library Integration Points (5.13e)

_Performed: 2026-07-13_

## Functions confirmed available from plugin (non-admin) context

All five functions are declared in WordPress core files that are loaded on every
request, not just wp-admin:

| Function                            | Core file                     | Loaded on frontend?      |
| ----------------------------------- | ----------------------------- | ------------------------ |
| `wp_handle_upload()`                | `wp-admin/includes/file.php`  | No — must `require_once` |
| `wp_insert_attachment()`            | `wp-includes/post.php`        | Yes (always loaded)      |
| `wp_generate_attachment_metadata()` | `wp-admin/includes/image.php` | No — must `require_once` |
| `wp_get_attachment_url()`           | `wp-includes/post.php`        | Yes (always loaded)      |
| `wp_delete_attachment()`            | `wp-includes/post.php`        | Yes (always loaded)      |

`wp_handle_upload()` and `wp_generate_attachment_metadata()` live in `wp-admin/includes/`
files that are **not** autoloaded outside wp-admin. This is a real constraint: the REST
endpoint runs on the frontend/API surface, not wp-admin, so `PhotoStorage` must
`require_once ABSPATH . 'wp-admin/includes/file.php'` and
`require_once ABSPATH . 'wp-admin/includes/image.php'` before calling them — the same
pattern `Activator::create_or_update_schema()` already uses for
`wp-admin/includes/upgrade.php` ([Activator.php:43](../Activator.php#L43)).
`wp_insert_attachment()` and `wp_delete_attachment()` need no such require.

## `wp_handle_upload()` signature constraint

`wp_handle_upload( array &$file, array $overrides = [] )` expects `$file` in `$_FILES`
shape (`name`, `type`, `tmp_name`, `error`, `size`) — it does not accept raw bytes. Since
photos arrive as base64 in the JSON body (not a multipart upload), `PhotoStorage` must:

1. Decode base64 to raw bytes.
2. Write raw bytes to a real temp file (`wp_tempnam()` or `wp_upload_dir()['path'] . '/tmp-' . uniqid()`).
3. Build a `$_FILES`-shaped array pointing `tmp_name` at that temp file.
4. Pass `'test_form' => false` in `$overrides` (no nonce form to check) and
   `'action' => 'wp_handle_upload'` is the default — no override needed.
5. `wp_handle_upload()` **moves** (not copies) the temp file into the uploads directory
   on success, so no separate delete-then-move step is needed — only cleanup on failure
   paths where the temp file was never consumed.

## Directory routing to `/wp-content/uploads/goqw/YEAR/MONTH/` (D1)

`wp_handle_upload()` places files under `wp_upload_dir()`'s current year/month
subdirectory by default, not a custom one. To route into `goqw/YEAR/MONTH/` (D1), the
`upload_dir` filter must be added immediately before the call and removed immediately
after:

```php
add_filter( 'upload_dir', [ $this, 'filter_upload_dir' ] );
$result = wp_handle_upload( $file, $overrides );
remove_filter( 'upload_dir', [ $this, 'filter_upload_dir' ] );
```

where `filter_upload_dir()` prepends `/goqw` to `path`, `url`, and `subdir` on the array
`wp_upload_dir()` normally returns. This is the standard WordPress pattern for
namespacing uploads (used by WooCommerce, Contact Form 7, etc.) — no core function takes
a directory override directly.

## Attachment creation and metadata

After `wp_handle_upload()` returns `{ file, url, type }`:

```php
$attachment_id = wp_insert_attachment(
    [ 'post_mime_type' => $result['type'], 'post_title' => $original_name, 'post_status' => 'inherit' ],
    $result['file']
);
$metadata = wp_generate_attachment_metadata( $attachment_id, $result['file'] );
wp_update_attachment_metadata( $attachment_id, $metadata );
```

`wp_update_attachment_metadata()` (also `wp-includes/post.php`, always loaded) is required
to actually persist the metadata `wp_generate_attachment_metadata()` computes — generating
it alone does not save it. This function was missing from the spec's function list and is
added to the `PhotoStorage` implementation.

## URL generation

`wp_get_attachment_url( $attachment_id )` returns the permanent public URL
(`wp_upload_dir()`-relative, respecting any `upload_dir` filter active on the site — none
persists after `PhotoStorage` removes its filter, so URLs are ordinary
`.../wp-content/uploads/goqw/YEAR/MONTH/file.jpg` paths, matching D1/D2).

## Deletion

`wp_delete_attachment( $attachment_id, true )` — the second argument `true` forces
permanent deletion (bypasses Trash), which is what both `PhotoStorage::deletePhoto()`
(orphan cleanup, D6) and `PhotoRetention` (scheduled cleanup, D3) need. Returns the
deleted `WP_Post` object on success, `false`/`null` on failure.

## Test-environment consequence

None of these are Brain\Monkey-stubbed today (`tests/bootstrap.php` only stubs
`WP_REST_Response`, `WP_Error`, `WP_REST_Request`, `WP_Post`, `WP_Query`). All calls in
`PhotoStorage` and `PhotoRetention` must go through `Brain\Monkey\Functions\when(...)` /
`::expect(...)` in tests, consistent with how `SubmissionControllerTest.php` mocks
`sanitize_key`, `wp_json_encode`, `current_time`, etc.
