# Arbiter demo (`@jl/arbiter-demo`)

Arbiter's real analyst console, running inside the portfolio as a live demo at `/demo/arbiter` (Pass 11; ADR-0050). The console is [Arbiter](https://github.com/awkwardapples/Arbiter)'s own `web/` app, copied at one commit (`UPSTREAM.md`). Its API is answered in the browser from a snapshot captured from Arbiter's engine in sample mode, so a visitor can start an assessment and watch the agents reach a ruling without anything calling Zetaris, Nemotron or any server.

## What is here

| Path                                                                                                                   | Whose      | What                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `src/` (except `src/demo/`), `public/arbiter_logo.png`, `index.html`, tsconfigs, `components.json`, `eslint.config.js` | Arbiter's  | The console, never edited here.                                                        |
| `package.json`                                                                                                         | Arbiter's  | Upstream's, with its name and scripts replaced.                                        |
| `upstream/`                                                                                                            | Arbiter's  | Verbatim backend files the case study quotes.                                          |
| `src/demo/`                                                                                                            | The demo's | The entry, the API stand-in, the banner, and their tests.                              |
| `demo.html`, `vite.demo.config.ts`                                                                                     | The demo's | The page and the build (base `/demo/arbiter/`, into `apps/site/public/demo/arbiter/`). |
| `public/data/`                                                                                                         | The demo's | The snapshot (`scripts/arbiter/capture.py`).                                           |

The root `pnpm build` runs `build:demo` before the site build. The demo loads only after "Try the live demo" is pressed.

## Honesty rules

These are Arbiter's own rules (`docs/DEMO_SCRIPT.md` upstream):

- Say "live" only over live evidence.
- Keep the sample-mode label on screen over sample-mode runs.

The demo keeps the console's "Sample mode" chip, and adds a banner saying that assessments replay recorded runs and nothing entered leaves the page.

## Refreshing the snapshot

Refresh the snapshot whenever the console is re-synced: the console and its data must come from the same commit. It needs Python 3.12 or newer (`py -3.12 --version`; on Windows, `winget install Python.Python.3.12`).

1. Clone Arbiter fresh, outside this repository, at the commit in `UPSTREAM.md`. A fresh clone starts with no cases, audit or memory.

   ```
   git clone https://github.com/awkwardapples/Arbiter.git %TEMP%\arbiter-capture
   git -C %TEMP%\arbiter-capture checkout <sha>
   ```

2. In the clone, make a virtual environment and install only what the API needs:

   ```
   py -3.12 -m venv .venv
   .venv\Scripts\python -m pip install fastapi==0.159.1 "uvicorn[standard]==0.54.0" pydantic==2.14.1 pydantic-settings==2.16.1 httpx==0.28.1 tenacity==9.2.1 duckdb==2.0.0 PyYAML==6.0.3 python-dotenv==1.2.4
   ```

3. Start the API in sample mode (no credentials, no models):

   ```
   set SAMPLE_MODE=true
   set LLM_PROVIDER=offline
   set PORT=8765
   .venv\Scripts\python run.py serve
   ```

4. From this repository, with the API running, capture into `public/data/`. The script empties the folder first.

   ```
   %TEMP%\arbiter-capture\.venv\Scripts\python scripts\arbiter\capture.py http://127.0.0.1:8765 apps\arbiter-demo\public\data <sha>
   ```

   It records every vendor's assessment, the cases, dossiers, replays, audit, memory and the recordings Arbiter commits (live examples, the live session and the sample examples). It makes the capturing machine's paths relative, and it fails if the snapshot is over 8 MB, or any file is over 1 MB.

5. Stop the API. Then run `pnpm media:screens arbiter` for new stills, and `pnpm gates`.

## Re-syncing the console

```
pnpm arbiter:sync <path to an Arbiter checkout> <full sha>
```

This copies `web/` and the quoted backend files at that commit and rewrites `UPSTREAM.md`, leaving the demo's own files alone. Then refresh the snapshot as above. The case study's excerpts are cut from `upstream/` by anchor, so the site build fails if a quoted passage moved.

## Tests

`pnpm --filter @jl/arbiter-demo test` runs the adapter's unit tests (jsdom):

- the path mapping;
- captured run ids;
- the 409 answers and their messages;
- dossiers;
- the event stream's order, `done` and `close()`;
- the navigation message.

The site's browser tests run the demo itself (`apps/site/e2e/arbiter-demo.spec.ts`) and in its frame.
