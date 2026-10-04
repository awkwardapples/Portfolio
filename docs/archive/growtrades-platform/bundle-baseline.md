# Bundle Baseline

_Single rolling file. Updated at the end of each step that changes the JS bundle._

---

## Current baseline — Step 4.8 (2026-06-04)

| Asset                    | Raw       | Gzip       |
| ------------------------ | --------- | ---------- |
| `wizard.*.js`            | 246.81 kB | 72.75 kB   |
| `wizard.*.css`           | 17.31 kB  | 4.03 kB    |
| `inter-variable.*.woff2` | 48.26 kB  | — (binary) |

**Total shipped JS + CSS (gzip): ~76.8 kB**

Delta from Step 5.1: JS +5.61 kB raw / +2.14 kB gzip. Added: photo compression
utility (~80 lines, no new dependencies), PhotoStore, PhotoField, multi-photo UI.
No third-party image library — all canvas API.

---

## History

| Step | JS raw    | JS gzip  | Delta gzip | Notes                               |
| ---- | --------- | -------- | ---------- | ----------------------------------- |
| 4.6  | 225.6 kB  | 66.4 kB  | baseline   | React, Zod, submission adapter      |
| 5.1  | 241.20 kB | 70.61 kB | +4.21 kB   | Site shell, 5 pages, WP routing     |
| 4.8  | 246.81 kB | 72.75 kB | +2.14 kB   | Photo upload pipeline (no new deps) |

**Budget: 180 kB gzip.** Current usage: 72.75 kB (40% of budget).

---

## Key contributors (Step 4.8 build)

| Module                         | Est. contribution | Notes                                |
| ------------------------------ | ----------------- | ------------------------------------ |
| React + ReactDOM               | ~35 kB gzip       | Core framework                       |
| Zod                            | ~13 kB gzip       | Schema validation                    |
| Wizard domain (FSM, pricing)   | ~7 kB gzip        | Pure business logic                  |
| Site shell + 5 pages           | ~8 kB gzip        | Added in 5.0                         |
| Components + screens           | ~5 kB gzip        | All rendering code                   |
| Photo upload (canvas only)     | ~2 kB gzip        | No library; native canvas + File API |
| Tailwind CSS utilities         | ~4 kB gzip        | Purged to used classes               |
| Fencing + decking fixtures     | ~3 kB gzip        | Both verticals registered            |
| Inter variable font (CSS only) | ~4 kB gzip        | Self-hosted woff2                    |

_Precise per-module breakdown: `pnpm --filter @growth-ops/wizard exec vite-bundle-visualizer`
(output in `dist/stats.html`, gitignored)._
