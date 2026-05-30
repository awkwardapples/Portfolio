# Bundle Baseline — Step 4.6

_Captured: 2026-05-29 (pre-4.6 frontend additions, Step 4.5 complete)_

## Build output

| Asset                    | Raw      | Gzip       |
| ------------------------ | -------- | ---------- |
| `wizard.*.js`            | 225.6 kB | 66.4 kB    |
| `wizard.*.css`           | 15.1 kB  | 3.7 kB     |
| `inter-variable.*.woff2` | 48.3 kB  | — (binary) |

**Total shipped JS + CSS (gzip): ~70 kB**

Source map (`wizard.*.js.map`, 721 kB) is built but never shipped to the plugin's assets dir — the build pipeline explicitly excludes it.

## Key contributors (estimated from source)

| Module                         | Est. contribution | Notes                                   |
| ------------------------------ | ----------------- | --------------------------------------- |
| React + ReactDOM               | ~35 kB gzip       | Core framework, non-negotiable          |
| Zod                            | ~13 kB gzip       | Schema validation; used in domain layer |
| Inter variable font (CSS only) | ~3 kB gzip        | Self-hosted; woff2 is binary, not in JS |
| Wizard domain (FSM, pricing)   | ~7 kB gzip        | Pure business logic                     |
| Components + screens           | ~5 kB gzip        | All rendering code from Step 4.4        |
| Fencing fixture config         | ~2 kB gzip        | Only vertical currently in registry     |
| Tailwind CSS utilities         | ~3 kB gzip        | Purged to used classes only             |

_Note: precise per-module breakdown requires `pnpm analyze` (emits local `dist/stats.html`, gitignored)._

## Observations

1. **React dominates (~53% of gzip).** Acceptable for an embedded SPA; no viable swap
   without a full rewrite.
2. **Zod is the second-largest dependency (~20%).** It validates config on both startup
   (PublicConfig schema) and field answers. Worth watching as more verticals add schemas.
3. **The wizard engine and components are lean (~18%).** Domain layer, pricing, FSM,
   all rendering code — together they're comparable to Zod alone.
4. **No charting, animation, or heavy UI libraries.** ADR-0012 constraints (no gradients,
   no blur, no spinners, flat UI) incidentally keep the bundle tight.
5. **Step 4.6 additions** (`httpSubmissionPort`, wire payload logic) will add
   an estimated ~1–2 kB gzip. No new dependencies are introduced.

## Phase 5 watchlist

- `browser-image-compression` (photo uploads) — estimated 20–30 kB gzip; should be a
  dynamic import so it only loads on the `photo` field type.
- Second vertical registration: adds only the fixture config (~1–2 kB), not duplicated
  framework code.
- Analytics script (if embedded): audit carefully to avoid doubling the bundle.
