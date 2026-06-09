# Current State

_Last updated: 2026-06-09 (post Step 5.5b-architecture)_

## What's working

- Wizard engine (FSM, validation, navigation, persistence).
- Pricing engine (computePrice, gate enforcement).
- Manual-quote routing: wizards with `quoteMode: 'manual'` bypass pricing and go directly to submission.
- Category navigation (optional): CategorySelector phase before service selection when `enableCategoryNavigation` is true.
- Submission pipeline end-to-end in WordPress (validate → persist → forward → respond).
- Site shell with 5 routes (Home, Services, Our Work, Contact, Quote).
- Service abstraction (fencing + decking verticals).
- Photo upload (multi-photo, browser compression, server-side validation, base64 in payload).
- WordPress page mapping (single root page + rewrite rules + non-invasive front-page policy).

## Gate state (last verified)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors
- `pnpm test`: 425/425 (unchanged)
- `pnpm build`: clean, ~73 kB gzip bundle (unchanged)
- `composer test`: passing (95 tests, 7 new from 5.5b-architecture)
- `composer analyse`: clean

## OV-001 verification

**Closed June 5, 2026.** End-to-end functional verification of the system in a
real WordPress install (LocalWP). All Criterion 21 sub-criteria met. See
`docs/phase-5-evidence.md` for the full verification record.

The system is now verified to work end-to-end in WordPress for the first time
across the project. Step 5.3 (Adaptation Runbook) is no longer gated.

## What's NOT yet built

- Step 5.5c (SCB-specific customization) — up next.
- Media retention policy (deferred per 4.8 spec).
- Idempotency for submission retry (deferred; trigger: first observed duplicate).
- Rate limiting on submit endpoint (deferred; trigger: >100 submissions/day).
- Admin replay UI for failed forwards (deferred; trigger: ops team need).
- Second client deployment (Step 6 candidate; trigger: business decision).

## Critical context

- The plugin is a template, not a feature plugin. It assumes the WordPress
  install is clean (no conflicting existing content at `/services`, `/contact`,
  etc., and either no front page configured or Sample Page only).
- Every step from this point forward includes operational verification, not
  just code gates. See planning discipline addition in `docs/technical-debt.md`.

## Completed Steps

- Step 4.0 — UX shell (design-system primitives: Button, Input, IconButton, Skeleton, Tooltip)
- Step 4.1 — Config schema + validation architecture (Zod schemas, cross-reference validation, fencing fixture)
- Step 4.2 — Wizard state machine (FSM, events, transition(), selectors, navigation helpers, replay, WizardStore, WizardProvider, useWizard/useWizardSelector, persistence, submission port)
- Step 4.3 — Pricing engine integration (computePrice, PricingResult/PricingBreakdown, pricing selectors, pricing gate in transition: validating → submitting blocked when pricing invalid)
- Step 4.4 — React rendering layer (composites, field registry, step renderer, phase screens, WizardShell, App.tsx wired to fencing fixture)
- Step 4.5 — Vertical registry + config resolution (closed registry, resolveVertical, PublicConfig v2, wizardId)
- Step 4.6 — WordPress REST submission adapter — Phase 4 CLOSED
- Step 4.7 — Service abstraction layer
- Step 4.8 — Photo upload pipeline (browser compression + server validation)
- Step 5.0 — Site shell + reference pages
- Step 5.1 — WordPress page mapping + production routing
- **Step 5.2 — OV-001 remediation (F5+F6 code fixes; F1+F3 operational; F2+F4 deferred with triggers)**
- **Step 5.3 — Adaptation runbook (`docs/adaptation-runbook.md`; documentation only)**
- **Step 5.4 — Make.com integration guide (`docs/make-com-integration.md`; documentation only)**
- Step 5.5a-remediation — Wire contract fix and operational verification
  (June 2026). Resolved post-5.5a wire contract drift where the submission
  payload builder hardcoded contractVersion: 2 and omitted quoteMode.
  Both LocalWP sites verified end-to-end per ADR-0018. The `pnpm build`
  command is now composed to run both Vite build and plugin-staging in
  one step, preventing the build-pipeline gap that caused multiple
  debugging episodes during verification.
- **Step 5.5b — Operational fork procedure documentation** (`docs/fork-procedure.md`).
  Captures the corrected clone-and-merge workflow incorporating lessons
  from 5.5a-remediation: sibling-directory layout, `template` remote
  naming, composed `pnpm build`, post-merge verification, and common
  pitfalls. Documentation-only; no code changes.
- **Step 5.5b-architecture — Rendering architecture implementation** (ADR-0019).
  Plugin-provided minimal page template (`templates/react-host.php`) replaces
  the active theme's template for React-hosted routes via the `template_include`
  filter. WordPress/Kadence chrome no longer appears alongside the React app.
  Theme rendering preserved for wp-admin and non-React surfaces. 7 new PHP tests.

## Key Architectural Facts

### Site layer (src/site/\*\*)

- `src/site/content/` — typed TypeScript const modules (site-content.ts,
  services-content.ts, work-content.ts). Edit to adapt for a new client.
- `src/site/routing/` — hand-rolled router. `Link.tsx` dispatches `goqw:navigate`;
  `Router.tsx` is a pure function of `pathname` prop; `routes.ts` is the static table.
- `src/site/layout/` — `SiteShell`, `Header`, `Nav`, `Footer`, `SkipLink`.
- `src/site/pages/` — five concrete page components. `QuotePage` owns the wizard
  selection/mount (moved from App.tsx in 5.0).
- `SiteApp` owns pathname state + event subscriptions; renders `SiteShell → Router`.
- ESLint boundary: `src/site/**` may NOT import `@/domain/runtime/**` or
  `@/domain/pricing/**` directly.

### Submission pipeline (Step 4.6 — ADR-0015)

Strict ordering: validate → persist → forward → respond.

| HTTP Status | Meaning                                               |
| ----------- | ----------------------------------------------------- |
| 200         | Persisted and forwarded; `{ reference: 'GOQW-<id>' }` |
| 400         | Payload invalid; nothing stored                       |
| 500         | DB failure; nothing forwarded                         |
| 502         | Persisted but forward failed; data is safe            |

- `httpSubmissionPort`: production port; appends `/submit` to `restUrl` namespace base (ADR-0015 amendment 2026-06-05).
- `devSubmissionPort`: fallback when `config.restUrl === ''` (standalone Vite dev).
- `WizardStore.buildRequest()`: builds `SubmissionRequest` including pricing snapshot
  and `clientTimestamp: new Date().toISOString()`.

### Vertical registry (`src/domain/registry/**`)

- `VERTICALS`: closed `Readonly<Record<string, Vertical>>`, frozen at runtime
- `resolveVertical(wizardId): SessionConfig | null` — pure, total, no I/O
- `resolveFallbackVertical()` — returns the `FALLBACK_VERTICAL_ID` entry (`'fencing'`)
- `QuotePage` resolves the vertical from `config.wizardId` (set by PHP → `window.GOQW_CONFIG`)
- Adding a vertical = one PR (new fixture + registry entry)

### PublicConfig v3 contract

- `contractVersion: 3` (bumped from 2 in Step 5.5a; wire payload fix in 5.5a-remediation)
- `wizardId: string` (selects the vertical)
- `enableCategoryNavigation: boolean` (defaults false; opt-in from 5.5a)
- `restUrl`, `restNonce` (used by `httpSubmissionPort`)
- PHP: `PublicConfig::CONTRACT_VERSION = 3`, `goqw_wizard_id` option seeded on activation
- Lockstep requirement: PHP plugin and JS bundle must be upgraded together
- Wire payload must include `quoteMode: 'instant' | 'manual'` (validated by SubmissionController)

### WordPress Routing Layer (Step 5.1)

| Class                      | What                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `Routing\SiteRoutes`       | PHP copy of the 5 recognized paths; `normalize()` + `is_recognized()` match routes.ts    |
| `Routing\SiteRootPage`     | Idempotent lifecycle for the single WP page backing all routes                           |
| `Routing\FrontPagePolicy`  | Sets Site Root as front page if not already configured; admin notice otherwise           |
| `Routing\RewriteRegistrar` | Registers WP rewrite rules for the 4 non-root paths; exposes `goqw_route` query var      |
| `Routing\RouteInterceptor` | `pre_get_posts` filter — rewrites main query to Site Root for recognized paths           |
| `Routing\SelfHealer`       | `init` check — recreates Site Root if manually deleted                                   |
| `Routing\SiteRenderer`     | `the_content` filter (priority 5) — outputs `<div id="qw-root" data-initial-path="...">` |
| `CrossLanguageRoutesTest`  | Parses routes.ts and asserts it matches SiteRoutes::PATHS exactly                        |

## Required Gates

- lint (`pnpm lint` → 0 errors, 0 warnings)
- typecheck (`pnpm typecheck`)
- vitest (`pnpm test` → 425/425)
- build (`pnpm build`)
- PHP: `composer lint` → 0/0, `composer analyse` → no errors, `composer test` → 88/88 (2 skipped)
