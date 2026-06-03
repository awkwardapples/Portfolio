import { describe, it, expect, beforeEach } from 'vitest';

import { PhotoStore, generateFileId } from '@/runtime/photos-store';

describe('PhotoStore', () => {
  let store: PhotoStore;

  beforeEach(() => {
    store = new PhotoStore();
  });

  it('starts empty', () => {
    expect(store.size()).toBe(0);
  });

  it('stores and retrieves a base64 string', () => {
    store.set('file-1', 'abc123');
    expect(store.get('file-1')).toBe('abc123');
  });

  it('returns undefined for unknown fileId', () => {
    expect(store.get('no-such-id')).toBeUndefined();
  });

  it('reports has() correctly', () => {
    store.set('file-1', 'data');
    expect(store.has('file-1')).toBe(true);
    expect(store.has('file-2')).toBe(false);
  });

  it('delete removes an entry', () => {
    store.set('file-1', 'data');
    store.delete('file-1');
    expect(store.has('file-1')).toBe(false);
    expect(store.size()).toBe(0);
  });

  it('clear removes all entries', () => {
    store.set('file-1', 'a');
    store.set('file-2', 'b');
    store.clear();
    expect(store.size()).toBe(0);
  });

  it('size reflects entry count', () => {
    store.set('file-1', 'a');
    store.set('file-2', 'b');
    expect(store.size()).toBe(2);
    store.delete('file-1');
    expect(store.size()).toBe(1);
  });
});

describe('generateFileId', () => {
  it('returns a non-empty string', () => {
    expect(generateFileId().length).toBeGreaterThan(0);
  });

  it('returns unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateFileId()));
    expect(ids.size).toBe(20);
  });
});
