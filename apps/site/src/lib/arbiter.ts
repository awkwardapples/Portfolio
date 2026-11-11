/**
 * Arbiter's repository at the commit the demo and the case study come from
 * (Pass 11, B.1; ADR-0050). Every link to Arbiter's code uses this commit,
 * never `main`, so a quoted line still says what the page says it does.
 * arbiter.test.ts checks it matches apps/arbiter-demo/UPSTREAM.md and the
 * snapshot.
 */
export const ARBITER_REPOSITORY = 'https://github.com/awkwardapples/Arbiter';
export const ARBITER_SHA = '745098876d169e7ae146fc7af9a94d4f0aa85b84';

/** A file in Arbiter at the pinned commit, optionally with a line range. */
export function arbiterFile(path: string, lines?: { from: number; to: number }): string {
  const anchor = lines
    ? lines.from === lines.to
      ? `#L${lines.from}`
      : `#L${lines.from}-L${lines.to}`
    : '';
  return `${ARBITER_REPOSITORY}/blob/${ARBITER_SHA}/${path}${anchor}`;
}
