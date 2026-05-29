# Current State

_Last updated: 2026-05-29_

## Completed

- Step 4.0 — UX shell (design-system primitives: Button, Input, IconButton, Skeleton, Tooltip)
- Step 4.1 — Config schema + validation architecture (Zod schemas, cross-reference validation, fencing fixture)
- Step 4.2 — Wizard state machine (FSM, events, transition(), selectors, navigation helpers, replay, WizardStore, WizardProvider, useWizard/useWizardSelector, persistence, submission port)
- Step 4.3 — Pricing engine integration (computePrice, PricingResult/PricingBreakdown, pricing selectors, pricing gate in transition: validating → submitting blocked when pricing invalid)
- Step 4.4 — React rendering layer (composites, field registry, step renderer, phase screens, WizardShell, App.tsx wired to fencing fixture)
- **Step 4.5 — Vertical registry + config resolution (JUST COMPLETED)**

## Current Step

**Step 4.5 complete.** The wizard is multi-client capable. A second vertical is one PR away.

Next: Step 4.6 (WordPress REST submission adapter, replacing `devSubmissionPort`) or Phase 5 (site templates).

## Test Count

297 passing (Vitest, node environment)

## Key Architectural Facts

### Vertical registry (`src/domain/registry/**`)

- `VERTICALS`: closed `Readonly<Record<string, Vertical>>`, frozen at runtime
- `resolveVertical(wizardId): SessionConfig | null` — pure, total, no I/O
- `resolveFallbackVertical()` — returns the `FALLBACK_VERTICAL_ID` entry (`'fencing'`)
- `App.tsx` resolves the vertical from `config.wizardId` (set by PHP → `window.GOQW_CONFIG`)
- Adding a vertical = one PR (new fixture + registry entry)

### PublicConfig v2 contract

- `contractVersion: 2` (bumped from 1)
- `wizardId: string` added (required, min 1 char)
- PHP: `PublicConfig::CONTRACT_VERSION = 2`, `goqw_wizard_id` option seeded on activation
- Lockstep requirement: PHP plugin and JS bundle must be upgraded together

### Domain layer (`src/domain/**`)

- Pure, React-free, framework-agnostic
- `transition(state, event, config): WizardState` — total, pure, no side effects
- `computePrice(answers, wizard, pricing): PricingResult` — integer pence only, deterministic
- Pricing gate: `validating + SUBMIT_REQUESTED → answering (invalid) or submitting (valid)`
- `buildFieldKeyMap` + navigation helpers used by both transition and shell

### Runtime layer (`src/runtime/**`)

- `WizardStore`: bridges FSM to React via `useSyncExternalStore`
- `WizardProvider`: injects store into context, calls `store.hydrate()` on mount
- `useWizard()`: full state + dispatch
- `useWizardSelector<T>(selector)`: derived slice subscriber
- `sessionStorageAdapter`: persists answers across page reloads within tab
- `devSubmissionPort` in App.tsx resolves after 800ms (replace in Phase 5)

### Component layer

```
primitives  →  composites  →  steps/screens  →  WizardShell  →  App
```

ESLint boundary rules enforce this layering. Composites cannot import steps/screens. Primitives cannot import composites/steps/screens.

### Field registry (`src/components/steps/field-registry.tsx`)

Closed `Record<FieldType, FieldRenderer>`. TypeScript enforces completeness. All 9 types implemented: text, textarea, select, radio, checkbox, number, dimensions, photo, review.

**Exception**: `ReviewField` uses `useWizardSelector` internally (Option A) — the single documented deviation from the prop-driven renderer pattern.

### Phase → screen mapping

| Phase                      | Rendered                                                     |
| -------------------------- | ------------------------------------------------------------ |
| `idle` / `hydrating`       | `HydratingScreen` (skeleton)                                 |
| `answering` / `validating` | `StepRenderer` + `ProgressBar` + `PriceSummary` (when valid) |
| `submitting`               | `SubmittingScreen` (skeleton)                                |
| `submit_success`           | `SuccessScreen`                                              |
| `submit_failure`           | `FailureScreen` + retry button                               |

### Validation display

Silent-until-touched: errors hidden until field blur (marks field in local `touched` set) or Next/Submit click (`showAllErrors = true`). `StepRenderer` is keyed on `step.id` so all local state resets on step change.

## Approved Decisions

- Closed in-repo vertical registry (ADR-0013); no dynamic registration
- Reference template product scope: engine + config + WordPress site template (ADR-0014)
- PublicConfig v2 hard bump for `wizardId` addition (ADR-0009 amendment)
- `SessionConfig` (wizard + pricing, never stored in WizardState) — domain layer minimal type; registry `SessionConfig` is enriched with id/label/schemaVersion
- Explicit `validating` phase for the pricing gate
- `useSyncExternalStore` adapter pattern
- ReviewField Option A (useWizardSelector internally, documented exception)
- No RHF/Zustand/Redux — FSM is authoritative for all wizard state

## Deferred / Known Gaps

- Real `qw/v1/submit` REST endpoint (Step 4.6 / Phase 5) — currently `devSubmissionPort` in App.tsx
- Component tests (StepRenderer, field renderers) — require jsdom config, separate ADR decision
- `h-10` Tailwind utility: used in existing Button/Input primitives and carried into new components; spacing scale only defines keys 0–16 (excluding 10). No visual regression in practice but warrants a hardening pass.
- `accent-primary` on radio/checkbox inputs — depends on Tailwind generating the accent utility from the custom primary token
- PHP toolchain broken on dev machine (vendor uses `readonly class` needing PHP 8.2; dev has PHP 8.1); pre-existing issue
- analytics, autosave beyond session scope — Phase 5+

## Required Gates

- lint (`pnpm lint` → 0 errors, 0 warnings)
- typecheck (`pnpm typecheck`)
- vitest (`pnpm test` → 297/297)
- build (`pnpm build`)
