# Audit 6.3-C: Text-Area Field Type

_Compiled: 2026-07-22_

## Path note

Same as 6.2's Audit B: `apps/wizard/src/domain/steps/` holds only
`__tests__/` for the non-field step kinds. The field-type registry and
schema live in `domain/config/field-types.ts` and
`domain/config/wizard-config.ts`; the renderer lives in
`components/steps/fields/TextareaField.tsx`. Saved here per the spec's
requested path.

## What field type is used for long-form text input?

`type: 'textarea'` — already registered in `FIELD_TYPES`
(`domain/config/field-types.ts`): `'textarea', // multi-line free text`.
Already exercised by all four existing manual-quote services'
`work_description` field (see `AUDIT-6.3-manual-flow.md`). No new field
type needed.

## What schema fields does it support?

`FieldSchema` (`domain/config/wizard-config.ts`) — the same strict object
audited in 6.1/6.2, unchanged since:

```ts
{
  id: string;        // stable id
  key: string;        // answer key
  type: 'textarea';    // (or any of the 9 FIELD_TYPES)
  label: string;       // required, shown as the field's legend/label
  help?: string;       // optional, one string, rendered once below the label
  required?: boolean;  // default false
  options?: ...;       // forbidden for textarea (only choice fields use it)
  condition?: ...;      // optional visibility condition
  maxCount?: number;    // photo fields only, ignored otherwise
}
```

**No `placeholder` field exists anywhere in `FieldSchema`, and
`TextareaField.tsx`'s `<textarea>` element does not set a `placeholder`
attribute at all** (confirmed by reading the component — the props it
reads from `field` are only `label`, `help`, `required`; nothing else is
forwarded to the DOM element as a placeholder). The spec's illustrative
`placeholder: 'E.g., "I need a garden shed built..."'` field cannot be
added without both a schema change (out of scope — "No architectural
changes") and a renderer change. Per 6.1/6.2 precedent, resolution: fold
the example text into the existing `help` string instead — this is
exactly what `general-repairs.config.ts`/`plumbing.config.ts` already do
(`help: 'The more detail you give, the more accurate our quote will
be.'`); "Other"'s `help` can extend that pattern with a concrete example.

**No min/max length field exists either.** `validateField()`'s
`'textarea'` case (`domain/runtime/answer-validation.ts`) only checks
`typeof answer !== 'string'` and, for fields with a `FORMAT_VALIDATORS`
entry, applies that; there's no length constraint mechanism for text
fields in general. Not needed for "Other" — the spec doesn't ask for one.

## Existing examples of dedicated description steps

All four manual-quote services' `description` step (see Audit B) — a
step containing exactly one `textarea` field, always first in the
sequence. "Other"'s project-description step is the same construct with
different copy, not a new pattern.
