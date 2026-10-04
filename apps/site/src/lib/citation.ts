/**
 * Citations for documents (spec H.6): plain text in APA style and BibTeX,
 * generated from the work entry's data. Dissertations are `@thesis` with
 * their programme as the type; papers, reports, slides and posters are
 * `@misc`. Nothing that is not peer-reviewed is called a publication: the
 * BibTeX says so in `note`.
 */
import type { DocType } from './format';

export interface CitationInput {
  /** People in citation order, "Josh Lennon" style. */
  authors: readonly string[];
  title: string;
  docType: DocType;
  peerReviewed: boolean;
  date: Date;
  /** The permanent absolute URL of the PDF. */
  url: string;
  institution?: string | undefined;
  /** For dissertations, e.g. "BSc dissertation". */
  programme?: string | undefined;
}

const DOC_TYPE_NOTES: Record<DocType, string> = {
  paper: 'Paper',
  dissertation: 'Dissertation',
  report: 'Report',
  slides: 'Slides',
  poster: 'Poster',
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'on',
  'of',
  'in',
  'for',
  'and',
  'to',
  'from',
  'with',
]);

function splitName(name: string): { family: string; given: string[] } {
  const parts = name.trim().split(/\s+/);
  const family = parts.pop() ?? name;
  return { family, given: parts };
}

/** "Lennon, J." */
function apaName(name: string): string {
  const { family, given } = splitName(name);
  const initials = given.map((part) => `${part.charAt(0).toUpperCase()}.`).join(' ');
  return initials ? `${family}, ${initials}` : family;
}

/** "Lennon, J.", "Lennon, J., & Mukherjee, A.", "Lennon, J., Smith, A., & Mukherjee, A." */
function apaAuthors(authors: readonly string[]): string {
  const names = authors.map(apaName);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
}

function bracketNote(input: CitationInput): string {
  if (input.docType === 'dissertation') {
    const kind = input.programme ?? 'Dissertation';
    return input.institution ? `${kind}, ${input.institution}` : kind;
  }
  return DOC_TYPE_NOTES[input.docType];
}

/** "Lennon, J. (2025). Title [BSc dissertation, University of Manchester]. https://..." */
export function plainCitation(input: CitationInput): string {
  const year = input.date.getUTCFullYear();
  const title = input.title.replace(/[.\s]+$/, '');
  return `${apaAuthors(input.authors)} (${year}). ${title} [${bracketNote(input)}]. ${input.url}`;
}

/** Escapes BibTeX's special characters in a field value (not in URLs). */
export function escapeBibtex(value: string): string {
  // One pass, so the braces a replacement adds are never escaped again.
  return value.replace(/[\\{}&%$#_~^]/g, (char) => {
    if (char === '\\') return '\\textbackslash{}';
    if (char === '~') return '\\textasciitilde{}';
    if (char === '^') return '\\textasciicircum{}';
    return `\\${char}`;
  });
}

/** "lennon2025extracting": family name, year and the first significant word of the title. */
export function citationKey(input: CitationInput): string {
  const ascii = (text: string) =>
    text
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .toLowerCase();
  const family = ascii(splitName(input.authors[0] ?? 'anonymous').family).replace(/\W/g, '');
  const word =
    ascii(input.title)
      .split(/[\s-]+/)
      .find((part) => part && !STOP_WORDS.has(part)) ?? 'document';
  return `${family}${input.date.getUTCFullYear()}${word.replace(/\W/g, '')}`;
}

export function bibtexCitation(input: CitationInput): string {
  const bibAuthors = input.authors
    .map((name) => {
      const { family, given } = splitName(name);
      return given.length > 0 ? `${family}, ${given.join(' ')}` : family;
    })
    .map(escapeBibtex)
    .join(' and ');

  const fields: [string, string][] = [
    ['author', `{${bibAuthors}}`],
    // Double braces keep the title's capitals as written.
    ['title', `{{${escapeBibtex(input.title)}}}`],
  ];
  let type: 'thesis' | 'misc';
  if (input.docType === 'dissertation') {
    type = 'thesis';
    fields.push(['type', `{${escapeBibtex(input.programme ?? 'Dissertation')}}`]);
    if (input.institution) fields.push(['institution', `{${escapeBibtex(input.institution)}}`]);
  } else {
    type = 'misc';
    fields.push(['howpublished', `{${DOC_TYPE_NOTES[input.docType]}}`]);
  }
  fields.push(['year', `{${input.date.getUTCFullYear()}}`]);
  if (!input.peerReviewed) fields.push(['note', '{Not peer-reviewed}']);
  fields.push(['url', `{${input.url}}`]);

  const width = Math.max(...fields.map(([name]) => name.length));
  const body = fields.map(([name, value]) => `  ${name.padEnd(width)} = ${value},`).join('\n');
  return `@${type}{${citationKey(input)},\n${body}\n}`;
}
