# Audit 6.5-B: non-field-step-engine.test.ts Type Errors

_Compiled: 2026-07-22_

## Path correction

The spec assumes `apps/wizard/src/domain/__tests__/non-field-step-
engine.test.ts`. The real location (confirmed by `Get-ChildItem`/`find`)
is:

```
apps/wizard/src/domain/steps/__tests__/non-field-step-engine.test.ts
```

Under `domain/steps/__tests__/`, not `domain/__tests__/` — consistent
with this file testing the 5.13a non-field step _kinds_
(`estimate-display`, `visual-card-selector`, `size-bracket-selector`),
which conceptually live under `domain/steps/` even though their schemas
are physically defined in `domain/config/wizard-config.ts` (same
distinction noted in 6.2's and 6.3's own audits of that directory).

## Command run

```
cd apps/wizard
pnpm typecheck
```

(`pnpm typecheck` runs `tsc --noEmit && tsc --noEmit -p tsconfig.test.json`
— both production and test compilation. Only the second command surfaces
these errors; see `AUDIT-6.5-tsconfig-test-error.md` for why.)

## Exact errors

```
src/domain/steps/__tests__/non-field-step-engine.test.ts(52,5): error TS2322:
  Type '{ stepKind: "visual-card-selector"; id: string; title: string;
  answerKey: string; options: { id: string; label: string; }[]; }' is not
  assignable to type '...'.
    Property 'multiple' is missing in type '{ stepKind:
    "visual-card-selector"; ... }' but required in type '{ ...
    stepKind: "visual-card-selector"; answerKey: string; multiple: boolean;
    ... }'.

src/domain/steps/__tests__/non-field-step-engine.test.ts(59,5): error TS2322:
  Type '{ stepKind: "estimate-display"; id: string; title: string;
  disclaimer: string; onAdjustGoTo: string; }' is not assignable to type
  '...'.
    Property 'showRangeAsRange' is missing in type '{ stepKind:
    "estimate-display"; ... }' but required in type '{ ... stepKind:
    "estimate-display"; disclaimer: string; showRangeAsRange: boolean;
    onAdjustGoTo: string; ... }'.
```

Exactly 2 errors, both `TS2322` ("not assignable"), both on object
literals inside the `allStepTypesConfig` fixture (lines 43–71):

- Line 52: the `visual-card-selector` step object (id `material_step`)
  omits `multiple`.
- Line 59: the `estimate-display` step object (id `estimate`) omits
  `showRangeAsRange`.

## Root cause — not missing types, not wrong assertions, not deprecated APIs

**It's neither of the three categories the spec's Audit B guessed at.**
The actual cause: `VisualCardSelectorStepSchema.multiple` and
`EstimateDisplayStepSchema.showRangeAsRange` are both declared with Zod
`.default(false)`/`.default(true)` (`domain/config/wizard-config.ts`).
A Zod field with `.default()` is **optional on the schema's parse
_input_** (an author may omit it and the default applies at runtime) but
**required on `z.infer`'s output type** (the type represents the shape
_after_ parsing, where the default has already been substituted in).
`WizardConfig` (used as this fixture's type annotation) is exactly that
output-inferred type — so TypeScript correctly requires both fields
explicitly, even though the Zod schema would happily default them at
runtime if this object were ever actually parsed.

This is a real, if easy-to-miss, distinction that trips up anyone writing
a config literal typed directly as the parsed output type instead of
running it through the parser. And it's not a systemic problem — check
any real service config (`fencing.config.ts`'s `fence_type_step`
includes `multiple: false` explicitly; its `estimate` step includes
`showRangeAsRange: true`) and every one of the 11 production wizard
configs (soon 12, with `other`) sets both fields explicitly on every
`visual-card-selector`/`estimate-display` step. **Only this one test
fixture, added in Step 5.13a/5.13b to exercise the non-field step engine
generically, omitted them** — a plain oversight when the fixture was
first written, not a pattern anyone should generalize a "fix the schema"
or "relax the type" response from. `AnyStep`'s type is correct; the
fixture is incomplete.

## Fix

Add the two missing fields, matching how every real config already does
it:

```ts
{
  stepKind: 'visual-card-selector' as const,
  id: 'material_step',
  title: 'Material',
  answerKey: 'material',
  multiple: false,          // ← added
  options: [{ id: 'brick', label: 'Brick' }],
},
// ...
{
  stepKind: 'estimate-display' as const,
  id: 'estimate',
  title: 'Estimate',
  disclaimer: 'Guide price only.',
  showRangeAsRange: true,   // ← added
  onAdjustGoTo: 'area_bracket',
},
```

Neither field affects what this test file actually asserts (it tests
`buildFieldKeyMap`/`validateStep`/`getVisibleSteps` behavior around
non-field steps generally, never reads `multiple` or `showRangeAsRange`
directly) — this is a type-level completeness fix with zero behavioral
change to the test's own assertions or the code under test.

## Verification after fix

```
pnpm typecheck   # must exit 0, no errors
pnpm test        # 820/820 unchanged; this file's own 10 tests unaffected in behavior
```
