# Audit B — MediaValidator Current State (5.13e)

_Performed: 2026-07-13_

## File examined

`plugins/quote-wizard/src/Submissions/MediaValidator.php`

## What validation is applied

`MediaValidator::validate( array $answers ): array{ ok: bool, issues: list }` walks every
answer field, and for each one shaped like `{ files: [...] }`, validates each file entry
in this order (short-circuit on first failure):

1. Per-photo encoded size ≤ `max_photo_bytes` (default 5 MB) → `too_large`
2. Running total across all photos ≤ `max_total_bytes` (default 10 MB) → `total_too_large`
3. `mimeType` claim in `{image/jpeg, image/png, image/webp}` → `unsupported_type`
4. Base64 decodes successfully → `invalid_encoding`
5. `finfo` magic-byte match against the claimed MIME → `content_mismatch`
6. `getimagesizefromstring` confirms a real image, dimensions ≤ `max_dimension`
   (default 12000px) → `not_an_image` / `dimensions_too_large`

Limits are constructor-injected so tests can use small values.

## The 5.12b `invalid_encoding` / data-URL-prefix fix

Step 5.12b added prefix stripping before step 4's `base64_decode()`:

```php
$raw_base64 = (string) preg_replace( '/^data:[^;]+;base64,/i', '', $base64 );
```

This runs unconditionally (a no-op if no prefix is present) and made browsers that
prepend `data:image/jpeg;base64,` succeed validation. `invalid_encoding` is now returned
only when the stripped string is empty or fails `base64_decode(..., true)` (strict mode).

## Where validation happens in the submission flow

`SubmissionController::handle()` Step 1b, immediately after payload shape validation and
before `SubmissionRepository::insert()` — i.e. before any DB write. A validation failure
returns 400 with `mediaIssues` and nothing is persisted.

## Relevance to 5.13e (D8: keep base64 validation)

Per D8, `MediaValidator` is unchanged. It still validates the **incoming base64** at the
same point in the flow, before `PhotoStorage` ever touches the data. `PhotoStorage`
receives already-validated `dataBase64` strings — it does not need to re-run MIME/magic-
byte/dimension checks, only decode-to-file and hand off to WordPress's media library
functions (which have their own independent `wp_check_filetype_and_ext()` gate, see
Audit C).

One consequence worth flagging: `MediaValidator` operates on the **raw incoming
`$answers`** (with `dataBase64` still present) — it must run _before_ `PhotoStorage`
mutates the answers array in `SubmissionController`, otherwise validation would see URLs
instead of base64 and its magic-byte/dimension checks would no longer apply to anything.
The implementation must preserve this ordering: validate (existing) → store via
`PhotoStorage` (new) → persist (existing, now storing URLs not base64).
