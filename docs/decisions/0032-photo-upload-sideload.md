# ADR-0032: Photo Upload via wp_handle_sideload

**Status:** Accepted (Step 5.14.3, 2026-07-17)

## Context

`PhotoStorage::store_photo()` used `wp_handle_upload()` to move a decoded photo's
temp file into the WordPress media library. `wp_handle_upload()` internally requires
`is_uploaded_file( $file['tmp_name'] )` to return `true` — a PHP built-in that only
returns `true` for a file that arrived via an actual HTTP multipart `$_FILES` upload
in the current request, a safeguard against path-traversal attacks where a script
tricks `move_uploaded_file()` into moving an arbitrary server file.

`PhotoStorage` receives photos as base64 in a JSON body, decodes them, and writes the
bytes to a temp file itself via `wp_tempnam()` + `file_put_contents()`
(`write_temp_file()`). That file was never part of an HTTP upload, so
`is_uploaded_file()` always returns `false` for it, and `wp_handle_upload()` rejects
every single photo submission with "Specified file failed upload test." — on every
deployment, unconditionally (`AUDIT-5.14.3-current-state.md`). This is a distinct bug
from the two already fixed in this method: Step 5.14.1 fixed a `wp_tempnam()`
load-order bug (a fatal error, not an upload-test rejection), and Step 5.14.2 fixed a
filename/MIME mismatch that `wp_check_filetype_and_ext()` (a _different_ internal
check) rejects. All three bugs live in the same few lines of `store_photo()` because
all three are about the mismatch between "a real HTTP upload" (what WordPress's
upload functions assume) and "bytes this class decoded and wrote itself" (what
actually happens here) — but each is a separate WordPress-side check with a separate
root cause and a separate fix.

## Decision

Use `wp_handle_sideload()` instead of `wp_handle_upload()`. This is the WordPress-
provided API specifically for programmatic file handling (used by, e.g., the core
media importer and any plugin that fetches a remote file or generates one locally
before adding it to the media library) — it checks `is_readable( $file['tmp_name']
)` instead of `is_uploaded_file()`, which correctly accepts a file this class wrote
itself.

Also pass an explicit `mimes` override
(`array( 'jpg|jpeg|jpe' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp',
'gif' => 'image/gif' )`) matching `MediaValidator`'s own allowlist. This makes the
accepted formats independent of any theme or plugin that filters `upload_mimes`
site-wide — a deployment-specific plugin's MIME restrictions (tighter or looser)
should never affect the quote wizard's own upload path.

## Consequences

**Positive:**

- Photos upload reliably in any WordPress environment — this was a real bug
  affecting every submission with a photo, on every deployment, including the SCB
  pilot.
- Standard, WordPress-documented pattern for programmatic uploads (not a workaround).
- Explicit MIME allowlist removes a class of surprise from other installed plugins.

**Negative:**

- Requires `WP_TEMP_DIR` to be writable — already true in production (Linux hosts
  typically have a writable `/tmp`), but LocalWP's Windows PHP process frequently
  cannot write to the OS-default temp path, requiring the explicit `WP_TEMP_DIR`
  `wp-config.php` constant documented in this step's onboarding update.
- Uploaded photos are stored at ordinary public media-library URLs, same as before
  this step (Step 5.13e's original design decision, ADR-0026) — not a new tradeoff
  introduced here, but worth restating since it's directly relevant to the next point.

**Neutral:**

- Photos uploaded during local development render fine in WordPress admin but not
  via Google Sheets' `IMAGE()` formula, since Google's servers cannot reach a
  `*.local` URL. This is expected, not a defect, and is now documented in
  `docs/onboarding.md` rather than left for an engineer to rediscover.

## Deviations from the spec

- **No debug-logging removal.** The spec's Section 4.1 lists twelve `[goqw-debug]`
  `error_log()` calls to remove, "added during the SCB diagnostic session." A full
  read of `PhotoStorage.php` before this step found zero `error_log()` calls of any
  kind in the file — see `AUDIT-5.14.3-current-state.md`. Per this step's own cover
  note, this is treated as a no-op rather than a missing fix; nothing was removed
  because nothing matching the description existed. Commit 5 (the spec's dedicated
  "cleanup diagnostic logging" commit) is correspondingly a verification-only commit.

## Cross-references

- ADR-0026 (photo URL storage — introduced `PhotoStorage`)
- ADR-0030 (namespace prefix defense)
- ADR-0031 (photo extension/MIME consistency — the immediately prior step's fix in
  the same method)
- `AUDIT-5.14.3-current-state.md`, `AUDIT-5.14.3-test-coverage.md`,
  `AUDIT-5.14.3-documentation.md`
