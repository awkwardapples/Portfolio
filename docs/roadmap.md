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
| 5.5b-architecture     | Complete | Rendering architecture implementation (Option C hybrid)                                                 |
| 5.5b-architecture-fix | Complete | Asset enqueue gate fix; React app now mounts and renders on React routes                                |
| 5.5c                  | Up next  | SCB-specific customization                                                                              |
| 5.5                   | Planned  | First client adaptation (handyman, priority services)                                                   |
| 5.6                   | Planned  | Visual customization v1 (driven by 5.5 client feedback)                                                 |
| 5.7                   | Planned  | Handyman additional services (driven by lead patterns)                                                  |
| 6.0                   | Planned  | First client production deployment to IONOS                                                             |
| 6.1+                  | Future   | Second client onboarding (validates template)                                                           |

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

**5.5 — First client adaptation.** Empirical test of the 5.3 runbook. Applies
it to the handyman client. Builds the priority subset of the handyman's
services (2-3 services initially). Uses the existing visual default; visual
customization comes in 5.6 based on actual client feedback.

**5.6 — Visual customization v1.** Builds the navbar variants, color/background
system, layout variants, and optional widgets specified in
`docs/product-vision.md`. Scoped based on what 5.5 actually surfaces. Driven
by real first-client feedback, not anticipation.

**5.7 — Service expansion.** Adds more of the handyman's services to the wizard
registry. Driven by which services are getting customer interest, not in bulk.

**6.0 — Production deployment.** First real client goes live on IONOS hosting.
Operational, gated on 5.6 + 5.7 reaching a state the client is happy with.

**6.1+ — Second client onboarding.** Validates the template against a different
trade business. Triggers visual variation refinements, possible structural
adjustments based on real cross-client experience.

## Gating

Step 5.3 may proceed: Criterion 21 (operational verification of 5.2) was met
June 5, 2026. See `docs/phase-5-evidence.md`.

No remaining gating clauses for Step 5.3 itself.

Future steps maintain their natural ordering dependencies (5.5 depends on 5.3
runbook; 5.6 depends on 5.5 feedback; etc.). Each step's start is gated on
the prior step's verification — not just gate clearance but operational
verification where the step affects WordPress deployment.

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
