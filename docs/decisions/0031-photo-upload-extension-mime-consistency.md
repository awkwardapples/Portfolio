# ADR-0031: Photo Upload Extension/MIME Consistency

**Status:** Accepted (Step 5.14.2, 2026-07-17)

## Context

The wizard's browser-side compression (`image-compression.ts`, Step 4.8) always
re-encodes every selected photo to JPEG — a deliberate choice for consistent output
format and unconditional EXIF stripping (see the module's own top-of-file comment).
`PhotoField.tsx` built each `PhotoMetadata` entry with `originalName: file.name` — the
_pre-compression_ filename — while `mimeType` was hardcoded to `'image/jpeg'` to match
what compression actually produced. A user who selected `holiday.png` therefore
submitted a `PhotoMetadata` entry claiming `image/jpeg` content under a `.png`
filename. `MediaValidator` doesn't check filename/MIME consistency (only that the
declared MIME is allowlisted and that magic bytes match the declared MIME — both of
which passed, since the bytes genuinely were JPEG and `mimeType` genuinely said so).
The mismatch only surfaced deeper in `PhotoStorage::store_photo()`, where
`wp_handle_upload()` internally calls `wp_check_filetype_and_ext()` and rejects a
filename/MIME mismatch outright — a real-WordPress-only failure this project's mocked
test suite could never catch (see `AUDIT-5.14.2-integration.md`).

## Decision

**Defense-in-depth: fix both client and server (spec Q1 = C).**

- **Client:** `compressImage()` returns a new `correctedFileName` field (the original
  basename with its extension replaced by `.jpg`, via the extracted pure
  `correctedJpegFileName()` helper). `PhotoField.tsx` uses it — via a new pure
  `buildPhotoMetadata()` helper in `domain/runtime/photos.ts` — instead of the source
  `File`'s own `name` when constructing `PhotoMetadata.originalName`.
- **Server:** `PhotoStorage` gains a `MIME_TO_EXTENSION` map and a
  `correct_filename_extension()` method that corrects `original_name`'s extension to
  match the claimed `mime_type` before `wp_handle_upload()` is ever called — a safety
  net independent of what the client sends, protecting against a modified client, a
  replayed request, or a future client bug that reintroduces the same class of
  mismatch.

Both fixes are necessary: the client fix corrects the actual root cause (a filename
that never should have diverged from the compressed content), and the server fix is
the one that actually stands between a malformed request and a `wp_handle_upload()`
rejection — the client can never be fully trusted for a REST endpoint accepting raw
JSON.

## Implementation

`correctedJpegFileName(originalName)` strips any existing extension
(`/\.[^./\\]+$/`) and appends `.jpg`, falling back to `photo.jpg` if the basename would
be empty. It is extracted as a standalone export specifically because `compressImage()`
itself needs `canvas`/`createImageBitmap`, unavailable in this project's `node`-only
Vitest environment (see the existing top-of-file comment in
`image-compression.test.ts`) — the extraction is what makes the filename-correction
logic independently testable at all.

`PhotoStorage::correct_filename_extension()` is `private` (an internal correctness
detail, not part of the class's public contract) and is exercised in tests by spying on
the mocked `wp_handle_upload()`'s `'name'` argument rather than by widening its
visibility — see `AUDIT-5.14.2-integration.md`.

## Deviations from the spec

- **No `PhotoUploadIntegrationTest extends WP_UnitTestCase`.** This project has never
  had a real-WordPress test environment at any prior step (`tests/bootstrap.php` stubs
  a handful of WP classes and mocks every WP function via Brain\Monkey; there is no
  wp-phpunit, no database). The spec's Section 4.4 test is replaced by
  `PhotoUploadExtensionTest.php`, which reproduces the exact reported scenario
  end-to-end through `PhotoStorage::store_photo()` and asserts on what the mocked
  `wp_handle_upload()` actually received — see `AUDIT-5.14.2-integration.md` for the
  full reasoning.
- **`correct_filename_extension()` is not tested via direct method calls** (the spec's
  own test sketch calls it as if public). Kept `private`; tested via the same call-spy
  technique as the integration-style test, for the reasons above.
- **`post_title` also uses the corrected filename**, not just the `'name'` key handed to
  `wp_handle_upload()` — the spec's code sample only corrected the latter. Using the
  corrected name everywhere `original_name` previously appeared avoids a second,
  narrower inconsistency (an attachment whose media-library title still shows the wrong
  extension).

## Consequences

**Positive:**

- Photos upload reliably regardless of source format (PNG, WebP, or already-JPEG).
- Server is robust against client bugs or a modified/malicious client — the correction
  runs unconditionally, not only when the client happens to send a mismatch.
- Standard defense-in-depth pattern with no coupling between the two fixes — either one
  alone would have resolved the reported bug; both together close the gap for any
  future client.

**Negative / accepted tradeoffs:**

- Slight duplication: the MIME→extension mapping exists in two places (client's
  `correctedJpegFileName()`, hardcoded to JPEG only, since that's the only format
  compression ever produces; server's `MIME_TO_EXTENSION`, covering all four allowlisted
  types since the server must handle whatever a client claims). Not shared code because
  they solve different problems — the client always knows its own output format, the
  server never can assume it.
- Historical attachments uploaded before this fix (if any made it through in a
  WordPress configuration lenient enough to accept them) retain whatever filename they
  were given; no backfill migration is included.
- No true end-to-end test of `wp_check_filetype_and_ext()`'s real behavior — the
  regression test proves `PhotoStorage` sends a consistent filename/MIME pair, not that
  WordPress's real validator accepts it (a reasonable inference, not a certainty, absent
  the real function).

## Not in scope

- Backfilling extensions on already-uploaded attachments.
- Standing up a real WordPress/wp-phpunit test environment.
- Any change to `MediaValidator`'s validation order or allowlist.
- Support for source formats compression doesn't already produce (compression is
  JPEG-only by design, unchanged).

## Cross-references

- ADR-0026 (photo URL storage — introduced `PhotoStorage`)
- ADR-0030 (namespace prefix defense — the immediately prior step's PhotoStorage work)
- `AUDIT-5.14.2-photo-preparation.md`, `AUDIT-5.14.2-mime-extension.md`,
  `AUDIT-5.14.2-integration.md`
