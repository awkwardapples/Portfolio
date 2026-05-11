# Project Structure

**Version:** 1.0
**Status:** Proposed

---

## 1. Top-level layout

A single Git repository organised as a workspace. Two deployable artifacts (React app, WordPress plugin) plus shared docs and ops material.

```
growth-ops-platform/
├── apps/
│   └── wizard/                      # The React quote wizard (Vite)
├── plugins/
│   └── quote-wizard/                # The WordPress plugin
├── config/
│   └── trades/                      # Per-trade pricing configs (JSON + TS schema)
├── automation/
│   ├── make-scenarios/              # Exported Make.com blueprints (JSON)
│   ├── hubspot/                     # HubSpot property definitions, workflow notes
│   └── email-templates/             # Owner & customer email templates (HTML + MJML)
├── docs/
│   ├── 01-system-overview.md
│   ├── 02-architecture.md
│   ├── 03-project-structure.md
│   ├── 04-implementation-roadmap.md
│   ├── 05-risk-analysis.md
│   ├── 06-pricing-engine-spec.md
│   ├── deployment.md                # Step-by-step deployment runbook
│   ├── client-onboarding.md         # The agency's per-client playbook
│   ├── operations.md                # Day-2 ops: monitoring, support, recovery
│   └── decisions/                   # ADRs (Architecture Decision Records)
│       └── 0001-thin-wp-endpoint.md
├── scripts/
│   ├── build-plugin.sh              # Builds React app, copies dist into plugin
│   ├── package-plugin.sh            # Produces plugin .zip for upload
│   └── new-client.sh                # Scaffolds a new client deployment (later)
├── .github/
│   └── workflows/
│       └── ci.yml                   # Lint, typecheck, build on PR
├── .editorconfig
├── .gitignore
├── README.md                        # Onboarding for engineers (not clients)
├── package.json                     # Workspace root
└── pnpm-workspace.yaml              # Workspace definition (or npm workspaces)
```

## 2. `apps/wizard/` — the React app

This is the engine. It is generic. It does not know what fencing is. It reads a config, renders a wizard, calculates a price, submits a payload.

```
apps/wizard/
├── public/
│   └── (static assets only if needed — favicon is WP's job)
├── src/
│   ├── main.tsx                     # Entry point: finds #qw-root, mounts <App />
│   ├── App.tsx                      # Top-level component; reads config, routes steps
│   │
│   ├── engine/                      # The reusable wizard runtime
│   │   ├── types.ts                 # Config types, submission types, result types
│   │   ├── wizard-machine.ts        # Step navigation, conditional logic
│   │   ├── pricing-engine.ts        # Pure function: (config, answers) → estimate
│   │   ├── validation.ts            # Zod schemas built from config
│   │   └── submission.ts            # Builds FormData, POSTs, handles errors
│   │
│   ├── steps/                       # Step components (one per question type)
│   │   ├── TextStep.tsx
│   │   ├── NumberStep.tsx
│   │   ├── SingleChoiceStep.tsx
│   │   ├── MultiChoiceStep.tsx
│   │   ├── PhotoUploadStep.tsx
│   │   ├── ContactDetailsStep.tsx
│   │   ├── ReviewStep.tsx
│   │   └── ResultStep.tsx
│   │
│   ├── ui/                          # Design-system primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Card.tsx
│   │   ├── Consent.tsx
│   │   └── Spinner.tsx
│   │
│   ├── hooks/
│   │   ├── useWizard.ts
│   │   ├── useImageCompression.ts
│   │   └── useAnalytics.ts
│   │
│   ├── lib/
│   │   ├── analytics.ts             # GA4 + Clarity wrappers (no-op if not configured)
│   │   ├── format.ts                # Currency, length, area formatters
│   │   └── errors.ts                # Error reporter
│   │
│   ├── styles/
│   │   └── index.css                # Tailwind directives + minimal globals
│   │
│   └── config-loader.ts             # Reads window.qwConfig or build-time import
│
├── index.html                       # Dev-only; production mounts into WP
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── package.json
└── README.md                        # How to develop, test, build
```

**Key principles for this directory:**

- `engine/` contains nothing that knows about fencing, landscaping, or any specific trade. If a future developer needs to add "decking", they add a config — they do not touch `engine/`.
- `steps/` contains step component types, not step instances. The config defines which steps to render and in what order; the components just render them.
- `ui/` is a thin design system. It exists so the wizard has a consistent look without us pulling in a heavy library like MUI or Chakra. We are not building Storybook for v1.
- No client name appears anywhere in this directory. Ever.

## 3. `plugins/quote-wizard/` — the WordPress plugin

This is the bridge. PHP, follows WordPress plugin conventions, namespaced to avoid conflicts.

```
plugins/quote-wizard/
├── quote-wizard.php                 # Plugin header, bootstrap, autoloader
├── uninstall.php                    # Drops the qw_submissions table on uninstall
│
├── src/
│   ├── Plugin.php                   # Main plugin class
│   ├── Activator.php                # Creates tables, sets defaults on activation
│   ├── Deactivator.php              # Clears scheduled events on deactivation
│   │
│   ├── Rest/
│   │   ├── SubmitController.php     # POST /wp-json/qw/v1/submit
│   │   ├── ErrorController.php      # POST /wp-json/qw/v1/error (client errors)
│   │   ├── Validator.php            # Server-side payload validation
│   │   └── RateLimiter.php          # Per-IP rate limiting via transients
│   │
│   ├── Submissions/
│   │   ├── Repository.php           # CRUD on qw_submissions
│   │   ├── ImageHandler.php         # Sideload images to media library
│   │   └── MakeForwarder.php        # POST to Make.com webhook with retries
│   │
│   ├── Admin/
│   │   ├── SettingsPage.php         # Plugin settings (webhook URL, etc.)
│   │   ├── SubmissionsPage.php      # List & view recent submissions
│   │   └── assets/                  # Admin CSS/JS (vanilla, minimal)
│   │
│   ├── Frontend/
│   │   ├── Shortcode.php            # [quote_wizard] shortcode
│   │   ├── Block.php                # Optional Gutenberg block (Phase 6)
│   │   └── AssetLoader.php          # Enqueues built React bundle
│   │
│   ├── Cron/
│   │   └── PruneSubmissions.php     # Daily job: delete submissions > 90 days
│   │
│   └── Support/
│       ├── Logger.php
│       └── Settings.php             # Wrapper around get_option/update_option
│
├── assets/
│   └── dist/                        # Built React bundle (committed; build script copies here)
│       ├── wizard.js
│       └── wizard.css
│
├── templates/
│   └── admin/                       # PHP templates for admin pages
│
├── languages/                       # .pot file for i18n (v1: en_GB only)
│
├── composer.json                    # Autoloading + dev dependencies (PHPCS, PHPUnit)
├── readme.txt                       # WordPress plugin readme format
└── README.md                        # Developer README (different from above)
```

**Key principles:**

- PSR-4 autoloading under a namespace like `Agency\QuoteWizard\`. Renaming for a new client touches the namespace, the plugin slug, and the text domain — that is the seam.
- No database queries outside `Repository.php`. No HTTP calls outside `MakeForwarder.php`. These are the abuse-prone primitives; they get their own files.
- Admin UI is vanilla PHP + minimal JS. We do not build a React admin in v1.
- The built React bundle is committed to `assets/dist/`. This is unusual for a typical React project but correct for a WordPress plugin: the plugin ZIP must be self-contained, and uploading to wp-admin must not require a build step on the server.

## 4. `config/trades/` — pricing configs

The single most reused asset across clients.

```
config/trades/
├── README.md                        # How to author a config; the spec
├── schema/
│   ├── trade-config.schema.json     # JSON Schema for validation
│   └── trade-config.types.ts        # TypeScript types (source of truth)
├── fencing.json                     # Reference implementation (client #1's starting point)
├── handyman.example.json            # Example for future use
└── landscaping.example.json         # Example for future use
```

A client's actual config lives in their plugin instance, not in this directory. This directory holds reference configs and the schema. When deploying a new client, we copy `fencing.json` to their plugin, change the numbers, and ship.

## 5. `automation/` — the integration layer

```
automation/
├── make-scenarios/
│   ├── lead-intake.blueprint.json   # Exported Make.com scenario
│   └── README.md                    # How to import & configure for a new client
├── hubspot/
│   ├── contact-properties.md        # Custom properties to create
│   ├── workflow-notes.md            # Recommended HubSpot workflows
│   └── property-mapping.md          # Payload field → HubSpot property
└── email-templates/
    ├── owner-notification.mjml
    ├── owner-notification.html
    ├── customer-confirmation.mjml
    ├── customer-confirmation.html
    └── README.md                    # How to customise per client
```

MJML is used as the source for emails because writing responsive HTML email by hand is masochism. The compiled `.html` files are what Make.com actually sends.

## 6. `docs/` — the source of truth

The numbered Phase 1 documents live here, alongside operational docs.

The `docs/decisions/` subdirectory holds ADRs (Architecture Decision Records). Every non-trivial architectural decision gets a short ADR with context, decision, consequences. This is what saves us in 18 months when someone asks "why on earth did we do it this way?"

Examples of ADRs we will write before coding:
- 0001-thin-wp-endpoint.md (recording the Path A vs Path B decision)
- 0002-react-hook-form-vs-formik.md
- 0003-config-bundled-vs-wp-options.md
- 0004-no-storybook-in-v1.md

## 7. What we are deliberately NOT including

- **`shared/` or `packages/common/`** — Tempting, but premature. The React app and the WP plugin share no runtime code (one is TS in the browser, the other is PHP on the server). They share a *contract* (the payload shape), which lives in `docs/` and is duplicated as types in TS and as a validator in PHP. When that duplication causes a bug, we revisit. Until then, the cost of a shared package exceeds the benefit.
- **A monorepo build tool like Turborepo or Nx.** The repo has exactly two buildable artifacts. `pnpm` workspaces (or `npm` workspaces) handle this fine.
- **Storybook.** The wizard has ~10 components. We can review them by running the dev server. Storybook is a 1-day setup we recover from at component #30, not component #10.
- **A test runner contracted on the WordPress side.** Plugin code is tested with Pest or PHPUnit. Adding it day one is correct; investing in a full integration test suite is not.
- **Docker.** Cloudways is the target. Dockerising a WordPress plugin for development is a known time-sink; `wp-env` (the official WordPress local dev tool) is the right answer if we need a local WP. Decision deferred to Phase 3.

## 8. Naming conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase, one component per file | `PhotoUploadStep.tsx` |
| React hooks | camelCase, `use` prefix | `useImageCompression.ts` |
| TS types | PascalCase | `type WizardConfig = …` |
| PHP classes | PascalCase, PSR-4 | `class SubmitController` |
| PHP namespace | `Agency\QuoteWizard\…` | rename per client |
| WP options keys | snake_case, `qw_` prefix | `qw_webhook_url` |
| WP DB tables | snake_case, `qw_` prefix, no `wp_` (WP adds it) | `qw_submissions` |
| REST routes | kebab-case | `/wp-json/qw/v1/submit` |
| Make.com scenarios | `client-name-purpose` | `acme-fencing-lead-intake` |
| HubSpot custom properties | snake_case, `qw_` prefix | `qw_estimate_low` |

Consistency here pays off when debugging across systems at 9pm.

## 9. Repository hygiene

- **Branching.** `main` is protected and represents production. Feature work happens on short-lived branches merged via PR. No long-running feature branches.
- **Commits.** Conventional Commits format (`feat:`, `fix:`, `chore:`, `docs:`). This pays off when generating changelogs for clients.
- **CI.** Lint, typecheck, test, build. PRs that don't pass don't merge.
- **Releases.** Semantic versioning on the plugin (`1.0.0`, `1.1.0`). The plugin header in `quote-wizard.php` is the source of truth for the version. A GitHub Action builds and attaches the plugin ZIP to a release on tag push.
