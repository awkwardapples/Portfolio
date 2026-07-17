/**
 * Photo answer value types (Step 4.8).
 *
 * A photo field's answer is an array of photo metadata entries. Metadata is
 * FSM-state-resident and serializable. The base64 bytes live in a volatile
 * PhotoStore (apps/wizard/src/runtime/photo-store.ts) keyed by fileId, and
 * are merged into the submission payload at submission time.
 *
 * The split preserves the serialization invariant (WizardState is always
 * JSON-safe) while keeping sessionStorage small: a session with 5 photos does
 * not persist 10 MB of base64 on every answer change.
 */

/** Metadata for one compressed photo. FSM-resident; serializable. */
export interface PhotoMetadata {
  readonly fileId: string;
  readonly originalName: string;
  readonly mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  readonly sizeBytes: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The answer-value shape for a photo field. Stored in WizardState.answers.
 * Files array is empty until the user selects photos.
 */
export interface PhotoAnswerValue {
  readonly files: readonly PhotoMetadata[];
}

/**
 * One photo enriched with its base64 payload for submission. Built in the
 * effects layer by merging FSM metadata with the PhotoStore.
 */
export interface PhotoFilePayload extends PhotoMetadata {
  readonly dataBase64: string;
}

/** Type guard: is a value a PhotoAnswerValue? */
export function isPhotoAnswerValue(value: unknown): value is PhotoAnswerValue {
  return (
    value !== null &&
    typeof value === 'object' &&
    'files' in value &&
    Array.isArray((value as PhotoAnswerValue).files)
  );
}

/**
 * Shape of a compressed photo relevant to building its PhotoMetadata entry.
 * Matches (a subset of) CompressedPhoto from @/utils/image-compression —
 * defined locally rather than imported to keep this pure domain module
 * decoupled from the DOM-dependent compression module.
 */
interface CompressedPhotoLike {
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
  readonly correctedFileName: string;
}

/**
 * Build the PhotoMetadata entry for one compressed photo (Step 5.14.2).
 *
 * Uses `compressed.correctedFileName`, not the source File's own name:
 * compression always re-encodes to JPEG, so the original extension (.png,
 * .webp, ...) would no longer match the actual bytes — see
 * AUDIT-5.14.2-photo-preparation.md. Pure and DOM-free so it's independently
 * testable, unlike the React field component that calls it.
 *
 * @param fileId      Generated ID keying the base64 bytes in the PhotoStore.
 * @param compressed  Result of compressImage().
 */
export function buildPhotoMetadata(fileId: string, compressed: CompressedPhotoLike): PhotoMetadata {
  return {
    fileId,
    originalName: compressed.correctedFileName,
    mimeType: 'image/jpeg',
    sizeBytes: compressed.blob.size,
    width: compressed.width,
    height: compressed.height,
  };
}
