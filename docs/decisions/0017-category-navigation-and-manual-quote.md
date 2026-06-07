# ADR-0017: Category Navigation and Manual-Quote Service Routing

**Status:** Accepted
**Date:** 2026-06-07

## Context

Step 5.5a introduces template capabilities driven by the first real client
engagement (SCB Handyman). The client requires two features that the template
did not previously support:

1. **Multi-category service offerings.** The client offers services across
   distinct trade categories (landscaping, decorating, general handyman). A flat
   list of all services without grouping is too unwieldy at the selection screen.
   Clients with fewer services (Acme Fencing template: two services) do not need
   this; it should be opt-in.

2. **Manual-quote services.** Some of the client's services cannot be reasonably
   priced via wizard configuration (variable scope, customer-supplied materials,
   novel job types). For these, the wizard should collect a description and
   contact details, and route the submission as a quote request for the contractor
   to assess manually, rather than presenting an instant price.

These requirements emerged from a real client engagement, not anticipation. The
architecture principles (ADR-0014: template-clone, not SaaS; ADR-0013: closed
registry; ADR-0012: no presentation in domain) remain unchanged.

## Decision

### 1. Category navigation

A new **category registry** (`src/domain/registry/categories.ts`) holds
`CategoryConfig` records. Each vertical (service) can declare an optional
`categoryId` linking it to a category.

Category navigation is enabled per-deployment via a new boolean field
`enableCategoryNavigation` in `PublicConfig` (defaults to `false`). When
`false`, the wizard behaves identically to pre-5.5a (single flat service list,
no category selection).

When `true`, the `QuotePage` presents a category selector before the service
selector, and the service selector is filtered to show only the services in the
chosen category.

The FSM gains a `'category_selection'` phase and a `CATEGORY_SELECTED` event
for state tracking and future use. In the current implementation, category
navigation is handled at the page level (`QuotePage.tsx`) and the FSM phase is
plumbed for forward compatibility.

The `CATEGORIES` registry in the template is empty by default. Each client fork
populates it in the same commit that configures their services.

### 2. Manual-quote service routing

Each wizard config can declare `quoteMode: 'instant' | 'manual'` (optional;
defaults to `'instant'` when absent). This preserves backward compatibility
with all existing configs.

- **Instant** (`quoteMode: 'instant'` or absent): pricing is computed and the
  pricing gate applies before submission. The user sees a price range.
- **Manual** (`quoteMode: 'manual'`): pricing is not computed and the pricing
  gate is bypassed. The submission is routed as a manual-quote request. The
  user sees a summary indicating the contractor will assess and quote.

The PHP `SubmissionController` accepts manual submissions (pricing field null
or absent when `quoteMode = 'manual'`). The `Forwarder` passes `quoteMode`
through the webhook payload so Make.com workflows can route accordingly.

### 3. Wire contract version bump

`PublicConfig.contractVersion` bumps from 2 to 3. The bump is additive: all
existing fields are preserved. The TS bundle and PHP plugin must be deployed
together (existing lockstep constraint from ADR-0015). The `SubmissionController`
checks for contractVersion 3.

## Consequences

### Positive

- Future clients can opt in to category navigation without code changes.
  Opt-out is the default, preserving all existing single-trade deployments.
- Manual-quote routing handles trades where instant pricing is impossible or
  unhelpful, expanding the template's addressable client range.
- Both capabilities are reusable and configuration-driven, consistent with
  ADR-0014.

### Negative

- `PublicConfig` contractVersion bumps to 3; existing installations require
  redeployment of both PHP plugin and JS bundle to continue operating.
- FSM gains a new phase and branch, increasing complexity.
- Each client fork that uses categories must populate the `CATEGORIES` registry
  and assign `categoryId` to relevant verticals.

### Risks

- Manual-quote services that should use instant pricing — config error. Mitigated
  by clear documentation in `docs/adaptation-runbook.md`.
- Categories with zero services — schema validation rejects empty-service
  categories during config authoring.

## Alternatives considered

- **Grouped-fields composite for complex service workflows.** Considered but
  deferred: workflow decomposition (sequential steps, one sub-task per step)
  handles the target case via existing capability. Trigger to revisit: multiple
  client deployments demonstrate a limitation that decomposition cannot solve.

- **Manual-quote as a special-case service type with hardcoded behavior.**
  Rejected per ADR-0014 discipline: capabilities must be configuration-driven,
  not implemented as special cases.

## Cross-references

- ADR-0013 (Vertical Registry System) — registry extended with optional category
  dimension; amendment below.
- ADR-0014 (Reference Template Product Scope) — capabilities benefit all client
  forks, not only the first client.
- ADR-0015 (Submission Pipeline Architecture) — payload widened; amendment below.
