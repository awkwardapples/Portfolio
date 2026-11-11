/**
 * How Arbiter reasons, step by step (Pass 11, F.5): each step pairs one
 * sentence with a real artefact, cut at build time from the verbatim copies
 * of Arbiter's files in apps/arbiter-demo/upstream (pinned commit,
 * src/lib/arbiter.ts). The build fails if an anchor moves. Each step links
 * to the file on GitHub at that commit, with line anchors.
 */
import contracts from '../../../../arbiter-demo/upstream/app/actions/contracts.py?raw';
import queries from '../../../../arbiter-demo/upstream/app/data/queries.yaml?raw';
import scoutGuard from '../../../../arbiter-demo/upstream/app/guard/scout_guard.py?raw';
import orchestrator from '../../../../arbiter-demo/upstream/app/orchestrator.py?raw';
import replay from '../../../../arbiter-demo/upstream/app/audit/replay.py?raw';
import trace from '../../../../arbiter-demo/upstream/logs/examples/live/trace-run-211916c1544d.jsonl?raw';
import policy from '../../../../arbiter-demo/upstream/policy/arbiter_policy.v1.yaml?raw';

import { arbiterFile } from '~/lib/arbiter';
import { excerptLines, traceLine } from '~/lib/excerpt';

import type { PipelineStep } from './types';

const TRACE = 'logs/examples/live/trace-run-211916c1544d.jsonl';

/** A code excerpt from one of Arbiter's files, linked at its lines. */
function code(path: string, source: string, start: string, end: string, after = 0) {
  const name = path.split('/').pop() ?? path;
  const cut = excerptLines(source, start, end, { after, file: name });
  return {
    link: { href: arbiterFile(path, cut), label: `${name}, lines ${cut.from} to ${cut.to}` },
    artefact: { caption: path, code: cut.code },
  };
}

/** A line of live example 2's trace (25 October 2026), found by the span the README quotes. */
function traced(span: string, also: string) {
  const found = traceLine(trace, [`"span_id":"${span}"`, also], { file: TRACE });
  return {
    link: {
      href: arbiterFile(TRACE, { from: found.line, to: found.line }),
      label: `Live example 2's trace, line ${found.line}`,
    },
    artefact: {
      caption: `${TRACE}, line ${found.line} (empty and nested fields left out)`,
      code: found.code,
    },
  };
}

const guard = code('app/guard/scout_guard.py', scoutGuard, 'def guard(', 'level = "block"');
const kevQuery = code(
  'app/data/queries.yaml',
  queries,
  'Q_COMPONENT_KEV:',
  '- {name: vendor_id, type: vendor_id}',
);
const kevTrace = traced('2e67b49302d94d47', '"query_id":"Q_COMPONENT_KEV"');
const sendBack = traced('6a0ba5b7bd4d4030', '"status":"needs_revision"');
const outcomes = code('policy/arbiter_policy.v1.yaml', policy, 'outcome_rules:', '{id: O9,');
const challenge = code(
  'app/orchestrator.py',
  orchestrator,
  'if state is State.CHALLENGE:',
  'return State.REPORT',
);
const signing = code('app/actions/contracts.py', contracts, 'def sign(', 'return True, "ok"');
const replaying = code(
  'app/audit/replay.py',
  replay,
  'def replay(',
  'contract_signatures=signatures_ok,',
  2,
);

export const ARBITER_STEPS: PipelineStep[] = [
  {
    title: 'Guard',
    text: 'Vendor text passes Meterless Scout before any model reads it; blocked content escalates.',
    links: [guard.link],
    artefacts: [guard.artefact],
  },
  {
    title: 'Plan over one model',
    text: 'The Planner reads the Zetaris semantic layer as a 304-token catalogue and chooses registry queries; it never writes SQL.',
    links: [kevQuery.link],
    artefacts: [kevQuery.artefact],
  },
  {
    title: 'Gather with quotes',
    text: "The Evidence agent runs the queries and extracts each claim with a verbatim quote. In live example 2, the query that joins the vendor's declared software to CISA's known-exploited list ran inside Zetaris and found 15 FortiOS entries.",
    links: [kevTrace.link],
    artefacts: [kevTrace.artefact],
  },
  {
    title: 'Evaluate and send back',
    text: 'The Evaluator checks claims against the records and sends the plan back for missing evidence, at most twice. Here it sent the Planner back for incident and contract evidence.',
    links: [sendBack.link],
    artefacts: [sendBack.artefact],
  },
  {
    title: 'Decide by policy',
    text: "A versioned policy maps the facts to one of five outcomes; a model's worse extraction can lower an outcome, never raise it.",
    links: [outcomes.link],
    artefacts: [outcomes.artefact],
  },
  {
    title: 'Challenge',
    text: 'The Challenger attacks the candidate decision and can force a re-plan or an escalation, never an approval.',
    links: [challenge.link],
    artefacts: [challenge.artefact],
  },
  {
    title: 'Sign, audit, replay',
    text: 'Every side effect needs an HMAC-signed execution contract; every step joins a hash-chained log; any decision replays from it.',
    links: [signing.link, replaying.link],
    artefacts: [signing.artefact, replaying.artefact],
  },
];
