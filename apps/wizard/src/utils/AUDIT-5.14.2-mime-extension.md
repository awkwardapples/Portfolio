# Audit B — MIME/Extension Mismatch Points (5.14.2)

_Performed: 2026-07-17_

## Where the mismatch is introduced

`compressImage()` ([image-compression.ts:40](image-compression.ts#L40)) always encodes
to `image/jpeg` regardless of the input `File`'s type — this is deliberate (see the
file's own top-of-file comment: "provides consistent output format (JPEG) and strips
EXIF unconditionally"). The function currently returns no filename at all; the caller
(`PhotoField.tsx`) supplies the _original_ `File.name`, which retains whatever extension
the source had (`.png`, `.webp`, `.heic`, etc.).

## Where it can be corrected — three candidate points, one chosen

1. **In `image-compression.ts`, as part of `compressImage()`'s return value.** Chosen.
   The function already knows the output is unconditionally JPEG and already has the
   original filename available (`file.name` is a parameter). Adding a
   `correctedFileName` field here means the correction logic lives exactly where the
   format decision is made — if compression's target format ever changes, this is the
   only place that needs to change.
2. **In `PhotoField.tsx`'s photo-preparation map, overriding `file.name` after the
   fact.** Rejected as the _sole_ fix location: it would duplicate the
   extension-stripping logic that `compressImage()` would otherwise own, and nothing
   about `PhotoField.tsx` needs to know compression's specific output format beyond
   "trust what compression tells me." `PhotoField.tsx` still needs a one-line change to
   _use_ the corrected name (Audit A) — that's consumption, not correction.
3. **Server-side in `PhotoStorage.php`, as a safety net.** Adopted _in addition to_ (1) —
   this is the defense-in-depth structure the spec asks for (Q1 = C). The server cannot
   trust client-supplied filenames (a modified client, a replayed request, or a future
   client bug could reintroduce the mismatch), so `PhotoStorage` independently maps
   `mimeType` → expected extension and corrects `original_name` before it's ever handed
   to `wp_handle_upload()`. This is the fix that actually prevents the WordPress-side
   rejection regardless of what the client sends — see
   `AUDIT-5.14.1-admin-includes.md`'s precedent of REST-context WordPress function
   requirements for why `wp_handle_upload()`'s internal `wp_check_filetype_and_ext()`
   check is opaque from unit tests (Audit C covers this).

## Decision

Both (1) and (3) are implemented. (2) is implemented only as the minimal "use the
corrected value" change Audit A already identified — no independent correction logic
in `PhotoField.tsx`.
