/**
 * Text a work page generates from its data (spec H.6): the attribution line
 * under the title, the statement of authorship, and the citation input for
 * each document. Nothing here adds a fact: every phrase comes from a field.
 */
import type { CitationInput } from './citation';
import type { DocType } from './format';

export const STATUS_LABELS = {
  complete: 'Complete',
  ongoing: 'Ongoing',
  archived: 'Archived',
} as const;

interface Collaborator {
  name: string;
  role?: string | undefined;
  url?: string | undefined;
}

/** The fields these helpers read, so tests need no content collection. */
export interface WorkFacts {
  role: string;
  date: Date | string;
  authorship: {
    type: 'sole' | 'lead' | 'contributor' | string;
    collaborators: readonly Collaborator[];
    supervisor?: string | undefined;
  };
  context?:
    | {
        institution?: string | undefined;
        programme?: string | undefined;
        result?: string | undefined;
      }
    | undefined;
}

const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);
const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * "Sole author. BSc dissertation, University of Manchester. Awarded 76%
 * (first class)." from role, programme, institution and result.
 */
export function attributionLine(work: WorkFacts): string {
  const parts = [sentence(work.role)];
  const where = [work.context?.programme, work.context?.institution].filter(Boolean).join(', ');
  if (where) parts.push(sentence(capitalise(where)));
  if (work.context?.result) parts.push(sentence(work.context.result));
  return parts.join(' ');
}

function nameList(collaborators: readonly Collaborator[]): string {
  const names = collaborators.map((person) =>
    person.role ? `${person.name} (${person.role})` : person.name,
  );
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** The statement of authorship (spec H.6 item 7), in the first person. */
export function authorshipStatement(work: WorkFacts, hasExternalMedia: boolean): string[] {
  const { type, collaborators, supervisor } = work.authorship;
  const lines: string[] = [];
  if (collaborators.length === 0) {
    lines.push(type === 'sole' ? 'This is my own work.' : `My role: ${work.role.toLowerCase()}.`);
  } else if (type === 'lead') {
    lines.push(`I led this work, with ${nameList(collaborators)}.`);
  } else if (type === 'sole') {
    lines.push(`This is my own work, with contributions from ${nameList(collaborators)}.`);
  } else {
    lines.push(
      `I contributed to this work with ${nameList(collaborators)}. My role: ${work.role.toLowerCase()}.`,
    );
  }
  if (supervisor) lines.push(`Supervised by ${supervisor}.`);
  if (hasExternalMedia) lines.push('Material by other people is credited where it appears.');
  return lines;
}

/** The author list for citations: Josh first, then collaborators in their listed order. */
export function authorsOf(work: WorkFacts, name: string): string[] {
  return [name, ...work.authorship.collaborators.map((person) => person.name)];
}

export function citationInput(
  work: WorkFacts,
  document: { file: string; title: string; docType: DocType; peerReviewed: boolean },
  options: { name: string; site: URL | string; date: Date },
): CitationInput {
  return {
    authors: authorsOf(work, options.name),
    title: document.title,
    docType: document.docType,
    peerReviewed: document.peerReviewed,
    date: options.date,
    url: new URL(`/documents/${document.file}`, options.site).href,
    institution: work.context?.institution,
    programme: work.context?.programme,
  };
}
