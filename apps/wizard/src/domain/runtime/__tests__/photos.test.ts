import { describe, it, expect } from 'vitest';

import { buildPhotoMetadata, isPhotoAnswerValue } from '@/domain/runtime/photos';

describe('buildPhotoMetadata (Step 5.14.2)', () => {
  it('uses correctedFileName as originalName, not the source file name', () => {
    const meta = buildPhotoMetadata('file-1', {
      blob: new Blob(['bytes']),
      width: 800,
      height: 600,
      correctedFileName: 'photo.jpg',
    });
    expect(meta.originalName).toBe('photo.jpg');
  });

  it('carries fileId, mimeType, dimensions, and blob size through unchanged', () => {
    const blob = new Blob(['0123456789']);
    const meta = buildPhotoMetadata('file-42', {
      blob,
      width: 1200,
      height: 900,
      correctedFileName: 'holiday.jpg',
    });

    expect(meta.fileId).toBe('file-42');
    expect(meta.mimeType).toBe('image/jpeg');
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(900);
    expect(meta.sizeBytes).toBe(blob.size);
  });
});

describe('isPhotoAnswerValue', () => {
  it('accepts a value with a files array', () => {
    expect(isPhotoAnswerValue({ files: [] })).toBe(true);
  });

  it('rejects null, non-objects, and objects without a files array', () => {
    expect(isPhotoAnswerValue(null)).toBe(false);
    expect(isPhotoAnswerValue('x')).toBe(false);
    expect(isPhotoAnswerValue({})).toBe(false);
  });
});
