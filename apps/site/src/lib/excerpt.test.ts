import { describe, expect, it } from 'vitest';

import { excerpt, excerptLines, traceLine } from './excerpt';

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

describe('excerptLines', () => {
  it('gives the 1-based lines the excerpt covers, for line links', () => {
    expect(excerptLines(source, '// Layer 1', "'honeypot_filled'", { after: 1 })).toMatchObject({
      from: 2,
      to: 5,
    });
  });
});

describe('traceLine', () => {
  const trace = [
    '{"agent_name":"PlannerAgent","action":"plan","status":"success","provider_meta":{"x":1}}',
    '{"agent_name":"EvaluatorAgent","action":"evaluate","status":"needs_revision","rows":null,"iteration":1}',
  ].join('\n');

  it('finds the one matching line and shows its non-empty, flat fields', () => {
    const found = traceLine(trace, ['"EvaluatorAgent"', '"needs_revision"']);
    expect(found.line).toBe(2);
    expect(JSON.parse(found.code)).toEqual({
      agent_name: 'EvaluatorAgent',
      action: 'evaluate',
      status: 'needs_revision',
      iteration: 1,
    });
  });

  it('fails when no line, or more than one, matches', () => {
    expect(() => traceLine(trace, ['"ChallengerAgent"'], { file: 't.jsonl' })).toThrow(
      /0 lines of t.jsonl/,
    );
    expect(() => traceLine(trace, ['"status"'])).toThrow(/2 lines/);
  });
});
