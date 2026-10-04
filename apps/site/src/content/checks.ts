/**
 * Content checks that run while the collections load (spec H.3, T.4).
 *
 * Pure functions with no Astro imports, so they are unit-tested directly
 * (checks.test.ts). The loader in loader.ts runs them after every load and
 * fails a production build with the file and field named; in `astro dev`
 * the same problems are printed as warnings so the site keeps running.
 */

export const TODO_MARK = 'TODO(josh)';

export interface EntryLike {
  id: string;
  filePath?: string | undefined;
  body?: string | undefined;
  data: Record<string, unknown>;
}

export interface Problem {
  file: string;
  field?: string;
  message: string;
}

const fileOf = (entry: EntryLike) => entry.filePath ?? entry.id;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);

const isDraft = (value: unknown) => isRecord(value) && value.draft === true;

/**
 * Field paths whose value holds a placeholder, e.g. `authorship.type` or
 * `experience[2].start`. With `skipDraftItems`, list items marked
 * `draft: true` are ignored (the profile's experience, education and photos).
 */
export function findTodos(value: unknown, path = '', skipDraftItems = false): string[] {
  if (typeof value === 'string') return value.includes(TODO_MARK) ? [path || '(value)'] : [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      skipDraftItems && isDraft(item) ? [] : findTodos(item, `${path}[${index}]`, skipDraftItems),
    );
  }
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    findTodos(child, path ? `${path}.${key}` : key, skipDraftItems),
  );
}

/** True if anything in the value holds a placeholder. */
export function hasTodo(value: unknown): boolean {
  return findTodos(value).length > 0;
}

/**
 * The placeholder guard (spec T.4): a published entry may not contain
 * `TODO(josh)` in its data or its body. Drafts are excluded from production
 * builds, so they may.
 */
export function placeholderProblems(
  entry: EntryLike,
  options: { draftItems?: boolean } = {},
): Problem[] {
  if (entry.data.draft === true) return [];
  const draftItems = options.draftItems ?? false;
  const advice = draftItems
    ? 'Fill it in, or mark that item `draft: true`.'
    : 'Fill it in, or mark the entry `draft: true`.';
  const problems: Problem[] = findTodos(entry.data, '', draftItems).map((field) => ({
    file: fileOf(entry),
    field,
    message: `Placeholder in a published entry. ${advice}`,
  }));
  if (entry.body?.includes(TODO_MARK)) {
    problems.push({
      file: fileOf(entry),
      field: `body, line ${lineOf(entry.body, entry.body.indexOf(TODO_MARK))}`,
      message: `Placeholder in a published entry. ${advice}`,
    });
  }
  return problems;
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

/** Images in the body need alt text (spec H.3, R). */
export function altTextProblems(entry: EntryLike): Problem[] {
  const body = entry.body ?? '';
  const problems: Problem[] = [];
  for (const match of body.matchAll(/!\[\s*\]\(/g)) {
    problems.push({
      file: fileOf(entry),
      field: `body, line ${lineOf(body, match.index ?? 0)}`,
      message: 'This image has no alt text: write it between the square brackets.',
    });
  }
  for (const match of body.matchAll(/<(img|Figure|Picture|Image)\b(?![^>]*\balt=)[^>]*>/g)) {
    problems.push({
      file: fileOf(entry),
      field: `body, line ${lineOf(body, match.index ?? 0)}`,
      message: `<${match[1]}> needs an alt attribute.`,
    });
  }
  return problems;
}

/** Folder names become URLs, so they must be lowercase and hyphenated (spec S). */
export function slugProblems(entries: EntryLike[], pattern: RegExp, example: string): Problem[] {
  return entries
    .filter((entry) => {
      const folder = (entry.filePath ?? '').split('/').slice(-2, -1)[0];
      return folder !== undefined && !pattern.test(folder);
    })
    .map((entry) => ({
      file: fileOf(entry),
      message: `Rename the folder to the form ${example} (lowercase letters, digits and hyphens).`,
    }));
}

const published = (entries: EntryLike[]) => entries.filter((entry) => entry.data.draft !== true);

/** Two published featured entries cannot share a featuredOrder (spec H.3). */
export function featuredOrderProblems(entries: EntryLike[]): Problem[] {
  const seen = new Map<number, EntryLike>();
  const problems: Problem[] = [];
  for (const entry of published(entries)) {
    const order = entry.data.featuredOrder;
    if (entry.data.featured !== true || typeof order !== 'number') continue;
    const other = seen.get(order);
    if (other) {
      problems.push({
        file: fileOf(entry),
        field: 'featuredOrder',
        message: `featuredOrder ${order} is already used by ${other.id}.`,
      });
    } else seen.set(order, entry);
  }
  return problems;
}

/** References from a published entry must point to another published entry (spec H.3). */
export function referenceProblems(
  entries: EntryLike[],
  field: string,
  targets: EntryLike[],
): Problem[] {
  const byId = new Map(targets.map((target) => [target.id, target]));
  const problems: Problem[] = [];
  for (const entry of published(entries)) {
    const raw = entry.data[field];
    const refs = (Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]) as unknown[];
    for (const ref of refs) {
      const id = isRecord(ref) && typeof ref.id === 'string' ? ref.id : String(ref);
      const target = byId.get(id);
      if (!target) {
        problems.push({ file: fileOf(entry), field, message: `There is no work entry "${id}".` });
      } else if (target.data.draft === true) {
        problems.push({
          file: fileOf(entry),
          field,
          message: `"${id}" is a draft, so this link would point nowhere in production.`,
        });
      }
    }
  }
  return problems;
}

export interface DocumentStore {
  /** True if public/documents/<file> exists. */
  exists(file: string): boolean;
  /** True if `pnpm media:pdf` has recorded the file (pages, size, cover). */
  recorded(file: string): boolean;
}

/** Every document an entry lists must be in public/documents/ with its cover (spec H.3, H.7). */
export function documentProblems(entries: EntryLike[], store: DocumentStore): Problem[] {
  const problems: Problem[] = [];
  for (const entry of published(entries)) {
    const listed = [
      ...((entry.data.documents as unknown[] | undefined) ?? []),
      ...(((entry.data.media as unknown[] | undefined) ?? []).filter(
        (item) => isRecord(item) && item.type === 'document',
      ) as unknown[]),
    ];
    for (const item of listed) {
      if (!isRecord(item) || typeof item.file !== 'string') continue;
      if (!store.exists(item.file)) {
        problems.push({
          file: fileOf(entry),
          field: 'documents',
          message: `apps/site/public/documents/${item.file} does not exist. Add it with pnpm media:pdf.`,
        });
      } else if (!store.recorded(item.file)) {
        problems.push({
          file: fileOf(entry),
          field: 'documents',
          message: `${item.file} has no cover or page count yet. Run pnpm media:pdf on it.`,
        });
      }
    }
  }
  return problems;
}

/** One readable block for the build log. */
export function formatProblems(collection: string, problems: Problem[]): string {
  const lines = problems.map(
    (problem) =>
      `  ${problem.file}${problem.field ? ` > ${problem.field}` : ''}: ${problem.message}`,
  );
  return `Content check failed for "${collection}" (${problems.length} problem${
    problems.length === 1 ? '' : 's'
  }):\n${lines.join('\n')}`;
}
