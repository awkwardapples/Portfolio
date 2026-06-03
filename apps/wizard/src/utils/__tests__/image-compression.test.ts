/**
 * Tests for image-compression utilities.
 *
 * compressImage and blobToBase64 require a DOM + canvas environment unavailable
 * in node; they are tested manually. Only the pure scaleToFit function and the
 * blobToBase64 chunking logic (via a TextEncoder-based stand-in) are unit-tested.
 */
import { describe, it, expect } from 'vitest';

import { scaleToFit, blobToBase64 } from '@/utils/image-compression';

// ---------------------------------------------------------------------------
// scaleToFit
// ---------------------------------------------------------------------------

describe('scaleToFit', () => {
  it('does not upscale an image already within budget', () => {
    const result = scaleToFit(800, 600, 2000);
    expect(result).toEqual({ targetWidth: 800, targetHeight: 600 });
  });

  it('scales landscape by longest edge', () => {
    const result = scaleToFit(4000, 3000, 2000);
    expect(result).toEqual({ targetWidth: 2000, targetHeight: 1500 });
  });

  it('scales portrait by longest edge', () => {
    const result = scaleToFit(3000, 4000, 2000);
    expect(result).toEqual({ targetWidth: 1500, targetHeight: 2000 });
  });

  it('scales square image', () => {
    const result = scaleToFit(4000, 4000, 2000);
    expect(result).toEqual({ targetWidth: 2000, targetHeight: 2000 });
  });

  it('passes through an image exactly at the limit', () => {
    const result = scaleToFit(2000, 1500, 2000);
    expect(result).toEqual({ targetWidth: 2000, targetHeight: 1500 });
  });

  it('rounds fractional pixels to nearest integer', () => {
    // 3001 × 2000, maxEdge 2000 → scale = 2000/3001 ≈ 0.6664
    const result = scaleToFit(3001, 2000, 2000);
    expect(result.targetWidth).toBe(2000);
    expect(result.targetHeight).toBe(Math.round(2000 * (2000 / 3001)));
  });
});

// ---------------------------------------------------------------------------
// blobToBase64
// ---------------------------------------------------------------------------

describe('blobToBase64', () => {
  it('round-trips small ASCII bytes', async () => {
    const text = 'hello';
    const blob = new Blob([text]);
    const b64 = await blobToBase64(blob);
    expect(atob(b64)).toBe(text);
  });

  it('returns empty string for empty Blob', async () => {
    const blob = new Blob([]);
    const b64 = await blobToBase64(blob);
    expect(b64).toBe('');
  });

  it('encodes binary bytes correctly', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const blob = new Blob([bytes]);
    const b64 = await blobToBase64(blob);
    const decoded = atob(b64);
    expect(decoded.charCodeAt(0)).toBe(0xff);
    expect(decoded.charCodeAt(1)).toBe(0xd8);
    expect(decoded.charCodeAt(2)).toBe(0xff);
    expect(decoded.charCodeAt(3)).toBe(0xe0);
  });
});
