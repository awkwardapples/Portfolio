# Service Customization Guide

Comprehensive guide for adapting the wizard's service offerings to a
specific client's needs. Written for LLM-driven customization — every
operation has a worked example, an explicit sync-obligation checklist,
and the reasoning behind each step, not just the mechanical action.

**Before you start:** this guide describes the codebase as of Step 6.4
(2026-07-22, 12 registered services: fencing, decking, patio, driveway,
steps, painting, jetwash, general-repairs, plumbing, electrical,
carpentry, other). File paths, counts, and code shapes below were
verified against the real source at that point — see
`docs/AUDIT-6.4-sync-obligations.md`, `apps/wizard/src/domain/AUDIT-6.4-
pricing-patterns.md`, `apps/wizard/src/domain/AUDIT-6.4-categories.md`,
and `apps/wizard/src/__tests__/AUDIT-6.4-shared-tests.md` for the
supporting audit trail. **If you're reading this in a codebase that has
since evolved, verify service counts and file shapes against the current
source before trusting a code snippet here verbatim** — re-run the greps
in Section 10 and Appendix C rather than assuming this document is still
byte-accurate. This document itself needed correcting against several
wrong assumptions that seemed reasonable before verification (see the
inline notes marked **Corrected assumption** throughout) — the discipline
that produced this guide is the discipline it asks you to keep using.

## Table of Contents

1. [Understanding Services](#1-understanding-services)
2. [Adding a New Service](#2-adding-a-new-service)
3. [Removing a Service](#3-removing-a-service)
4. [Modifying Service Questions](#4-modifying-service-questions)
5. [Adjusting Pricing Formulas](#5-adjusting-pricing-formulas)
6. [Updating Service Metadata](#6-updating-service-metadata)
7. [Managing Service Categories](#7-managing-service-categories)
8. [Toggling Quote Modes](#8-toggling-quote-modes)
9. [Sync Obligation Checklists](#9-sync-obligation-checklists)
10. [Testing Guidance](#10-testing-guidance)
11. [Common Pitfalls](#11-common-pitfalls)

- [Appendix A: Service Templates](#appendix-a-service-templates)
- [Appendix B: Pricing Formula Reference](#appendix-b-pricing-formula-reference)
- [Appendix C: Sync Obligation Map](#appendix-c-sync-obligation-map)

---

## 1. Understanding Services

The wizard supports two categories of service, distinguished by
`WizardConfig.quoteMode`:

**Instant-quote services** — show a calculated price range before the
user submits. Currently 7: `fencing`, `decking`, `patio`, `driveway`,
`steps` (garden steps), `painting`, `jetwash`.

**Manual-quote services** — collect a description and contact details;
the business owner reviews and quotes manually, no price shown in the
wizard. Currently 5: `general-repairs`, `plumbing`, `electrical`,
`carpentry`, `other`.

### 1.1 Where a service lives

Each service is defined across up to four files:

| File                                                    | Role                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `apps/wizard/src/domain/fixtures/<service>.config.ts`   | The wizard's step sequence (`WizardConfig`) and pricing rules (`PricingConfig`)                        |
| `apps/wizard/src/domain/registry/verticals.ts`          | Registration — the `VERTICALS` object literal is the single source of truth for "which services exist" |
| `apps/wizard/src/site/content/services-content.ts`      | Marketing copy for the `/services` page and homepage preview                                           |
| `plugins/quote-wizard/src/SEO/ServiceSchemaEmitter.php` | SEO structured-data mirror (schema.org `Service` JSON-LD)                                              |

**Corrected assumption:** an earlier draft of this project's own planning
documents assumed a `apps/wizard/src/content/services-content.ts` path
(no `site/`) and a `apps/wizard/src/domain/fixtures/index.ts` aggregator.
Neither exists. Registration is in `domain/registry/verticals.ts`, and
marketing content is under `site/content/`. Always confirm a path with
`Glob`/`find` before writing to it — this guide gives you the _correct_
paths, but codebases drift, and trusting a remembered path over the
actual filesystem is how sync gaps happen in the first place.

### 1.2 What a `WizardConfig` actually looks like

```ts
interface WizardConfig {
  schemaVersion: 1;
  id: string; // stable id, must match the verticals.ts registry key
  quoteMode?: 'instant' | 'manual'; // optional; absent is treated as 'instant'
  title: string; // the only human-facing name at this layer
  steps: AnyStep[];
}
```

There is **no `name`, `description`, or `features` field on
`WizardConfig` itself** — those live in `services-content.ts` instead
(Section 6). `title` is what appears in the wizard's own header; it is
not the marketing copy.

### 1.3 What a registry entry (`Vertical`) looks like

```ts
interface Vertical {
  id: string;
  label: string; // diagnostic/internal only — never shown as UI copy
  schemaVersion: 1;
  categoryId?: string; // optional; see Section 7
  wizard: WizardConfig;
  pricing: PricingConfig; // real formula for instant-quote; manualQuotePricingStub for manual-quote
}
```

### 1.4 Service order

Services appear in the wizard's service list, and in
`listEnabledServiceIds()`'s default (no per-client override) case, in
**registry key insertion order** — i.e., the literal order properties
appear in the `VERTICALS = Object.freeze({ ... })` object in
`verticals.ts`. **There is no numeric `position`/`displayOrder` field on
`Vertical`** (unlike categories — see Section 7, which do have one).
Moving a service earlier or later in the list means moving its key
earlier or later in that object literal, nothing else.

### 1.5 Step composition: instant vs. manual

Manual-quote services share one uniform 7-step shape (ADR-0021 Decision 3) — see Section 2.2 and Appendix A. Instant-quote services do **not**
share a uniform shape: each uses whatever combination of the size-
bracket-selector / visual-card-selector / estimate-display step kinds
(from `domain/config/wizard-config.ts`) and classic field steps fits that
trade, and each has its own dedicated test file rather than a shared one
(Section 10.2).

---

## 2. Adding a New Service

### 2.1 Files You'll Touch

**Required (see Appendix C for the full obligation table):**

1. New config: `apps/wizard/src/domain/fixtures/<service>.config.ts`
2. Registry: `apps/wizard/src/domain/registry/verticals.ts` (new `Vertical` const + one new key in `VERTICALS`)
3. Marketing: `apps/wizard/src/site/content/services-content.ts` (new `ServiceEntry`)
4. SEO: `plugins/quote-wizard/src/SEO/ServiceSchemaEmitter.php` (new `SERVICES` entry — **documented same-commit obligation**, see `SERVICE-REGISTRY-AUDIT.md` in that same directory)
5. Test files with hardcoded service counts/lists — as of this writing, exactly 5 (Section 9, Appendix C); **re-grep before trusting this number**, since it changes any time a service is added or removed.

**Conditional (only if applicable to this client):**

- A `categoryId` on the new `Vertical`, if category navigation matters for this deployment (Section 7).
- An `ICON_MAP` entry (`site/sections/ServicesPreview/icons/`) plus a `home-page-content.ts` `ServicesPreview` entry, **only if** you want this service featured on the homepage — most services are _not_ featured there (only 6 of the current 12 are), so this is optional, not required.

### 2.2 Steps to Add a Service

**Step 1 — choose the pattern.**

- **Instant quote** (real-time price): pick the closest existing service
  as a structural template based on its pricing unit (Appendix A) —
  length-based (`fencing`), area-based (`patio`/`driveway`/`decking`), or
  count-based (`painting`'s per-room, `steps`'s per-step). Copy its step
  sequence and adapt the size-bracket/visual-card options and pricing
  numbers.
- **Manual quote** (business owner quotes by hand): copy any existing
  manual-quote config — they are structurally identical (ADR-0021
  Decision 3), so the choice of which one to copy only matters for which
  wording you're adapting from. `other.config.ts` has the most
  trade-neutral copy if you're building something genuinely novel.

**Step 2 — create the config file.**

Manual-quote shape (the uniform 7-step pattern every existing
manual-quote service follows):

```ts
import type { WizardConfig } from '@/domain/config/wizard-config';
import { manualQuotePricingStub } from '@/domain/fixtures/manual-quote-pricing-stub';

export const shedWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'shed',
  quoteMode: 'manual',
  title: 'Shed building',
  steps: [
    {
      id: 'description',
      title: 'Describe the work',
      description: "Tell us what you need and we'll get back to you with a custom quote.",
      fields: [
        {
          id: 'work_description',
          key: 'work_description',
          type: 'textarea',
          label: 'Please describe the shed you need (size, materials, location in the garden)',
          help: 'The more detail you give, the more accurate our quote will be.',
          required: true,
        },
      ],
    },
    // urgency, property, site_photos, contact_preference, contact, address —
    // copy verbatim from any existing manual-quote config (e.g. carpentry.config.ts).
    // These five steps are byte-identical across every manual-quote service; only
    // the description step's copy differs. Do not improvise a different shape here —
    // it will fail to plug into the shared test suite (Section 10.1) and will
    // diverge from ADR-0021 Decision 3 for no benefit.
  ],
};

export const shedPricingConfig = manualQuotePricingStub;
```

**Corrected assumption:** there is no `type: 'multi-field-form'` step
kind, and `WizardConfig` has no top-level `name`/`description` fields —
an earlier draft of this project's planning documents assumed both. A
step with a `fields[]` array and no `stepKind` property _is_ the
"multi-field form" — that's simply what a classic field step is called in
this schema. Adding a literal `type: 'multi-field-form'` key to a step
object will fail Zod validation (`StepSchema` is a `z.strictObject`; any
key it doesn't recognize is a validation error, not a silent no-op).

**Step 3 — register in `verticals.ts`.**

```ts
import { shedWizardConfig, shedPricingConfig } from '@/domain/fixtures/shed.config';

// ... existing Vertical consts ...

const shed: Vertical = {
  id: 'shed',
  label: 'Shed Building',
  schemaVersion: 1,
  categoryId: 'landscaping', // omit entirely if this service shouldn't be categorized
  wizard: shedWizardConfig,
  pricing: shedPricingConfig,
};

export const VERTICALS: Readonly<Record<string, Vertical>> = Object.freeze({
  fencing,
  decking,
  painting,
  patio,
  driveway,
  steps,
  jetwash,
  'general-repairs': generalRepairs,
  plumbing,
  electrical,
  carpentry,
  shed, // ← new service — placed before 'other'
  other, // ← keep 'other' last, per ADR-0035 (it's the long-tail catch-all)
});
```

**Warning:** object key order **is** display order — there is no other
ordering mechanism to fall back on. If your new service should appear
before `other` but after everything else, this is the only place that
decision is made. Placing it after `other` would put a named, specific
service behind the generic catch-all in the list, which reads oddly to
users — keep `other` last unless a client explicitly wants it elsewhere.

**Step 4 — add marketing content** (`services-content.ts`):

```ts
{
  id: 'shed',
  name: 'Shed Building',
  summary: 'Custom garden sheds and storage buildings.',
  description:
    'Bespoke garden sheds in a range of sizes and materials, from simple storage ' +
    "to fully-fitted workshops. Describe your project online and we'll provide a custom quote.",
},
```

**Step 5 — add the SEO schema entry** (`ServiceSchemaEmitter.php`):

```php
'shed' => array(
    'name'        => 'Shed Building',
    'description' => 'Bespoke garden sheds in a range of sizes and materials, from simple storage to fully-fitted workshops.',
    'category'    => 'landscaping', // omit this key entirely if uncategorized — see Section 7
),
```

**Warning — this is a real, written obligation, not a suggestion.**
`ServiceSchemaEmitter.php`'s own doc comment and
`plugins/quote-wizard/src/SEO/SERVICE-REGISTRY-AUDIT.md`'s "Sync
discipline" section both say this file "must be updated in the same
commit" as `verticals.ts`. This was discovered the hard way in Step 6.3
— the JS registry and this PHP mirror can silently drift, and nothing
stops the wizard from working perfectly while its SEO structured data
quietly falls out of sync. There is no automated check tying the two
together; treat this instruction as load-bearing.

**Step 6 — update hardcoded test counts.** Grep for the current count
before assuming a specific number — it changes every time a service is
added or removed:

```bash
rg -n "toHaveLength\(1[0-9]\)|all 1[0-9] (services|registered)|1[0-9] services" apps/wizard/src
```

(PowerShell equivalent: `Select-String -Path "apps/wizard/src" -Recurse -Include "*.ts" -Pattern "\d+ (services|registered)"`.)
As of this writing that's 5 files (Section 9.1, Appendix C) — update each
matched literal count/array. For a manual-quote service specifically,
also add one line to `MANUAL_CONFIGS` in `domain/fixtures/__tests__/
manual-quote-configs.test.ts` and to the appropriate array (`INSTANT_
CONFIGS` or `MANUAL_CONFIGS`) in `domain/fixtures/__tests__/consent-
field.test.ts` — see Section 10.1 for exactly what these two shared test
files check and why a new manual-quote service gets most of its
structural coverage for free by doing this.

**Step 7 — category assignment (optional).** Only needed if this
client uses category navigation and wants the new service grouped. See
Section 7.

**Step 8 — run the tests.**

```bash
cd apps/wizard && pnpm test
```

For a manual-quote service, the shared parametrized suites
(`manual-quote-configs.test.ts`, `consent-field.test.ts`) will exercise
the new service automatically once you've added it to their arrays
(Step 6) — you generally don't need to write new structural tests. For
an **instant-quote** service, there is no equivalent shared suite (see
Section 10.2) — write a new, dedicated validation test file modeled on
the closest existing one.

### 2.3 Worked Example: Adding "Shed Building" (manual quote)

A landscaping client wants to offer custom shed-building as a service.
Sheds vary too much in size, material, and site complexity for a
sensible instant price, so this is a manual-quote service — reasoning
that matches why `general-repairs`/`plumbing`/`electrical`/`carpentry`/
`other` are all manual: high variability makes an instant estimate
either misleadingly narrow or uselessly wide.

**1. Pattern:** manual quote, copying `carpentry.config.ts`'s structure
(closest in spirit — bespoke joinery/construction work) with `other.
config.ts`'s neutrality of tone for the description prompt, since "shed
building" is specific enough to name directly.

**2. Config file** (`domain/fixtures/shed.config.ts`) — full uniform
7-step shape as shown in Section 2.2's Step 2, with:

```ts
title: 'Shed building',
// description step field:
label: 'Please describe the shed you need (size, materials, location in the garden)',
```

The remaining 6 steps (`urgency`, `property`, `site_photos`,
`contact_preference`, `contact`, `address`) are copied verbatim from
`carpentry.config.ts` — field ids, keys, and options unchanged, because
the shared test suite (Section 10.1) checks for exactly this shape.

**3. Register in `verticals.ts`:**

```ts
const shed: Vertical = {
  id: 'shed',
  label: 'Shed Building',
  schemaVersion: 1,
  categoryId: 'landscaping',
  wizard: shedWizardConfig,
  pricing: shedPricingConfig,
};

export const VERTICALS = Object.freeze({
  fencing,
  decking,
  painting,
  patio,
  driveway,
  steps,
  jetwash,
  'general-repairs': generalRepairs,
  plumbing,
  electrical,
  carpentry,
  shed, // new — after the 11 existing named services
  other, // still last
});
```

**Reasoning for `categoryId: 'landscaping'`:** a shed is an outdoor
garden structure, closer to fencing/decking/patio/driveway/steps than to
indoor decorating or interior handyman work — it fits the existing
category cleanly, unlike `other`, which by definition resists
categorization.

**4. Marketing content, 5. SEO schema:** as shown in Section 2.2.

**6. Test counts:** grep confirms 5 files need updating from "12" to
"13" (Section 2.2 Step 6's command); add `{ id: 'shed', config:
shedWizardConfig }` to `MANUAL_CONFIGS` in both
`manual-quote-configs.test.ts` and `consent-field.test.ts` (the latter
with `lastMandatoryStepId: 'address'`).

**7. Category:** done in step 3 above (`categoryId: 'landscaping'`).

**8. Test:**

```bash
cd apps/wizard && pnpm test
```

Verify specifically:

- `shed` appears in `listVerticalIds()`'s output, in the position you
  placed it.
- The shared `manual-quote-configs.test.ts` `it.each` blocks now run
  against `shed` too (Vitest will report new test _executions_, not new
  test _files_ — see `AUDIT-6.4-shared-tests.md`'s footnote on how
  `it.each` expansion counts in the test run summary).
- A manual end-to-end pass through the wizard (dev server) reaches the
  final `address` step and the FSM allows submission once all required
  fields are answered.
- The submitted payload's `answers.work_description` contains the shed
  description text — this requires no extra plumbing:
  `WizardStore.buildRequest()` spreads the entire answers map
  unconditionally, so any field with a `key` automatically reaches the
  submission payload once answered (confirmed in Steps 6.2/6.3's own
  payload tests).

---

## 3. Removing a Service

### 3.1 Consider disabling instead of deleting

Before deleting anything, ask whether the actual need is "this client
should never see this service" (permanent) or "don't show this for now"
(temporary/reversible). The registry supports **disabling without
deletion**: set the WordPress `goqw_enabled_services` option to an
explicit comma-separated list that omits the service. The `Vertical` stays
registered, fully functional, just not offered to that client's wizard
users — `listEnabledServiceIds(override)` filters to the override, and
`ServiceSchemaEmitter::get_active_services()` mirrors the same filter on
the PHP side. This is reversible with an option change, no code change,
no redeploy.

Only actually delete the service (this section) when the intent is
template-wide removal — e.g. a service that was a mistake, or one no
client will ever offer again.

### 3.2 Files You'll Touch

The same files as adding, in reverse:

1. Delete `apps/wizard/src/domain/fixtures/<service>.config.ts`.
2. Remove its `Vertical` const and its key from `VERTICALS` in `verticals.ts`.
3. Remove its entry from `services-content.ts`.
4. Remove its entry from `ServiceSchemaEmitter.php`'s `SERVICES` map (same-commit obligation, same as adding).
5. Update the same 5 hardcoded-count test files (Section 2.1) — decrement counts, remove the id from every array it appeared in (`ALL_VERTICAL_IDS`, `ALL_SERVICE_IDS`, `MANUAL_CONFIGS`/`INSTANT_CONFIGS` as applicable).
6. If it had a homepage `ServicesPreview` icon/entry (Section 2.1's conditional item): remove the `ICON_MAP` entry and the `home-page-content.ts` entry, and update `services-preview.test.ts`'s expected key list.
7. If it was a work-content.ts portfolio entry's `serviceId` target: either remove that work entry too, or it will fail `content.test.ts`'s "every work entry references a real service id" check.

### 3.3 Steps

1. **Confirm intent** (Section 3.1) — deletion is not casually reversible; a deleted config file, if not preserved in version control history, is gone.
2. **Remove the `Vertical` const and its key from `verticals.ts`.**
3. **Delete the config file.**
4. **Remove the marketing entry.**
5. **Remove the SEO schema entry.**
6. **Update every hardcoded count/array** (grep first, per Section 2.2 Step 6 — don't guess the current count).
7. **Test:** `pnpm test` from `apps/wizard`. Every reference to the removed id should be gone; no test should still expect it to resolve.

**Warning — historical data is untouched.** Submissions already in the
WordPress database with `wizard_id` matching the removed service remain
exactly as they were; nothing in this operation touches the submissions
table or its schema. This is correct behavior (historical records
shouldn't be rewritten), but don't be surprised that old rows reference
an id the registry no longer knows about — that's expected, not a bug to
chase.

---

## 4. Modifying Service Questions

### 4.1 When Adjustments Are Simple

Adding, removing, or rewording questions within a single service's
`steps[]` array is low-risk and doesn't ripple outward the way adding/
removing a whole service does:

- **Add a question:** add a new field object to an existing step's
  `fields[]`, or add a whole new step to the `steps[]` array. New fields
  need a stable `id`/`key` (see 4.2) and a `type` from the registry:
  `text`, `textarea`, `select`, `radio`, `checkbox`, `number`,
  `dimensions`, `photo`, `review` (`domain/config/field-types.ts`).
- **Remove a question:** delete the field object (or the whole step, if
  it only had one field).
- **Reword a question:** edit the `label`/`help`/`title`/`description`
  strings directly. This never touches `id`/`key` and is the lowest-risk
  edit in this entire guide — pure copy, no structural or data
  implications.
- **Change field type:** change `type` and adjust `options` to match
  (choice types — `select`/`radio`/`checkbox` — require an `options`
  array of `{ value, label }`; non-choice types must not have one, or
  cross-reference validation (`validateWizardConfig`) will reject the
  config).

### 4.2 Warning: Backward Compatibility

**Existing submissions carry old field values under old keys.** If you
rename a field's `key` from `fence_size` to `size`, every already-
submitted record still has `answers.fence_size`, not `answers.size` — the
rename only affects _future_ submissions. Before renaming a `key` that's
already live, consider:

- **Google Sheets / Make.com column mapping** — if the downstream
  scenario maps a specific answer key to a specific spreadsheet column,
  a rename breaks that mapping silently (the column goes blank for new
  submissions, not an error) until the Make.com scenario is updated to
  match.
- **Test fixtures** — any test asserting `answers.<old_key>` will need
  updating to the new key, and will otherwise fail (loudly, in CI — this
  one at least isn't a silent break).
- **Whether renaming is worth it at all** — a `key` is an internal
  contract, not user-facing copy. If the only motivation is "the name
  reads oddly to us as developers," reconsider — the field's `label` is
  what users and the business owner actually see; `key` is invisible to
  everyone except the code and the spreadsheet column header.

### 4.3 Testing After Modification

```bash
cd apps/wizard && pnpm test
```

If a field was renamed, fix the specific failures involving that key
(they'll name the exact assertion and expected/actual key). Don't reach
for a broad fixture rewrite — a targeted field rename produces targeted,
specific test failures, not a cascade.

---

## 5. Adjusting Pricing Formulas

### 5.1 Understanding the Pricing Structure — corrected assumption

**There is no per-service pricing function to find or edit.** Pricing is
computed by exactly one shared, generic engine —
`domain/pricing/pricing-engine.ts`'s `computePrice(answers, wizard,
pricing)` — evaluated identically for every instant-quote service. A
service's "pricing formula" is **pure declarative data**: a
`PricingConfig` object exported from that service's `<service>.config.ts`
file. There is no `calculatePricing()` or `estimateJob()` function
per service anywhere in this codebase (an earlier planning draft assumed
there would be — there isn't). This matters practically: adjusting a
service's pricing is always a data edit (numbers in an object literal),
never a logic edit.

Every `PricingConfig` has this shape:

```ts
{
  schemaVersion: 1,
  currency: 'GBP',
  base: { label, perUnitPence, unit: 'linear_metre' | 'square_metre' | 'item', quantityFieldId },
  modifiers: [ { id, label, appliesToFieldId, match, effect } ],  // effect: {kind:'multiply', factor} | {kind:'add', amountPence}
  extras:    [ { id, label, appliesToFieldId, match, amountPence } ], // always additive
  bounds: { minPence, maxPence, rounding: { mode: 'nearest', toPence } },
  rangeSpreadBasisPoints: number, // e.g. 1500 = ±15%
}
```

`computePrice()`'s fixed evaluation order:

1. `basePence = round(base.perUnitPence × answers[quantityFieldId])`.
2. Apply each `modifiers[]` entry in array order — `multiply`
   scales the running total by `factor`; `add` adds a flat
   `amountPence` — only when its `match` rule holds against another
   field's answer.
3. Add each `extras[]` entry in array order — always additive, only
   when its `match` holds.
4. Clamp to `[bounds.minPence, bounds.maxPence]`.
5. Round to the nearest `bounds.rounding.toPence`.
6. Derive the displayed range from the **rounded** figure:
   `roundedPence × (1 ∓ rangeSpreadBasisPoints / 10000)`.

**All monetary values are integer pence.** £75.50 = `7550`. Never use a
decimal/float — the schema enforces integer-ness and floats fail
validation outright (this is deliberate; see `domain/config/pricing.ts`'s
own doc comments on avoiding floating-point money entirely).

### 5.2 Where Modifiers and Extras Live

**In each service's own config, never in a shared module.** There is no
cross-service rate table or shared pricing constant anywhere —
`pricing-engine.ts` has zero knowledge of which services exist; it only
knows the generic `PricingConfig` shape. Editing one service's
`modifiers`/`extras` arrays can never affect another service's pricing,
because nothing is shared between them at the data level.

### 5.3 Adjusting a Rate — correctly, using the real shape

**Corrected assumption:** don't look for a `RATES_PER_METER` lookup
object keyed by fence type — it doesn't exist. The _base_ rate is a
single number (`base.perUnitPence`); _per-type_ premiums are expressed as
**relative multiplier modifiers**, not separate absolute rates.

Example: `fencing.config.ts`'s actual base and modifiers (abbreviated):

```ts
base: {
  perUnitPence: 7500, // £75.00/m — feather edge is the baseline, no modifier needed for it
  unit: 'linear_metre',
  quantityFieldId: 'length_m',
},
modifiers: [
  { id: 'type_closeboard', appliesToFieldId: 'fence_type',
    match: { kind: 'equals', value: 'closeboard' },
    effect: { kind: 'multiply', factor: 1.1 } },  // £75 × 1.1 = £82.50/m
  { id: 'type_panel', appliesToFieldId: 'fence_type',
    match: { kind: 'equals', value: 'panel' },
    effect: { kind: 'multiply', factor: 1.2 } },   // £75 × 1.2 = £90/m
  // ...
],
```

**To raise the overall base rate** (e.g. feather edge £75/m → £80/m for
a client in a higher-cost-of-living area), edit `base.perUnitPence`:
`7500 → 8000`. Every type's effective rate shifts proportionally, since
type premiums are multipliers on the base, not fixed absolute rates.

**To change one type's relative premium** (e.g. closeboard should be 15%
above baseline instead of 10%), edit that modifier's `factor`:
`1.1 → 1.15`. This does _not_ touch `base.perUnitPence` and does not
affect any other type's price.

### 5.4 Worked Example: New Client Pricing ("Bright Fencing")

Client wants: closeboard at £82/m (base × modifier, not a standalone
figure), reflecting a ~9% premium over the template default (£75 × 1.1 =
£82.50, close enough that the client's target of £82 essentially _is_
the existing modifier — no change needed there) — but they specifically
want their **panel** fencing repriced from the template's 1.2× (£90/m) up
to 1.3× (£97.50/m), since panel fencing installation takes longer in
their market and the template's default premium doesn't reflect that.

**Reasoning:** rather than inventing a new absolute rate, express the
change as what it actually is — a change to the panel-type modifier's
relative premium, leaving the base rate and every other type's modifier
untouched. This is the correct way to think about "repricing one fence
type": it's a one-line `factor` edit, not a rewrite of the base.

**Edit** (`fencing.config.ts`):

```ts
{
  id: 'type_panel',
  label: 'Panel premium',
  appliesToFieldId: 'fence_type',
  match: { kind: 'equals', value: 'panel' },
  effect: { kind: 'multiply', factor: 1.3 }, // was 1.2
},
```

**Also check:** `fencing-validation.test.ts` and any pricing-engine test
that asserts a specific expected total for a panel-fence scenario (search
for `factor: 1.2` or a panel-specific worked-example total in the
config's own doc comments — `fencing.config.ts` documents a worked
example in its header comment; update that comment's arithmetic too, or
it becomes a stale, misleading example for the next person reading the
file).

### 5.5 Warning: Test Coverage After Pricing Changes

Some validation tests assert exact numeric values (e.g. "pricing has 5
modifiers covering type and height variants" or specific `perUnitPence`
checks). Changing a rate without checking whether a test hardcodes the
old value will produce a clear, specific test failure naming the
mismatched number — this is a _good_ failure mode (loud, precise), not
one to work around. Update the test's expected value to match the new
rate; don't loosen the assertion to stop checking it.

---

## 6. Updating Service Metadata

### 6.1 Fields to Update, and Where Each One Lives

| Concept                       | Field                | File                                                                |
| ----------------------------- | -------------------- | ------------------------------------------------------------------- |
| Wizard header text            | `title`              | `<service>.config.ts` (`WizardConfig.title`)                        |
| Internal/diagnostic label     | `label`              | `verticals.ts` (`Vertical.label`) — never shown as UI copy          |
| Marketing name                | `name`               | `services-content.ts` (`ServiceEntry.name`)                         |
| Marketing summary (list card) | `summary`            | `services-content.ts`                                               |
| Marketing long description    | `description`        | `services-content.ts`                                               |
| SEO schema name/description   | `name`/`description` | `ServiceSchemaEmitter.php`                                          |
| Quote mode                    | `quoteMode`          | `<service>.config.ts` (`'instant'` \| `'manual'`, absent = instant) |
| Category                      | `categoryId`         | `verticals.ts` (`Vertical.categoryId`, optional)                    |

**Corrected assumption:** there is no single `description` field shared
across all four surfaces — `WizardConfig` has no `description` at all
(only `title`); the marketing description lives only in
`services-content.ts`; the SEO description is a _separate_,
independently-maintained string in `ServiceSchemaEmitter.php` that
happens to usually match or closely paraphrase the marketing one, by
convention rather than by any enforced link.

### 6.2 Cross-File Sync

When changing a service's display name, decide **deliberately** whether
`title` (wizard header), `label` (internal), `name` (marketing), and
`name` (SEO schema) should all read identically, or whether some should
diverge (e.g. a marketing name might be more evocative than a terse
wizard header). There's no technical requirement that they match — but
an unintentional mismatch (forgetting to update one of the four) reads
as an oversight to anyone comparing the wizard to the marketing site.

**Warning:** name changes have three different audiences —

- **Google/search results** (schema.org `name` in `ServiceSchemaEmitter.php`)
- **Customers browsing `/services`** (`services-content.ts`)
- **Users already inside the wizard** (`<service>.config.ts`'s `title`)

Update all three together when the intent is a genuine rename, not just
one of the three.

---

## 7. Managing Service Categories

### 7.1 Category System Overview — corrected assumption

Categories are defined in exactly **one** place:
`domain/registry/categories.ts`'s `CATEGORIES` registry (4 entries:
`landscaping`, `decorating`, `exterior-cleaning`, `handyman`, each with an
`id`, `label`, optional `description`, and a numeric `displayOrder`).
**There is no second "category enumeration" file** — an earlier planning
draft assumed one might exist separately from where categories are
assigned to services; it doesn't. `categories.ts` is the sole source for
what categories exist.

**Category _navigation_ as a feature** (a category-picker step shown
before the service list) is gated by `PublicConfig.enableCategoryNavigation`,
a WordPress option defaulting to `false` — most deployments show one flat
service list and never touch categories at all.

### 7.2 Assigning a Service to a Category — corrected assumption

**This happens in `verticals.ts`, not `ServiceSchemaEmitter.php`.** Each
`Vertical` has an optional `categoryId?: string` field — that's the
canonical assignment, read by `ServiceSelector.tsx`'s category-filtering
logic. `ServiceSchemaEmitter.php`'s own `category` field is a
**separate, independently-maintained mirror** of the same value, used
only for the SEO schema's `category` string — updating it doesn't assign
a category; it just keeps the SEO output consistent with the real
assignment. Update both together, but understand `verticals.ts` is the
one that actually changes wizard behavior:

```ts
// verticals.ts — the real assignment
const shed: Vertical = {
  id: 'shed',
  categoryId: 'landscaping', // ← this is what ServiceSelector.tsx reads
  // ...
};
```

```php
// ServiceSchemaEmitter.php — the SEO mirror, kept consistent but not authoritative
'shed' => array(
    'category' => 'landscaping', // ← must match verticals.ts's categoryId, or omit both if uncategorized
),
```

### 7.3 Uncategorized Services

A service with no `categoryId` (like `other`, since Step 6.3 — see
ADR-0035) is **fully visible in the flat service list** when
`enableCategoryNavigation` is `false` (the default). When category
navigation **is** enabled and a user has drilled into a specific
category, an uncategorized service **will not appear** in that filtered
view — `ServiceSelector.tsx`'s filter (`categoryId === filterByCategoryId`)
can never match `undefined`. This is a real, documented consequence, not
a bug: leaving a genuinely uncategorizable service (a long-tail catch-all
like `other`) unassigned is a deliberate tradeoff over forcing it into
one of the four categories it doesn't really belong in. If a specific
client wants an uncategorized service visible under category navigation,
assign it any existing category (or add a new one to `CATEGORIES` first,
if none fits) — there's no structural barrier, just a judgment call about
which category (if any) genuinely fits.

---

## 8. Toggling Quote Modes

### 8.1 This Is Not a Simple Flag Flip

**Warning — read this before starting either conversion.** `quoteMode`
is a one-line change, but the **step composition it implies is not**.
Instant-quote services use size-bracket-selector / visual-card-selector /
estimate-display step kinds plus a `PricingConfig` with real numbers;
manual-quote services use the uniform 7-step classic-field-step shape
(Section 1.5) with `manualQuotePricingStub`. Converting between them
means **replacing most of the `steps[]` array**, not editing one field.
Budget for this as "redesign the wizard flow for this service," not "flip
a setting."

### 8.2 Converting Instant → Manual

When: pricing logic has become too variable to estimate honestly (e.g. a
service that started simple but now covers wildly different job types).

1. Replace the size-bracket-selector/visual-card-selector/estimate-display
   steps with the uniform manual-quote 7-step shape (Section 2.2's Step
   2 template) — in practice, copy an existing manual-quote config's
   `steps[]` wholesale and adapt only the `description` step's copy to
   this service.
2. Change `quoteMode: 'instant'` to `quoteMode: 'manual'` (or remove the
   field entirely if you want the schema default — but explicit is
   clearer here).
3. Replace the real `PricingConfig` export with
   `manualQuotePricingStub` (`domain/fixtures/manual-quote-pricing-stub.ts`)
   — the `Vertical` type still requires a `pricing` field even for manual
   services; the stub satisfies the type contract and is never evaluated
   (`quoteMode: 'manual'` bypasses `computePrice()` entirely at the
   submission-building layer).
4. Update or remove any tests that asserted specific instant-quote
   pricing behavior for this service; add it to the shared manual-quote
   test arrays (Section 2.2 Step 6) instead.

### 8.3 Converting Manual → Instant

When: enough real job data exists to design a fair, honest pricing
formula (the opposite trigger from 8.2).

1. Design the `PricingConfig` — base unit and rate, modifiers, extras,
   bounds, range spread (Section 5.1's shape). This is the hard,
   business-judgment part; get real rate data from the client first.
2. Replace the manual 7-step shape with an instant-quote flow: pick a
   structural template from Appendix A matching your pricing unit
   (length/area/count), and adapt its size-bracket/visual-card steps.
3. Change `quoteMode: 'manual'` to `quoteMode: 'instant'`.
4. Write a new, dedicated validation test file (Section 10.2 — there's
   no shared instant-quote suite to plug into for free, unlike 8.2's
   direction).

---

## 9. Sync Obligation Checklists

### 9.1 Adding a Service

- [ ] Create `<service>.config.ts` in `apps/wizard/src/domain/fixtures/`
- [ ] Register a new `Vertical` const + key in `apps/wizard/src/domain/registry/verticals.ts` (position = display order)
- [ ] Add entry in `apps/wizard/src/site/content/services-content.ts`
- [ ] Add entry in `plugins/quote-wizard/src/SEO/ServiceSchemaEmitter.php` (**same-commit obligation**)
- [ ] Grep and update hardcoded service-count/list test files (5 as of this writing — re-grep, don't assume)
- [ ] If manual-quote: add to `MANUAL_CONFIGS` in `manual-quote-configs.test.ts` and to `INSTANT_CONFIGS`/`MANUAL_CONFIGS` in `consent-field.test.ts`
- [ ] If instant-quote: write a new dedicated validation test file (no shared suite exists)
- [ ] Assign `categoryId` if this deployment uses category navigation and a category genuinely fits (optional otherwise)
- [ ] (Optional) Add an `ICON_MAP` entry + `home-page-content.ts` `ServicesPreview` item, only if featuring this service on the homepage
- [ ] Run `pnpm test` from `apps/wizard`

### 9.2 Removing a Service

- [ ] Delete `<service>.config.ts`
- [ ] Remove the `Vertical` const and its key from `verticals.ts`
- [ ] Remove the entry from `services-content.ts`
- [ ] Remove the entry from `ServiceSchemaEmitter.php` (**same-commit obligation**)
- [ ] Grep and decrement hardcoded service-count/list test files; remove the id from every array
- [ ] Remove any `ICON_MAP`/`home-page-content.ts`/`services-preview.test.ts` references, if present
- [ ] Remove or repoint any `work-content.ts` entry whose `serviceId` targeted this service
- [ ] Run `pnpm test`
- [ ] **Do not** attempt to touch historical submissions in the database — out of scope, and correct as-is (Section 3.3)

### 9.3 Modifying a Service (questions, copy, or pricing)

- [ ] Edit `<service>.config.ts` directly for step/field/pricing changes
- [ ] If `title`/`name`/`description` changed: update `services-content.ts` and `ServiceSchemaEmitter.php` to match (Section 6.2)
- [ ] If a field `key` was renamed: check Make.com/Google Sheets mapping and test fixtures (Section 4.2)
- [ ] If pricing changed: check for tests hardcoding the old expected value (Section 5.5)
- [ ] If `categoryId` changed: update both `verticals.ts` (authoritative) and `ServiceSchemaEmitter.php` (mirror)
- [ ] Run `pnpm test`

### 9.4 Adjusting Categories

- [ ] Update the `categoryId` on the affected `Vertical`(s) in `verticals.ts` — this is the real assignment
- [ ] Update the matching `category` string in `ServiceSchemaEmitter.php` (mirror only, not authoritative)
- [ ] If adding/renaming a category itself (not just reassigning a service): edit `domain/registry/categories.ts`'s `CATEGORIES` registry directly — there is no second file to update
- [ ] Run `pnpm test` — `domain/registry/__tests__/categories.test.ts` and `resolve.test.ts`'s per-service `categoryId` assertions will catch drift

---

## 10. Testing Guidance

### 10.1 What Tests Cover, and How Reuse Works

- **Config structure tests** (per-service or shared) — verify a
  service's `WizardConfig`/`PricingConfig` pass `validateWizardConfig`/
  `validatePricingConfig` and have the expected step/field shape.
- **Shared parametrized tests** — `manual-quote-configs.test.ts`
  (structural contract for all manual-quote services) and
  `consent-field.test.ts` (consent-field placement for _every_ service,
  instant or manual). Adding a manual-quote service to these two files'
  config arrays is usually sufficient — the shared `it.each` blocks
  exercise the new service automatically, with zero new test code
  (this is exactly how Step 6.3 added `other` with only 2 bespoke tests
  of its own).
- **Registry tests** — `resolve.test.ts`/`services.test.ts`/
  `service-selection.test.ts` assert the full registered-service list
  and order; every service (instant or manual) must be added to these.
- **Instant-quote validation tests** — no shared suite; each
  instant-quote service has its own dedicated file
  (`fencing-validation.test.ts`, etc. — see `AUDIT-6.4-shared-tests.md`
  for the full list and why no shared file exists for this category).
- **Submission payload tests** — confirm a new field reaches
  `state.answers` (and thus the wire payload, since `buildRequest()`
  spreads the answers map unconditionally — no per-field allowlist
  exists anywhere in the submission pipeline).

### 10.2 Adding Tests for a New Service

- **Manual-quote:** in most cases, no new test _file_ is needed — adding
  the service to the two shared arrays (Section 9.1) is the test
  addition. Write bespoke tests only if the service has a genuinely
  unusual field beyond the uniform 7-step shape (rare — the whole point
  of the uniform shape is that it usually doesn't need one).
- **Instant-quote:** always write a new dedicated file, modeled on the
  closest existing one (Appendix A) — there's no way to get this for
  free, since instant-quote services aren't structurally uniform enough
  to parametrize over.

### 10.3 Running Tests

From the repo root (runs every workspace package's tests):

```bash
pnpm test
```

From `apps/wizard` directly (faster iteration, wizard-only):

```bash
pnpm test
```

Filtered to a subset of test files (Vitest treats a positional argument
as a path/name filter):

```bash
pnpm test shed
```

Watch mode during active development:

```bash
pnpm test:watch
```

### 10.4 Failed Tests — Diagnosis Order

1. Read the failure message and file path first — it names the exact
   assertion and the exact expected/actual mismatch; don't start
   guessing before reading it.
2. If it's a count/length mismatch (`expected 12, got 13` or similar):
   you likely missed one of the 5 hardcoded-count files (Section 9.1) —
   re-run the grep.
3. If it's a missing-key error on a renamed field: check whether a test
   fixture still references the old field `key` (Section 4.2).
4. If it's a pricing-value mismatch: check whether a test hardcodes the
   old rate/expected total (Section 5.5).
5. If it's an ESLint `no-restricted-imports` boundary error on a new test
   file: domain-layer tests (`domain/**/__tests__/`) cannot import
   `@/runtime/**` — payload/submission-plumbing tests that need
   `createWizardStore` belong under `runtime/__tests__/` instead (this
   boundary is enforced, not a suggestion — see Steps 6.2/6.3's own
   payload test files for the correct split).

---

## 11. Common Pitfalls

**Warning — adding a service without updating `ServiceSchemaEmitter.php`.**
Symptom: everything works in the wizard; the SEO structured data for
`/services` silently doesn't include the new service. No test catches
this automatically (PHP and TypeScript are separate toolchains with no
cross-check). Fix: add the PHP entry in the same commit, per its own
documented sync-discipline note.

**Warning — removing/adding a service without updating hardcoded test
counts.** Symptom: multiple test failures like "expected 12, got 13" or
a literal array missing/gaining an id, spread across `resolve.test.ts`,
`services.test.ts`, `service-selection.test.ts`, and (for manual-quote
services) `manual-quote-configs.test.ts`/`consent-field.test.ts`. Fix:
grep for the count pattern (Section 2.2 Step 6) rather than trying to
remember which files hardcode it — the list has changed once already
(6.3 discovered 5 files; a future step might find more or fewer).

**Warning — renaming a field `key` breaks downstream mappings silently.**
Symptom: the business owner reports empty columns in Google Sheets for
new submissions, with no error anywhere in the wizard or WordPress logs
— the field's data is there, just under a new answer key the Make.com
scenario doesn't know to map. Fix: update the Make.com scenario's field
mapping, or don't rename a `key` that's already live in production
without coordinating the downstream change.

**Warning — changing pricing without checking test fixtures.** Symptom:
a specific pricing test fails with an exact expected-vs-actual pence
mismatch. This is a _good_, loud failure — the alternative (a test that
doesn't check specific values) would let a pricing regression through
silently. Fix: update the test's expected value; don't weaken the
assertion.

**Warning — adding a service without a category when this deployment
uses category navigation.** Symptom: the service appears in the flat
"all services" list but is invisible whenever a user has drilled into
any specific category (Section 7.3). This is often _intentional_ (a
genuine long-tail catch-all, like `other`), but if it's accidental for a
named, specific service, the fix is a one-line `categoryId` addition —
easy to miss because the symptom only appears when category navigation
is actually enabled (`false` by default), so it can go unnoticed in a
deployment that hasn't turned that feature on yet.

**Warning — assuming a per-service pricing function exists.** Symptom:
searching the codebase for `calculatePricing()`/`estimateJob()` or
similar and finding nothing, then concluding pricing must be hardcoded
somewhere unexpected. There is no such function — `computePrice()` is the
one shared engine (Section 5.1); the "formula" you're looking for is
always data in that service's `PricingConfig` export, never code.

**Warning — assuming `ServiceSchemaEmitter.php`'s `category` field
assigns the category.** Symptom: editing the PHP file's `category` key
and expecting the wizard's actual category-navigation filtering to
change — it won't. The real assignment is `verticals.ts`'s `categoryId`
(Section 7.2); the PHP field is a downstream mirror for SEO output only.

---

## Appendix A: Service Templates

Use the closest structural match as your starting point, not a blank
file:

| Pattern                                                            | Template                                                                                                | Why                                                                                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Length-based instant quote                                         | `fencing.config.ts`                                                                                     | `size-bracket-selector` with `unit: 'm'`, linear-metre pricing                                                                                       |
| Area-based instant quote                                           | `patio.config.ts`, `driveway.config.ts`, `decking.config.ts`                                            | `size-bracket-selector` with `unit: 'm²'`, square-metre pricing                                                                                      |
| Count-based instant quote (per room)                               | `painting.config.ts`                                                                                    | `base.unit: 'item'`, `quantityFieldId` a simple count field, zero modifiers/extras — the simplest pricing config in the codebase                     |
| Count-based instant quote (per unit, with type/material modifiers) | `steps.config.ts` (garden steps)                                                                        | `base.unit: 'item'`, 6 modifiers (shape × material)                                                                                                  |
| Manual quote — any trade                                           | Any of `general-repairs.config.ts`, `plumbing.config.ts`, `electrical.config.ts`, `carpentry.config.ts` | All five (including `other.config.ts`) are structurally identical (ADR-0021 Decision 3) — pick whichever's _copy_ is closest to what you're adapting |
| Manual quote — genuinely novel/long-tail                           | `other.config.ts`                                                                                       | Most trade-neutral prompt copy of the five                                                                                                           |

## Appendix B: Pricing Formula Reference

See `apps/wizard/src/domain/AUDIT-6.4-pricing-patterns.md` for the full
per-service base-rate survey. Worked trace of `computePrice()` for a
concrete case — 20m of closeboard fencing, standard height, with a gate:

```
fencingWizardConfig, fencingPricingConfig
answers: { length_m: 20, fence_type: 'closeboard', height: 'standard', include_gate: 'yes' }

1. base:      7500 (perUnitPence) × 20 (length_m)         = 150000 pence (£1500.00)
2. modifiers: type_closeboard matches → × 1.1              = 165000 pence (£1650.00)
              (height 'standard' matches no modifier — only 'low'/'tall' have one)
3. extras:    include_gate === 'yes' matches → + 35000      = 200000 pence (£2000.00)
4. clamp:     within [20000, 5000000]                       = 200000 pence (unchanged)
5. round:     nearest 500 (toPence)                         = 200000 pence (unchanged — already a multiple of 500)
6. range:     rangeSpreadBasisPoints 1500 (±15%)
              min = 200000 × 0.85 = 170000 pence (£1700.00)
              max = 200000 × 1.15 = 230000 pence (£2300.00)

Displayed to the user: £1,700 – £2,300
```

Every instant-quote service's price is this same six-step trace with
different numbers plugged in — there is no service-specific variant of
this algorithm anywhere (Section 5.1).

## Appendix C: Sync Obligation Map

| File                                                                                 | Purpose                                            | Update when                                           | Authoritative?                                                                                                                             |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/wizard/src/domain/fixtures/<service>.config.ts`                                | Wizard steps + pricing                             | Add / modify / remove a service                       | Yes — the service's actual behavior                                                                                                        |
| `apps/wizard/src/domain/registry/verticals.ts`                                       | Service registration + order + category assignment | Add / remove a service; reorder; change category      | Yes — "which services exist," in what order, in what category                                                                              |
| `apps/wizard/src/site/content/services-content.ts`                                   | Marketing copy                                     | Add / remove / rename a service                       | Yes, for marketing copy — not linked to `verticals.ts` by any enforced check                                                               |
| `plugins/quote-wizard/src/SEO/ServiceSchemaEmitter.php`                              | SEO JSON-LD schema                                 | Add / remove / rename a service; change category      | No — mirrors `verticals.ts`/`services-content.ts`; has a **documented, written same-commit sync obligation** (`SERVICE-REGISTRY-AUDIT.md`) |
| `domain/registry/__tests__/resolve.test.ts`                                          | Registry order/count assertions                    | Add / remove a service                                | Test only                                                                                                                                  |
| `domain/registry/__tests__/services.test.ts`                                         | Enabled-service-list assertions                    | Add / remove a service                                | Test only                                                                                                                                  |
| `__tests__/service-selection.test.ts`                                                | App-level selection-logic assertions               | Add / remove a service                                | Test only                                                                                                                                  |
| `domain/fixtures/__tests__/manual-quote-configs.test.ts`                             | Shared manual-quote structural contract            | Add / remove a manual-quote service                   | Test only                                                                                                                                  |
| `domain/fixtures/__tests__/consent-field.test.ts`                                    | Consent-field placement, all services              | Add / remove any service                              | Test only                                                                                                                                  |
| `domain/registry/categories.ts`                                                      | Category definitions                               | Add / rename a category (not service-count-dependent) | Yes — sole source for categories                                                                                                           |
| `site/sections/ServicesPreview/icons/index.ts` (`ICON_MAP`) + `home-page-content.ts` | Homepage-featured service icons                    | Only if featuring a service on the homepage           | Conditional, not mandatory                                                                                                                 |
| `site/content/work-content.ts`                                                       | Portfolio entries referencing a `serviceId`        | Only if removing a service with existing work entries | Validity constraint, not a sync obligation                                                                                                 |
