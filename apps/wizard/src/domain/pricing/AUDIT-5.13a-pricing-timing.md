# Audit B — Pricing Calculation Timing (5.13a)

## Scope

Understand when pricing is calculated and whether it can be called at any point
in the wizard flow (not just at the end).

## Findings

### computePrice is already a pure on-demand function

`computePrice(answers, wizard, pricing)` in `pricing-engine.ts` is a pure function:

- Takes current `answers`, `wizard` config, and `pricing` config as arguments
- Returns `PricingResult` — no state mutation, no side effects
- Returns `{ valid: false }` when the quantity field is not yet answered or is non-numeric
- Can be called at ANY point given the current answer map
- Does NOT depend on wizard phase or step position

### Already used mid-wizard

`WizardShell.tsx` already calls `selectPrice(state, config)` (a thin wrapper around
`computePrice`) while the wizard is in the `answering` phase to render `<PriceSummary>`.
This confirms that pricing is callable mid-wizard today.

### Pricing selectors

`selectPrice`, `selectPricingBreakdown`, and `selectIsPricingValid` in
`pricing-selectors.ts` are all pure functions that delegate to `computePrice`.

## Impact on 5.13a

### No refactoring required

The estimate-display step can call `selectPrice(state, config)` (or `computePrice` directly)
in its component body and get the current price range immediately. No architectural changes
to the pricing layer are needed.

### Component design note

`EstimateDisplayStep` imports `selectPrice` from `@/domain/pricing` and calls it with
`state.answers` from `useWizard()` and `config` from `useWizardStore().getConfig()`. This
matches the existing pattern in `WizardShell`.

### Partial-answer behaviour

If the user reaches an estimate-display step before answering the quantity field, `computePrice`
returns `valid: false`. The estimate-display component should handle this gracefully (e.g.,
show "Price not yet available" or hide the estimate section). This is a component-level
concern, not an engine concern.
