/**
 * Labels for content (spec E.5): plain, sentence case, saying exactly what
 * happens ("Read the dissertation (PDF, 2.2 MB)"). Metadata is set in
 * separate elements or joined with commas, never middle dots.
 */
import type { DocumentInfo } from './documents';

export const KIND_LABELS = {
  research: 'Research',
  software: 'Software',
  venture: 'Venture',
  music: 'Music',
  writing: 'Writing',
} as const;

export const DOC_TYPE_LABELS = {
  paper: 'Paper',
  dissertation: 'Dissertation',
  report: 'Report',
  slides: 'Slides',
  poster: 'Poster',
} as const;

export type DocType = keyof typeof DOC_TYPE_LABELS;

/** "Read the dissertation (PDF, 2.2 MB)" */
export function readDocumentLabel(docType: DocType, info: DocumentInfo | undefined): string {
  const noun = docType === 'slides' ? 'slides' : DOC_TYPE_LABELS[docType].toLowerCase();
  return info ? `Read the ${noun} (PDF, ${info.size})` : `Read the ${noun} (PDF)`;
}

/** "Download (PDF, 2.2 MB)" */
export function downloadLabel(info: DocumentInfo | undefined): string {
  return info ? `Download (PDF, ${info.size})` : 'Download (PDF)';
}

/** "58 pages" */
export function pagesLabel(pages: number): string {
  return `${pages} ${pages === 1 ? 'page' : 'pages'}`;
}

export function peerReviewLabel(peerReviewed: boolean): string {
  return peerReviewed ? 'Peer-reviewed' : 'Not peer-reviewed';
}

/** ISO date for <time datetime>. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "August 2025" */
export function monthYear(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
