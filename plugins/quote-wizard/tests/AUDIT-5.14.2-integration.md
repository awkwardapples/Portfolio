# Audit C — Integration Test Requirements (5.14.2)

_Performed: 2026-07-17_

## What test infrastructure actually exists

There is **no `WP_UnitTestCase`, no wp-phpunit, no real WordPress bootstrap, and no
database** anywhere in this test suite. `tests/bootstrap.php`
([bootstrap.php:1](bootstrap.php)) is explicit about this: it stubs the handful of WP
classes (`WP_REST_Response`, `WP_Error`, `WP_REST_Request`, `WP_Post`, `WP_Query`) and
constants plugin source files need at parse/require time, and every WordPress
**function** call (`get_option`, `wp_handle_upload`, `wp_insert_attachment`, etc.) is
mocked per-test via `Brain\Monkey\Functions\when()`/`::expect()`. This has been true
since the test suite's inception — see `PhotoStorageTest.php`, which already mocks
`wp_handle_upload` to `justReturn()` a fixed array rather than exercising WordPress's
real upload/validation pipeline.

`tests/Feature/ExampleTest.php` exists but is a placeholder (`expect(true)->toBeTrue()`)
— there is no established "Feature" or "Integration" test pattern to extend, only
"Unit" tests that mock every WordPress boundary.

`phpunit.xml` ([phpunit.xml:9](../phpunit.xml#L9)) scans `./tests` recursively for any
`*Test.php` file regardless of directory — `tests/Integration/*Test.php` would be
picked up automatically without a Pest/PHPUnit config change. `Pest.php`'s
`uses()->in('Unit')` only binds the default TestCase to files under `tests/Unit/`; it
does not exclude other directories from running.

## Mocked vs. real `wp_handle_upload()`

`wp_handle_upload()` is **entirely mocked** in every existing test — no test in this
suite exercises WordPress's real implementation, which is where
`wp_check_filetype_and_ext()` actually runs the extension/MIME consistency check this
step fixes. This is _why_ the bug shipped past `composer test` and was only caught in a
real WordPress install during SCB pilot testing: the mock always returns success
regardless of what `'name'`/`'type'` keys it's called with.

## What would catch this specific bug

Given no real WordPress process is reachable from this test suite, a true end-to-end
integration test (real `wp_handle_upload()`, real `wp_check_filetype_and_ext()`) is not
achievable here — building one would mean standing up wp-phpunit and a MySQL instance,
which is out of scope for this step (and was explicitly out of scope for every prior
photo-handling step; see `AUDIT-5.13e-wp-media-integration.md`'s "Test-environment
consequence" section, which established the mocking convention this audit confirms is
unchanged).

What **is** achievable, and is the test this step adds: a **call-argument-capturing**
test — mock `wp_handle_upload()` with a spy (`Functions\when(...)->alias(...)`, the same
pattern `PhotoStorageTest.php` already uses for `wp_handle_upload` in
"loads admin includes exactly once...") that records the `'name'` value it was actually
invoked with, then assert that value has the _correct_ extension for a mismatched
input (e.g. `originalName: 'photo.png'`, `mimeType: 'image/jpeg'` in →
`name: 'photo.jpg'` out). This exercises `PhotoStorage::store_photo()`'s real
`correct_filename_extension()` logic end-to-end within the method, without needing a
real WordPress upload pipeline — the correction happens entirely inside `PhotoStorage`,
before `wp_handle_upload()` is ever called, so a spy on the mock's input is sufficient
to prove the fix works. Direct unit tests of `correct_filename_extension()` in
isolation cover the mapping table itself.

## Deviation from the spec

The spec's `PhotoUploadIntegrationTest extends WP_UnitTestCase` (Section 4.4) assumes a
real-WordPress test environment this project has never had, at any prior step. This
step's test — `PhotoUploadExtensionTest.php` — follows the existing Pest + Brain\Monkey
convention (spy on the mocked `wp_handle_upload`) instead. It is placed under
`tests/Unit/` (not `tests/Integration/`, since no `Integration` convention exists yet
and `Pest.php`'s `uses()->in('Unit')` is the only wired base-class binding) but is
explicitly named and commented as the regression test for this exact class of bug, so a
future engineer who searches for "integration test" for photo upload finds it.
