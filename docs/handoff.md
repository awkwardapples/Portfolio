# Handoff

_Last updated: 2026-06-09 (post Step 5.5b)_

## Status

- Step 5.5a-remediation complete and operationally verified (June 8, 2026).
- Step 5.5b complete (June 9, 2026): fork procedure documented in
  `docs/fork-procedure.md` with all 5.5a-remediation lessons captured.
- Both LocalWP sites confirmed running the correct wire contract.
- Build pipeline corrected: `pnpm build` now composes Vite build with
  plugin staging in one command.
- Fork-and-customize architecture demonstrated end-to-end: template
  improvements propagated to the SCB client clone via standard merge.
- Step 5.5b-architecture (rendering architecture implementation) is now up next.

The system is functionally complete for a single-client deployment. The remaining
work is template adaptation, visual customization (driven by real client
feedback), and production deployment for the first client.

See `docs/roadmap.md` for the full sequence and `docs/product-vision.md` for
the medium-term product direction.

## What to read first if you're new

1. `docs/roadmap.md` — single-page project shape and status.
2. `docs/current-state.md` — what works right now.
3. `docs/technical-debt.md` — known deferred work with triggers.
4. `docs/onboarding.md` — how to develop, build, and deploy.
5. `docs/adaptation-runbook.md` — how to clone and adapt the template for a
   new client. Read this before Step 5.5.
6. `docs/make-com-integration.md` — how to configure Make.com to receive
   quote submissions from a deployed install. Read this alongside 5.5.
7. ADRs in `docs/decisions/` in numerical order — record of every architectural
   decision. Read 0014 first if you want to understand the product direction
   (template-clone repository, not multi-tenant SaaS, not operator-editing CMS).

## What to do first

If you are starting a new step:

1. Read this file. Read `current-state.md`. Read the most recent ADR amendment.
2. Run all gates locally and confirm they match what `current-state.md` claims.
   If they don't, that's a finding before you start any work.
3. If your step affects the WordPress-deployed system, run OV-001-style
   verification at the end. See the planning discipline in `technical-debt.md`.

## What NOT to do

- Do not add new architectural surface without explicit approval. The system
  is structurally complete for its target (b — reusable template repository).
- Do not begin a new development step until the prior step's verification is
  recorded in evidence and the documentation set (current-state, handoff,
  technical-debt, roadmap, relevant ADRs) reflects reality.
- Do not skip the deploy procedure in `onboarding.md`. The OV-001 episode (June 2026) demonstrated what happens when redeployment is improvised.

## Next candidate steps

The roadmap is sequenced explicitly. See `docs/roadmap.md` for full detail.

**Immediate next step:** Step 5.5b-architecture — Rendering architecture
implementation. Removes the WordPress/Kadence chrome from React-hosted routes
via a plugin-provided minimal page template (Option C hybrid).

**Then:** Step 5.5c — SCB-specific customization. Apply SCB Handyman's
content, branding, and initial service set against the now-clean rendering
canvas.

After 5.5c: Step 5.6 (visual customization v1) and beyond.

Each step is sized small and verified before the next begins. See
`docs/roadmap.md` "Step rationale and dependencies" for why each step is
shaped the way it is.

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
src/site/              Website shell + five reference pages. May NOT import
                       @/domain/runtime/** or @/domain/pricing/** directly.
src/App.tsx            Entry. One-line mount of <SiteApp />.
```

### Vertical registry

- `resolveVertical(wizardId): SessionConfig | null` — pure, deterministic, no I/O
- Fallback: `resolveFallbackVertical()` returns `'fencing'` entry
- `QuotePage`: resolves vertical via `listEnabledServiceIds` + `resolveService`
- Adding a vertical: new fixture in `src/domain/fixtures/` + one entry in `verticals.ts`

### State machine

- `transition(state, event, config): WizardState` — pure, total, no side effects
- `WizardStore` owns side effects: persistence, submission, auto-advance from `validating`
- Phases: `idle → answering → validating → submitting → submit_success | submit_failure`
- `validating` is instantaneous (auto-advanced by WizardStore immediately after entry)

### Submission pipeline

- `httpSubmissionPort`: appends `/submit` to `restUrl` namespace base (F5 fix, ADR-0015 amendment 2026-06-05)
- `devSubmissionPort`: fallback when `config.restUrl === ''`
- HTTP 200 → `SUBMIT_SUCCEEDED`; all other outcomes → `SUBMIT_FAILED`
- No internal retry: retry is a user-initiated FSM event (`SUBMIT_RETRY`)

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

## Key Files

| File                                      | Purpose                                                    |
| ----------------------------------------- | ---------------------------------------------------------- |
| `src/site/SiteApp.tsx`                    | Application root; pathname state + site shell              |
| `src/site/pages/QuotePage.tsx`            | Quote page; wizard selection + mount                       |
| `src/site/content/site-content.ts`        | Site-wide copy — edit for each client                      |
| `src/domain/registry/index.ts`            | Registry public surface                                    |
| `src/domain/registry/verticals.ts`        | VERTICALS map + FALLBACK_VERTICAL_ID                       |
| `src/domain/fixtures/fencing.config.ts`   | Canonical reference config (WizardConfig + PricingConfig)  |
| `src/domain/runtime/transition.ts`        | State machine transition function                          |
| `src/domain/pricing/pricing-engine.ts`    | Pure pricing computation                                   |
| `src/runtime/WizardStore.ts`              | Effect orchestration                                       |
| `src/runtime/http-submission-port.ts`     | Production submission adapter (appends /submit to restUrl) |
| `src/components/WizardShell.tsx`          | Phase → screen mapping                                     |
| `src/components/steps/field-registry.tsx` | Closed FieldType → renderer map                            |
| `src/config-loader.ts`                    | Reads window.GOQW_CONFIG; falls back to safe defaults      |
| `docs/decisions/`                         | All ADRs — read before making structural changes           |
