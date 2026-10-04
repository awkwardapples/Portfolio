import { describe, expect, it } from 'vitest';

import {
  bibtexCitation,
  citationKey,
  escapeBibtex,
  plainCitation,
  type CitationInput,
} from './citation';
import { parseBibtex, unescapedSpecials } from './testing/bibtex-parser';

const dissertation: CitationInput = {
  authors: ['Josh Lennon'],
  title: 'Extracting magnetic information from Kerr Microscopy images',
  docType: 'dissertation',
  peerReviewed: false,
  date: new Date('2025-08-11'),
  url: 'https://joshlennon.com/documents/kerr-microscopy-dissertation.pdf',
  institution: 'University of Manchester',
  programme: 'BSc dissertation',
};

const report: CitationInput = {
  authors: ['Josh Lennon'],
  title: 'Iris I could identify this flower',
  docType: 'report',
  peerReviewed: false,
  date: new Date('2023-10-08'),
  url: 'https://joshlennon.com/documents/neural-network-iris-report.pdf',
};

const REQUIRED: Record<string, string[]> = {
  thesis: ['author', 'title', 'type', 'institution', 'year', 'url'],
  misc: ['author', 'title', 'howpublished', 'year', 'url'],
};

/** Parses the BibTeX and checks the fields a reference manager needs. */
function validate(bibtex: string) {
  const entries = parseBibtex(bibtex);
  expect(entries).toHaveLength(1);
  const [entry] = entries;
  if (!entry) throw new Error('no entry');
  for (const field of REQUIRED[entry.type] ?? ['unknown entry type']) {
    expect(entry.fields, `${entry.type} needs ${field}`).toHaveProperty(field);
  }
  for (const [name, value] of Object.entries(entry.fields)) {
    if (name !== 'url') expect(unescapedSpecials(value), name).toEqual([]);
  }
  return entry;
}

describe('BibTeX citations', () => {
  it('cites the dissertation as @thesis with its programme as the type (spec H.6)', () => {
    const entry = validate(bibtexCitation(dissertation));
    expect(entry.type).toBe('thesis');
    expect(entry.key).toBe('lennon2025extracting');
    expect(entry.fields).toMatchObject({
      author: 'Lennon, Josh',
      title: '{Extracting magnetic information from Kerr Microscopy images}',
      type: 'BSc dissertation',
      institution: 'University of Manchester',
      year: '2025',
      note: 'Not peer-reviewed',
      url: dissertation.url,
    });
  });

  it('cites reports and papers as @misc', () => {
    const entry = validate(bibtexCitation(report));
    expect(entry.type).toBe('misc');
    expect(entry.key).toBe('lennon2023iris');
    expect(entry.fields.howpublished).toBe('Report');
  });

  it('joins several authors with "and", and leaves out the note when peer-reviewed', () => {
    const entry = validate(
      bibtexCitation({
        ...report,
        docType: 'paper',
        peerReviewed: true,
        authors: ['Josh Lennon', 'Ada Byron King'],
      }),
    );
    expect(entry.fields.author).toBe('Lennon, Josh and King, Ada Byron');
    expect(entry.fields).not.toHaveProperty('note');
  });

  it('escapes special characters so the entry still parses', () => {
    const entry = validate(
      bibtexCitation({ ...report, title: 'R&D at 100% {fast} #1 with snake_case ~ ^ \\' }),
    );
    expect(entry.fields.title).toBe(
      '{R\\&D at 100\\% \\{fast\\} \\#1 with snake\\_case \\textasciitilde{} \\textasciicircum{} \\textbackslash{}}',
    );
  });

  it('builds keys from plain letters only', () => {
    expect(citationKey({ ...report, title: 'The Élan of Neural-Nets' })).toBe('lennon2023elan');
    expect(escapeBibtex('a_b')).toBe('a\\_b');
  });

  it('rejects malformed BibTeX, so the parser is a real check', () => {
    expect(() => parseBibtex('@misc{key, title = {unbalanced}')).toThrow();
    expect(() => parseBibtex('@misc{key, title = {a}, title = {b}}')).toThrow(/Duplicate/);
    expect(unescapedSpecials('R&D')).toEqual(['&']);
  });
});

describe('plain-text citations', () => {
  it('follows APA: authors, year, title, a bracketed description and the URL', () => {
    expect(plainCitation(dissertation)).toBe(
      'Lennon, J. (2025). Extracting magnetic information from Kerr Microscopy images [BSc dissertation, University of Manchester]. https://joshlennon.com/documents/kerr-microscopy-dissertation.pdf',
    );
    expect(plainCitation(report)).toBe(
      'Lennon, J. (2023). Iris I could identify this flower [Report]. https://joshlennon.com/documents/neural-network-iris-report.pdf',
    );
  });

  it('lists co-authors with an ampersand before the last', () => {
    expect(
      plainCitation({ ...report, authors: ['Josh Lennon', 'Ada King', 'Alan Turing'] }),
    ).toMatch(/^Lennon, J\., King, A\., & Turing, A\. \(2023\)/);
  });
});
