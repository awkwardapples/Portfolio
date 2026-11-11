/**
 * Short addresses printed in Josh's CV and elsewhere (Pass 11, D.1;
 * ADR-0051). Paths never change once printed. The build writes them to
 * dist/_redirects as 301s, which Cloudflare's static assets answer before
 * any file is served (integrations/short-links.mjs); `astro dev` serves the
 * same redirects through Astro's own `redirects` option.
 */
export interface ShortLink {
  /** The printed path, without a trailing slash. */
  readonly path: string;
  /** Where it lands: a page on this site, with a fragment where it opens a document. */
  readonly to: string;
  /** Where the path was printed, or "spare" for one kept ready. */
  readonly printedIn: 'CV' | 'spare';
}

export const SHORT_LINKS: readonly ShortLink[] = [
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
  { path: '/arbiter', to: '/work/arbiter', printedIn: 'spare' },
  { path: '/cv', to: '/cv.pdf', printedIn: 'spare' },
];

/** dist/_redirects: each path with and without a trailing slash, as a 301. */
export function redirectsFile(links: readonly ShortLink[] = SHORT_LINKS): string {
  const lines = links.flatMap((link) => [
    `${link.path} ${link.to} 301`,
    `${link.path}/ ${link.to} 301`,
  ]);
  return `# Short links (src/lib/short-links.ts). Generated at build time; do not edit.\n${lines.join('\n')}\n`;
}

/** Astro's `redirects` option, for `astro dev`. */
export function devRedirects(
  links: readonly ShortLink[] = SHORT_LINKS,
): Record<string, { status: 301; destination: string }> {
  return Object.fromEntries(
    links.map((link) => [link.path, { status: 301 as const, destination: link.to }]),
  );
}

/**
 * Problems with the registry against the built site: a target that is not a
 * page or file, a fragment its page does not have, or a short path that
 * would shadow a real page. `page(path)` returns the HTML of a built page,
 * `file(path)` whether a file exists; both take site paths.
 */
export function shortLinkProblems(
  links: readonly ShortLink[],
  site: { page: (path: string) => string | undefined; file: (path: string) => boolean },
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const link of links) {
    if (!/^\/[a-z0-9-]+$/.test(link.path)) {
      problems.push(`${link.path}: a short path is one lowercase segment, e.g. /arbiter`);
    }
    if (seen.has(link.path)) problems.push(`${link.path}: listed twice`);
    seen.add(link.path);
    if (site.page(link.path) !== undefined || site.file(link.path)) {
      problems.push(`${link.path}: collides with a real page or file`);
    }
    const [target = '', fragment] = link.to.split('#');
    const html = site.page(target);
    if (html === undefined && !site.file(target)) {
      problems.push(`${link.path}: its target ${target} is not in the build`);
    } else if (fragment && !new RegExp(`\\sid="${fragment}"`).test(html ?? '')) {
      problems.push(`${link.path}: ${target} has no element with id="${fragment}"`);
    }
  }
  return problems;
}
