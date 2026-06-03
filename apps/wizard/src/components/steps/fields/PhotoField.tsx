import { useState, useCallback, useRef } from 'react';

import { isPhotoAnswerValue } from '@/domain/runtime/photos';
import type { PhotoMetadata } from '@/domain/runtime/photos';
import { compressImage, blobToBase64 } from '@/utils/image-compression';
import { usePhotoStore } from '@/runtime/hooks/usePhotoStore';
import { generateFileId } from '@/runtime/photos-store';
import { ValidationMessage } from '@/components/composites';

import type { FieldRendererProps } from '../types';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB per file (pre-compression)
const MAX_TOTAL_BYTES = 9 * 1024 * 1024; // 9 MB client-side limit (server cap is 10 MB)
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedMime = (typeof ALLOWED_MIME)[number];

function isAllowedMime(mime: string): mime is AllowedMime {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Multi-photo upload field.
 *
 * Behaviour:
 *   - Compresses each selected image to JPEG via canvas (2000px max, 0.85 quality).
 *   - Stores base64 in the volatile PhotoStore (not in FSM state).
 *   - Dispatches ANSWER_SET with PhotoAnswerValue (metadata only).
 *   - Shows thumbnails with individual remove buttons.
 *   - Shows a "re-attach required" indicator for metadata entries missing from
 *     the PhotoStore (user reloaded the page; StepRenderer disables Submit).
 *   - Client-side caps: maxCount photos, 5 MB per file, 9 MB total.
 */
export function PhotoField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: FieldRendererProps): JSX.Element {
  const photoStore = usePhotoStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const maxCount = field.maxCount ?? 1;

  const [compressing, setCompressing] = useState<ReadonlySet<string>>(new Set());
  const [localError, setLocalError] = useState<string | undefined>(undefined);

  const id = field.key;
  const errorId = (error ?? localError) ? `${id}-error` : undefined;
  const helpId = field.help ? `${id}-help` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  const handleFiles = useCallback(
    async (fileList: FileList | null): Promise<void> => {
      if (!fileList || fileList.length === 0) return;

      setLocalError(undefined);

      // Derive currentFiles inside the callback so the dep array uses `value`, not the
      // per-render-derived currentFiles constant (react-hooks/exhaustive-deps requirement).
      const currentFiles: readonly PhotoMetadata[] = isPhotoAnswerValue(value) ? value.files : [];
      const incoming = Array.from(fileList);

      // Count check
      if (currentFiles.length + incoming.length > maxCount) {
        setLocalError(
          `You can upload at most ${maxCount} photo${maxCount === 1 ? '' : 's'}. Remove some to add more.`,
        );
        return;
      }

      // Per-file MIME check
      for (const file of incoming) {
        if (!isAllowedMime(file.type)) {
          setLocalError(`${file.name} is not a supported image type. Use JPEG, PNG, or WebP.`);
          return;
        }
      }

      // Per-file size check (pre-compression)
      for (const file of incoming) {
        if (file.size > MAX_PHOTO_BYTES) {
          setLocalError(`${file.name} is too large (${formatBytes(file.size)}). Maximum is 5 MB.`);
          return;
        }
      }

      // Generate IDs early so we can track compression state
      const pendingIds = incoming.map(() => generateFileId());
      setCompressing((prev) => new Set([...prev, ...pendingIds]));

      // Compress in parallel
      const results = await Promise.allSettled(
        incoming.map(async (file, i): Promise<PhotoMetadata> => {
          const compressed = await compressImage(file);
          const base64 = await blobToBase64(compressed.blob);

          // Total size check (post-compression, encoded)
          const currentTotal =
            currentFiles.reduce((sum, m) => {
              const stored = photoStore?.get(m.fileId);
              return sum + (stored ? stored.length : 0);
            }, 0) + base64.length;

          if (currentTotal > MAX_TOTAL_BYTES) {
            throw new Error(
              `Adding this photo would exceed the 9 MB total limit. Remove some photos first.`,
            );
          }

          const fileId = pendingIds[i]!;
          photoStore?.set(fileId, base64);

          return {
            fileId,
            originalName: file.name,
            mimeType: 'image/jpeg',
            sizeBytes: compressed.blob.size,
            width: compressed.width,
            height: compressed.height,
          };
        }),
      );

      // Remove pending IDs before updating state
      const completedIds = new Set(pendingIds);
      setCompressing((prev) => {
        const next = new Set(prev);
        completedIds.forEach((id) => next.delete(id));
        return next;
      });

      const succeeded: PhotoMetadata[] = [];
      let firstError: string | undefined;
      for (const result of results) {
        if (result.status === 'fulfilled') {
          succeeded.push(result.value);
        } else if (!firstError) {
          firstError =
            result.reason instanceof Error
              ? result.reason.message
              : 'Could not process this image.';
        }
      }

      if (succeeded.length > 0) {
        onChange({ files: [...currentFiles, ...succeeded] });
      }
      if (firstError) {
        setLocalError(firstError);
      }

      // Reset input so the same file can be selected again if removed
      if (inputRef.current) inputRef.current.value = '';
    },
    [value, maxCount, onChange, photoStore],
  );

  function handleRemove(fileId: string): void {
    photoStore?.delete(fileId);
    const files = isPhotoAnswerValue(value) ? value.files : [];
    onChange({ files: files.filter((m) => m.fileId !== fileId) });
  }

  const currentFiles: readonly PhotoMetadata[] = isPhotoAnswerValue(value) ? value.files : [];
  const isAtMax = currentFiles.length >= maxCount && compressing.size === 0;
  const displayError = error ?? localError;

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-text">
        {field.label}
        {field.required && (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        )}
      </legend>

      {field.help && (
        <p id={helpId} className="mt-1 text-sm text-text-muted">
          {field.help}
        </p>
      )}

      {/* Existing thumbnails */}
      {currentFiles.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Attached photos">
          {currentFiles.map((meta) => {
            const hasData = photoStore?.has(meta.fileId) ?? false;
            return (
              <li
                key={meta.fileId}
                className="flex items-center gap-3 rounded border border-border p-2"
              >
                {!hasData && (
                  <span className="shrink-0 text-xs font-bold text-warning" aria-hidden="true">
                    !
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-text">
                  {meta.originalName}
                </span>
                <span className="shrink-0 text-xs text-text-muted">
                  {formatBytes(meta.sizeBytes)}
                </span>
                {!hasData && (
                  <span className="shrink-0 text-xs text-warning">Re-attach required</span>
                )}
                <button
                  type="button"
                  className="shrink-0 text-sm text-danger hover:underline"
                  aria-label={`Remove ${meta.originalName}`}
                  onClick={() => handleRemove(meta.fileId)}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Compressing indicator */}
      {compressing.size > 0 && (
        <p className="mt-2 text-sm text-text-muted" aria-live="polite">
          Compressing {compressing.size} photo{compressing.size === 1 ? '' : 's'}…
        </p>
      )}

      {/* File input — hidden when at max capacity */}
      {!isAtMax && (
        <div className="mt-3">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={maxCount > 1}
            aria-required={field.required || undefined}
            aria-describedby={describedBy}
            onChange={(e) => {
              void handleFiles(e.target.files);
              onBlur();
            }}
            className="text-sm text-text file:mr-3 file:rounded file:border-0 file:bg-surface-sunken file:px-3 file:py-2 file:text-sm file:font-medium file:text-text"
          />
          <p className="mt-1 text-xs text-text-muted">
            JPEG, PNG, or WebP — up to {maxCount} photo{maxCount === 1 ? '' : 's'}, 5 MB each
          </p>
        </div>
      )}

      {displayError && <ValidationMessage id={errorId} message={displayError} />}
    </fieldset>
  );
}
