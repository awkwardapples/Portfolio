# Audit A — Current Pre-Step Configuration (5.13c)

Date: 2026-07-08
Step: 5.13c Phase 0 Audit A

## Source file

`apps/wizard/src/domain/wizards/address-prestep.ts`

## Current configuration

```typescript
export const addressPreStep: Step = {
  id: 'contact-and-address',
  title: 'Your details',
  fields: [
    { id: 'prestep-name', key: 'contact_name', type: 'text', required: true },
    {
      id: 'prestep-postcode',
      key: 'postcode',
      type: 'text',
      required: true,
      help: 'e.g. SW1A 1AA',
    },
    {
      id: 'prestep-phone',
      key: 'contact_phone',
      type: 'text',
      required: true,
      help: 'e.g. 07712 345678',
    },
    { id: 'prestep-email', key: 'contact_email', type: 'text', required: true },
  ],
};
```

| id               | key           | type | required | Format validator                     |
| ---------------- | ------------- | ---- | -------- | ------------------------------------ |
| prestep-name     | contact_name  | text | true     | none                                 |
| prestep-postcode | postcode      | text | true     | validatePostcode (FORMAT_VALIDATORS) |
| prestep-phone    | contact_phone | text | true     | validatePhone (FORMAT_VALIDATORS)    |
| prestep-email    | contact_email | text | true     | validateEmail (FORMAT_VALIDATORS)    |

## Validators applied

FORMAT_VALIDATORS (in `domain/validation/format-validators.ts`) maps:

- `'postcode'` → `validatePostcode`
- `'contact_email'` → `validateEmail`
- `'contact_phone'` → `validatePhone`

Applied by `answer-validation.ts` `validateField()` on any `type: 'text'` field whose `key`
appears in the map. No FieldSchema changes needed.

## Wiring

`QuotePage.tsx` passes `preSteps: [addressPreStep]` in the `SessionConfig` for both the
normal service path and the fallback wizard path. `getMergedWizard()` in `transition.ts`
prepends the pre-step to `wizard.steps` at runtime.

## Existing tests

File: `apps/wizard/src/domain/wizards/__tests__/address-prestep.test.ts` — 5 tests:

1. `has the expected stable step id` → asserts `addressPreStep.id === 'contact-and-address'`
2. `has exactly four fields` → asserts `fields.length === 4`
3. `all fields use type text` → all `field.type === 'text'`
4. `all fields are required` → all `field.required === true`
5. `field keys are the shared contact keys that trigger auto-fill and format validation` →
   checks that keys include `contact_name`, `postcode`, `contact_phone`, `contact_email`

## Finding: step id collision

The current pre-step `id: 'contact-and-address'`. The spec §4.2 proposes using the same
`id: 'contact-and-address'` for the new end-of-wizard contact collection step.

If both exist in the merged wizard produced by `getMergedWizard()`, `validateWizardConfig`
will reject the config because step ids must be unique across the merged step list.

**Required action**: Change the pre-step id to `'postcode_prestep'` when reducing it to
postcode-only. The end-of-wizard step then takes the `'contact-and-address'` id, replacing
the current `'contact'` step in each instant-quote service config.

## Impact on existing tests (Commit 2)

Tests 1, 2, 4, and 5 will fail after the pre-step is reduced to postcode-only with the
new id. All 5 tests must be rewritten in Commit 2 to match the new single-field config:

- id: `'postcode_prestep'`
- 1 field (postcode only)
- required: true
- key: `'postcode'`
- type: `'text'`
