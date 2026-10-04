import { describe, expect, it } from 'vitest';

import { attributionLine, authorshipStatement, citationInput, type WorkFacts } from './work';

const dissertation: WorkFacts = {
  role: 'Sole author',
  date: new Date('2025-08-11'),
  authorship: { type: 'sole', collaborators: [] },
  context: {
    institution: 'University of Manchester',
    programme: 'BSc dissertation',
    result: 'Awarded 76% (first class)',
  },
};

describe('attributionLine', () => {
  it('reads as the spec example (H.6)', () => {
    expect(attributionLine(dissertation)).toBe(
      'Sole author. BSc dissertation, University of Manchester. Awarded 76% (first class).',
    );
  });

  it('is just the role when there is no context', () => {
    expect(attributionLine({ ...dissertation, role: 'Sole developer', context: undefined })).toBe(
      'Sole developer.',
    );
  });
});

describe('authorshipStatement', () => {
  it('states sole work plainly', () => {
    expect(authorshipStatement(dissertation, false)).toEqual(['This is my own work.']);
  });

  it('names collaborators, the supervisor and external credits from the data', () => {
    const lead: WorkFacts = {
      ...dissertation,
      authorship: {
        type: 'lead',
        collaborators: [{ name: 'Ada King', role: 'data' }, { name: 'Alan Turing' }],
        supervisor: 'Prof. Example',
      },
    };
    expect(authorshipStatement(lead, true)).toEqual([
      'I led this work, with Ada King (data) and Alan Turing.',
      'Supervised by Prof. Example.',
      'Material by other people is credited where it appears.',
    ]);
  });

  it('describes a contribution with the role', () => {
    const contributor: WorkFacts = {
      ...dissertation,
      role: 'Co-author',
      authorship: { type: 'contributor', collaborators: [{ name: 'Ada King' }] },
    };
    expect(authorshipStatement(contributor, false)).toEqual([
      'I contributed to this work with Ada King. My role: co-author.',
    ]);
  });
});

describe('citationInput', () => {
  it('builds the permanent document URL on the site origin', () => {
    const input = citationInput(
      dissertation,
      {
        file: 'kerr-microscopy-dissertation.pdf',
        title: 'T',
        docType: 'dissertation',
        peerReviewed: false,
      },
      { name: 'Josh Lennon', site: 'https://joshlennon.com', date: new Date('2025-08-11') },
    );
    expect(input.url).toBe('https://joshlennon.com/documents/kerr-microscopy-dissertation.pdf');
    expect(input.authors).toEqual(['Josh Lennon']);
    expect(input.programme).toBe('BSc dissertation');
  });
});
