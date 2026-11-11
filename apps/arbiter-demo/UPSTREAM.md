# Upstream

This package is Arbiter's analyst console, copied from [https://github.com/awkwardapples/Arbiter](https://github.com/awkwardapples/Arbiter) by `pnpm arbiter:sync` (`scripts/arbiter/sync-console.mjs`).

- **Commit:** [`745098876d169e7ae146fc7af9a94d4f0aa85b84`](https://github.com/awkwardapples/Arbiter/tree/745098876d169e7ae146fc7af9a94d4f0aa85b84)
- **Committed:** 2026-10-25T22:42:19Z
- **Copied from `web/`:** `src`, `public`, `index.html`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `components.json`, `eslint.config.js`.
- **Left out:**
  - `dist/`, `node_modules/` and `package-lock.json`;
  - `scripts/` (`source-hash.mjs`, `record-fixtures.mjs`);
  - upstream's tests (`src/**/__tests__/**`, `src/test/**`);
  - `vite.config.ts` and its dev-server proxy: `vite.demo.config.ts` builds the demo instead.
- **`upstream/`:** verbatim copies of the backend files the case study quotes: `app/orchestrator.py`, `app/policy/engine.py`, `policy/arbiter_policy.v1.yaml`, `app/actions/contracts.py`, `app/audit/chain.py`, `app/audit/replay.py`, `app/guard/scout_guard.py`, `app/data/queries.yaml`, `logs/examples/live/trace-run-211916c1544d.jsonl`, `docs/EVALUATION.md`, `README.md`.

## The rule

Upstream files are never edited here. The demo adds its own files beside them (`src/demo/`, `demo.html`, `vite.demo.config.ts`, `public/data/`, `README.md`). The only change to an upstream file is `package.json`: its name is `@jl/arbiter-demo` and its scripts are the demo's.

To move to a newer commit, run `pnpm arbiter:sync <checkout> <sha>`, then refresh the snapshot (`README.md`).
