# ADR-0021: Wizard Service Library

**Status:** Accepted (Step 5.9, June 2026)

## Context

Per `docs/product-vision.md` §2.3 and §3.2–3.4, the template provides a library of common
handyman wizard configurations. The existing engine (Steps 4.0–4.8) supports both instant-quote
and manual-quote pathways (ADR-0017). Step 5.9 implements 7 new service wizards alongside the
2 existing ones (fencing, decking) to total 9 services covering common handyman work.

This ADR captures structural decisions for the service library that govern how new services are
added in future client forks.

## Decisions

### Decision 1 — Single-file config pattern

Each wizard service is a single `*.config.ts` file under
`apps/wizard/src/domain/fixtures/`. This mirrors the existing fencing and decking pattern
(canonical reference configs). There are no sub-folders per service.

Each instant-quote file exports two named constants:

- `{name}WizardConfig: WizardConfig`
- `{name}PricingConfig: PricingConfig`

Each manual-quote file exports one named constant:

- `{name}WizardConfig: WizardConfig`

plus imports `manualQuotePricingStub` from the shared stub file.

### Decision 2 — Manual-quote pricing stub

The `Vertical` registry type requires a `pricing: PricingConfig` field (non-optional, introduced
in Step 4.5 for the instant-quote case). Manual-quote services cannot provide a meaningful
pricing config because they bypass the pricing gate entirely (ADR-0017 / `quoteMode: 'manual'`).

A shared `manualQuotePricingStub` in
`apps/wizard/src/domain/fixtures/manual-quote-pricing-stub.ts` satisfies the type requirement
with structurally valid but semantically null values. The stub is never evaluated by the pricing
engine at runtime; it exists only to satisfy the `Vertical` interface.

All 4 manual-quote services import this stub. Validation tests for manual-quote configs do NOT
call `validatePricingConfig` (which would fail on the stub's non-existent quantityFieldId) —
only `validateWizardConfig`.

### Decision 3 — Uniform manual-quote field set

Manual-quote services (general repairs, plumbing, electrical, carpentry) share a uniform step
structure:

1. Description (textarea — service-specific prompt)
2. Urgency (select: emergency / this week / this month / flexible)
3. Property type (select: residential / commercial)
4. Photos (photo, optional, maxCount 5)
5. Contact preference (radio: phone / email / either)
6. Contact details (text: name, phone, email)
7. Address (text: postcode)

Only the description step prompt differs per service. This uniformity is deliberate: the template
provides a functional lead-capture flow; per-client field refinement happens at 5.12 and
subsequent onboardings.

### Decision 4 — Four standard categories with opt-in navigation

The `registry/categories.ts` registry is populated with four categories:

| Category          | ID                  | displayOrder |
| ----------------- | ------------------- | ------------ |
| Landscaping       | `landscaping`       | 1            |
| Decorating        | `decorating`        | 2            |
| Exterior Cleaning | `exterior-cleaning` | 3            |
| Handyman Services | `handyman`          | 4            |

Category navigation remains **disabled by default** (`enableCategoryNavigation: false` per
ADR-0017). Client forks enable it via `PublicConfig` when service breadth warrants it. All
9 verticals carry a `categoryId` assignment for use when navigation is enabled.

### Decision 5 — Placeholder pricing

Initial pricing formulas use arbitrary values producing plausible-looking estimates but not
calibrated to real-world handyman pricing. Placeholder is intentional:

- The template's purpose is structural reuse, not pre-calibrated pricing.
- Pricing accuracy is a per-client concern addressed at 5.12 (SCB) and equivalent steps.
- The pricing engine enforces integer pence and deterministic evaluation; calibration is a
  data change, not a code change.

### Decision 6 — String-keyed icon map in ServicesPreview

Service icons are 24×24 inline SVG components in
`apps/wizard/src/site/sections/ServicesPreview/icons/`. A string-keyed `ICON_MAP` in
`icons/index.ts` maps service IDs to icon components. The `ServicesPreviewLayout` looks up
the icon by `service.iconOrImage` string and renders it when present.

Content files (`.ts`) pass a string key (e.g. `iconOrImage: 'fencing'`); the Layout TSX
resolves to the component. This avoids requiring content files to become `.tsx`.

## Consequences

### Positive

- 9 services immediately available for any client fork.
- Manual-quote and instant-quote services share consistent UX patterns.
- Category navigation is defined and ready; no engine changes needed to activate it.
- Bundle impact is bounded — configs are data, not heavy logic.
- Single-file pattern keeps addition of new services to a one-PR change.

### Negative

- Pricing is decorative until calibrated per-client.
- Manual-quote field set is generic; specific trades may want different questions.
- Stub pricing config requires awareness of why manual-quote verticals carry it.

### Risks

- Real handymen may find manual-quote field prompts too generic; addressed at 5.12.
- Pricing estimates may look implausible for unusual jobs; documented and expected.

## Cross-references

- ADR-0017: `quoteMode: 'manual'` pathway and `enableCategoryNavigation`
- ADR-0020: Section library architecture (Footer extends this pattern)
- `docs/product-vision.md` §2.3, §3.4
- `apps/wizard/src/domain/fixtures/manual-quote-pricing-stub.ts`
