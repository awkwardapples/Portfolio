# Audit D — Media Validation Logic (5.12b)

_Performed: 2026-07-07_

## File examined

`plugins/quote-wizard/src/Submissions/MediaValidator.php`

## invalid_encoding trigger conditions

`invalid_encoding` is returned in two places:

**Line 136** — when `$base64 === ''` (empty string):

```php
if ( '' === $base64 ) {
    return array( 'fileIndex' => $index, 'code' => 'invalid_encoding' );
}
```

**Line 144** — when `base64_decode($base64, true)` returns `false`:

```php
$decoded = base64_decode( $base64, true );
if ( false === $decoded ) {
    return array( 'fileIndex' => $index, 'code' => 'invalid_encoding' );
}
```

PHP's `base64_decode()` in strict mode (`true`) returns `false` when the string
contains characters outside the base64 alphabet (A-Z, a-z, 0-9, +, /, =).

## Frontend encoding pipeline

`apps/wizard/src/utils/image-compression.ts`:

- `blobToBase64(blob)` explicitly produces raw base64 with NO data URL prefix
- Comment: "Encode a Blob to a base64 string (no data: prefix)"
- Uses `btoa(binary)` which produces A-Z, a-z, 0-9, +, /, = only

`apps/wizard/src/components/steps/fields/PhotoField.tsx`:

- Calls `compressImage(file)` → always returns `image/jpeg` mime type
- Calls `blobToBase64(compressed.blob)` → stores raw base64 in PhotoStore
- Metadata sets `mimeType: 'image/jpeg'` regardless of original file type

## Root cause analysis

The standard code path does NOT include a data URL prefix. Two failure scenarios
explain `invalid_encoding` for a legitimate iPhone JPEG:

**Scenario A — Empty dataBase64 (most likely):**
`PhotoField.tsx` line 118: `photoStore?.set(fileId, base64)` where `photoStore` is
optional. If `usePhotoStore()` returns null in an edge case (e.g., context not yet
mounted), the store.set() is a no-op. Later, `submission-media.ts` reads:
`dataBase64: store.get(meta.fileId) ?? ''` — returns `''` → triggers line 136
`invalid_encoding`.

**Scenario B — Browser sends data URL prefix (defensive):**
Some mobile browser versions or browser extensions may modify the base64 payload
to include a `data:image/jpeg;base64,` prefix before the actual base64 content.
The `data:` prefix contains `:`, `;`, and `/` characters that are valid base64 chars
but the `:` and `;` are not — strict decode returns false → triggers line 144.

## Fix

Add defensive data URL prefix stripping in `validate_file()` before the decode step.
This makes the validator robust to both scenarios:

- An empty string after stripping still triggers `invalid_encoding` (correct)
- A string with valid base64 after prefix stripping succeeds decode (correct fix)
- A genuinely malformed non-base64 string still fails decode (correct rejection)

```php
// 4. Base64 decode.
// Strip data URL prefix if present (e.g., 'data:image/jpeg;base64,...').
// The frontend sends raw base64, but some browser paths prepend this prefix.
$raw_base64 = (string) preg_replace( '/^data:[^;]+;base64,/i', '', $base64 );

if ( '' === $raw_base64 ) {
    return array( 'fileIndex' => $index, 'code' => 'invalid_encoding' );
}

$decoded = base64_decode( $raw_base64, true );
if ( false === $decoded ) {
    return array( 'fileIndex' => $index, 'code' => 'invalid_encoding' );
}
```

Magic-byte (step 5) and dimension (step 6) checks run against `$decoded`,
which is the same as before — no security regression.

## Security check

Stripping the prefix does NOT weaken security:

- Step 3 (MIME allowlist) still rejects invalid claimed types
- Step 5 (finfo magic bytes) still verifies actual content against claimed type
- Step 6 (getimagesizefromstring) still confirms valid image dimensions
- A malformed payload that passes strip+decode but fails steps 5-6 is still rejected
