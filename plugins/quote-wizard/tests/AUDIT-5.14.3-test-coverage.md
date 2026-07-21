# Audit B — Test Coverage (5.14.3)

_Performed: 2026-07-17_

## Current mocking of the upload function

Every existing test that exercises the upload path — all of `PhotoStorageTest.php`'s
happy-path, failure-path, and Step 5.14.1/5.14.2 tests, plus all of
`PhotoUploadExtensionTest.php` (Step 5.14.2's regression test) — mocks
`wp_handle_upload()` via `Functions\when('wp_handle_upload')->justReturn(...)` or
`->alias(...)`. None of them mock `wp_handle_sideload()`, and none call the real
WordPress implementation of either function.

Files requiring updates, and what in each:

- **`tests/Unit/PhotoStorageTest.php`** — every `Functions\when( 'wp_handle_upload' )`
  call (9 occurrences across the happy-path, failure-path, admin-includes-ordering,
  and extension-correction test groups) must become
  `Functions\when( 'wp_handle_sideload' )`. The "namespace prefix defense" test
  (`'PhotoStorage.php prefixes every admin-include-dependent WordPress function it
calls'`) asserts `wp_handle_upload` is prefixed in the source — this must become
  `wp_handle_sideload`, or the assertion will pass for the wrong reason (the string
  `wp_handle_upload` will no longer appear in the source at all once this step lands,
  so the test would need updating to keep testing anything meaningful). Docblock prose
  mentioning `wp_handle_upload()` (class-level comment, `filter_upload_dir()`'s
  comment) should also be corrected for accuracy, though this doesn't affect test
  behavior.
- **`tests/Unit/PhotoUploadExtensionTest.php`** — both tests' `Functions\when(
'wp_handle_upload' )->alias(...)` calls must become `wp_handle_sideload`.

## Whether any test would have caught the `is_uploaded_file()` bug

No. Every test mocks the upload function itself, so none of them ever reach
WordPress's real `wp_handle_upload()`/`is_uploaded_file()` check — this is the same
structural gap `AUDIT-5.14.2-integration.md` already documented: this project has no
`WP_UnitTestCase`, no wp-phpunit, no real WordPress bootstrap, and mocking the exact
function under test necessarily hides bugs in _that function's real implementation_,
not just bugs in how `PhotoStorage` calls it. This is unchanged by this step and is
not something this step attempts to fix (see ADR-0032's Deviations / Risk #2 in the
spec: "Tests miss integration issues — Only unit tests possible; documented in ADR").

What the updated tests _do_ verify, and _is_ meaningful: that `PhotoStorage` calls
`wp_handle_sideload` (not `wp_handle_upload`) with the correct `$file` array and the
new `mimes` override — i.e., that the API swap actually took effect and didn't silently
regress to calling the wrong function, and that the `mimes` allowlist is exactly the
four formats this plugin supports. A future engineer changing this code and
accidentally reverting to `wp_handle_upload()` would fail these tests immediately.
