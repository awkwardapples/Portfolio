import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { ARBITER_SHA, arbiterFile } from './arbiter';
import { ARBITER_EVALUATION } from './arbiter-evaluation';

/** Arbiter in the case study (Pass 11, B.1, F.6). */

const demo = (path: string) =>
  readFileSync(fileURLToPath(new URL(`../../../arbiter-demo/${path}`, import.meta.url)), 'utf8');

describe('the pinned commit', () => {
  it('is the one the demo was copied and captured at', () => {
    expect(demo('UPSTREAM.md')).toContain(ARBITER_SHA);
    expect(JSON.parse(demo('public/data/index.json')).sha).toBe(ARBITER_SHA);
  });

  it('is in every link to the code, with line anchors', () => {
    expect(arbiterFile('app/orchestrator.py', { from: 108, to: 116 })).toBe(
      `https://github.com/awkwardapples/Arbiter/blob/${ARBITER_SHA}/app/orchestrator.py#L108-L116`,
    );
    expect(arbiterFile('README.md', { from: 59, to: 59 })).toMatch(/#L59$/);
  });
});

describe('How well it works (F.6)', () => {
  it("states only what Arbiter's own evaluation says, figure by figure", () => {
    for (const row of ARBITER_EVALUATION) {
      expect(row.sources.length, row.measure).toBeGreaterThan(0);
      for (const [file, text] of row.sources) {
        expect(demo(`upstream/${file}`), `${row.measure}: ${file}`).toContain(text);
      }
    }
  });
});
