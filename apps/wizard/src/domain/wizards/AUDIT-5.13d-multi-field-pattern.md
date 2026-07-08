# Audit B — Multi-Field Step Pattern (5.13d Phase 0)

**Date:** 2026-07-08
**Purpose:** Document the existing multi-field step pattern so optional-details can reuse it correctly.

## Source

`apps/wizard/src/domain/config/wizard-config.ts` — `StepSchema`

## Classic field step structure (`StepSchema`)

```typescript
export const StepSchema = z.strictObject({
  id: idSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(FieldSchema).min(1),
  condition: ConditionSchema.optional(),
});
```

Identified by the presence of a `fields` array. Discriminated from new step kinds via `isFieldStep(step)`.

## Field structure (`FieldSchema`)

```typescript
export const FieldSchema = z.strictObject({
  id: idSchema, // stable id — contract, never changes
  key: idSchema, // answer key in wizard state
  type: z.enum(FIELD_TYPES), // 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'dimensions' | 'photo' | 'review'
  label: z.string().min(1),
  help: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(optionSchema).optional(), // required for select/radio/checkbox; forbidden for others
  condition: ConditionSchema.optional(),
  maxCount: z.number().int().min(1).max(5).optional(), // photo fields only
});
```

**Strict object** — unknown keys fail validation. Cannot add `maxLength` or other arbitrary keys.

## Condition structure

Field or step visibility is controlled by a `condition` property:

```typescript
condition: { operator: 'equals', fieldId: '<field-id>', value: '<answer-value>' }
```

- `fieldId` references the field's **id** (not key)
- The condition evaluator resolves `fieldId → key` via `buildFieldKeyMap` (covers all fields in all steps)
- Intra-step field conditions work — a field can depend on another field in the same step
- Fail-closed: unknown `fieldId` always evaluates to `false`

## Existing contact-and-address step as reference

All 7 instant-quote services share this pattern for the multi-field step:

```typescript
{
  id: 'contact-and-address',
  title: 'Almost done!',
  description: 'Enter your details so we can send you your personalised quote.',
  fields: [
    { id: 'contact_name',  key: 'contact_name',  type: 'text', label: 'Your name',     required: true },
    { id: 'contact_phone', key: 'contact_phone', type: 'text', label: 'Phone number',  required: true },
    { id: 'contact_email', key: 'contact_email', type: 'text', label: 'Email address', required: true },
    { id: 'full_address',  key: 'full_address',  type: 'text', label: 'Full address',  required: true },
  ],
}
```

## Optional-details step design

The optional-details step reuses the same structure:

```typescript
{
  id: 'optional-details',
  title: 'Anything else? (Optional)',
  description: "These details help us prepare the best possible quote. Fill in what you'd like, or skip and submit.",
  allowSkip: true,   // NEW flag (added to StepSchema in Commit 2)
  fields: [
    // Per-service fields, all required: false
  ],
}
```

`allowSkip` requires adding `allowSkip: z.boolean().optional()` to `StepSchema`. Since `StepSchema` uses `z.strictObject`, the field must be explicitly declared in the schema — unknown keys still fail.

## Choice field options format

Select, radio, and checkbox fields MUST declare options as `{ value: string, label: string }` objects:

```typescript
options: [
  { value: 'next_week', label: 'Next week' },
  { value: 'next_month', label: 'Next month' },
];
```

Plain strings are not accepted — they will fail Zod validation at the `optionSchema` level.

## Field id / key convention

In the optional-details step, `id` and `key` will be identical for all fields (no reason to separate them). Example:

```typescript
{ id: 'preferred_timeframe', key: 'preferred_timeframe', type: 'select', ... }
```
