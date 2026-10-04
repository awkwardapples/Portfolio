import { describe, expect, it } from 'vitest';

import { excerpt } from './excerpt';

const source = [
  'export function a() {',
  '  // Layer 1: honeypot.',
  "  if (value !== '') {",
  "    return 'honeypot_filled';",
  '  }',
  '  return null;',
  '}',
].join('\n');

describe('excerpt', () => {
  it('cuts from the start marker to the end marker, dedented, with extra lines after', () => {
    expect(excerpt(source, '// Layer 1', "'honeypot_filled'", { after: 1 })).toBe(
      ['// Layer 1: honeypot.', "if (value !== '') {", "  return 'honeypot_filled';", '}'].join(
        '\n',
      ),
    );
  });

  it('fails loudly when the code it quotes has moved', () => {
    expect(() => excerpt(source, '// Layer 9', '}', { file: 'bot.ts' })).toThrow(
      'excerpt: "// Layer 9" not found in bot.ts',
    );
    expect(() => excerpt(source, '// Layer 1', 'nowhere')).toThrow(/not found after/);
  });
});
