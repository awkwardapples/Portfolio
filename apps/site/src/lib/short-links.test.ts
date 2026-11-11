import { describe, expect, it } from 'vitest';

import { SHORT_LINKS, devRedirects, redirectsFile, shortLinkProblems } from './short-links';

/** Short links (Pass 11, D.1). */

const site = (pages: Record<string, string>, files: string[] = []) => ({
  page: (path: string) => pages[path],
  file: (path: string) => files.includes(path),
});

describe('the registry', () => {
  it('keeps the two paths printed in the CV, landing on the documents', () => {
    expect(SHORT_LINKS.filter((link) => link.printedIn === 'CV')).toEqual([
      {
        path: '/intro-to-deep-learning',
        to: '/work/introduction-to-deep-learning#read',
        printedIn: 'CV',
      },
      {
        path: '/extracting-image-data',
        to: '/work/kerr-microscopy-dissertation#read',
        printedIn: 'CV',
      },
    ]);
  });

  it('writes each path as a 301, with and without a trailing slash', () => {
    const lines = redirectsFile([{ path: '/cv', to: '/cv.pdf', printedIn: 'spare' }])
      .split('\n')
      .filter((line) => line && !line.startsWith('#'));
    expect(lines).toEqual(['/cv /cv.pdf 301', '/cv/ /cv.pdf 301']);
  });

  it("gives astro dev the same redirects through Astro's option", () => {
    expect(devRedirects([{ path: '/cv', to: '/cv.pdf', printedIn: 'spare' }])).toEqual({
      '/cv': { status: 301, destination: '/cv.pdf' },
    });
  });
});

describe('shortLinkProblems', () => {
  const pages = { '/work/paper': '<li id="read" class="document-card">', '/about': '<main>' };

  it('passes when every target and fragment exists', () => {
    expect(
      shortLinkProblems(
        [
          { path: '/paper', to: '/work/paper#read', printedIn: 'CV' },
          { path: '/cv', to: '/cv.pdf', printedIn: 'spare' },
        ],
        site(pages, ['/cv.pdf']),
      ),
    ).toEqual([]);
  });

  it('fails on a missing page, a missing fragment, a collision and a bad path', () => {
    const problems = shortLinkProblems(
      [
        { path: '/gone', to: '/work/gone#read', printedIn: 'CV' },
        { path: '/paper', to: '/work/paper#read-2', printedIn: 'CV' },
        { path: '/about', to: '/work/paper', printedIn: 'spare' },
        { path: '/Two/Parts', to: '/work/paper', printedIn: 'spare' },
      ],
      site(pages),
    );
    expect(problems).toEqual([
      '/gone: its target /work/gone is not in the build',
      '/paper: /work/paper has no element with id="read-2"',
      '/about: collides with a real page or file',
      '/Two/Parts: a short path is one lowercase segment, e.g. /arbiter',
    ]);
  });
});
