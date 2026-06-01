# Current State

_Last updated: 2026-06-01_

## Completed

- Step 4.0 — UX shell (design-system primitives: Button, Input, IconButton, Skeleton, Tooltip)
- Step 4.1 — Config schema + validation architecture (Zod schemas, cross-reference validation, fencing fixture)
- Step 4.2 — Wizard state machine (FSM, events, transition(), selectors, navigation helpers, replay, WizardStore, WizardProvider, useWizard/useWizardSelector, persistence, submission port)
- Step 4.3 — Pricing engine integration (computePrice, PricingResult/PricingBreakdown, pricing selectors, pricing gate in transition: validating → submitting blocked when pricing invalid)
- Step 4.4 — React rendering layer (composites, field registry, step renderer, phase screens, WizardShell, App.tsx wired to fencing fixture)
- Step 4.5 — Vertical registry + config resolution (closed registry, resolveVertical, PublicConfig v2, wizardId)
- Step 4.6 — WordPress REST submission adapter — Phase 4 CLOSED
- **Step 4.7 — Service abstraction layer (JUST COMPLETED)**

## Current Step

**Phase 4 fully complete.** Two reference verticals (fencing, decking). Per-session service
selection: the user picks a service on load; the wizard mounts the matching config. When only
one service is enabled the selector is bypassed automatically.

Next: **Phase 5** — site templates, QuotePage (ServiceSelector moves here), WordPress shortcode
wiring, analytics, autosave.

## Test Count

**337 Vitest tests passing** (19 test files). PHP Pest: 20 tests discovered
(2 Example + 7 PublicConfig + 3 Settings + 8 SubmissionController), all passing.

## Key Architectural Facts

### Submission pipeline (Step 4.6 — ADR-0015)

Strict ordering: validate → persist → forward → respond.

| HTTP Status | Meaning                                               |
| ----------- | ----------------------------------------------------- |
| 200         | Persisted and forwarded; `{ reference: 'GOQW-<id>' }` |
| 400         | Payload invalid; nothing stored                       |
| 500         | DB failure; nothing forwarded                         |
| 502         | Persisted but forward failed; data is safe            |

- `httpSubmissionPort`: production port; uses `restUrl` + `restNonce` from PublicConfig.
- `devSubmissionPort`: fallback when `config.restUrl === ''` (standalone Vite dev).
- `WizardStore.buildRequest()`: builds `SubmissionRequest` including pricing snapshot
  and `clientTimestamp: new Date().toISOString()`.

### SubmissionPort interface (redesigned in 4.6)

```typescript
submit(request: SubmissionRequest): Promise<SubmissionPortResult>
// Never throws; SubmissionPortResult = { ok: true, reference } | { ok: false, error }
```

### SubmissionErrorCode (expanded in 4.6)

`'network_unreachable' | 'request_timeout' | 'forwarder_unavailable' | 'bad_response' | 'validation_failed' | 'unauthorized' | 'server_error'`

### Vertical registry (`src/domain/registry/**`)

- `VERTICALS`: closed `Readonly<Record<string, Vertical>>`, frozen at runtime
- `resolveVertical(wizardId): SessionConfig | null` — pure, total, no I/O
- `resolveFallbackVertical()` — returns the `FALLBACK_VERTICAL_ID` entry (`'fencing'`)
- `App.tsx` resolves the vertical from `config.wizardId` (set by PHP → `window.GOQW_CONFIG`)
- Adding a vertical = one PR (new fixture + registry entry)

### PublicConfig v2 contract

- `contractVersion: 2` (bumped from 1 in Step 4.5)
- `wizardId: string` (selects the vertical)
- `restUrl`, `restNonce` (used by `httpSubmissionPort`)
- PHP: `PublicConfig::CONTRACT_VERSION = 2`, `goqw_wizard_id` option seeded on activation
- Lockstep requirement: PHP plugin and JS bundle must be upgraded together

### Domain layer (`src/domain/**`)

- Pure, React-free, framework-agnostic
- `transition(state, event, config): WizardState` — total, pure, no side effects
- `computePrice(answers, wizard, pricing): PricingResult` — integer pence only, deterministic
- Pricing gate: `validating + SUBMIT_REQUESTED → answering (invalid) or submitting (valid)`

### Runtime layer (`src/runtime/**`)

- `WizardStore`: bridges FSM to React via `useSyncExternalStore`
- `httpSubmissionPort`: production submission adapter (Step 4.6)
- `sessionStorageAdapter`: persists answers across page reloads within tab
- `devSubmissionPort` in App.tsx: fallback when `restUrl` is empty

### PHP layer (`plugins/quote-wizard/`)

- `SubmissionController`: validate → persist → forward → respond (ADR-0015)
- `SubmissionRepository`: `INSERT` + `mark_forwarded` / `mark_forward_failed`
- `Forwarder`: synchronous `wp_remote_post` to Make.com webhook (10 s timeout)
- `Schema`: redesigned for 4.6 wire contract (`wizard_id`, `answers_json`, etc.)
- PHP toolchain: pest 2.33.2 / phpunit 10.5.9 (PHP 8.1 compatibility)

### Service selection layer (Step 4.7 — ADR-0013 amendment)

- Two reference verticals: `fencing` (£325/m base) and `decking` (£250/m base).
- `listEnabledServiceIds(override?)`: returns all registry services or filters by `PublicConfig.enabledServiceIds`.
- `resolveService(id)`: alias of `resolveVertical` for selection-layer code.
- `App.tsx`: shows `ServiceSelector` when multiple services enabled; auto-selects and bypasses selector when exactly one service is enabled; falls back to `resolveFallbackVertical()` when all configured ids are unknown.
- `ServiceSelector` + `ServiceCard`: minimal accessible selection UI; mounts at App.tsx root in Phase 4; migrates to QuotePage in Phase 5.
- `goqw_enabled_services` WP option: CSV of enabled service ids; empty = all services offered.

## Approved Decisions

- ADR-0015: Submission pipeline architecture (strict ordering, wire contract)
- ADR-0015 amendment: wizardId/service equivalence (Step 4.7)
- ADR-0013: Closed in-repo vertical registry
- ADR-0013 amendment: per-session service selection, service/vertical synonymy (Step 4.7)
- ADR-0014: Reference template product scope
- ADR-0009 amendment: PublicConfig v2 hard bump for `wizardId`
- ADR-0009 amendment: `enabledServiceIds` optional additive field (Step 4.7)
- ADR-0005 amendment: 502 wire contract with `forwarder_unavailable` error code
- ADR-0001 amendment: persist-before-forward formalised with status lifecycle

## Deferred / Known Gaps

- Component tests (StepRenderer, ServiceSelector, ServiceCard) — require jsdom Vitest config
- Idempotency key for SUBMIT_RETRY duplicates (see ADR-0015 future work)
- Rate limiting on `qw/v1/submit` (see ADR-0015 future work)
- `h-10` Tailwind utility: used in primitives; spacing scale only defines keys 0–16
- Analytics, autosave beyond session scope — Phase 5+
- Site templates, WordPress shortcode wiring, QuotePage (ServiceSelector migrates here) — Phase 5
- Media uploads — Phase 4.8

## Required Gates

- lint (`pnpm lint` → 0 errors, 0 warnings)
- typecheck (`pnpm typecheck`)
- vitest (`pnpm test` → 337/337)
- build (`pnpm build`)
- PHP: `composer lint` → 0/0, `composer analyse` → no errors, `composer test` → exit 0
