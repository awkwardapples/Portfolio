# Audit 6.4-D: Shared Test Patterns

_Compiled: 2026-07-22_

## Two genuinely shared (parametrized) test files, both manual-quote-only or universal

### `domain/fixtures/__tests__/manual-quote-configs.test.ts`

Applies to **all manual-quote services** (currently `general-repairs`,
`plumbing`, `electrical`, `carpentry`, `other` — 5 as of Step 6.3). A
`MANUAL_CONFIGS` array of `{ id, config }` pairs feeds `it.each()` blocks
asserting the shared structural contract every manual-quote service must
follow (ADR-0021 Decision 3):

- Passes `validateWizardConfig`.
- `quoteMode === 'manual'`.
- Exactly 7 steps, in the fixed order: `description → urgency → property
→ site_photos → contact_preference → contact → address`.
- `description` step has a required `textarea` field.
- `site_photos` step has a `photo` field, `maxCount: 5`, not required.
- A separate regression `describe` block asserts **no** manual-quote
  service has an `optional-details` step.
- A final `describe` block has one bespoke test per service checking its
  `description` field's label mentions the right trade (or, for `other`,
  is generic) — this part is NOT parametrized, since each service's copy
  is unique by design.

**Adding a new manual-quote service that follows the standard shape**:
add one line to `MANUAL_CONFIGS` and the structural `it.each` blocks
apply automatically — this is the reuse mechanism 6.3 exploited to add
`other` with zero new structural test code.

### `domain/fixtures/__tests__/consent-field.test.ts`

Applies to **every** wizard, instant or manual (currently all 12
services). Two arrays — `INSTANT_CONFIGS` (7 entries, each with
`lastMandatoryStepId: 'contact-and-address'`) and `MANUAL_CONFIGS` (5
entries, each with `lastMandatoryStepId: 'address'`) — feed `it.each`
assertions that:

- The named last-mandatory-step has a required `checkbox`
  `data_processing_consent` field with exactly one option (`value:
'agreed'`).
- That field is the **last** field on that step.
- (Instant only) `optional-details` never collects consent — regression
  guard for the skippable step.

**Adding any new service**: add one line to whichever array matches its
quote mode, with the correct `lastMandatoryStepId` for its flow shape.

## No shared instant-quote structural test file — and why

Unlike manual-quote services, **each instant-quote service has its own
dedicated validation test file** with bespoke, non-parametrized
assertions:

- `fencing-validation.test.ts`
- `decking-validation.test.ts`
- `patio-driveway-steps-validation.test.ts` (covers 3 services in one
  file: patio, driveway, garden steps)
- `painting-validation.test.ts`
- `jetwash-validation.test.ts`

There is no `instant-quote-configs.test.ts` equivalent to
`manual-quote-configs.test.ts`, because instant-quote services are **not
structurally uniform** the way manual-quote services are: they differ in
step count, bracket units (`m` vs `m²`), visual-card option sets, and
pricing shape (see `AUDIT-6.4-pricing-patterns.md`) — there's no single
7-step template to parametrize over. Adding a new instant-quote service
means writing a **new, dedicated test file** for it (following an
existing one, e.g. `patio.config.ts`'s test as the closest template for
an area-based service), not extending a shared array. The guide must be
explicit about this asymmetry — it's the single biggest structural
difference between "adding a manual-quote service" (mostly free test
coverage via `MANUAL_CONFIGS`) and "adding an instant-quote service"
(write bespoke tests, same effort as any of the 7 existing ones took).

## Registry-level shared tests (apply regardless of quote mode)

Three files assert against the **full** registered-service list, not
split by quote mode — these are the "hardcoded count" files from
`AUDIT-6.4-sync-obligations.md`:

- `domain/registry/__tests__/resolve.test.ts` — `ALL_VERTICAL_IDS` (12
  ids in registry order) backs `listVerticalIds()`,
  `resolveVertical(id)` non-null, and per-service `categoryId` assertions.
- `domain/registry/__tests__/services.test.ts` — `ALL_SERVICE_IDS` (same
  12, same order) backs `listEnabledServiceIds()`'s default-all-services
  case, plus a "copy audit" checking no wizard title contains "quote" or
  "request".
- `__tests__/service-selection.test.ts` — a lighter-weight duplicate of
  `services.test.ts`'s length assertion (`ids.length` check), covering
  the same `listEnabledServiceIds()` API from the app-selection-logic
  angle rather than the registry angle.

These three must all be updated together when the total service count
changes — they're not derived from one another (each hardcodes its own
copy of the id list/count), which is exactly why 6.3 needed to touch all
three plus the two shared-fixture files above (5 files total).

## What tests do NOT need updating when a service is added

- Any test in `domain/runtime/__tests__/` (FSM, transition, validation)
  — entirely config-agnostic, tested against small synthetic wizard
  configs of its own construction.
- `domain/registry/__tests__/categories.test.ts` — asserts against the
  4-entry `CATEGORIES` registry only, never against `VERTICALS` or a
  service count.
- Any `src/site/**` test (routing, sections, content) **except**
  `content.test.ts`'s work-entry validity check (see
  `AUDIT-6.4-sync-obligations.md`'s "Other content referencing service
  ids" note) and `ServicesPreview/__tests__/services-preview.test.ts`
  (only if the new service is also added to a homepage `ServicesPreview`
  section — optional, not required).
