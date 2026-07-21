# Audit A — PhotoStorage Current State (5.14.3)

_Performed: 2026-07-17_

## Current state of `store_photo()`

Read [PhotoStorage.php](PhotoStorage.php) completely (253 lines). As of the end of
Step 5.14.2, `store_photo()`:

1. Calls `ensure_upload_functions_loaded()` first (Step 5.14.1 fix — loads
   `wp-admin/includes/file.php` and `image.php` before anything that needs them).
2. Decodes base64 to raw bytes (`decode()`).
3. Writes raw bytes to a temp file via `wp_tempnam()` + `file_put_contents()`
   (`write_temp_file()`).
4. Corrects the filename's extension to match the claimed MIME type
   (`correct_filename_extension()`, Step 5.14.2).
5. Builds a `$_FILES`-shaped array (`name`, `type`, `tmp_name`, `error`, `size`).
6. Adds the `upload_dir` filter, calls **`wp_handle_upload( $file, [ 'test_form' =>
false ] )`**, removes the filter.
7. On success, calls `wp_insert_attachment()`, tags the attachment
   (`update_post_meta`), generates and saves attachment metadata, returns the URL +
   attachment ID.

## The bug this step fixes

`wp_handle_upload()` internally requires `is_uploaded_file( $file['tmp_name'] )` to
return `true`. `is_uploaded_file()` is a PHP built-in that only returns `true` for a
file that arrived via an actual HTTP multipart `$_FILES` upload in _this_ request —
WordPress uses it specifically to guard against path-traversal attacks where a script
tricks `move_uploaded_file()` into moving an arbitrary server file. `write_temp_file()`
creates its temp file via `wp_tempnam()` + `file_put_contents()` — a file the PHP
process wrote itself, never part of an HTTP upload — so `is_uploaded_file()` always
returns `false` for it, and `wp_handle_upload()` rejects the call with "Specified file
failed upload test." This affects **every** submission with a photo, on every
deployment, unconditionally — Steps 5.14.1 and 5.14.2 fixed two real bugs in the same
method (`wp_tempnam()` load order; filename/MIME mismatch) but neither addressed this
one, because both of those bugs' symptoms (fatal error; "failed upload test" from a
_different_ internal check, `wp_check_filetype_and_ext()`) were superficially similar
but had different root causes. This step's root cause is the choice of WordPress API,
not anything about the file's content or timing.

## Debug logging — none present

The spec describes removing `[goqw-debug]` `error_log()` calls "added during the SCB
diagnostic session." **No such calls exist in the current file.** A full read of
`PhotoStorage.php` shows exactly zero `error_log()` calls of any kind — the only
logging touchpoint in the photo-storage path is `[goqw-ops]` logging in
`SubmissionController::store_photos()` (outside this file), which already existed
before this step and is explicitly what the spec says to keep. Per this step's own
cover note ("this specification may reference removing debug changes that arent
present and in such cases should be ignored"), Section 4.1's debug-removal
instructions and Commit 5 ("cleanup PhotoStorage diagnostic logging") are no-ops for
this codebase — recorded here rather than silently skipped.

## `mimes` parameter — not currently used

`wp_handle_upload()` is called with only `[ 'test_form' => false ]` — no `mimes` key.
`wp_handle_sideload()` (and `wp_handle_upload()`, for that matter) accepts an optional
`mimes` override array in its `$overrides` parameter to replace WordPress's default
extension/MIME allowlist for that one call. This step adds it explicitly for
`wp_handle_sideload()`.
