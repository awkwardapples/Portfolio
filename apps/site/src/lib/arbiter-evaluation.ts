/**
 * How well Arbiter works (Pass 11, F.6): only what its own published
 * evaluation says, each figure with its caveat, and with the exact text it
 * comes from in apps/arbiter-demo/upstream (docs/EVALUATION.md or the
 * README, at the pinned commit). arbiter-evaluation.test.ts checks that
 * every source text is there, so a figure on the page cannot drift.
 */
export interface EvaluationRow {
  measure: string;
  result: string;
  note?: string;
  /** [file in apps/arbiter-demo/upstream, the text the figure is copied from]. */
  sources: [file: 'docs/EVALUATION.md' | 'README.md', text: string][];
}

export const ARBITER_EVALUATION: EvaluationRow[] = [
  {
    measure: 'Correct decisions, live, on the first 10 test cases (25 October 2026)',
    result: '10 of 10',
    note: 'Wilson 95% interval 0.72 to 1.00',
    sources: [
      ['docs/EVALUATION.md', '10/10 correct'],
      ['docs/EVALUATION.md', 'Wilson 95% interval of 0.72–1.00 on accuracy'],
    ],
  },
  {
    measure: 'Unsafe approvals, live',
    result: '0',
    sources: [['docs/EVALUATION.md', '0 unsafe approvals']],
  },
  {
    measure: 'Consistent repeats, live',
    result: '4 of 4',
    sources: [['docs/EVALUATION.md', '4/4 consistent repeats']],
  },
  {
    measure: 'Correct decisions, offline, on the whole test split',
    result: '16 of 16',
    sources: [['docs/EVALUATION.md', '| arbiter_offline | 1.000 (16/16) |']],
  },
  {
    measure: 'Model calls that fell back to deterministic logic, live',
    result: '10 of 21',
    note: 'Because of the routing issue under Credits; the policy still decided every case',
    sources: [['docs/EVALUATION.md', '**Fallbacks:** 10 of 21 calls']],
  },
  {
    measure: 'A single-prompt baseline',
    result: 'Not measured',
    note: 'Every baseline call returned HTTP 502',
    sources: [
      ['docs/EVALUATION.md', 'All 10 primary baseline calls, and the 4 repeats, returned HTTP 502'],
    ],
  },
  {
    measure: 'Live example 2, Quillfeather Payroll Cloud Ltd',
    result: 'Escalate, in 228 s',
    note: '14 Zetaris queries, each with a request id; 4 Nemotron calls, each with a receipt',
    sources: [
      ['README.md', 'Outcome `ESCALATE`, matching its label, in 228 s'],
      ['README.md', 'Fourteen registry queries went through Zetaris, each with a request id.'],
      ['README.md', 'Four agent steps ran on Nemotron through Nightshift, each with a receipt.'],
    ],
  },
  {
    measure: 'Zetaris parity with the mirror',
    result: '416 of 416',
    note: 'Registry comparisons',
    sources: [['README.md', '416/416 registry comparisons against the mirror']],
  },
];
