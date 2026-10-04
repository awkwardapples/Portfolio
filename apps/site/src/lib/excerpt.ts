/**
 * Real code for the case study (spec J.2 item 4): a few lines cut from a
 * source file at build time, between a line containing `start` and the next
 * line containing `end`, plus `after` more lines, with the common indent
 * removed. If either marker is missing the build fails, so an excerpt can
 * never silently drift from the code it claims to show.
 */
export function excerpt(
  source: string,
  start: string,
  end: string,
  { after = 0, file = 'source' }: { after?: number; file?: string } = {},
): string {
  const lines = source.split(/\r?\n/);
  const from = lines.findIndex((line) => line.includes(start));
  if (from === -1) throw new Error(`excerpt: "${start}" not found in ${file}`);
  const to = lines.findIndex((line, index) => index >= from && line.includes(end));
  if (to === -1) throw new Error(`excerpt: "${end}" not found after "${start}" in ${file}`);
  const chosen = lines.slice(from, Math.min(lines.length, to + 1 + after));
  const indent = Math.min(
    ...chosen
      .filter((line) => line.trim() !== '')
      .map((line) => line.length - line.trimStart().length),
  );
  return chosen.map((line) => line.slice(indent)).join('\n');
}
