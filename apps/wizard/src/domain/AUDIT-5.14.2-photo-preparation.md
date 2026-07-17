# Audit A — Client-Side Photo Preparation Flow (5.14.2)

_Performed: 2026-07-17_

## Flow traced

1. User selects file(s) via the `<input type="file">` in
   [PhotoField.tsx](../../components/steps/fields/PhotoField.tsx#L59) (`handleFiles`).
2. Each `File` is passed to
   [`compressImage(file)`](../../utils/image-compression.ts#L40), which **always**
   re-encodes to JPEG via `canvas.toBlob(resolve, 'image/jpeg', quality)`
   ([image-compression.ts:68](../../utils/image-compression.ts#L68)) regardless of the
   source format — confirms Undocumented Assumption #1. The returned `CompressedPhoto`
   carries `mimeType: 'image/jpeg'` but, before this step, no filename at all.
3. `blobToBase64(compressed.blob)` encodes the JPEG bytes.
4. **[PhotoField.tsx:120-127](../../components/steps/fields/PhotoField.tsx#L120-L127)**
   builds the `PhotoMetadata` object that becomes the answer value:
   ```ts
   return {
     fileId,
     originalName: file.name, // <-- the ORIGINAL File's name, e.g. "photo.png"
     mimeType: 'image/jpeg', // <-- hardcoded, matches what compression actually produced
     sizeBytes: compressed.blob.size,
     width: compressed.width,
     height: compressed.height,
   };
   ```
   This is the exact mismatch point (confirms Undocumented Assumption #2): `originalName`
   is `file.name` (pre-compression, e.g. `photo.png`), but the bytes and `mimeType` are
   always JPEG. A user uploading `photo.png` or `photo.webp` produces a `PhotoMetadata`
   entry whose `originalName` extension does not match its actual content.
5. `PhotoMetadata` (no base64) is stored in FSM state via `onChange({ files: [...] })`;
   the base64 itself lives only in the volatile `PhotoStore`, keyed by `fileId`
   ([photos.ts](../../domain/runtime/photos.ts) — comment at top of file explains the
   split).
6. At submission time,
   [`enrichRequest()` in submission-media.ts](../../runtime/submission-media.ts#L33)
   merges `PhotoStore` base64 back onto each `PhotoMetadata`, spreading it unchanged
   (`{ ...meta, dataBase64 }`) into a `PhotoFilePayload`. `originalName` and `mimeType`
   pass through untouched from step 4.
7. The wire payload's `files[].originalName` reaches
   [`SubmissionController::store_photos()`](../../../../../plugins/quote-wizard/src/Rest/SubmissionController.php#L343),
   which reads `$file['originalName']` and passes it as `PhotoStorage::store_photo()`'s
   `$original_name` parameter — still carrying the pre-compression extension.

## Answers to the requested questions

- **File path where photo files are prepared:**
  `apps/wizard/src/components/steps/fields/PhotoField.tsx`, inside the `handleFiles`
  callback's `Promise.allSettled` map (lines ~100–127).
- **Line where filename is set on the payload:**
  [PhotoField.tsx:122](../../components/steps/fields/PhotoField.tsx#L122) —
  `originalName: file.name`. This is the single point of truth; `submission-media.ts`
  only copies it forward, it does not re-derive it.

## Fix location

`compressImage()` in `image-compression.ts` is the natural owner of the corrected
filename — it already knows the output is always `.jpg` and already receives the
original `File` (so it has `file.name` available to strip/replace the extension from).
`PhotoField.tsx` line 122 then uses `compressed.correctedFileName` instead of
`file.name`. No other call site constructs a `PhotoMetadata.originalName` — grep confirms
`originalName` is written only in `PhotoField.tsx` and read (never rewritten) everywhere
else (`ReviewField.tsx`, `submission-media.ts`).
