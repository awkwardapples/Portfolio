# Roadmap

A single-page, structural view of project state. Update on every completed step.

## Phases

| Phase | Status      | Key deliverable                                           |
| ----- | ----------- | --------------------------------------------------------- |
| 1     | Complete    | Architecture and ADRs 0001–0011                           |
| 2     | Complete    | Repo scaffold, plugin skeleton, build pipeline            |
| 3     | Complete    | CI, packaging, onboarding (steps 3A–3H)                   |
| 4     | Complete    | Wizard engine, end-to-end submission, service abstraction |
| 5     | In progress | Reusable website template + WP deployment verified        |
| 6     | Future      | First client production deployment                        |

## Step status

| Step                  | Status   | What                                                                                                    |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| 4.7                   | Complete | Service abstraction + decking vertical                                                                  |
| 4.8                   | Complete | Photo upload capability + tests                                                                         |
| 5.0                   | Complete | Site shell + 5 reference pages                                                                          |
| 5.1                   | Complete | WordPress page mapping + production routing                                                             |
| 5.2                   | Complete | OV-001 remediation (verified end-to-end in WordPress)                                                   |
| 5.3                   | Complete | Adaptation runbook (documentation of clone-and-customize)                                               |
| 5.4                   | Complete | Make.com integration documentation                                                                      |
| 5.5a                  | Complete | Template capabilities (category nav + manual-quote mode)                                                |
| 5.5a-remediation      | Complete | Wire contract drift fix; operational verification under ADR-0018; build-pipeline composition correction |
| 5.5b                  | Complete | Operational fork procedure documentation                                                                |
| 5.5b-architecture     | Complete | Rendering architecture implementation (Option C hybrid; ADR-0019)                                       |
| 5.5b-architecture-fix | Complete | Asset enqueue gate fix; React app now mounts and renders on React routes                                |
| 5.6                   | Complete | Product vision rewrite + roadmap revision                                                               |
| 5.7                   | Complete | Section library: composition mechanism + 7 sections                                                     |
| 5.7-remediation       | Complete | CTA routing (SectionLink); canonical redirect fix; viewport sizing                                      |
| 5.8                   | Complete | Footer: template structure + per-client content slots                                                   |
| 5.9                   | Complete | Wizard service library: 11 services (5 instant + 4 manual + 2 original)                                 |
| 5.9-remediation       | Complete | 6 OV findings: pre-step, back-button fix, UK validators, category nav default, copy, ADR-0022           |
| 5.10a                 | Complete | SEO Layer 1: per-route titles, meta, canonical, OG/Twitter; category back button; ADR-0023              |
| 5.10b                 | Up next  | SEO Layers 2-4: LocalBusiness schema, Service schema, sitemap.xml, robots.txt                           |
| 5.11                  | Planned  | Per-client customization tooling refinement                                                             |
| 5.12                  | Planned  | SCB-specific deployment (first real client)                                                             |
| 6.0                   | Planned  | Production IONOS deployment                                                                             |
| 6.1+                  | Future   | Second and subsequent clients                                                                           |

## Step rationale and dependencies

**5.3 — Adaptation runbook.** Documents how to clone and adapt the template for
a new client using _existing_ capabilities. No new code. The runbook reflects
the variation points listed in `docs/product-vision.md`.

**5.4 — Make.com docs.** Operational, not code. Covers webhook configuration
and downstream workflow design. Can run in parallel with 5.5.

**5.5a — Template capabilities.** Adds two opt-in capabilities: category
navigation (optional phase before service selection) and manual-quote mode
(bypasses instant pricing for complex services). Wire contract bumped to v3.
Acme Fencing demo unchanged. See ADR-0017.

**5.5a-remediation — Wire contract drift fix.** Corrects the omission that
5.5a's code gates passed while the submission payload builder still hardcoded
`contractVersion: 2` and omitted `quoteMode`. Adds wire-contract integration
tests (ADR-0018) to prevent recurrence. Bumps GOQW_VERSION to 0.3.0. The
discipline gap (Criterion 26 not performed before 5.5a was marked complete) is
recorded honestly in evidence and in ADR-0017's amendment.

**5.5b — Operational fork procedure documentation.** Captures the
clone-and-merge procedure for client onboarding, including the corrections
discovered during 5.5a-remediation: sibling-directory layout, `template`
remote naming, the composed `pnpm build`, and post-merge verification.
Empirically tested when 6.1 (second client onboarding) arrives; refined then
if gaps surface.

**5.5b-architecture — Rendering architecture implementation.** Establishes
the hybrid rendering model: plugin-provided minimal page template for
React-hosted routes, theme rendering preserved for wp-admin and non-React
surfaces. Resolves the visible "double header" problem where WordPress/theme
chrome wraps the React app. Foundational decision affecting all client
deployments; not SCB-specific. See ADR-0019.

**5.5b-architecture-fix — Asset enqueue gate fix.** Discovered post-deployment
that `AssetLoader::current_page_has_shortcode()` never fired under the minimal
template — `the_content()` is never called, so shortcodes are never evaluated.
The React bundle was never enqueued; pages rendered blank. Fix adds
`SiteRoutes::is_current_request_react_route()` as a shared helper and updates
`AssetLoader` to enqueue on React routes regardless of shortcode. Also refactors
`RenderingArchitecture` and `RouteInterceptor` to use the helper, eliminating
duplicated guard chains. ADR-0018 and ADR-0019 amended with lessons learned
(visible-UI verification requirement). See both ADRs.

**5.6 — Product vision rewrite + roadmap revision.** Replaces the earlier
product-vision.md (which described intended variation points and deferred
capabilities) with a comprehensive template definition: the 7-section homepage
library, the behavioral/visual layer separation principle, the 9-service wizard
library (5 instant, 4 manual), the manual-quote flow, SEO infrastructure
layers, the per-client customization model, and the 21st.dev workflow.
Documentation-only; no code, no tests. Establishes the reference document
for all subsequent implementation steps.

**5.7 — Section library.** Implements the composition mechanism (Pattern A:
single composition file per page, array of `{ section, config }` entries) and
all 7 standard sections (Hero, Intro, Services Preview, Process, Projects, Why
Choose Us, FAQ). Each section follows the behavioral/visual layer separation
(Pattern B: `Section/index.tsx` + `Section/Layout.tsx`). Default section order
established. Home page composed from the library.

**5.7-remediation — CTA routing, canonical redirect, viewport sizing.** Three
findings from 5.7 operational verification: (1) WordPress `redirect_canonical`
intercepted React routes — fixed by `CanonicalRedirectGuard` PHP class; (2)
plain `<a>` tags in section Layouts caused full-page reloads — fixed by
`SectionLink` helper that uses the site router for internal paths; (3) sections
were cramped — fixed by Hero `lg:min-h-screen` + internal spacing upgrades.
ADR-0020 amended. 4 implementation commits.

**5.8 — Footer.** Implements the template-fixed footer structure with per-client
content slots. All content slots documented and configurable from a single
footer content file. Footer appears on all five routes.

**5.9 — Wizard service library.** Built 9 new service configs. Spec planned
patio/paving/driveways as one config; content cleanly mapped to 3 separate
instant-quote configs (patio, driveway, steps), yielding 11 total services.
5 instant-quote (painting, patio, driveway, steps, jetwash) + 4 manual-quote
(general-repairs, plumbing, electrical, carpentry) + 2 original (fencing, decking).
4 categories, 11 SVG icons, string-keyed ICON_MAP. ADR-0021 documents
architectural decisions. OV-5.9-1 through OV-5.9-15 pending.

**5.9-remediation — 6 OV findings.** R1: category nav PHP default → true (ADR-0017
amended). R2: double-Back bug fixed in `handleStepBack` (pop not append) + Back
always visible + first-step Back returns to service selector. R3: engine-level
pre-step via `SessionConfig.preSteps` and `getMergedWizard()` collects contact
details before every wizard (ADR-0022). R4: UK format validators for postcode,
email, phone wired into `answer-validation.ts` via `FORMAT_VALIDATORS`. R5:
"quote"/"quote request" copy stripped from all 11 wizard titles.

**5.10a — SEO Layer 1 + category back button.** PHP-emitted, route-aware SEO: per-route
titles via `pre_get_document_title`, meta descriptions, canonical URLs, Open Graph (6 tags),
Twitter cards (4 tags). `SEORouteContent` + `SEOMetaEmitter` PHP module registered in
`Plugin::boot()`. `react-host.php` hard-coded title removed; emitted by WordPress's
`_wp_render_title_tag()`. `og-image-default.png` placeholder ships. `ServiceSelector` gains
category back button. 3 Vitest + 15 PHP tests. ADR-0023 accepted.

**5.10b — SEO Layers 2-4.** LocalBusiness JSON-LD (Layer 2); Service JSON-LD per
enabled service (Layer 3); sitemap.xml and robots.txt generation (Layer 4). PHP plugin
emits all into `wp_head()` or via rewrite rules.

**5.11 — Per-client customization tooling refinement.** Validates and refines
the per-client customization workflow against an actual adaptation pass. Ensures
the composition file, section content config, service selection, and footer
config are ergonomic. May introduce helper types or developer tooling if the
workflow surfaces friction. Empirical (do the adaptation, find the gaps, fix).

**5.12 — SCB-specific deployment.** First real client adaptation. Applies the
5.7-5.11 template to SCB Handyman. Selects SCB's services, composes SCB's home
page, provides SCB's business content, applies visual customization per SCB's
brand. Operational verification per ADR-0018.

**6.0 — Production IONOS deployment.** First real client goes live. Operational,
gated on 5.12 reaching a state the client is satisfied with.

**6.1+ — Second client onboarding.** Validates the template against a different
trade business. Triggers visual variation refinements and possible structural
adjustments based on real cross-client experience.

## Gating

Step 5.3 may proceed: Criterion 21 (operational verification of 5.2) was met
June 5, 2026. See `docs/phase-5-evidence.md`.

No remaining gating clauses for Step 5.3 itself.

Future steps maintain their natural ordering dependencies (5.7 depends on the
5.6 product vision; 5.9 depends on the 5.7 section library; 5.12 depends on
5.7-5.11 template completeness). Each step's start is gated on the prior
step's verification — not just gate clearance but operational verification
where the step affects WordPress deployment.

## Triggers (deferred work)

See `docs/technical-debt.md` for the full catalog of deferred work with
trigger conditions.

Notable triggers:

- **Visual customization beyond 5.6:** triggered by second-client requirements
  or first-client refinement requests.
- **Interactive pricing configuration:** triggered by config-file editing
  becoming a bottleneck after multiple adaptations.
- **Operational hardening (idempotency, rate limiting, replay UI):** triggered
  by real operational events (duplicate leads, volume, retry needs).
- **Make.com workflow per-client:** owned per client in 5.4 and onward; each
  client's Make.com setup is independent.

## Out of scope (explicitly not planned)

See `docs/product-vision.md` for the anti-goals section.

- Operator-editing CMS (ADR-0014).
- Multi-tenant runtime tenant switching (ADR-0013).
- Themes registry / per-client theme system.
- Internationalization (until triggered).
- SSR (until SEO/perf justifies).
