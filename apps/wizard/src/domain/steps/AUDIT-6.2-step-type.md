# Audit 6.2-B: Multi-Field-Form Step Type

_Compiled: 2026-07-22_

## Path note

`apps/wizard/src/domain/steps/` exists but contains only
`__tests__/` (tests for the 5.13a non-field step kinds: `estimate-display`,
`visual-card-selector`, `size-bracket-selector`). The step-kind _schemas_
themselves live in `apps/wizard/src/domain/config/wizard-config.ts`, same
file audited in 6.1. This file is saved at the spec's requested path since
the directory does exist; the schema itself lives elsewhere as noted.

## Is there a step type called `multi-field-form`?

**No.** There is no step kind by that name, and no `type` discriminant on
a step at all. `wizard-config.ts` defines exactly two categories of step:

1. **Classic field step** (`StepSchema`) — has a `fields[]` array. This is
   the type every field-collecting step in this codebase uses: `extras`,
   `site_photos`, `contact-and-address`, `optional-details`. It carries no
   `stepKind` property.
2. **New step kinds from 5.13a** (`EstimateDisplayStepSchema`,
   `VisualCardSelectorStepSchema`, `SizeBracketSelectorStepSchema`) — each
   carries a literal `stepKind` discriminant (`'estimate-display'` etc.)
   and has no `fields[]`.

`AnyStepSchema` is the union of both categories; `isFieldStep(step)`
(`wizard-config.ts:268-270`) distinguishes them by checking for the
_absence_ of `stepKind` — not by checking for a `type` value of
`'multi-field-form'` or anything similar. **`StepSchema` is a
`z.strictObject`, so adding a `type: 'multi-field-form'` key (or any key
not in its known set: `id`, `title`, `description`, `fields`, `condition`,
`allowSkip`) would fail validation outright.**

Since the new 6.2 step needs multiple fields on one page with no special
non-field behavior (no price display, no visual cards, no bracket
selection), it is a **classic field step** — the same construct every
other multi-question fencing step (`extras`, `contact-and-address`,
`optional-details`) already uses. No new step kind, no schema change.

## What field types does it support?

Whatever's in `FIELD_TYPES` (`domain/config/field-types.ts`): `text`,
`textarea`, `select`, `radio`, `checkbox`, `number`, `dimensions`, `photo`,
`review`. `radio` is fully supported end-to-end — registered in the type
union, has a Zod-validated shape via `FieldSchema`, and has a working
renderer (`RadioGroupField.tsx`) already wired into the field-type-to-
component lookup (confirmed no separate registration step needed; every
other field type follows the identical pattern).

## How are radio-style fields declared?

```ts
{
  id: 'terrain',
  key: 'terrain',
  type: 'radio',
  label: 'How would you describe the terrain?',
  required: true,
  options: [
    { value: 'soft', label: 'Soft — standard soil, easy to dig' },
    { value: 'hard', label: 'Hard — rocky, compacted, or uneven ground' },
    { value: 'concrete', label: 'Concrete — existing concrete or paving' },
  ],
}
```

`id` and `key` are both required by `FieldSchema` (the id/key duplication
pattern is already standard for every field in this codebase — see
`include_gate`, `remove_old`, etc., which both set `id` and `key` to the
same string).

## How are helper text / descriptions added?

See Audit A: one `help: string` per **field** (not per option), rendered
once beneath the field's label. No per-option helper text field exists.
Resolution: fold per-option nuance into each option's `label` string (see
Audit A's terrain example above); use `help` for the one field
(`gravel_boards`) that needs a single field-level explanation instead of
per-option nuance.

## How is mandatory/optional determined?

`required: z.boolean().default(false)` on `FieldSchema`. Setting
`required: true` is sufficient — `validateField()`
(`domain/runtime/answer-validation.ts`) treats any empty answer (`null`,
`undefined`, `''`, whitespace-only, `[]`) as failing a required field with
"This field is required." and `radio`'s own case additionally rejects an
answer that doesn't match one of the field's declared option values. See
`AUDIT-6.2-validation-pattern.md` for how this feeds into step-level
gating.
