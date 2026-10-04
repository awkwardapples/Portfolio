import { describe, expect, it } from 'vitest';

import type { DocumentInfo } from './documents';
import { downloadLabel, monthYear, pagesLabel, peerReviewLabel, readDocumentLabel } from './format';

const info = { size: '2.2 MB' } as DocumentInfo;

describe('content labels', () => {
  it('names the document type and size in the read action', () => {
    expect(readDocumentLabel('dissertation', info)).toBe('Read the dissertation (PDF, 2.2 MB)');
    expect(readDocumentLabel('paper', undefined)).toBe('Read the paper (PDF)');
    expect(readDocumentLabel('slides', info)).toBe('Read the slides (PDF, 2.2 MB)');
  });

  it('labels downloads, pages and review status plainly', () => {
    expect(downloadLabel(info)).toBe('Download (PDF, 2.2 MB)');
    expect(pagesLabel(1)).toBe('1 page');
    expect(pagesLabel(58)).toBe('58 pages');
    expect(peerReviewLabel(false)).toBe('Not peer-reviewed');
  });

  it('writes months in British English', () => {
    expect(monthYear(new Date('2025-08-11T00:00:00Z'))).toBe('August 2025');
  });
});
