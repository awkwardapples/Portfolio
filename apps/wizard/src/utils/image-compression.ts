/**
 * Browser-side image compression.
 *
 * Resizes a File to a configurable longest-edge limit and re-encodes as JPEG
 * at a configurable quality. Uses native canvas + createImageBitmap — no
 * third-party dependencies. EXIF data is stripped by the re-encode.
 *
 * The defaults (2000px / 0.85 quality) are calibrated for typical phone
 * photos. A 4032×3024 iPhone shot typically produces 400–800 kB output.
 * The 5 MB per-photo and 10 MB total caps in the submission pipeline are the
 * hard safety net; compression reduces payload size as a best effort.
 *
 * Compression runs on every selected file regardless of original size, which
 * provides consistent output format (JPEG) and strips EXIF unconditionally.
 */

export interface CompressedPhoto {
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
  readonly mimeType: 'image/jpeg';
}

export interface CompressionOptions {
  readonly maxLongestEdgePx: number;
  readonly quality: number;
}

const DEFAULTS: CompressionOptions = {
  maxLongestEdgePx: 2000,
  quality: 0.85,
};

/**
 * Compress a single image File. Returns a CompressedPhoto or throws a typed
 * string error code so callers can map to user-visible messages.
 *
 * Error codes: 'image_decode_failed' | 'canvas_unavailable' | 'canvas_encode_failed'
 */
export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {},
): Promise<CompressedPhoto> {
  const opts = { ...DEFAULTS, ...options };

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('image_decode_failed');
  });

  const { targetWidth, targetHeight } = scaleToFit(
    bitmap.width,
    bitmap.height,
    opts.maxLongestEdgePx,
  );

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    bitmap.close();
    throw new Error('canvas_unavailable');
  }
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', opts.quality),
  );
  if (blob === null) throw new Error('canvas_encode_failed');

  return { blob, width: targetWidth, height: targetHeight, mimeType: 'image/jpeg' };
}

/**
 * Scale source dimensions so the longest edge fits within maxEdge, preserving
 * aspect ratio. Returns the source dimensions unchanged if already within budget.
 */
export function scaleToFit(
  srcW: number,
  srcH: number,
  maxEdge: number,
): { targetWidth: number; targetHeight: number } {
  const longest = Math.max(srcW, srcH);
  if (longest <= maxEdge) return { targetWidth: srcW, targetHeight: srcH };
  const scale = maxEdge / longest;
  return {
    targetWidth: Math.round(srcW * scale),
    targetHeight: Math.round(srcH * scale),
  };
}

/**
 * Encode a Blob to a base64 string (no data: prefix). Chunked to avoid
 * call-stack overflow on large buffers.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}
