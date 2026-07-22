# Audit 6.2-A: Fencing Config Structure Post-6.1

_Compiled: 2026-07-22_

## Current step sequence (`fencing.config.ts`, post-6.1)

| #   | Step id               | Step kind                                      | Notes                                                           |
| --- | --------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| 0   | `fence_size`          | `size-bracket-selector`                        | length in `m`, feet-equivalent display added in 6.1             |
| 1   | `fence_type_step`     | `visual-card-selector`                         | fence material                                                  |
| 2   | `fence_height_step`   | `visual-card-selector`                         | height; option labels gained feet equivalents in 6.1            |
| 3   | `estimate`            | `estimate-display`                             | shows price range, accept/adjust                                |
| 4   | `extras`              | classic field step (`fields[]`, no `stepKind`) | `include_gate` (checkbox), `remove_old` (checkbox)              |
| 5   | `site_photos`         | classic field step                             | single `photo` field, `maxCount: 5`, guidance text added in 6.1 |
| 6   | `contact-and-address` | classic field step                             | name/phone/email/address/consent, all required                  |
| 7   | `optional-details`    | classic field step                             | `allowSkip: true`; preferred_timeframe, additional_notes        |

**Position of `estimate-display`:** index 3, immediately after the three
selection steps (`fence_size`, `fence_type_step`, `fence_height_step`).

**Position of `photos` (`site_photos`):** index 5 — **not** immediately
after `estimate`. `extras` (index 4) sits between them already.

## Placement decision for the new 6.2 step

The spec's own illustrative step array (`[..., extrasStep,
estimateDisplayStep, fencingDetailsStep, photosStep, ...]`) puts `extras`
_before_ `estimate-display`, which does not match the real order above
(`estimate` comes before `extras`). Treating that array as a rough
illustration rather than an audited fact (consistent with 6.1's finding
that the spec's assumed file layout was also wrong), the actual insertion
point is resolved from the spec's stated _rationale_, not its literal
array:

> "After estimate: user has seen price and is committed to proceeding.
> Before photos: keeps commercially-relevant info together. Before contact
> info: still low-commitment for user."

`extras` (gate/removal add-ons) is exactly the "commercially-relevant info"
the rationale describes, and it already sits between `estimate` and
`site_photos`. Inserting the new step **after `extras`, immediately before
`site_photos`** satisfies every constraint literally: it is after
`estimate-display` (criterion 2), before `photos` (criterion 3), and it
keeps all commercially/quote-relevant steps (`estimate`, `extras`,
`fencing-details`) contiguous rather than splitting `extras` away from the
estimate flow. Final order:

```
fence_size → fence_type_step → fence_height_step → estimate → extras
  → fencing-details (NEW) → site_photos → contact-and-address → optional-details
```

## Field type used for existing radio-style questions

`include_gate` and `remove_old` are `type: 'checkbox'` (single-option
checkboxes, "Yes, include a gate"), not `radio` — checkbox was used there
because a single boolean toggle reads more naturally as a checkbox than a
two-option radio group. The registry does separately define `'radio'`
(`FIELD_TYPES` in `domain/config/field-types.ts`) with a working renderer
(`components/steps/fields/RadioGroupField.tsx`), just not yet exercised by
any existing fencing field — this step is the first classic-field-step
usage of `type: 'radio'` in `fencing.config.ts`. Confirmed compatible: see
Audit B.

## Schema for helper text on individual fields — critical finding

`FieldSchema` (`domain/config/wizard-config.ts`) has exactly one
human-copy slot beyond `label`: a single `help: z.string().optional()` on
the **field**, rendered once beneath the field's legend/label (see
`RadioGroupField.tsx:26-30`, identical pattern in every other field
renderer). There is **no per-option helper text field** — `optionSchema`
(`wizard-config.ts:84-87`) is `{ value, label }` only. There is also no
`description` field on `Field` at all (only `Step` has `description`).

This is a hard mismatch with the spec's illustrative field shape, which
puts a distinct `helperText` on each radio _option_ (three different
helper strings for `terrain`'s three options) and a `description` on the
`gravel_boards` field. Per the spec's own fallback ("adjust to match
actual schema"), and per 6.1's precedent of adapting to existing
label/help mechanisms rather than adding new schema fields (a schema
change would be an architectural change, explicitly out of scope for
6.2), resolution:

- **Per-option nuance** (`terrain`, `post_material`): folded into the
  option `label` itself, e.g. `'Soft — standard soil, easy to dig'`. No
  schema or renderer change; the option's full explanatory text is always
  visible, not conditionally shown or hidden.
- **Field-level description** (`gravel_boards`): mapped to the existing
  `help` field, which already renders beneath the field's label.

See `AUDIT-6.2-step-type.md` for the step-type-level version of this
finding.
