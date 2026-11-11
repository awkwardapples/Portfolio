/**
 * Real code for the case studies (spec J.2 item 4; Pass 11, F.5): a few
 * lines cut from a source file at build time, between a line containing
 * `start` and the next line containing `end`, plus `after` more lines, with
 * the common indent removed. If either marker is missing the build fails, so
 * an excerpt can never silently drift from the code it claims to show.
 */
export function excerpt(
  source: string,
  start: string,
  end: string,
  options: { after?: number; file?: string } = {},
): string {
  return excerptLines(source, start, end, options).code;
}

/** As excerpt, with the 1-based first and last line numbers, for links such as #L48-L64. */
export function excerptLines(
  source: string,
  start: string,
  end: string,
  { after = 0, file = 'source' }: { after?: number; file?: string } = {},
): { code: string; from: number; to: number } {
  const lines = source.split(/\r?\n/);
  const from = lines.findIndex((line) => line.includes(start));
  if (from === -1) throw new Error(`excerpt: "${start}" not found in ${file}`);
  const to = lines.findIndex((line, index) => index >= from && line.includes(end));
  if (to === -1) throw new Error(`excerpt: "${end}" not found after "${start}" in ${file}`);
  const last = Math.min(lines.length, to + 1 + after);
  const chosen = lines.slice(from, last);
  const indent = Math.min(
    ...chosen
      .filter((line) => line.trim() !== '')
      .map((line) => line.length - line.trimStart().length),
  );
  return { code: chosen.map((line) => line.slice(indent)).join('\n'), from: from + 1, to: last };
}

/**
 * One line of a JSON Lines trace, found by the fragments it must contain,
 * shown with its empty fields left out and nested objects dropped, so a
 * long trace record reads as what happened. Fails the build if no line, or
 * more than one, matches.
 */
export function traceLine(
  source: string,
  fragments: readonly string[],
  { file = 'trace' }: { file?: string } = {},
): { code: string; line: number } {
  const lines = source.split(/\r?\n/);
  const matches = lines
    .map((text, index) => ({ text, index }))
    .filter(({ text }) => fragments.every((fragment) => text.includes(fragment)));
  if (matches.length !== 1) {
    throw new Error(
      `traceLine: ${matches.length} lines of ${file} contain ${fragments.map((f) => `"${f}"`).join(' and ')}; expected one`,
    );
  }
  const [match] = matches;
  const record = JSON.parse(match?.text ?? '{}') as Record<string, unknown>;
  const shown = Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== null && value !== '' && typeof value !== 'object',
    ),
  );
  return { code: JSON.stringify(shown, null, 2), line: (match?.index ?? 0) + 1 };
}
