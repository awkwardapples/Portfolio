# ADR-0036: Service Customization Guide

**Status:** Accepted (Step 6.4, 2026-07-22)

## Context

Steps 6.1–6.3 each independently rediscovered the same class of problem:
a spec's planning assumptions about file layout, schema shape, or sync
obligations didn't match the real codebase, requiring a Phase 0 audit to
correct course before implementation. 6.3 in particular surfaced a
previously-undocumented cross-cutting obligation
(`ServiceSchemaEmitter.php`'s PHP mirror of the JS service registry) that
no prior planning document anticipated.

Service-level customization (adding a service, adjusting pricing,
managing categories) is exactly the kind of task an LLM performing
per-client adaptation will be asked to do repeatedly, without the benefit
of the Phase-0-audit discipline this project's own step-by-step process
enforces. Without a single, accurate, LLM-followable reference, each
customization pass would need to independently rediscover the same facts
6.1–6.4 already worked out — or worse, act on the same wrong assumptions
those specs started with.

## Decision

Create `docs/service-customization-guide.md` (D1=A: single file, not a
directory of smaller docs) as the authoritative reference for all
service-level customization, organized by operation (D2=A): adding,
removing, modifying questions, adjusting pricing, updating metadata,
managing categories, toggling quote modes.

Each operation includes:

- A worked example (D3=B) grounded in a real, plausible scenario (e.g.
  adding a "Shed Building" manual-quote service; repricing one fence
  type for a hypothetical client).
- The reasoning behind each step (D4=B), not just the mechanical action
  — e.g. _why_ a shed-building service is manual rather than instant, not
  just _that_ it is.
- An explicit sync-obligation checklist (D5=C) rather than prose alone,
  so a customization pass can be verified mechanically against a list.
- Explicit per-operation testing guidance (D6=A) — what to run, what a
  failure means, and where shared test coverage comes for free vs. where
  it doesn't (the manual-quote vs. instant-quote asymmetry discovered in
  Audit D).
- Anti-patterns as inline warnings at the point of relevance (D7=C),
  rather than collected only in a single end-of-document "Pitfalls"
  section — though Section 11 does also collect them centrally, per the
  spec's own requested structure, as a second discoverability path.

Phase 0 audits (`AUDIT-6.4-sync-obligations.md`,
`apps/wizard/src/domain/AUDIT-6.4-pricing-patterns.md`,
`apps/wizard/src/domain/AUDIT-6.4-categories.md`,
`apps/wizard/src/__tests__/AUDIT-6.4-shared-tests.md`) verified every
factual claim in the guide against the current source rather than
carrying forward assumptions from the planning spec or prior steps'
memory — see "Deviations from the spec" below for what those audits
overturned.

Per D8=B, this step does not attempt to clean up any pre-existing
lint/type drift or other pre-existing issues discovered along the way —
that's explicitly deferred to a separate 6.5 cleanup step.

## Consequences

**Positive:**

- Future service customization work (by an LLM or a human) has a single,
  verified reference instead of needing to re-derive sync obligations,
  pricing structure, and category semantics from scratch each time.
- The guide's own worked examples double as regression documentation —
  if the codebase changes in a way that invalidates a worked example, a
  careful reader who tries to follow it will notice the mismatch.
- Explicit checklists (Section 9) make a customization pass auditable:
  a reviewer can check each box against the actual diff.

**Negative:**

- Documentation drift risk (Risk #2 in the spec): the guide describes a
  point-in-time codebase state (12 services, 5 hardcoded-count files,
  specific pricing numbers). Mitigated by an explicit "Before you start"
  note at the top of the guide instructing the reader to re-verify counts
  and paths via the grep commands given in Section 10, rather than
  trusting the document as permanently byte-accurate.
- A single ~1100-line file is long to read start-to-finish, though the
  table of contents and per-operation structure are designed for
  targeted lookup rather than linear reading.

**Neutral:**

- Documentation-only step: no code changes, no test changes, no
  architectural changes. `pnpm test` output and bundle size are
  identical before and after this step.

## Discovery during implementation: a real scope conflict with the existing handoff document's rules

`llm-customization-handoff.md`'s Rule 1 ("Scope boundary") explicitly
forbids the per-client customization LLM from modifying
`apps/wizard/src/domain/` (including the vertical registry and, by
extension, service fixture configs), `plugins/quote-wizard/src/`
(including `ServiceSchemaEmitter.php`), and any test file — precisely the
files the new service-customization-guide.md instructs an engineer to
edit. Simply adding "see the new guide" without addressing this would
leave two documents giving contradictory instructions to whoever reads
both. Resolved by adding an explicit note before Rule 1 clarifying these
are two different tasks: `llm-customization-handoff.md` continues to
govern the narrower, lower-supervision per-client content/branding/SEO
pass (Rule 1/Rule 2 unchanged, still enforced); adding/removing/
restructuring a service is a separate, broader engineering task that uses
`service-customization-guide.md` and is explicitly _not_ authorized under
the existing document's rules. This wasn't anticipated by the spec's own
Section 4.2 (which just asked for "a prominent reference") — it surfaced
only by actually reading Rule 1 before writing the reference, the same
verify-before-writing discipline the rest of this ADR describes.

## Deviations from the spec

Several of the spec's own illustrative assumptions, if copied into the
guide verbatim, would have taught wrong information. Each was corrected
against the Phase 0 audits before writing:

- **No per-service pricing function.** The spec's Section 5.2 assumed
  "Each instant-quote service has pricing logic in its config file...
  functions like `calculatePricing()` or `estimateJob()`." There is
  exactly one shared engine (`pricing-engine.ts`'s `computePrice()`)
  evaluating declarative `PricingConfig` data — no per-service function
  exists anywhere. See `AUDIT-6.4-pricing-patterns.md`.
- **No `RATES_PER_METER`-style lookup constant.** The spec's Section 5.3
  worked example showed editing a module-level rate table. Real rates
  are `base.perUnitPence` (a single number) plus per-type **modifier
  factors** (multipliers on the base), not a table of absolute rates —
  the guide's worked pricing example uses the real shape instead.
- **No `apps/wizard/src/content/services-content.ts` path** (missing
  `site/`) and **no `domain/fixtures/index.ts` aggregator** — both
  already corrected in 6.1/6.3, reconfirmed here.
- **No `type: 'multi-field-form'` step discriminant** and **no
  `WizardConfig.name`/`.description` fields** — already corrected in
  6.2/6.3, reconfirmed and explained in Section 1.2/2.2 with the
  underlying reason (strict-object Zod schemas reject unrecognized keys
  outright).
- **`ServiceSchemaEmitter.php`'s `category` field is not where categories
  are assigned** — the spec's Section 7.2 illustrative snippet edits that
  PHP file to assign a category. The real assignment is `verticals.ts`'s
  `Vertical.categoryId`; the PHP field is a downstream, non-authoritative
  mirror. See `AUDIT-6.4-categories.md`.
- **No second "category enumeration" file** — the spec's Section 7.2
  says "Also update category configuration file if categories are
  enumerated separately." There is no such second file;
  `domain/registry/categories.ts` is the sole source.
- **Quote-mode toggling is not a flag flip** — the spec's Section 8
  reads like a one-line `quoteMode` change. In practice it requires
  replacing most of the `steps[]` array, since instant- and manual-quote
  services use structurally different step kinds. The guide's Section 8
  states this explicitly as the first thing a reader sees for that
  operation, to prevent underestimating the scope.
- **`ICON_MAP`/`services-preview.test.ts` investigated and found not to
  be a missing sync obligation** (a plausible "6th file" 6.3 might have
  missed) — it's a curated homepage-feature subset, decoupled by design
  from the full service registry. Documented as a _conditional_, not
  _mandatory_, sync surface. See `AUDIT-6.4-sync-obligations.md`.
- **Manual-quote vs. instant-quote test-coverage asymmetry** — the
  spec's Section 10.2 implies uniform "shared parametrized tests" apply
  broadly. In reality, only manual-quote services get near-free coverage
  via `MANUAL_CONFIGS`; instant-quote services have no equivalent shared
  suite and always need a bespoke test file. See `AUDIT-6.4-shared-
tests.md`.

## Cross-references

- `docs/AUDIT-6.4-sync-obligations.md`,
  `apps/wizard/src/domain/AUDIT-6.4-pricing-patterns.md`,
  `apps/wizard/src/domain/AUDIT-6.4-categories.md`,
  `apps/wizard/src/__tests__/AUDIT-6.4-shared-tests.md`
- `docs/service-customization-guide.md` (this ADR's subject)
- ADR-0021 (Wizard Service Library — Decision 3: uniform manual-quote
  structure; Decision 4: categoryId assignment)
- ADR-0033, ADR-0034, ADR-0035 (Steps 6.1–6.3 — each independently
  established the "verify against the real codebase, don't trust the
  planning spec's assumed shape" discipline this guide generalizes)
