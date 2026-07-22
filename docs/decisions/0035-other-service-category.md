# ADR-0035: "Other" Service Category

**Status:** Accepted (Step 6.3, 2026-07-22)

## Context

Trade businesses often offer more services than the wizard's defined
list. Rather than build a dedicated wizard flow for every possible
service (sheds, garden storage, custom outdoor structures, etc.), "Other"
catches the long tail as a manual-quote service.

Phase 0 audits (`AUDIT-6.3-service-structure.md`, `AUDIT-6.3-manual-
flow.md`, `AUDIT-6.3-textarea.md`), building on 6.1/6.2's precedent of
checking assumptions against the real codebase, found the spec's assumed
implementation shape didn't match reality in several ways:

- **No `domain/fixtures/index.ts` aggregator exists.** Service
  registration happens in `domain/registry/verticals.ts`, a frozen
  `Readonly<Record<string, Vertical>>` object literal. There is no
  explicit `position`/`displayOrder` field on `Vertical` — the _only_
  ordering mechanism is where a service's key sits in that object literal
  (`listEnabledServiceIds()`'s default case is `Object.keys(VERTICALS)`).
- **The manual-quote flow's real shape is not "postcode → project
  description → photos → contact → optional details."** All four
  existing manual-quote services (`general-repairs`, `plumbing`,
  `electrical`, `carpentry`) share an identical 7-step sequence —
  `description → urgency → property → site_photos → contact_preference →
contact → address` — established by ADR-0021 Decision 3. Postcode is
  collected **last**, bundled with consent in the `address` step, not
  first. There is **no `optional-details` step on any manual-quote
  service** (confirmed by an existing regression test in
  `manual-quote-configs.test.ts`). Postcode is additionally injected
  _unconditionally_ ahead of every wizard (instant or manual) by
  `QuotePage.tsx`'s `preSteps: [addressPreStep]` — an engine-level
  mechanism outside any service's own config, pre-existing and unrelated
  to this step.
- **`FieldSchema` has no `placeholder` field**, and `TextareaField.tsx`
  doesn't forward one to the DOM `<textarea>` either — consistent with
  6.1/6.2's finding that config-level example/helper text belongs in the
  existing `help` string, not a new schema field.
- **The existing `description`/`work_description` step and field naming
  already _is_ "a dedicated project description step" (D5=B)** — every
  manual-quote service already has one; "Other" needs the same
  mechanism with different copy, not a new one.
- **`ServiceSchemaEmitter.php` (Step 5.10b, PHP SEO Layer 3) maintains
  its own static mirror of the service registry**, with an explicit
  written maintenance contract in its own doc comment and in
  `SERVICE-REGISTRY-AUDIT.md`: "When a new service is added to
  `verticals.ts`... `ServiceSchemaEmitter::SERVICES` must be updated in
  the same commit." This is a real, load-bearing consistency rule this
  step must honor — not touching it would leave the template
  self-contradicting its own documented sync discipline, even though the
  spec's Architecture Overview didn't list this file.

## Discovery during implementation

`ServiceSchemaEmitter.php` maintains a static PHP `SERVICES` array
mirroring the JS registry (Step 5.10b — a deliberate tradeoff since "there
is no PHP service registry," per `SERVICE-REGISTRY-AUDIT.md`). Its own
sync-discipline note applies here, so `other` was added there too, plus
one `services-content.ts` marketing entry it draws its description from.
`category` — a required field on every existing PHP entry — was made
optional in that one array's shape (`category?: string`) to represent
`other`'s deliberate lack of a category rather than fabricating one;
`build_service_schema()` now omits the schema.org `category` field
entirely when absent, the same way it already omits `areaServed` when
unset. 1 new PHPUnit test (249→250) confirms the omission.

## Decision

New service `other` added via `domain/fixtures/other.config.ts` and
registered as the **last key** in `domain/registry/verticals.ts`'s
`VERTICALS` object literal (the only "last in service list" mechanism
that exists, per D1=A):

- **Label:** "Other services" (D2=B), set as both `Vertical.label` and
  `WizardConfig.title`.
- **Flow:** The exact same 7-step structure as the other four
  manual-quote services — `description → urgency → property →
site_photos → contact_preference → contact → address` — with only the
  `description` step's copy changed to be trade-agnostic (D4=A, D5=B).
  Deliberately **not** using the spec's illustrative `project_description`
  step/field id: keeping the standard `description`/`work_description`
  naming lets "other" plug into the existing shared parametrized test
  suites (`manual-quote-configs.test.ts`, `consent-field.test.ts`) as a
  fifth manual-quote service with zero special-casing, exactly the reuse
  those suites were built to support.
- **`categoryId`:** left unset. None of the four existing categories
  (`landscaping`, `decorating`, `exterior-cleaning`, `handyman`) fit an
  uncategorized catch-all; `categoryId` is documented as optional
  precisely for this case ("still fully functional and visible when
  category navigation is disabled" — `domain/registry/types.ts`).
- **Default state:** Enabled — automatic, requires no WordPress admin
  toggle. `listEnabledServiceIds()`'s no-override case returns
  `Object.keys(VERTICALS)`, so registering the vertical is the only
  action needed for D7=A.

## Consequences

**Positive:**

- Captures leads for services outside the 11 primary offerings via the
  same trusted manual-quote pipeline (bot protection, duplicate
  detection, consent — all apply unchanged).
- Zero new mechanism: no new step kind, no schema change, no new field
  type. Pure config + one registry entry.
- Reuses the existing manual-quote shared test suites instead of
  duplicating ~10 structural assertions per new service.

**Negative:**

- Business owner must handle diverse, unstructured inbound requests with
  no automated pricing.
- One more entry in the service selector for users to scan past — "Other"
  itself is the standard 7-step manual flow, the same length as every
  other manual-quote service, so it adds no extra steps for users who do
  select it.

**Neutral:**

- When a client deployment has `enableCategoryNavigation: true` and a
  user drills into a specific category, "Other" (no `categoryId`) will
  not appear in that filtered list — only in the flat "all services"
  view. `enableCategoryNavigation` defaults to `false` template-wide, so
  this affects no current deployment; a per-client fork that wants
  "Other" categorized can simply add a `categoryId`.
- `src/site/content/services-content.ts` (the marketing `/services` page
  content) **was** updated with an "Other services" entry — not because
  any test requires it (none does; it's independent of the `VERTICALS`
  registry), but because `ServiceSchemaEmitter.php`'s descriptions are
  explicitly drawn from this file's `description` field, and the two are
  meant to move together. The entry's exact wording (summary/description
  copy) remains a content customization surface for whoever adapts the
  site per-client.

## Deviations from the spec

- **No `domain/fixtures/index.ts`** — registration is in
  `domain/registry/verticals.ts` instead. See `AUDIT-6.3-service-
structure.md`.
- **Standard manual-quote flow, not the spec's illustrative
  postcode-first/optional-details flow** — matched the real, uniform
  structure all four existing manual-quote services already share. See
  `AUDIT-6.3-manual-flow.md`.
- **No `placeholder` field** — folded the spec's example text into the
  existing `help` string. See `AUDIT-6.3-textarea.md`.
- **`description`/`work_description` naming kept instead of the spec's
  `project_description`** — deliberate, for shared-test-suite reuse (see
  Decision above).
- **Test plan reframed around the real validation mechanism**, same as
  6.2: "Continue blocked without project description" became direct
  `validateStep()` assertions against the real config; "submission
  includes project_description" became a `state.answers` assertion via
  `createWizardStore`, proportionate to how this codebase already
  verifies payload plumbing elsewhere.
- **Structural coverage came primarily from extending the existing
  shared test files** (`manual-quote-configs.test.ts`,
  `consent-field.test.ts`, `resolve.test.ts`, `services.test.ts`,
  `service-selection.test.ts`) rather than writing ~15 new bespoke
  assertions — this is the reuse those parametrized suites exist for, not
  under-testing.
- **One PHP file was touched despite the spec's implicit "no PHP
  changes" assumption** ("PHP tests: 249 → 249 (unchanged)").
  `ServiceSchemaEmitter.php`'s own documented sync-discipline contract
  ("must be updated in the same commit") outweighs the spec's silence on
  it — leaving it un-synced would violate a rule this codebase already
  wrote down for itself. PHP went from 249 → 250 passed (4 skipped,
  unchanged).

## Cross-references

- `AUDIT-6.3-service-structure.md`, `AUDIT-6.3-manual-flow.md`,
  `AUDIT-6.3-textarea.md`
- ADR-0021 (Wizard Service Library — Decision 3: uniform manual-quote
  structure; Decision 4: categoryId assignment)
- ADR-0033, ADR-0034 (Steps 6.1/6.2 — established the pattern of
  checking spec assumptions against `domain/fixtures/`'s real structure
  before implementing)
