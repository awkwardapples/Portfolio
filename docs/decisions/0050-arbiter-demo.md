# ADR-0050: The Arbiter demo, replaying its own engine

**Status:** Accepted
**Date:** 2026-11-11 (Portfolio Pass 11)

## Context

Arbiter, Josh's solo entry to the Open Agent Hackathon 2026, is the strongest evidence on the site for the roles he is seeking. Its analyst console shows the agents reasoning towards a ruling, which is more convincing than any screenshot. The SCB demo (ADR-0044) already shows a real product inside the portfolio, in a browser frame.

Arbiter's console needs its API. That API runs agents on Nemotron through Meterless Nightshift, over a Zetaris semantic layer. Running it for every visitor would need credentials, cost money per run, and leave the site's demo dependent on three outside services. Arbiter also has its own honesty rules (its `docs/DEMO_SCRIPT.md`):

- say "live" only over live evidence;
- keep the sample-mode label on screen over sample-mode runs.

## Decision

**The console is vendored, and its API is answered in the browser from a snapshot of Arbiter's own engine.**

- **The console:** `apps/arbiter-demo` is Arbiter's `web/` app at one commit (`745098876d169e7ae146fc7af9a94d4f0aa85b84`, 25 October 2026), copied by `pnpm arbiter:sync` (`scripts/arbiter/sync-console.mjs`).
  - Upstream files are never edited. The only changed upstream file is `package.json`, for its name and scripts.
  - `UPSTREAM.md` records the commit, the date, what was copied and what was left out.
  - Its React 19, Vite 7, Tailwind 4 and zod 4 stay inside the package; no other package imports from it.
  - It is left out of the root Prettier run and the design checks. It is Arbiter's own product design, framed as evidence, as the SCB site is.
- **The snapshot:** `apps/arbiter-demo/public/data` was captured once by `scripts/arbiter/capture.py`, from a fresh clone running in sample mode (DuckDB mirror, offline models), and committed. CI never needs Python. It holds:
  - every vendor's assessment, as the events of its run;
  - the cases, traces, dossiers and replays;
  - the audit chain and memory, as they stand after every run;
  - the recordings Arbiter commits: its live examples, live session and sample examples.

  It is 4.4 MB in 224 files. The capturing machine's paths are made relative.

- **The adapter** (`src/demo/`), the demo's own code with its own tests:
  - **A memory router.** It resets the scroll on navigation and reports each page to the framing page as `/console/...`, to this origin only.
  - **A banner:** "Demo: assessments replay recorded runs of Arbiter's engine in sample mode. Nothing you enter leaves this page." The console's own "Sample mode" chip stays visible.
  - **Stand-ins for `fetch` and `EventSource`** on the console's API paths. Everything else passes through.
    - Reads come from the snapshot.
    - Starting a run for a captured vendor answers with the captured run's own id, because the case record names its run and the ruling card links to the case only when they match. Its events are then replayed unchanged, and the console's own pacer sets the viewing pace.
    - A new questionnaire, a review decision and a contract approval answer 409, with a plain reason.
  - **Zod in jitless mode.** Zod probes `new Function` once, which the demo's CSP (no `'unsafe-eval'`) reports as a violation.
- **Hosting:**
  - The root build runs `build:demo` into `apps/site/public/demo/arbiter/`, which is gitignored like the SCB demo.
  - It is served under the existing `/demo/*` policy (framed by this site only, `noindex`).
  - Its assets are cached for a year and its data for a day.
  - Its first view has its own 450 kB budget, at 389 kB gzipped. The site's budgets leave it out, since it loads only after "Try the live demo".
- **One frame for both demos.** `src/lib/demos.ts` holds each demo's addresses, labels, stills and caption, and `SiteFrame` renders either:
  - each demo has its own message type, so neither frame can be steered by the other demo;
  - Arbiter has one viewport, its own skeleton, and a landscape phone still;
  - on phones its dialog runs the console at 844 px, scaled to fit, with a hint to turn the phone sideways while it is upright.

## Alternatives considered

- **A live backend.** Rejected: credentials, a cost per visitor, three outside services, and a demo that breaks when any of them does.
- **Running the engine in the browser.** Rejected: the engine is Python, with DuckDB and its own policy engine. Porting it would mean demonstrating a rewrite, not Arbiter.
- **A recorded video only.** Rejected: the demo video is on the page as well, but a visitor choosing a vendor and opening the case shows more than watching.
- **Editing the console to call a static API.** Rejected: any edit makes the vendored copy something other than Arbiter's console, and every re-sync would have to repeat it.

## Consequences

- The demo's code and data must come from the same commit. After `pnpm arbiter:sync`, refresh the snapshot (`apps/arbiter-demo/README.md`).
- The vendored copy drifts from Arbiter until it is re-synced (technical debt).
- Browser tests check the following, with no foreign request, failed request, console error or CSP violation:
  - Quillfeather's run reaches its ruling and its case;
  - every page of the rail renders;
  - a recorded live run plays;
  - dossiers download;
  - the not-saved and not-in-demo answers appear;
  - the framed flow, with the address bar following;
  - the phone dialog, upright and sideways.
- The case study quotes Arbiter's backend from verbatim copies in `apps/arbiter-demo/upstream/`, cut by anchor, so a moved passage fails the build. Its evaluation figures are checked against Arbiter's `EVALUATION.md` and README.
