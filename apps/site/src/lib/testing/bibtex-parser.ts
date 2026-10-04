/**
 * A strict BibTeX parser for tests (spec Pass 5: "citations validated against
 * a BibTeX parser"). It follows BibTeX's entry grammar: `@type{key, name =
 * value, ...}` where a value is a braced group (braces balanced, escapes
 * allowed), a quoted string, a number or a bare macro name. It throws on
 * anything else, including unescaped special characters, which a third-party
 * parser would often accept silently. Written here because no BibTeX parser is
 * an approved dependency (spec U.6).
 */
export interface BibEntry {
  type: string;
  key: string;
  fields: Record<string, string>;
}

class ParseError extends Error {
  constructor(message: string, at: number, source: string) {
    super(`${message} at ${at}: "${source.slice(at, at + 24)}"`);
  }
}

export function parseBibtex(source: string): BibEntry[] {
  let at = 0;
  const entries: BibEntry[] = [];
  const fail = (message: string): never => {
    throw new ParseError(message, at, source);
  };
  const skipSpace = () => {
    while (at < source.length && /\s/.test(source[at] ?? '')) at += 1;
  };
  const expect = (char: string) => {
    skipSpace();
    if (source[at] !== char) fail(`Expected "${char}"`);
    at += 1;
  };
  const identifier = (pattern: RegExp, what: string): string => {
    skipSpace();
    const match = pattern.exec(source.slice(at));
    if (!match) return fail(`Expected ${what}`);
    at += match[0].length;
    return match[0];
  };

  const braced = (): string => {
    // at is on "{"; returns the content between the outer braces.
    let depth = 0;
    const start = at + 1;
    for (; at < source.length; at += 1) {
      const char = source[at];
      if (char === '\\') {
        at += 1;
        continue;
      }
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          at += 1;
          return source.slice(start, at - 1);
        }
      }
    }
    return fail('Unbalanced braces');
  };

  const value = (): string => {
    skipSpace();
    const char = source[at];
    if (char === '{') return braced();
    if (char === '"') {
      const end = source.indexOf('"', at + 1);
      if (end < 0) fail('Unterminated string');
      const text = source.slice(at + 1, end);
      at = end + 1;
      return text;
    }
    return identifier(/^[A-Za-z0-9_:-]+/, 'a value');
  };

  skipSpace();
  while (at < source.length) {
    expect('@');
    const type = identifier(/^[A-Za-z]+/, 'an entry type').toLowerCase();
    expect('{');
    const key = identifier(/^[A-Za-z0-9_:.-]+/, 'a citation key');
    const fields: Record<string, string> = {};
    skipSpace();
    while (source[at] === ',') {
      at += 1;
      skipSpace();
      if (source[at] === '}') break;
      const name = identifier(/^[A-Za-z][A-Za-z0-9_-]*/, 'a field name').toLowerCase();
      if (name in fields) fail(`Duplicate field "${name}"`);
      expect('=');
      fields[name] = value();
      skipSpace();
    }
    expect('}');
    entries.push({ type, key, fields });
    skipSpace();
  }
  return entries;
}

/** Special characters that must be escaped in BibTeX values other than URLs. */
export function unescapedSpecials(value: string): string[] {
  const found: string[] = [];
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i] ?? '';
    if ('&%$#_'.includes(char) && value[i - 1] !== '\\') found.push(char);
  }
  return found;
}
