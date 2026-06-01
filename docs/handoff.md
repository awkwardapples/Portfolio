# Development Handoff

_Last updated: 2026-06-01_

## Project

WordPress-based local lead generation wizard platform. A configurable multi-step quote wizard embeds into WordPress pages via a shortcode and collects answers, computes a price estimate, and submits to a WordPress REST endpoint which forwards to Make.com.

## Completed Phases

- Phase 1 — complete
- Phase 2 — complete
- Phase 3 — complete
- Step 4.0 — UX shell (design-system primitives)
- Step 4.1 — Config schema + validation architecture
- Step 4.2 — Wizard state machine (FSM + React adapter)
- Step 4.3 — Pricing engine integration
- Step 4.4 — React rendering layer
- Step 4.5 — Vertical registry + config resolution
- Step 4.6 — WordPress REST submission adapter — Phase 4 CLOSED
- **Step 4.7 — Service abstraction layer (JUST COMPLETED)**

## Where Things Stand

**Phase 4 fully complete.** Run `pnpm dev` from `apps/wizard`, open `localhost:5173`. The
service selector appears (two services: Fencing, Decking); clicking either mounts the full
wizard end-to-end. In a WordPress environment, submission persists to `wp_goqw_submissions`
and forwards to Make.com.

**337 Vitest tests passing. Zero lint warnings. Zero TypeScript errors. Build clean.**  
**PHP: composer lint 0/0, composer analyse no errors, composer test exit 0.**

## What Was Just Built (Step 4.5)

### New files

| File                                                      | Purpose                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `src/domain/registry/types.ts`                            | `Vertical` and `SessionConfig` types                            |
| `src/domain/registry/verticals.ts`                        | Closed registry: `VERTICALS`, `FALLBACK_VERTICAL_ID`            |
| `src/domain/registry/resolve.ts`                          | `resolveVertical`, `resolveFallbackVertical`, `listVerticalIds` |
| `src/domain/registry/index.ts`                            | Registry barrel                                                 |
| `src/domain/registry/__tests__/resolve.test.ts`           | 9 registry tests                                                |
| `src/__tests__/config-loader.test.ts`                     | 3 config-loader tests                                           |
| `src/__tests__/app-vertical-resolution.test.ts`           | 3 resolution smoke tests                                        |
| `plugins/quote-wizard/tests/Unit/PublicConfigTest.php`    | PHP tests for v2 contract                                       |
| `docs/decisions/0013-vertical-registry.md`                | ADR-0013                                                        |
| `docs/decisions/0014-reference-template-product-scope.md` | ADR-0014                                                        |

### Modified files

| File                                                 | Change                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `src/domain/config/public-config.ts`                 | `CONTRACT_VERSION` 1→2; add `wizardId` field                 |
| `src/types/global.d.ts`                              | `contractVersion: 2`; add `wizardId` to interface            |
| `src/config-loader.ts`                               | Import `FALLBACK_VERTICAL_ID`; add `wizardId` to defaults    |
| `tsconfig.test.json`                                 | Include `src/types/*.d.ts` so config-loader tests typecheck  |
| `src/App.tsx`                                        | Remove direct fencing imports; resolve vertical via registry |
| `plugins/quote-wizard/src/Frontend/PublicConfig.php` | `CONTRACT_VERSION` 1→2; emit `wizardId`                      |
| `plugins/quote-wizard/src/Activator.php`             | Seed `goqw_wizard_id` option                                 |
| `docs/decisions/0009-public-config-allowlist.md`     | Amendment appended (v2 + wizardId)                           |
| `docs/onboarding.md`                                 | Option count 8→9; ADR-0013 reference                         |

## What Was Just Built (Step 4.7)

### New files

| File                                                       | Purpose                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| `src/domain/fixtures/decking.config.ts`                    | Second reference vertical: decking wizard + pricing config      |
| `src/domain/fixtures/__tests__/decking-validation.test.ts` | Validates decking fixture against 4.1 schemas (2 tests)         |
| `src/domain/registry/services.ts`                          | `listEnabledServiceIds`, `resolveService` — selection-layer API |
| `src/domain/registry/__tests__/services.test.ts`           | 11 tests for services API                                       |
| `src/components/selection/ServiceSelector.tsx`             | Selection screen: heading + list of ServiceCard buttons         |
| `src/components/selection/ServiceCard.tsx`                 | Single service button card                                      |
| `src/components/selection/index.ts`                        | Barrel export                                                   |
| `src/__tests__/service-selection.test.ts`                  | 6 pure helper logic tests                                       |
| `docs/technical-debt.md`                                   | Technical debt register with media upload deferral              |

### Modified files

| File                                                        | Change                                                    |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| `src/domain/registry/types.ts`                              | Added `ServiceId` and `ServiceConfig` aliases             |
| `src/domain/registry/verticals.ts`                          | Registered `decking` vertical                             |
| `src/domain/registry/index.ts`                              | Exported new service API + aliases                        |
| `src/domain/config/public-config.ts`                        | Added optional `enabledServiceIds` field                  |
| `src/types/global.d.ts`                                     | Added optional `enabledServiceIds` to ambient declaration |
| `src/domain/__tests__/error-tone-and-public-config.test.ts` | 6 new enabledServiceIds test cases                        |
| `src/domain/registry/__tests__/resolve.test.ts`             | Updated `listVerticalIds` assertion to include decking    |
| `src/App.tsx`                                               | Per-session selection with single-service bypass          |
| `plugins/quote-wizard/src/Frontend/PublicConfig.php`        | Emit `enabledServiceIds` when configured                  |
| `plugins/quote-wizard/src/Activator.php`                    | Seed `goqw_enabled_services` option (count: 9 → 10)       |
| `plugins/quote-wizard/tests/Unit/PublicConfigTest.php`      | 4 new enabledServiceIds test cases                        |
| `docs/decisions/0013-vertical-registry.md`                  | Amendment: per-session selection + synonymy               |
| `docs/decisions/0009-public-config-allowlist.md`            | Amendment: enabledServiceIds additive field               |
| `docs/decisions/0015-submission-pipeline.md`                | Amendment: wizardId/service equivalence                   |

## Next Steps

### Phase 5 — Production integration + site templates

- Submission endpoint is live (Step 4.6); Make.com forwarder is live
- **ServiceSelector** currently mounts at App.tsx root; Phase 5 moves it to the QuotePage in the site shell
- WordPress shortcode wiring (replace `devSubmissionPort` fallback with injected config from PHP; `httpSubmissionPort` is ready)
- Before adding a service to a production Make.com workflow, ensure the workflow handles `wizardId: 'decking'` payload shape
- Site template layer (Home, Services, Our Work, Contact, Quote pages) — see ADR-0014
- Analytics
- Autosave beyond session scope

## Core Architecture

### Layer boundaries (enforced by ESLint)

```
src/domain/**          Pure, React-free. No UI imports. Independently testable.
src/domain/registry/** Vertical registry. Pure lookup; no React.
src/runtime/**         React adapter. WizardStore, hooks, persistence, submission.
src/components/
  primitives/          Button, Input, Skeleton, etc. No composites/steps/screens.
  composites/          Stateless UI pieces. No steps/screens.
  steps/               Field renderers, StepRenderer. May import composites + runtime.
  screens/             Phase screens. May import primitives + composites.
  WizardShell.tsx      Phase switcher. Imports everything.
src/App.tsx            Entry. Resolves vertical → store → shell.
```

### Vertical registry

- `resolveVertical(wizardId): SessionConfig | null` — pure, deterministic, no I/O
- Fallback: `resolveFallbackVertical()` returns `'fencing'` entry
- App.tsx: `const session = resolveVertical(config.wizardId) ?? resolveFallbackVertical()`
- Adding a vertical: new fixture in `src/domain/fixtures/` + one entry in `verticals.ts`

### State machine

- `transition(state, event, config): WizardState` — pure, total, no side effects
- `WizardStore` owns side effects: persistence, submission, auto-advance from `validating`
- Phases: `idle → answering → validating → submitting → submit_success | submit_failure`
- `validating` is instantaneous (auto-advanced by WizardStore immediately after entry)

### Pricing

- `computePrice(answers, wizard, pricing): PricingResult` — integer pence only
- Evaluation: base×qty → modifiers → extras → clamp → round → spread
- Gate: pricing must be valid to enter `submitting`; invalid returns to `answering`
- Display: `PriceSummary` shown when `price.valid === true`; updates live

### ReviewField exception

`ReviewField` uses `useWizardSelector` internally (Option A). It is the **only** field renderer that does not follow the pure prop-driven pattern. This is documented in the file.

## Core Constraints (unchanged)

- React-free pure domain layer in `src/domain/**`
- No side effects in `transition()`
- Zod-first schemas
- Integer pence arithmetic only (no floats for money)
- Deterministic pricing
- No arbitrary code evaluation
- Config-driven field registry
- Optimistic UI, no false success states
- All state serializable
- Fail-closed validation
- ADR-0012: flat UI, no gradients, no blur, no spinners (Skeleton only), no inline styles, no hex in components, no marketing language, no emoji
- PublicConfig v2 lockstep: PHP plugin and JS bundle must be upgraded together

## Workflow

1. Plan first, wait for approval
2. Implement incrementally
3. Verify: `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`
4. Produce evidence report

## Testing

Vitest in `apps/wizard`. Node environment only (`vitest.config.ts`). Include pattern: `src/**/*.test.ts`. Component tests (React rendering) require a separate jsdom config decision — currently deferred.

## Key Files

| File                                      | Purpose                                                   |
| ----------------------------------------- | --------------------------------------------------------- |
| `src/domain/registry/index.ts`            | Registry public surface                                   |
| `src/domain/registry/verticals.ts`        | VERTICALS map + FALLBACK_VERTICAL_ID                      |
| `src/domain/fixtures/fencing.config.ts`   | Canonical reference config (WizardConfig + PricingConfig) |
| `src/domain/runtime/transition.ts`        | State machine transition function                         |
| `src/domain/pricing/pricing-engine.ts`    | Pure pricing computation                                  |
| `src/runtime/WizardStore.ts`              | Effect orchestration                                      |
| `src/components/WizardShell.tsx`          | Phase → screen mapping                                    |
| `src/components/steps/field-registry.tsx` | Closed FieldType → renderer map                           |
| `src/App.tsx`                             | Dev entry point (resolves vertical, devSubmissionPort)    |
| `src/config-loader.ts`                    | Reads window.GOQW_CONFIG; falls back to safe defaults     |
| `docs/decisions/`                         | All ADRs — read before making structural changes          |
