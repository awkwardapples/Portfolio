import { describe, expect, it } from 'vitest';

import {
  altTextProblems,
  documentProblems,
  featuredOrderProblems,
  findTodos,
  formatProblems,
  hasTodo,
  placeholderProblems,
  referenceProblems,
  slugProblems,
  type EntryLike,
} from './checks';

const entry = (id: string, data: Record<string, unknown>, body = ''): EntryLike => ({
  id,
  filePath: `src/content/work/${id}/index.mdx`,
  body,
  data,
});

describe('findTodos', () => {
  it('reports the path of every placeholder', () => {
    expect(
      findTodos({
        title: 'Real title',
        authorship: { type: 'TODO(josh): sole or lead' },
        links: [{ url: 'https://example.com' }, { url: 'TODO(josh): repo' }],
      }),
    ).toEqual(['authorship.type', 'links[1].url']);
  });

  it('ignores dates, numbers and booleans', () => {
    expect(findTodos({ date: new Date('2025-01-01'), order: 1, draft: false })).toEqual([]);
  });

  it('skips list items marked draft when asked', () => {
    const profile = {
      experience: [
        { title: 'Founder', start: 'TODO(josh): YYYY-MM', draft: true },
        { title: 'TODO(josh): programme name', draft: false },
      ],
    };
    expect(findTodos(profile, '', true)).toEqual(['experience[1].title']);
    expect(findTodos(profile)).toEqual(['experience[0].start', 'experience[1].title']);
  });

  it('hasTodo is true for any placeholder', () => {
    expect(hasTodo(['a', { b: 'TODO(josh): c' }])).toBe(true);
    expect(hasTodo({ a: 'b' })).toBe(false);
  });
});

describe('placeholderProblems (spec T.4)', () => {
  it('fails a published entry with a placeholder in its data', () => {
    const problems = placeholderProblems(entry('a', { subtitle: 'TODO(josh): subtitle' }));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({
      file: 'src/content/work/a/index.mdx',
      field: 'subtitle',
    });
  });

  it('fails a published entry with a placeholder in its body, naming the line', () => {
    const problems = placeholderProblems(entry('a', {}, 'Intro\n\nTODO(josh): finish this'));
    expect(problems).toEqual([expect.objectContaining({ field: 'body, line 3' })]);
  });

  it('allows placeholders in drafts', () => {
    expect(
      placeholderProblems(entry('a', { draft: true, title: 'TODO(josh): title' }, 'TODO(josh)')),
    ).toEqual([]);
  });

  it('passes once the placeholder is removed', () => {
    expect(placeholderProblems(entry('a', { title: 'Done' }, 'Finished text.'))).toEqual([]);
  });

  it('allows placeholders in draft items of the profile only', () => {
    const profile = entry('profile', {
      experience: [{ start: 'TODO(josh): YYYY-MM', draft: true }],
      links: { linkedin: 'TODO(josh): URL' },
    });
    expect(placeholderProblems(profile, { draftItems: true }).map((p) => p.field)).toEqual([
      'links.linkedin',
    ]);
  });
});

describe('altTextProblems', () => {
  it('flags Markdown images without alt text', () => {
    const problems = altTextProblems(
      entry('a', {}, 'Text\n\n![](./photo.jpg)\n\n![A cat](./cat.jpg)'),
    );
    expect(problems).toEqual([expect.objectContaining({ field: 'body, line 3' })]);
  });

  it('flags image components without an alt attribute', () => {
    const body = '<Figure src={photo} caption="x" />\n<Figure src={photo} alt="A view" />';
    expect(altTextProblems(entry('a', {}, body))).toHaveLength(1);
  });
});

describe('slugProblems', () => {
  const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  it('flags folders that are not lowercase and hyphenated', () => {
    const entries = [
      entry('good-name', {}),
      { ...entry('x', {}), filePath: 'src/content/work/Bad Name/index.mdx' },
    ];
    expect(slugProblems(entries, SLUG, 'my-project')).toHaveLength(1);
  });
});

describe('featuredOrderProblems', () => {
  it('flags two published featured entries with the same order', () => {
    const problems = featuredOrderProblems([
      entry('a', { featured: true, featuredOrder: 1 }),
      entry('b', { featured: true, featuredOrder: 1 }),
      entry('c', { featured: true, featuredOrder: 2 }),
    ]);
    expect(problems).toEqual([expect.objectContaining({ file: 'src/content/work/b/index.mdx' })]);
  });

  it('ignores drafts', () => {
    expect(
      featuredOrderProblems([
        entry('a', { featured: true, featuredOrder: 1 }),
        entry('b', { featured: true, featuredOrder: 1, draft: true }),
      ]),
    ).toEqual([]);
  });
});

describe('referenceProblems', () => {
  const targets = [entry('live', {}), entry('wip', { draft: true })];

  it('flags a published entry pointing at a draft or a missing entry', () => {
    const problems = referenceProblems(
      [
        entry('a', {
          related: [
            { collection: 'work', id: 'wip' },
            { collection: 'work', id: 'gone' },
          ],
        }),
      ],
      'related',
      targets,
    );
    expect(problems.map((p) => p.message)).toEqual([
      expect.stringContaining('"wip" is a draft'),
      expect.stringContaining('no work entry "gone"'),
    ]);
  });

  it('accepts references to published entries, and single references', () => {
    expect(
      referenceProblems(
        [entry('a', { project: { collection: 'work', id: 'live' } })],
        'project',
        targets,
      ),
    ).toEqual([]);
  });

  it('lets drafts point at anything', () => {
    expect(
      referenceProblems(
        [entry('a', { draft: true, related: [{ id: 'gone' }] })],
        'related',
        targets,
      ),
    ).toEqual([]);
  });
});

describe('documentProblems', () => {
  const store = {
    exists: (file: string) => file !== 'missing.pdf',
    recorded: (file: string) => file === 'ready.pdf',
  };

  it('requires the file and its recorded cover', () => {
    const problems = documentProblems(
      [
        entry('a', {
          documents: [{ file: 'ready.pdf' }, { file: 'missing.pdf' }],
          media: [{ type: 'document', file: 'unrecorded.pdf' }],
        }),
      ],
      store,
    );
    expect(problems.map((p) => p.message)).toEqual([
      expect.stringContaining('missing.pdf does not exist'),
      expect.stringContaining('unrecorded.pdf has no cover'),
    ]);
  });
});

describe('formatProblems', () => {
  it('names the collection, file and field', () => {
    expect(
      formatProblems('work', [
        { file: 'src/content/work/a/index.mdx', field: 'title', message: 'Bad.' },
      ]),
    ).toBe(
      'Content check failed for "work" (1 problem):\n  src/content/work/a/index.mdx > title: Bad.',
    );
  });
});
