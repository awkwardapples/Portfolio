# Pass 11: Arbiter, the new CV and the CV's short links

Version 1.0, 11 November 2026. An addendum to `docs/portfolio-spec.md` (v1.2) for Claude Code, working in `awkwardapples/Portfolio`. Save it as `docs/portfolio-spec-pass-11.md`. Everything in the main spec still applies (section 0's working rules, the visual system in E, the anti-slop checklist in X, the gates in V.0); this file adds one pass and the decisions behind it.

---

## 0. How to run this pass

1. Start from an up-to-date `main` (`d9d5645` or later). Work on one branch, `feat/arbiter-and-cv`, in the four parts below, committing at the end of each part with the V.0 gates green.
2. **Do not merge this pass.** When all four parts are done, push the branch, open a pull request, and stop. Josh reviews it in his browser first (section I). Merge only when he says so. This replaces the "merge at the end of each pass" rule in V.0 for this pass only.
3. Never invent facts. Every fact about Josh in this pass comes from his new CV (section B.3), his message of 11 November 2026 (quoted where used), or the Arbiter repository at the pinned commit (B.1). Anything missing stays a `TODO(josh)` in a draft, as in T.4.
4. Stop and ask Josh before:
   - any history rewrite or force-push (C.1, step 3);
   - installing Python on his machine if it is missing (E.2);
   - any new dependency outside the Arbiter demo package (E.1 covers the ones inside it).
5. Never write Josh's personal phone number anywhere. It must not appear in any file, commit, test or output.

## A. What this pass does

| Part                   | Outcome                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. CV and profile      | The new CV is the site's `/cv.pdf`: phone number removed, every URL a working link. The profile, education, experience and skills follow the CV.                                                                                                                                                                                                                                                                   |
| 2. Short links         | `joshlennon.com/intro-to-deep-learning` and `joshlennon.com/extracting-image-data` (both printed in the CV) land on the document itself, with the reader open on wider screens.                                                                                                                                                                                                                                    |
| 3. The Arbiter demo    | Arbiter's real analyst console runs inside the portfolio as a live demo, exactly like the SCB demo: a browser frame, a still until the visitor asks, then the real interface. A visitor picks a vendor, presses **Start assessment** and watches the agents work to a ruling, then opens the case. Runs replay a snapshot captured from Arbiter's own engine in sample mode, so nothing calls Zetaris or Nemotron. |
| 4. The Arbiter section | A homepage section and a case study, built like GrowTrades', with the hackathon result, the demo video, the Zetaris endorsement, how it reasons, and its evaluation.                                                                                                                                                                                                                                               |

## B. What was found before writing this

### B.1 The Arbiter repository

- **Pinned commit:** `745098876d169e7ae146fc7af9a94d4f0aa85b84` (`main`, 25 October 2026). Everything copied or quoted from Arbiter comes from this commit, and every link to it uses this SHA, not `main`.
- **Stack:** a FastAPI backend (Python 3.12+), and a React 19, TypeScript, Vite 7, Tailwind 4 analyst console in `web/` (TanStack Query, React Router 7, React Flow for the run view, radix-ui, motion, zod 4). The built console is 1.21 MB of JavaScript, 386 kB gzipped.
- **Sample mode** (`SAMPLE_MODE=true`, `LLM_PROVIDER=offline`) needs no credentials. It runs the same agents and policy on a DuckDB mirror of the Zetaris model, with the deterministic model fallback. The console labels it itself, with a "Sample mode: DuckDB mirror, deterministic fallback" chip, and paces sample-mode runs for viewing.
- **The console's API:**
  - **Reads:** `/health`, `/vendors` (32 synthetic vendors), `/questions`, `/cases`, `/cases/{id}`, `/cases/{id}/trace`, `/cases/{id}/dossier?format=md|html`, `/registry/queries`, `/usl/model`, `/agents`, `/evidence/nightshift`, `/evidence/parity`, `/eval/latest`, `/audit/recent?limit=50`, `/audit/verify`, `/memory/precedents`, `/recordings`, `/recordings/{run_id}`.
  - **Actions:** `POST /runs` (start an assessment), then an EventSource on `/runs/{run_id}/events` (named `trace` events, then `done`).
  - **Writes the demo cannot honour:** `POST /cases/{id}/review`, `POST /contracts/{id}/approve`, `POST /cases/{id}/replay`.
- **Recordings:** 17 runs recorded from the real engine.
  - 4 `live_example`: Quillfeather ESCALATE, Corvid DECLINE, Fennimore REQUEST_INFO and Oakhaven ESCALATE, on 25 October 2026 through Zetaris and Nemotron.
  - 7 `live_session`: the memory story.
  - 6 `sample_example`.
  - There are also 63 `live_eval` recordings.
- **Its own honesty rules** (`docs/DEMO_SCRIPT.md`): say "live" only over live evidence, and keep the sample-mode label on screen over sample-mode runs. The portfolio follows both.

### B.2 A prototype proved the demo works

A throwaway prototype was built to remove the risk from Part 3:

- Arbiter was run in sample mode, and the API was snapshotted for five vendors and the 17 non-eval recordings: 1.6 MB, 57 files.
- `fetch` and `EventSource` were shimmed in a separate demo entry, with a memory router.
- The console was built at base `/demo/arbiter/` and framed in a parent page.

What was verified in Chromium:

- Starting Quillfeather plays all 80 events at the console's own viewing pace, in about 35 seconds, to the real ruling: "Escalate to the TPRM lead: Quillfeather Payroll Cloud Ltd says EU, but its contract (CTR-30007) shows US."
- **Open the case** shows the claim-versus-record view (vendor's word EU, contract record US) and the drafted next action.
- Every page works from the snapshot: Cases, Memory, Sources, Provider, Audit, Evaluation, and a recorded live run with its "Recorded live run, 25 Oct 2026" chip.
- Requests to other hosts: none. Missing files: none. Console errors: none.
- The parent's address bar followed every page through `postMessage`.

Three lessons are built into this spec:

1. **Keep the captured run id.** The ruling card links to the case only when the case record's `trace_path` contains the run id. So `POST /runs` must return the captured run's own id, and events are replayed unchanged.
2. **Reset scroll on navigation**, as a browser does. The memory router does not.
3. **List only captured recordings.** Filter `/recordings` to the kinds that are captured, so no "Watch" button leads nowhere.

The prototype's code is in Appendices A to C as reference, not as final code.

### B.3 The new CV

Josh supplied `Joshua_Lennon_CV.docx` on 11 November 2026. The public version, `Josh_Lennon_CV.pdf`, was prepared outside this repository. It has two A4 pages and follows the source's layout exactly, with only these changes:

- **Removed:** the phone number. Personal metadata was also stripped: a Grammarly document id, and a "Yale University" company field left over from the template.
- **Kept:** `joshlennon71@gmail.com`, because the site already shows it by Josh's decision (current-state, launch content).
- **Turned into real links:** none of the CV's URLs were hyperlinks. The PDF now has seven links: the email (mailto), LinkedIn, GitHub, `https://joshlennon.com`, the Arbiter repository, `https://joshlennon.com/extracting-image-data` and `https://joshlennon.com/intro-to-deep-learning`.

Josh will save the PDF in the repository as `apps/site/public/cv.pdf` before this pass starts. If it is not there, stop and ask. Do not try to regenerate it.

### B.4 The CV now in the repository is a privacy problem

`apps/site/public/cv.pdf`, committed in `d9bfab8` and public on GitHub, is an older CV. It contains:

- Josh's Gmail address, which is on the site by his choice;
- **a referee's university email address and office phone number**, which must not be published without that person's agreement.

Part 1 replaces the file. Removing the old version from history needs Josh's approval (C.1, step 3).

### B.5 Questions Claude Code must not resolve

Leave the current values in place and record these as open items:

1. **Agentic risk-assessment prototype date:** the site says 2026-02; the new CV says 2025.
2. **"Introduction to Deep Learning" date:** the site says 17 September 2025; the CV says 2024.
3. **Heathrow work experience placement:** no year is given, so the profile entry stays a draft (C.2).
4. **The Zetaris commenter's name:** Josh gave the role ("VP of Global Pre-Sales") but not the name. The endorsement works without it (F.2).
5. **The news classifier:** the CV describes it, but gives no year and does not say whether it was coursework. It stays off the site.

---

## C. Part 1: The CV and the profile

### C.1 The CV file

1. Check that `apps/site/public/cv.pdf` is the new file:
   - its text starts "Josh Lennon" then "joshlennon71@gmail.com";
   - it has 2 pages and 7 link annotations, including both `joshlennon.com` short links;
   - it contains no phone number.

   Add a unit test, `scripts/check-cv.mjs` run in the gates, that fails if the public CV has a UK phone number pattern, `tel:`, or the word "Referee", or if any `joshlennon.com/...` link in it does not resolve to a short link or route on the site (D.1).

2. The CV download label keeps its computed size.
3. **History (needs Josh's approval).** Recommend removing every earlier version of `apps/site/public/cv.pdf` from history:
   - run `git filter-repo --path apps/site/public/cv.pdf --invert-paths` on a fresh mirror clone, then re-add the new file in a new commit;
   - only after Josh says yes, force-push every branch;
   - then remind him that other clones must be re-cloned, and that GitHub Support can purge cached commits.

   If Josh says no, record the decision in `current-state.md`.

### C.2 Profile changes (`apps/site/src/content/profile/profile.yaml`)

Apply exactly these changes. Everything not listed stays as it is.

```yaml
# Josh's CV profile (11 November 2026), with one change: "28th globally" is stated precisely as
# 28th in the Reasoning Architecture track (he finished 109th of 547 projects overall).
bioShort: >-
  MSc Artificial Intelligence student at the University of Surrey, with a BSc in Artificial
  Intelligence from the University of Manchester and a first-class dissertation (76%). I build
  working AI products end to end: a solo multi-agent system that placed 28th in the Reasoning
  Architecture track at the Open Agent Hackathon, and a lead-generation business with paying
  clients. Seeking a graduate role in AI engineering, machine learning or AI consulting.
availability: Open to graduate roles in AI engineering, machine learning and AI consulting.
education:
  - institution: University of Surrey
    qualification: MSc Artificial Intelligence
    start: 2026
    end: 2027
    status: in-progress
    highlights:
      - 'Modules: Machine Learning, People-Centred AI, AI and Health, Speech and Audio Processing, AR and VR.'
      - 'Predicted grade: Distinction.'
  - institution: University of Manchester
    qualification: BSc Artificial Intelligence
    start: 2021
    end: 2025
    highlights:
      - Dissertation awarded 76% (first class), an image-processing application for physicists analysing magnetic field images in materials science.
      - 'Modules: Machine Learning, Data Science, Visual Computing, Knowledge-Based AI, Database Systems, Spanish.'
      - Year-long team project in Java, coordinating bug fixes on a large codebase through Git and GitHub issues.
  - institution: Fullbrook Sixth Form, Surrey
    qualification: A Levels
    start: 2019
    end: 2021
    highlights:
      - 'Computing A*, Mathematics A*, Physics A.'
      - An Extended Project on AI and surveillance in Chinese and British media, presented at conferences.
      - 'Relevant GCSEs: English 9, Computing 8, Physics 9.'

skills: # the CV's groups; compound items split so they match `tech` values on work entries
  - group: Programming
    items: [Python, TypeScript, JavaScript, SQL, Java, C, C++, MATLAB, HTML/CSS]
  - group: AI and data
    items:
      [
        Machine learning,
        Deep learning,
        NLP,
        Computer vision,
        LLM agents,
        Agentic workflows,
        PyTorch,
        OpenCV,
        Pandas,
        NumPy,
        Matplotlib,
      ]
  - group: Software and cloud
    items:
      [
        React,
        FastAPI,
        Node.js,
        Remix,
        PostgreSQL,
        Docker,
        Git and GitHub,
        CI/CD,
        Cloudflare Workers,
        Cloudflare R2,
        Stripe Connect,
        WordPress,
      ]
  - group: AI coding tools
    items: [Claude Code, Coding agents, Plan-first and test-first development]
  - group: Professional
    items:
      [Client consulting, Presenting to senior audiences, Written communication, Agile delivery]
```

The schema may not allow `status` or `highlights` on every education entry, or education entries below degree level. Extend it minimally and keep the About page's order newest first.

Experience (keep the existing GrowTrades and BEATLEASE entries' wording, which is Josh's own and fuller than the CV's):

```yaml
# Mercor: the CV's own line (11 November 2026). High-level, no client, contract. Spec Y.3 still applies.
- title: AI Expert [Contract]
  organisation: Mercor
  employmentType: contract
  start: '2026-08'
  confidential: true
  description:
    - Evaluating and annotating AI model outputs in large-scale workflows, producing training data for model fine-tuning while keeping accuracy and throughput high alongside full-time study.

- title: Work experience placement
  organisation: Heathrow Airport
  employmentType: placement
  start: 'TODO(josh): the year of the placement'
  draft: true
  description:
    - Selected for a competitive programme with access to restricted areas, including the runways, air traffic control and security operations.
    - Worked in large groups and presented to senior corporate audiences, including the Chief Commercial Officer.
```

Also add two short lists to the profile and show them on `/about` under the skills, as plain text with no icons:

- `volunteering`:
  - DEBRA charity, one week, 2018.
  - Primary school work experience, one week, 2019.
  - Coaching an under-9s rugby team.
- `interests`:
  - Songwriting and music production: writing, producing and recording my own songs.
  - University of Surrey badminton.

### C.3 The contact form's hiring options

In `apps/site/src/wizard/intents.ts`, the hiring intent's "What kind of work?" options become the CV's: AI engineering, Machine learning, AI consulting, Agentic AI, Something else. Ids are lowercase and hyphenated. Update the wizard tests and `docs/make-com.md`'s field list. No other contact-form change.

---

## D. Part 2: Short links and document deep links

### D.1 One registry, two outputs

Create `apps/site/src/lib/short-links.ts`:

```ts
/** Short addresses printed in Josh's CV and elsewhere. Paths never change once printed. */
export const SHORT_LINKS = [
  {
    path: '/intro-to-deep-learning',
    to: '/work/introduction-to-deep-learning#read',
    printedIn: 'CV',
  },
  {
    path: '/extracting-image-data',
    to: '/work/kerr-microscopy-dissertation#read',
    printedIn: 'CV',
  },
  { path: '/arbiter', to: '/work/arbiter', printedIn: 'spare' },
  { path: '/cv', to: '/cv.pdf', printedIn: 'spare' },
] as const;
```

From it, generate:

1. **`_redirects`** in the built site, as 301s.
   - Write it in an Astro integration's `astro:build:done` hook, so it cannot drift from the registry.
   - Include each path with and without a trailing slash.
   - Cloudflare's Workers static assets honour `_redirects` before serving assets, allow fragments in the target, and allow up to 2,000 static rules.
2. **The same redirects in `astro dev`**, through Astro's `redirects` option fed from the registry, so `pnpm dev` behaves the same. Verify that the production build still answers with the edge 301, not Astro's meta-refresh page. If Astro's generated pages would shadow anything, generate the dev redirects only in development.

A test fails the build if:

- a target page does not exist in the build;
- a target's fragment id does not exist on that page;
- a short path collides with a real page.

### D.2 "#read" opens the document

1. `DocumentCard` gets an `id`. On a work page the first document's card is `id="read"`, and any others are `read-2`, `read-3` and so on, in display order. This applies whether the document is the lead (the paper) or sits in the Documents section further down (the dissertation, whose lead is its video). Give the cards `scroll-margin-top` equal to the sticky header's height.
2. In `src/scripts/documents.ts`, on load (after the page's reveal transition) and on `hashchange`, if the hash names a document card:
   - scroll it into view;
   - where "Read here" exists (768 px and wider), open the inline reader as if "Read here" were pressed, but keep focus on the card's heading (give it `tabindex="-1"`) rather than moving it into the PDF frame;
   - on phones, only scroll. The card's "Open" and "Download" buttons are right there.
3. Nothing else about the reader changes. It still loads the PDF only when it opens.

Acceptance:

- On desktop, opening `http://localhost:8787/intro-to-deep-learning` lands on the paper's card with the reader open and the PDF loading.
- `/extracting-image-data` does the same for the dissertation, in its Documents section.
- At 390 px, both land on the card with "Open" visible.
- Both answer 301 to the exact target URL, fragment included.

---

## E. Part 3: The Arbiter demo

### E.1 A new workspace package, `apps/arbiter-demo`

- Copy Arbiter's `web/` folder at the pinned commit into `apps/arbiter-demo/`:
  - keep `src/`, `public/`, `index.html`, `package.json` (renamed `@jl/arbiter-demo`), the tsconfigs, `components.json` and `eslint.config.js`;
  - leave out `dist/`, `node_modules/`, `package-lock.json`, `scripts/source-hash.mjs`, upstream tests (`src/**/__tests__/**`, `src/test/**`), and the `vite.config.ts` proxy block.
- Add `UPSTREAM.md`: the source repository, the full SHA, the date, what was left out, and the rule that upstream files are never edited here except the two named in E.3.
- Add `scripts/arbiter/sync-console.mjs`. Given a local Arbiter checkout and a SHA, it repeats the copy and updates `UPSTREAM.md`.
- Add `apps/arbiter-demo/upstream/`, holding verbatim copies, at the pinned SHA, of the backend files the case study quotes (F.5):
  - `app/orchestrator.py`, `app/policy/engine.py`, `policy/arbiter_policy.v1.yaml`, `app/actions/contracts.py`, `app/audit/chain.py`, `app/audit/replay.py`, `app/guard/scout_guard.py`, `app/data/queries.yaml`;
  - `logs/examples/live/trace-run-211916c1544d.jsonl`;
  - `docs/EVALUATION.md`.

  The sync script copies these too.

- Its dependencies stay inside this package: React 19, Vite 7, Tailwind 4, zod 4 and the rest of upstream's list. pnpm keeps them separate from the site's. Record this in ADR-0050. No other package may import from it.
- Exclude the upstream source from:
  - the root Prettier and ESLint runs;
  - `scripts/check-design.mjs` and the no-spinner check;
  - the root content and CSP checks.

  It is Arbiter's own product design, framed as evidence, exactly as the SCB site is. The new files under `src/demo/` follow the repository's rules and have their own tests.

### E.2 The snapshot (`scripts/arbiter/capture.py`, data in `apps/arbiter-demo/public/data/`)

Captured once on Josh's machine and committed. CI never needs Python. The procedure:

1. Check for Python 3.12 or newer (`py -3.12 --version`). If it is missing, stop and ask Josh to run `winget install Python.Python.3.12`.
2. Clone Arbiter fresh at the pinned SHA into a folder outside this repository (for example `%TEMP%\arbiter-capture`). It must be a fresh clone, so cases, audit and memory start empty.
3. Create a virtual environment there and install only what the API needs:

   ```
   fastapi==0.159.1 "uvicorn[standard]==0.54.0" pydantic==2.14.1 pydantic-settings==2.16.1 httpx==0.28.1 tenacity==9.2.1 duckdb==2.0.0 PyYAML==6.0.3 python-dotenv==1.2.4
   ```

   Streamlit is not needed.

4. Start the API with `SAMPLE_MODE=true`, `LLM_PROVIDER=offline` and `PORT=8765` (`python run.py serve`), wait for `/health`, run `capture.py`, then stop the API.
5. What `capture.py` writes (Appendix A is the prototype):
   - `index.json`: for each vendor, its captured `run_id`, `case_id` and `outcome`, plus the capture time and the pinned SHA.
   - Every GET in B.1, as `<path>.json`:
     - `/audit/recent?limit=50` as `audit/recent.json`;
     - dossiers as `cases/<id>/dossier.md` and `dossier.html` (if Workers' `html_handling` redirects the `.html` file, store it under a name that it leaves alone and adjust the shim);
     - `/recordings` filtered to the kinds captured (`live_example`, `live_session`, `sample_example`), plus each of those recordings.
   - `runs/<vendor_id>.json`: one assessment per vendor, all 32 in id order (`POST /runs`, then the full event stream until `done`). Then each case's `/cases/<id>`, `/trace`, both dossiers, and `POST /cases/<id>/replay` saved as `cases/<id>/replay.json`.
   - `/cases`, `/audit/*` and `/memory/precedents` last, so they show the state after every run.
   - Minified JSON throughout. Budget: 8 MB in total, no file over 1 MB.
6. Optional: for the New vendor form, capture a run for each preset in `src/features/intake/presets.json`, keyed by a normalised hash of the exact request body the console sends. Capture the body by driving the console with Playwright against the sample API, or by replicating `buildCaseInput`. If this is not straightforward, skip it. The form then answers through the shim's message (E.3).
7. Record in `apps/arbiter-demo/README.md` how to refresh the snapshot, and that it must be refreshed whenever the console is re-synced.

### E.3 The demo adapter (`apps/arbiter-demo/src/demo/`)

Only two upstream-shaped files are added; nothing upstream is edited. If an edit turns out to be unavoidable, keep it to one clearly marked line and list it in `UPSTREAM.md`.

- **`demo.html`**: upstream's `index.html` with the entry pointed at `src/demo/main.tsx`, `<meta name="robots" content="noindex">` added, and the favicon path relative to the base.
- **`src/demo/main.tsx`** (Appendix B):
  - imports `./api-shim` first, then upstream's fonts, tokens and React Flow CSS;
  - builds `createMemoryRouter(routes, { initialEntries: ['/'] })` from upstream's exported `routes`;
  - renders upstream's `Providers` around a `RouterProvider`, under the demo banner.
  - On every navigation, it scrolls to the top and, when framed, posts `{ type: 'arbiter-demo:navigate', path: '/console' + pathname }` to `window.parent`, with `targetOrigin` set to its own origin.
- **`src/demo/api-shim.ts`** (Appendix C) installs replacements for `window.fetch` and `window.EventSource` that act only on same-origin paths under the console's API prefixes. Everything else passes through.
  - **GET** paths map to the snapshot under `import.meta.env.BASE_URL + 'data/'`. A missing file answers `404` with the API's own error shape: `{"error":{"type":"not_found","message":"Not in this demo."}}`.
  - **`POST /runs`** with a known `vendor_id` answers `202` with the **captured run's own id**, plus `events_url` and `status_url`.
    - A preset body found in the snapshot does the same.
    - Anything else answers `409`: `{"error":{"type":"not_in_demo","message":"This demo replays recorded runs of Arbiter's engine, so it can't assess a new questionnaire. Pick an existing vendor, or run Arbiter locally in sample mode."}}`. The console shows API messages as written.
  - **`GET /runs` and `GET /runs/{id}`** answer from the shim's in-memory list of runs started in this page.
  - **`POST /cases/{id}/replay`** answers with the captured `replay.json`.
  - **Review submissions and contract approvals** answer `409` with: "In this demo, decisions are not saved. In Arbiter, this records the TPRM lead's decision."
  - **EventSource** on `/runs/{id}/events` loads `runs/<vendor>.json`, then:
    - fires `open` (both `onopen` and listeners);
    - dispatches each event unchanged as a `trace` `MessageEvent`, with `lastEventId` set to its index and about 20 ms apart (the console's own pacer sets the viewing pace for sample-mode runs);
    - then dispatches `done` and closes. `close()` cancels pending timers.
  - **Dossier download links** are plain anchors, so a capturing click listener points them at the snapshot's files.
- **The banner** sits fixed at the top of the demo and is 28 px tall. Its text: "Demo: assessments replay recorded runs of Arbiter's engine in sample mode. Nothing you enter leaves this page." `demo.css` offsets upstream's full-height layout so nothing is hidden (Appendix B). Keep upstream's own "Sample mode" chip visible; it is the label Arbiter's rules require.
- **`vite.demo.config.ts`**:
  - base `/demo/arbiter/`, input `demo.html`, renamed to `index.html` in the output;
  - output to `apps/site/public/demo/arbiter/` (gitignored, like the SCB demo), with `public/` (the snapshot) copied in.
  - The script is `build:demo`, and the root `pnpm build` runs it before the site build.
- **Tests** (Vitest, jsdom, in this package): path mapping for every prefix; captured run ids; the 409 cases and their messages; the dossier mapping; EventSource ordering, `done` and `close()`; the navigation message's shape and target origin.

### E.4 Hosting and headers

- `apps/site/public/_headers`:
  - add `/demo/arbiter/assets/*` with `Cache-Control: public, max-age=31536000, immutable`;
  - add `/demo/arbiter/data/*` with `Cache-Control: public, max-age=86400`.

  The existing `/demo/*` policy already fits: same-origin scripts and fetches, inline styles, `data:` and `blob:` images, framed by this site only, and `noindex`. Verify there are no CSP violations in the browser tests.

- The site's JavaScript budgets do not apply to the demo, which loads only after "Try the live demo". Add a demo budget to `check-budgets`: the first view of `/demo/arbiter` is at most 450 kB gzipped of JavaScript and CSS.

### E.5 One frame component for both demos

Generalise without changing how the SCB demo looks or behaves:

- `src/lib/demos.ts` is a typed registry with one entry per demo:
  - **`scb`**: the current values.
  - **`arbiter`**:
    - `demoUrl` is `/demo/arbiter` (`/demo/arbiter/index.html` under `astro dev`);
    - `domain` is `localhost:8000`, where Arbiter's console really runs;
    - `initialPath` is `/console/`; `siteName` is "Arbiter console";
    - `tryLabel` is "Try the live demo"; `messageType` is `arbiter-demo:navigate`;
    - `skeleton` is `arbiter`; `viewports` is `['desktop']`;
    - `phoneViewportWidth` is `844`;
    - the stills are those from E.6;
    - the caption is the text in F.3.
- `SiteFrame` gets those props:
  - `readNavigateMessage` takes the expected `messageType`;
  - the viewport toggle shows only when there is more than one viewport;
  - `ArbiterSkeleton` shows the console's shape (a 200 px rail, a header bar, a tab row and five list rows);
  - **on phones**, when `phoneViewportWidth` is set and the screen is narrower, the dialog renders the iframe at that width, scaled to fit. When the phone is held upright it shows a one-line hint: "Best with your phone turned sideways." Held sideways, the console fits (the prototype checked it at 844 by 390 px, where its rail collapses to icons).

  SCB keeps its phone outline and native-width dialog.

- `LiveSite.astro` becomes `LiveDemo.astro`, taking `demo` and an optional `number`. Update the GrowTrades MDX to `<LiveDemo demo="scb" number={1} />`. The scroll-driven tilt stays as it is.

### E.6 Stills

Extend `pnpm media:screens` to build the Arbiter demo and capture, from the demo itself:

1. `content/work/arbiter/screens/console-ruling-desktop.png`, at 1280 by 800: the run view for Quillfeather once the ruling card shows. This is the frame's still and the work's cover.
2. `console-assess-landscape.png`, at 844 by 390: the Assess page. This is the phone still, shown in a landscape phone outline.
3. `console-case-desktop.png`, at 1280 by 800: the Quillfeather case's Decision tab (claim versus record). This is a case-study figure.

---

## F. Part 4: The Arbiter section and case study

### F.1 The work entry (`content/work/arbiter/index.mdx`)

```yaml
---
title: Arbiter
subtitle: Auditable reasoning for third-party vendor onboarding
kind: software
threads: [ai, software]
summary: >-
  A multi-agent system that checks a SaaS vendor's security claims against the company's own
  records. Agents gather cited evidence, a versioned policy makes the decision, and every step can
  be replayed from a signed audit trail.
date: 2026-10-25
status: complete
featured: true
featuredOrder: 1
role: Solo builder
authorship:
  type: sole
context:
  programme: Open Agent Hackathon 2026, Reasoning Architecture track
  result: 28th in the Reasoning Architecture track; 109th of 547 projects
tech:
  [
    Python,
    FastAPI,
    React,
    TypeScript,
    NVIDIA Nemotron,
    Meterless Nightshift,
    Meterless H-MEM,
    Meterless Scout,
    Zetaris,
    DuckDB,
    Docker,
  ]
template: case-study
cta: { label: Start a conversation, href: /contact?intent=hiring }
cover: ./screens/console-ruling-desktop.png
coverAlt: >-
  Arbiter's console after assessing Quillfeather Payroll Cloud Ltd: the agents' bench, and the
  ruling card reading Escalate, with the brief "Escalate to the TPRM lead: Quillfeather Payroll
  Cloud Ltd says EU, but its contract (CTR-30007) shows US."
links:
  - { type: demo, url: '#live-demo', label: Try the live demo }
  - { type: video, url: 'https://youtu.be/qzYbxp3Pc2U', label: Watch the demo video }
  - { type: github, url: 'https://github.com/awkwardapples/Arbiter', label: Code on GitHub }
  - {
      type: other,
      url: 'https://drive.google.com/file/d/1bLk0TJypcDtn7ZVOfptUXQ9txrTQCzir/view?usp=sharing',
      label: Slides (Google Drive),
    }
media:
  - { type: youtube, id: qzYbxp3Pc2U, title: 'Arbiter: the demo video' }
endorsements:
  - quote: >-
      Agents that verify a vendor's security claims instead of taking them at face value is a
      great use case, Josh Lennon. One semantic layer over five systems is exactly how agents
      should see enterprise data. Thanks for building with Zetaris.
    role: VP of Global Pre-Sales
    organisation: Zetaris
    context: commenting on my LinkedIn post about Arbiter
    url: https://lnkd.in/p/eQA8-Kin
tags: [agentic AI, multi-agent systems, risk, policy-as-code]
---
```

- **Schema changes:**
  - `template: case-study` gains an optional `cta` (default: the current GrowTrades behaviour, so GrowTrades keeps `/contact?intent=growtrades`);
  - `links` accepts in-page anchors;
  - add `endorsements` (F.2).
- **The video title** comes from oEmbed at build time, as for every YouTube item; the frontmatter title is the fallback.
- **Credits:** sponsor technology appears in `tech` and in the credits block (F.4). Authorship stays `sole`; the statement of authorship names the sponsors' components as external tools: NVIDIA Nemotron models, Meterless Nightshift, H-MEM and Scout (Arbiter vendors part of Scout in `vendor/meterless`), and the Zetaris platform.

Body (draft from Josh's own account and his repository; he may edit it at review):

> I built Arbiter on my own in five days for the Open Agent Hackathon 2026, sponsored by NVIDIA and SpaceX, in the Reasoning Architecture track. I competed solo against thousands of participants, most of them in teams, and Arbiter placed 28th in the track and 109th of 547 projects overall.
>
> It is for the third-party risk analyst who decides whether a new SaaS vendor may touch customer data. The vendor answers a security questionnaire; Arbiter checks each answer against what the company's own systems say, from contracts and incidents to watchlists and CISA's list of known-exploited vulnerabilities, and does the first pass of the triage.
>
> Five agents do the reasoning on NVIDIA Nemotron, through Meterless Nightshift. A Planner chooses which records to read, an Evidence agent extracts each claim with a verbatim quote, an Evaluator checks the claims against the records and sends the plan back when evidence is missing, a Challenger attacks the candidate decision, and a Reporter writes the cited brief. The decision itself is made by a versioned policy engine, not a model: one of five outcomes, from approve to decline. When evidence is missing, Arbiter drafts the request back to the vendor.
>
> All five company systems sit behind one Zetaris semantic layer, so the agents query one governed model instead of five schemas. Meterless H-MEM recalls precedents a TPRM lead has approved, and Meterless Scout screens vendor text before any model sees it. Every step is written to a hash-chained audit log, every action needs a signed execution contract, and any decision can be replayed from the log.

Then, in order:

1. `<LiveDemo demo="arbiter" number={1} />`, with `id="live-demo"`;
2. `## The demo video`, the YouTube facade (Fig. 2);
3. the endorsement (F.2);
4. `## What it does`;
5. `## How it reasons`;
6. `## How well it works`;
7. `## Credits`.

These are specified in F.4 to F.6.

### F.2 Endorsements

- **Schema** (on work entries): `quote` (verbatim, required), `name` (optional), `role`, `organisation`, `context`, `url` (the public source, required), and `date` (optional).
- **Component** `Endorsement.astro`:
  - a `<figure>` holding a `<blockquote cite={url}>`, set in STIX Two Text at the lead size, with a 4 px tungsten rule on its left edge (the highlighter use of the accent; never tungsten text on paper);
  - a `<figcaption>` reading: "{name, }{role}, {organisation}, {context}."
  - a link reading "View the comment on LinkedIn", with the LinkedIn mark and a tooltip; it opens in a new tab, and its accessible name says so.
- **Do not imitate LinkedIn's interface** (spec M.2). No avatar, no reactions, no follower counts.
- **No `Review` structured data.** Self-serving review markup is against search guidelines.
- The quote appears in the homepage section and the case study, and nowhere else.

### F.3 The homepage section (`components/home/Arbiter.astro`, `#arbiter`)

Build it like `GrowTrades.astro` and place it straight after Selected work, before Research. For the roles Josh is seeking, it is the strongest evidence on the page.

```
Arbiter                                                       (h2, data-landing)
Open Agent Hackathon 2026, built solo in five days: 28th in the Reasoning
Architecture track, 109th of 547 projects.                    (plain paragraph, not a label)
{summary}
[ Browser frame: still of the ruling, "Try the live demo" ]   (LiveDemo, demo="arbiter")
caption
[ Demo video facade, 7 cols ]      [ Endorsement, 5 cols ]     (stacked under 1024 px)
[Read the case study]  [Code on GitHub]
```

The frame's caption reads: "Arbiter's analyst console, running here as a demo. Pick a vendor and press Start assessment to watch the agents reach a ruling. Assessments replay runs recorded from the real engine in sample mode, on synthetic data with no models connected; the recorded live runs used Zetaris and Nemotron on 24 and 25 October 2026."

Also:

- `featuredOrder`:
  - Arbiter 1, the dissertation 2, GrowTrades 3, "Introduction to Deep Learning" 4;
  - the agentic risk-assessment prototype is no longer featured.
- The Selected work row for Arbiter shows "Try the live demo" (linking to `#arbiter`), "Watch the demo video" and "Code on GitHub".
- The threshold's "I'm hiring" description becomes "Selected work, a live AI demo and my CV". Its target stays `selected-work`, which Arbiter now heads.
- Add `arbiter` to `HomeSection`, and give `sections` the same presence rule as GrowTrades.

### F.4 The case study page

The `case-study` template already gives the header, the attribution line, the actions row, the narrative and the CTA. Add the sections, in this order:

1. **Fig. 1, the live demo** (E.5).
2. **The demo video** (Fig. 2), a YouTube facade. It loads nothing from YouTube until played.
3. **The endorsement.**
4. **What it does.**
   - Three facts from Arbiter's README, each with its source link exactly as the README gives it:
     - third parties are involved in 48% of breaches (Verizon 2026 DBIR);
     - organisations average 2,643 third parties and assess 36% of them, and 40% have a backlog (ProcessUnity, Ponemon-Sullivan 2026, n = 1,465);
     - companies spend 37.4 hours a week assessing vendors (Whistic 2025, n = 525).
   - The five outcomes, as a plain list: Approve, Approve with conditions, Request information, Escalate, Decline.
   - Fig. 3, the case still: claim versus record.
5. **How it reasons.**
   - First, the agents table from the README (name, what it can do, what it cannot), as a real table.
   - Then an "Under the hood" sequence: generalise `UnderTheHood.astro` so its steps come from data, and give Arbiter its own step list (F.5).
6. **How well it works** (F.6).
7. **Credits:**
   - NVIDIA Nemotron 3.5 Super VL 120B and Nemotron 3.5 Lightning 30B, through Meterless Nightshift;
   - Meterless H-MEM and Scout;
   - the Zetaris Unified Semantic Layer;
   - the CISA Known Exploited Vulnerabilities catalogue, as a committed snapshot.

   Then the deviation, stated plainly as Arbiter's README states it: the deep lane was designed for Nemotron 3 Super, which the account was not entitled to; a Nightshift routing rule coerced both lanes to `auto`; and Meterless acknowledged the bug on 24 October.

8. **The CTA**, from `cta`.

Structured data: the work's `CreativeWork` gets `award`: "28th, Reasoning Architecture track, Open Agent Hackathon 2026", plus `codeRepository` (use `SoftwareSourceCode` if the builder supports it, otherwise `CreativeWork` with `url` links).

### F.5 Under the hood, for Arbiter

Seven steps. Each step pairs one sentence with one real artefact, cut by `src/lib/excerpt.ts` from the verbatim copies in `apps/arbiter-demo/upstream/`. The build fails if an excerpt's anchor moves. Each step links to the file on GitHub at the pinned SHA, with line anchors.

| Step                   | Sentence                                                                                                                      | Artefact                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Guard                  | Vendor text passes Meterless Scout before any model reads it; blocked content escalates.                                      | `app/guard/scout_guard.py`, the screening function                                 |
| Plan over one model    | The Planner reads the Zetaris semantic layer as a 304-token catalogue and chooses registry queries; it never writes SQL.      | `app/data/queries.yaml`, `Q_COMPONENT_KEV`                                         |
| Gather with quotes     | The Evidence agent runs the queries and extracts each claim with a verbatim quote.                                            | Trace line: the federated KEV query from live example 2, as quoted in the README   |
| Evaluate and send back | The Evaluator checks claims against the records and sends the plan back for missing evidence, at most twice.                  | Trace line: `EvaluatorAgent` `needs_revision`, from the README                     |
| Decide by policy       | A versioned policy maps the facts to one of five outcomes; a model's worse extraction can lower an outcome, never raise it.   | `policy/arbiter_policy.v1.yaml`, the outcomes block                                |
| Challenge              | The Challenger attacks the candidate decision and can force a re-plan or an escalation, never an approval.                    | `app/orchestrator.py`, the challenge loop bound                                    |
| Sign, audit, replay    | Every side effect needs an HMAC-signed execution contract; every step joins a hash-chained log; any decision replays from it. | `app/actions/contracts.py` `sign` and `verify`, and `app/audit/replay.py` `replay` |

### F.6 How well it works

State only what Arbiter's own published evaluation says (`docs/EVALUATION.md` and the README at the pinned SHA). Copy the figures from the vendored `upstream/docs/EVALUATION.md`, and have a test check that each figure on the page appears in that file. Every figure keeps its caveat:

- **Live, 25 October 2026:** 10 of 10 correct on the first 10 test cases (Wilson 95% interval 0.72 to 1.00), 0 unsafe approvals, 4 of 4 consistent.
- **Offline:** 16 of 16.
- **Plainly stated:**
  - the data is synthetic, and n is small;
  - 10 of 21 model calls fell back to deterministic logic because of the routing issue, and the policy still decided every case;
  - the single-prompt baseline could not be measured, because every baseline call returned 502;
  - so no "beats the baseline" claim is made.
- **The hero run, live example 2:** 14 Zetaris queries with request ids, 4 Nemotron calls with receipts, ESCALATE in 228 s.
- **Zetaris parity:** 416 of 416 registry comparisons.

Present these as a short table and two sentences, not as big-number tiles.

### F.7 Posts

- Give the existing post `2026-10-07-open-agent-hackathon-2026` the line `project: arbiter`.
- Add `2026-11-11-arbiter-result/index.mdx`:
  - title "Arbiter placed 28th in Reasoning Architecture", threads `[ai, software]`, `project: arbiter`;
  - summary: "My solo entry to the Open Agent Hackathon 2026 finished 28th in the Reasoning Architecture track and 109th of 547 projects. You can run its console here.";
  - body: two sentences linking the case study and the demo, plus the video URL alone on a line, so it becomes a facade.

Josh may edit both at review.

---

## G. Tests and acceptance

All V.0 gates stay green. Add these browser tests (Playwright, under the enforced CSP, at 1280 px and 390 px unless noted):

1. **Homepage.**
   - `#arbiter` follows Selected work.
   - The frame shows its still and loads nothing under `/demo/arbiter/` before "Try the live demo" is pressed.
   - The video facade loads nothing from YouTube before Play.
   - The endorsement's link has the right URL and opens in a new tab.
2. **Demo, desktop.**
   - Press "Try the live demo".
   - In the frame, press "Start assessment of Quillfeather Payroll Cloud Ltd".
   - Within 90 seconds the ruling card shows "Escalate" and its brief headline. The address bar reads `localhost:8000/console/runs/<captured id>`.
   - "Open the case" shows "EU" and "US" in the claim-versus-record view.
   - Throughout: no request leaves the site's origin, no request answers 404, and there is no console error.
3. **Demo pages.**
   - Each rail page renders.
   - "Watch" on a recorded live run plays, with its recorded-live chip.
   - A review submission shows the not-saved message.
   - A new questionnaire shows the not-in-demo message, unless it matches a captured preset.
4. **Demo, phone.**
   - At 390 by 844 px, the button opens the dialog with the console at 844 px, scaled, and shows the sideways hint.
   - At 844 by 390 px, the console fits.
   - Escape and the close button return focus to the trigger.
5. **SCB demo unchanged.** The existing GrowTrades tests still pass. Its address bar and viewport toggle still work.
6. **Short links** (`wrangler dev`):
   - 301 with the exact `Location`, with and without a trailing slash;
   - the landing behaviour in D.2 at both widths.
7. **CV.** `/cv.pdf` is the new file, and the `check-cv` script passes.
8. **About.**
   - The new education entries, in the right order.
   - Skills in the CV's groups.
   - Volunteering and interests.
   - Mercor shows the new line and no link.
   - Heathrow is absent from production while it is a draft.
9. **axe:** no serious findings on `/`, `/work/arbiter`, `/about`, `/cv` targets and the demo facade.
10. **Lighthouse** on `/` and `/work/arbiter`: the main spec's budgets. The demo frame's still is the only image above the fold in `#arbiter`.

## H. Documentation

- **ADR-0050**, the Arbiter demo: the vendored console, the snapshot, the shims, the honesty rules, and why not a live backend.
- **ADR-0051**, short links and document deep links.
- Update:
  - `current-state.md`: this pass, the B.5 questions and the history decision;
  - `handoff.md`: refreshing the Arbiter snapshot and console;
  - `authoring-guide.md`: endorsements, and adding a short link;
  - `media-pipeline.md`: the Arbiter stills;
  - `technical-debt.md`: the vendored copy drifts until re-synced, and the demo package runs React 19 beside the site's React;
  - `README.md`: the new package.

## I. What Josh reviews before merging

When the branch is pushed, give Josh:

- the branch name;
- the pull request link;
- the open questions (B.5);
- the history decision (C.1);
- this checklist.

He tests with the production preview:

```
git fetch
git checkout feat/arbiter-and-cv
pnpm install
pnpm build
pnpm --filter @jl/edge dev     # then open http://localhost:8787
```

Then wait for "merge" or a list of changes.

---

## Appendix A: capture.py (prototype, verified 11 November 2026)

```python
"""Snapshot the Arbiter API (sample mode) into static files for the demo."""
import json, sys, time, pathlib, httpx

BASE = sys.argv[1]; OUT = pathlib.Path(sys.argv[2])
VENDORS = sys.argv[3].split(',') if len(sys.argv) > 3 else None
c = httpx.Client(base_url=BASE, timeout=120)

def save(rel, data, raw=False):
    p = OUT / rel; p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(data if raw else json.dumps(data, separators=(',', ':')), encoding='utf-8')

def get(path, rel=None):
    r = c.get(path); r.raise_for_status(); save(rel or path.strip('/') + '.json', r.json()); return r.json()

vendors = get('/vendors')
for p in ['/health', '/questions', '/registry/queries', '/usl/model', '/agents',
          '/evidence/nightshift', '/evidence/parity', '/eval/latest']:
    get(p)

runs = {}
for v in vendors:
    vid = v['vendor_id']
    if VENDORS and vid not in VENDORS: continue
    started = c.post('/runs', json={'vendor_id': vid}).json()
    events, done, kind = [], None, None
    with c.stream('GET', started['events_url']) as s:
        for line in s.iter_lines():
            if line.startswith('event: '): kind = line[7:]
            elif line.startswith('data: '):
                d = json.loads(line[6:])
                if kind == 'trace': events.append(d)
                elif kind == 'done': done = d; break
                elif kind == 'error': raise SystemExit(f'{vid}: {d}')
    runs[vid] = {'run_id': done['run_id'], 'case_id': done['case_id'], 'outcome': done['outcome']}
    save(f'runs/{vid}.json', {'events': events, 'done': done})
    cid = done['case_id']
    get(f'/cases/{cid}'); get(f'/cases/{cid}/trace')
    for fmt in ['md', 'html']:
        r = c.get(f'/cases/{cid}/dossier', params={'format': fmt}); r.raise_for_status()
        save(f'cases/{cid}/dossier.{fmt}', r.text, raw=True)
    # Pass 11 adds: POST /cases/{cid}/replay -> cases/{cid}/replay.json

get('/cases'); get('/audit/recent?limit=50', 'audit/recent.json'); get('/audit/verify'); get('/memory/precedents')
KINDS = {'live_example', 'live_session', 'sample_example'}
recs = [m for m in c.get('/recordings').json() if m['kind'] in KINDS]
save('recordings.json', recs)
for m in recs:
    get(f"/recordings/{m['run_id']}")
save('index.json', {'runs': runs, 'sha': '745098876d169e7ae146fc7af9a94d4f0aa85b84',
                    'captured_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})
```

## Appendix B: the demo entry and banner (prototype)

```tsx
// src/demo/main.tsx
import './api-shim';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import '../design/fonts';
import '../design/tokens.css';
import '@xyflow/react/dist/base.css';
import './demo.css';
import { Providers } from '../app/providers';
import { routes } from '../app/router';

const router = createMemoryRouter(routes, { initialEntries: ['/'] });
const report = (pathname: string) => {
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: 'arbiter-demo:navigate', path: `/console${pathname}` },
      window.location.origin,
    );
  }
};
router.subscribe((state) => {
  window.scrollTo(0, 0);
  report(state.location.pathname);
});
report('/');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <p className="demo-banner">
      Demo: assessments replay recorded runs of Arbiter's engine in sample mode. Nothing you enter
      leaves this page.
    </p>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
```

```css
/* src/demo/demo.css */
:root {
  --demo-banner: 28px;
}
.demo-banner {
  position: fixed;
  inset: 0 0 auto 0;
  height: var(--demo-banner);
  z-index: 60;
  margin: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font:
    500 12px/1 'Public Sans',
    system-ui,
    sans-serif;
  background: #1d1d1b;
  color: #f5f4ef;
}
body {
  padding-top: var(--demo-banner);
}
.h-screen {
  height: calc(100vh - var(--demo-banner)) !important;
}
nav.sticky {
  top: var(--demo-banner) !important;
}
```

## Appendix C: the API shim (prototype)

```ts
// src/demo/api-shim.ts — answers the console's API from the snapshot; nothing leaves the page.
const DATA = `${import.meta.env.BASE_URL}data/`;
const PREFIXES = [
  '/runs',
  '/cases',
  '/contracts',
  '/health',
  '/vendors',
  '/questions',
  '/memory',
  '/audit',
  '/eval',
  '/registry',
  '/usl',
  '/evidence',
  '/recordings',
  '/agents',
];
const realFetch = window.fetch.bind(window);
const runs = new Map<string, { runId: string; vendorId: string; startedAt: string }>();
let index: Promise<{
  runs: Record<string, { run_id: string; case_id: string; outcome: string }>;
}> | null = null;
const loadIndex = () => (index ??= realFetch(`${DATA}index.json`).then((r) => r.json()));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const notInDemo = (message: string) => json({ error: { type: 'not_in_demo', message } }, 409);

function apiPath(input: RequestInfo | URL): string | null {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    location.href,
  );
  if (url.origin !== location.origin) return null;
  return PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))
    ? url.pathname + url.search
    : null;
}

async function staticGet(path: string): Promise<Response> {
  const [pathname, query] = path.split('?');
  const dossier = pathname.match(/^\/cases\/([^/]+)\/dossier$/);
  if (dossier)
    return realFetch(
      `${DATA}cases/${dossier[1]}/dossier.${new URLSearchParams(query).get('format') ?? 'md'}`,
    );
  if (pathname === '/runs')
    return json([...runs.values()].map((r) => ({ run_id: r.runId, state: 'done' })));
  const status = pathname.match(/^\/runs\/([^/]+)$/);
  if (status)
    return json({
      run_id: status[1],
      state: 'done',
      n_events: 0,
      started_at: runs.get(status[1])?.startedAt ?? '',
    });
  const response = await realFetch(`${DATA}${pathname.replace(/^\//, '')}.json`);
  return response.ok
    ? response
    : json({ error: { type: 'not_found', message: 'Not in this demo.' } }, 404);
}

async function startRun(body: unknown): Promise<Response> {
  const vendorId = (body as { vendor_id?: string } | null)?.vendor_id;
  const { runs: captured } = await loadIndex();
  if (!vendorId || !captured[vendorId]) {
    return notInDemo(
      "This demo replays recorded runs of Arbiter's engine, so it can't assess a new questionnaire. Pick an existing vendor, or run Arbiter locally in sample mode.",
    );
  }
  const runId = captured[vendorId].run_id; // the captured id: the case record recognises its own run
  runs.set(runId, { runId, vendorId, startedAt: new Date().toISOString() });
  return json(
    { run_id: runId, events_url: `/runs/${runId}/events`, status_url: `/runs/${runId}` },
    202,
  );
}

window.fetch = async (input, init) => {
  const path = apiPath(input);
  if (!path) return realFetch(input, init);
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (method === 'GET') return staticGet(path);
  if (method === 'POST' && path.split('?')[0] === '/runs')
    return startRun(init?.body ? JSON.parse(String(init.body)) : null);
  // Pass 11 adds: POST /cases/{id}/replay -> the captured cases/{id}/replay.json, and preset matching (E.2 step 6).
  return notInDemo(
    "In this demo, decisions are not saved. In Arbiter, this records the TPRM lead's decision.",
  );
};

const RealEventSource = window.EventSource;
class DemoEventSource extends EventTarget {
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;
  readyState = 0;
  onopen: ((e: Event) => void) | null = null;
  onerror = null;
  onmessage = null;
  readonly withCredentials = false;
  private timers: number[] = [];
  constructor(readonly url: string) {
    super();
    void this.play(decodeURIComponent(url.match(/\/runs\/([^/]+)\/events/)?.[1] ?? ''));
  }
  private async play(runId: string) {
    const run = runs.get(runId);
    if (!run) {
      this.readyState = 2;
      this.dispatchEvent(
        new MessageEvent('error', { data: JSON.stringify({ message: 'Unknown run.' }) }),
      );
      return;
    }
    const capture = await realFetch(`${DATA}runs/${run.vendorId}.json`).then((r) => r.json());
    if (this.readyState === 2) return;
    this.readyState = 1;
    const open = new Event('open');
    this.onopen?.(open);
    this.dispatchEvent(open);
    capture.events.forEach((event: unknown, i: number) =>
      this.timers.push(
        window.setTimeout(
          () =>
            this.dispatchEvent(
              new MessageEvent('trace', { data: JSON.stringify(event), lastEventId: String(i) }),
            ),
          20 * i,
        ),
      ),
    );
    this.timers.push(
      window.setTimeout(
        () => {
          this.dispatchEvent(new MessageEvent('done', { data: JSON.stringify(capture.done) }));
          this.close();
        },
        20 * capture.events.length + 20,
      ),
    );
  }
  close() {
    this.readyState = 2;
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
window.EventSource = function (url: string | URL, init?: EventSourceInit) {
  const href = String(url);
  return apiPath(href) ? new DemoEventSource(href) : new RealEventSource(href, init);
} as unknown as typeof EventSource;
Object.assign(window.EventSource, { CONNECTING: 0, OPEN: 1, CLOSED: 2 });

document.addEventListener(
  'click',
  (e) => {
    const a = (e.target as Element | null)?.closest?.(
      'a[href*="/dossier?format="]',
    ) as HTMLAnchorElement | null;
    if (!a) return;
    const url = new URL(a.href);
    const m = url.pathname.match(/\/cases\/([^/]+)\/dossier$/);
    const format = url.searchParams.get('format');
    if (m && format) a.href = `${DATA}cases/${m[1]}/dossier.${format}`;
  },
  true,
);
```
