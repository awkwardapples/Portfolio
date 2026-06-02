# Development Handoff

_Last updated: 2026-06-02_

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
- Step 4.7 — Service abstraction layer
- **Step 5.0 — Site shell + reference pages (JUST COMPLETED)**

## Where Things Stand

**Step 5.0 complete.** Run `pnpm dev` from `apps/wizard`, open `localhost:5173`.
A real five-page site loads: Home, Services, Our Work, Contact, and Quote. Nav links
navigate without reload. The Quote page shows the service selector; selecting a service
mounts the full wizard end-to-end. `App.tsx` is now a one-line `<SiteApp />` mount.

**359 Vitest tests passing. Zero lint warnings. Zero TypeScript errors. Build clean.**
**PHP: composer lint 0/0, composer analyse no errors, composer test exit 0.**

## What Was Just Built (Step 5.0)

### New files

| File                                                    | Purpose                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/site/content/site-content.ts`                      | Site-wide copy (business name, contact, hero, nav CTA)                |
| `src/site/content/services-content.ts`                  | Service entries rendered on / and /services                           |
| `src/site/content/work-content.ts`                      | Portfolio entries rendered on /our-work                               |
| `src/site/content/__tests__/content.test.ts`            | Structural integrity tests (9 tests)                                  |
| `src/site/routing/Link.tsx`                             | pushState link — dispatches goqw:navigate, modifier-key aware         |
| `src/site/routing/Router.tsx`                           | Pure function of pathname prop; updates document.title                |
| `src/site/routing/routes.ts`                            | Static route table (5 entries); matchRoute() with trailing-slash norm |
| `src/site/routing/__tests__/routes.test.ts`             | Route table + matchRoute tests (13 tests)                             |
| `src/site/pages/HomePage.tsx`                           | Hero + services preview + CTA                                         |
| `src/site/pages/ServicesPage.tsx`                       | Full service descriptions + CTA                                       |
| `src/site/pages/OurWorkPage.tsx`                        | Portfolio entries                                                     |
| `src/site/pages/ContactPage.tsx`                        | Contact fields + quote CTA                                            |
| `src/site/pages/QuotePage.tsx`                          | Wizard mount (selection logic moved from App.tsx)                     |
| `src/site/layout/SkipLink.tsx`                          | Keyboard-accessible skip-to-main link                                 |
| `src/site/layout/Nav.tsx`                               | Primary nav; aria-current; horizontal scroll on mobile                |
| `src/site/layout/Header.tsx`                            | Site header with business name + Nav                                  |
| `src/site/layout/Footer.tsx`                            | Business details + year                                               |
| `src/site/layout/SiteShell.tsx`                         | Wraps every page: SkipLink, Header, main, Footer                      |
| `src/site/SiteApp.tsx`                                  | Owns pathname state + navigation subscriptions                        |
| `src/site/index.ts`                                     | Barrel: exports SiteApp                                               |
| `docs/decisions/0016-site-shell-and-reference-pages.md` | ADR-0016                                                              |
| `docs/phase-5-evidence.md`                              | Step 5.0 evidence report                                              |

### Modified files

| File                                                      | Change                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/App.tsx`                                             | Reduced to one-line `<SiteApp />` mount                          |
| `apps/wizard/eslint.config.js`                            | ESLint boundary: site layer banned from @/domain/runtime/pricing |
| `docs/decisions/0014-reference-template-product-scope.md` | Amendment: concrete pages, not schema-driven (5.0)               |

## Next Steps

### Step 5.x — WordPress deployment integration

The site shell is fully functional on the Vite dev server. The remaining
production integration work:

- **WordPress page mapping**: the React SPA serves five routes (`/`, `/services`,
  `/our-work`, `/contact`, `/quote`) from one mounted entry point. In WordPress,
  each route needs either: (a) a single catch-all page with the shortcode and a
  server-side rewrite rule forwarding all paths to that page, or (b) five separate
  WP pages each containing the shortcode with the React app navigating client-side.
  Decision needed before first production deployment. See technical-debt.md.
- **Short code wiring**: `httpSubmissionPort` is production-ready; the dev fallback
  in `QuotePage.tsx` cuts over automatically when `config.restUrl` is non-empty (set
  by PHP via `window.GOQW_CONFIG`).
- **Make.com workflow**: before adding decking to a production workflow, ensure the
  workflow handles `wizardId: 'decking'` payload shape.
- Analytics, autosave beyond session scope — later.

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
| `src/site/SiteApp.tsx`                    | Application root; pathname state + site shell             |
| `src/site/pages/QuotePage.tsx`            | Quote page; wizard selection + mount                      |
| `src/site/content/site-content.ts`        | Site-wide copy — edit for each client                     |
| `src/domain/registry/index.ts`            | Registry public surface                                   |
| `src/domain/registry/verticals.ts`        | VERTICALS map + FALLBACK_VERTICAL_ID                      |
| `src/domain/fixtures/fencing.config.ts`   | Canonical reference config (WizardConfig + PricingConfig) |
| `src/domain/runtime/transition.ts`        | State machine transition function                         |
| `src/domain/pricing/pricing-engine.ts`    | Pure pricing computation                                  |
| `src/runtime/WizardStore.ts`              | Effect orchestration                                      |
| `src/components/WizardShell.tsx`          | Phase → screen mapping                                    |
| `src/components/steps/field-registry.tsx` | Closed FieldType → renderer map                           |
| `src/config-loader.ts`                    | Reads window.GOQW_CONFIG; falls back to safe defaults     |
| `docs/decisions/`                         | All ADRs — read before making structural changes          |
