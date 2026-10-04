/**
 * Facts about each PDF in public/documents/, recorded by `pnpm media:pdf`
 * (spec H.7): page count, size, embedded metadata and the cover rendered from
 * page one, which lives beside the entry so Astro optimises it.
 */
import { statSync } from 'node:fs';
import { join } from 'node:path';

import type { ImageMetadata } from 'astro';

import manifest from '~/data/documents.json';

interface ManifestRecord {
  pages: number;
  bytes: number;
  title: string | null;
  author: string | null;
  cover: string;
}

const records = manifest as Record<string, ManifestRecord>;

const covers = import.meta.glob<{ default: ImageMetadata }>('/src/content/**/*.cover.png', {
  eager: true,
});

export interface DocumentInfo {
  file: string;
  /** The permanent URL, e.g. /documents/kerr-microscopy-dissertation.pdf. */
  url: string;
  pages: number;
  bytes: number;
  /** "2.2 MB", "809 kB": the size as people read it in a button label. */
  size: string;
  cover: ImageMetadata | undefined;
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

/** Undefined for a file `pnpm media:pdf` has not recorded (the content checks report it). */
export function documentInfo(file: string): DocumentInfo | undefined {
  const record = records[file];
  if (!record) return undefined;
  return {
    file,
    url: `/documents/${file}`,
    pages: record.pages,
    bytes: record.bytes,
    size: formatSize(record.bytes),
    cover: covers[`/src/${record.cover}`]?.default,
  };
}

/**
 * The size of a file in apps/site/public ("140 kB"), read at build time, or
 * undefined if it is not there. Builds run from apps/site (pnpm --filter).
 */
export function publicFileSize(path: string): string | undefined {
  try {
    return formatSize(statSync(join(process.cwd(), 'public', path)).size);
  } catch {
    return undefined;
  }
}
