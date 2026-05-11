# Pricing Engine Specification

**Version:** 1.0
**Status:** Proposed
**Purpose:** The formal contract for the config-driven pricing engine. The engine is built against this spec; this spec is the source of truth for what the engine does and does not do.

---

## 1. Goals

The pricing engine must:

1. Accept a typed configuration object describing a trade's pricing model.
2. Accept a typed answers object representing the user's wizard responses.
3. Produce a deterministic, typed estimate object containing a low and high range.
4. Be a pure function — no I/O, no globals, no side effects.
5. Support the fencing reference implementation completely.
6. Support extension to other trades (handyman, landscaping, garden services) via configuration alone, with no engine code changes for the common case.
7. Be fully unit-testable.
8. Fail loudly on misconfiguration. Silent fallback values are forbidden.

The engine must **not**:

- Know what fencing is.
- Hard-code any trade-specific logic.
- Perform any network calls.
- Round in surprising ways (rounding policy is explicit).
- Produce a single point estimate without a range (the brief requires "between £X and £Y").

---

## 2. Conceptual model

A pricing config describes how to build a total price from a set of answers. The total is composed by combining contributions of four kinds:

| Contribution kind | Example | Notes |
|---|---|---|
| **Base** | Fencing base price: £600 | A flat starting amount |
| **Per-unit** | Gravel board: £8/metre | Multiplied by a quantity from the answers |
| **Multiplier** | Difficult terrain: ×1.25 | Multiplies a subset of contributions (or the running total) |
| **Add-on** | Gate: £180 each | Fixed amounts, possibly quantified |

The total is then bracketed into a range using a configurable variance — for example, ±15% — to produce the "low" and "high" outputs the user sees.

The engine's job is to evaluate each contribution in a defined order, applying multipliers correctly, and produce the final range.

---

## 3. Config schema (TypeScript types)

The TypeScript definitions below are the source of truth. The JSON Schema and Zod runtime validators are generated from these.

```typescript
// =============================================================================
// Identifiers — string newtypes for clarity
// =============================================================================
type StepId = string;        // unique within a wizard config
type AnswerKey = string;     // dotted path into the answers object, e.g. "fence.length"
type RuleId = string;        // unique within a pricing config

// =============================================================================
// Wizard configuration
// =============================================================================
interface WizardConfig {
  schemaVersion: 1;
  trade: string;                       // "fencing", "landscaping", etc. Informational only.
  meta: {
    businessName: string;
    primaryColor: string;              // hex, e.g. "#0F4C81"
    currency: "GBP";                   // v1: GBP only
    locale: "en-GB";                   // v1: en-GB only
    vatBehavior: "exclusive" | "inclusive";  // affects estimate display copy
  };
  steps: Step[];
  pricing: PricingConfig;
  result: ResultConfig;
}

// =============================================================================
// Wizard steps
// =============================================================================
type Step =
  | TextStep
  | NumberStep
  | SingleChoiceStep
  | MultiChoiceStep
  | PhotoUploadStep
  | ContactDetailsStep
  | ReviewStep;

interface StepBase {
  id: StepId;
  title: string;
  description?: string;
  answerKey: AnswerKey;
  required: boolean;
  visibleWhen?: Condition;             // step skipped if condition is false
}

interface TextStep extends StepBase {
  type: "text";
  placeholder?: string;
  maxLength?: number;
}

interface NumberStep extends StepBase {
  type: "number";
  min?: number;
  max?: number;
  unit?: string;                       // display only, e.g. "metres"
}

interface SingleChoiceStep extends StepBase {
  type: "single-choice";
  options: Choice[];
  display: "buttons" | "dropdown";
}

interface MultiChoiceStep extends StepBase {
  type: "multi-choice";
  options: Choice[];
  minSelected?: number;
  maxSelected?: number;
}

interface PhotoUploadStep extends StepBase {
  type: "photos";
  maxFiles: number;                    // e.g. 5
  maxFileSizeMb: number;               // pre-compression
}

interface ContactDetailsStep extends StepBase {
  type: "contact";
  fields: ContactField[];              // e.g. ["name", "email", "phone", "address", "consent"]
}

interface ReviewStep extends StepBase {
  type: "review";
}

interface Choice {
  value: string;
  label: string;
  description?: string;
}

type ContactField = "name" | "email" | "phone" | "address" | "postcode" | "consent";

// =============================================================================
// Conditions — used for step visibility and rule application
// =============================================================================
type Condition =
  | { op: "equals"; key: AnswerKey; value: string | number | boolean }
  | { op: "includes"; key: AnswerKey; value: string }
  | { op: "gt" | "gte" | "lt" | "lte"; key: AnswerKey; value: number }
  | { op: "and"; conditions: Condition[] }
  | { op: "or"; conditions: Condition[] }
  | { op: "not"; condition: Condition };

// =============================================================================
// Pricing configuration
// =============================================================================
interface PricingConfig {
  currency: "GBP";
  rules: PricingRule[];                // evaluated in array order
  variance: VarianceConfig;
  rounding: RoundingConfig;
}

type PricingRule =
  | BaseRule
  | PerUnitRule
  | LookupRule
  | MultiplierRule
  | AddonRule;

interface RuleBase {
  id: RuleId;
  description: string;                 // for debugging; not shown to user
  when?: Condition;                    // rule applies only if condition is true
}

interface BaseRule extends RuleBase {
  kind: "base";
  amount: number;                      // e.g. 600
}

interface PerUnitRule extends RuleBase {
  kind: "per-unit";
  quantityKey: AnswerKey;              // e.g. "fence.length"
  amountPerUnit: number;               // e.g. 200 (£/metre)
}

interface LookupRule extends RuleBase {
  kind: "lookup";
  lookupKey: AnswerKey;                // e.g. "fence.material"
  amounts: Record<string, number>;     // e.g. { closeboard: 0, picket: -100, composite: 400 }
                                       // The matched value is added.
}

interface MultiplierRule extends RuleBase {
  kind: "multiplier";
  lookupKey: AnswerKey;                // e.g. "terrain"
  factors: Record<string, number>;     // e.g. { normal: 1, difficult: 1.25, severe: 1.5 }
  appliesTo: "running-total" | { sinceRuleId: RuleId };
                                       // running-total: multiplies the total so far
                                       // sinceRuleId: multiplies only the sum since that rule
}

interface AddonRule extends RuleBase {
  kind: "addon";
  amount: number;                      // e.g. 180 for a gate
  quantityKey?: AnswerKey;             // optional: if present, amount × quantity
  toggleKey?: AnswerKey;               // optional: applied only if answer is truthy
}

interface VarianceConfig {
  // Final low/high bracket
  // E.g. { mode: "percentage", value: 0.15 } → ±15%
  // E.g. { mode: "absolute", value: 200 } → ±£200
  mode: "percentage" | "absolute";
  value: number;
}

interface RoundingConfig {
  // Applied to low and high independently
  // E.g. { mode: "nearest", to: 50 } → rounds to nearest £50
  // E.g. { mode: "up", to: 10 } → always rounds up to nearest £10
  mode: "nearest" | "up" | "down";
  to: number;
}

// =============================================================================
// Result screen configuration
// =============================================================================
interface ResultConfig {
  headline: string;                    // e.g. "Your indicative estimate"
  rangeIntro: string;                  // e.g. "Projects like this typically cost between"
  rangeSuffix: string;                 // e.g. "+ VAT"
  disclaimer: string;                  // e.g. "This is an indicative estimate only..."
  primaryCta: {
    label: string;                     // e.g. "Book a free site visit"
    href?: string;                     // e.g. Calendly URL; if absent, shows phone CTA
  };
  trustSignals?: TrustSignal[];
}

interface TrustSignal {
  kind: "review-count" | "rating" | "years-trading" | "free-text";
  value: string;                       // display string, e.g. "127 five-star reviews"
}

// =============================================================================
// Engine input/output
// =============================================================================
type Answers = Record<AnswerKey, AnswerValue>;
type AnswerValue = string | number | boolean | string[] | null;

interface Estimate {
  low: number;                         // rounded
  high: number;                        // rounded
  currency: "GBP";
  vatBehavior: "exclusive" | "inclusive";
  breakdown: BreakdownEntry[];         // for debugging / advanced display
  warnings: string[];                  // non-fatal issues, e.g. "fallback used for unknown material"
}

interface BreakdownEntry {
  ruleId: RuleId;
  description: string;
  contribution: number;                // signed; multipliers contribute the delta
}
```

---

## 4. Evaluation algorithm

The engine is a pure reducer over the rules list. Pseudocode:

```
function calculate(pricing, answers):
    runningTotal = 0
    breakdown = []
    warnings = []
    ruleTotalsById = {}  // for "appliesTo: sinceRuleId" multiplier scope

    for each rule in pricing.rules (in order):
        if rule.when is defined and not evaluateCondition(rule.when, answers):
            continue  // rule skipped

        contribution = 0

        switch rule.kind:
            case "base":
                contribution = rule.amount

            case "per-unit":
                quantity = answers[rule.quantityKey]
                if quantity is null or undefined:
                    if rule is required-implicit:
                        FAIL_LOUDLY("per-unit rule references missing answer")
                    else:
                        contribution = 0
                else:
                    contribution = quantity × rule.amountPerUnit

            case "lookup":
                key = answers[rule.lookupKey]
                if key in rule.amounts:
                    contribution = rule.amounts[key]
                else:
                    warnings.push("lookup rule X had no entry for value Y; treated as 0")
                    contribution = 0

            case "multiplier":
                key = answers[rule.lookupKey]
                factor = rule.factors[key] or 1  // unknown values default to 1 with a warning
                if rule.appliesTo == "running-total":
                    delta = runningTotal × (factor - 1)
                    runningTotal += delta
                    contribution = delta  // for breakdown
                else if rule.appliesTo.sinceRuleId is defined:
                    scopedTotal = sum of contributions from rules after sinceRuleId
                    delta = scopedTotal × (factor - 1)
                    runningTotal += delta
                    contribution = delta
                continue  // skip the runningTotal += contribution below

            case "addon":
                if rule.toggleKey is defined and not truthy(answers[rule.toggleKey]):
                    continue
                quantity = (rule.quantityKey defined) ? answers[rule.quantityKey] : 1
                contribution = rule.amount × quantity

        runningTotal += contribution
        ruleTotalsById[rule.id] = contribution
        breakdown.push({ ruleId, description, contribution })

    // Apply variance
    variance = pricing.variance
    if variance.mode == "percentage":
        low = runningTotal × (1 - variance.value)
        high = runningTotal × (1 + variance.value)
    else:
        low = runningTotal - variance.value
        high = runningTotal + variance.value

    // Apply rounding independently
    low = round(low, pricing.rounding)
    high = round(high, pricing.rounding)

    return { low, high, breakdown, warnings, ... }
```

**Notes on the algorithm:**

- **Order matters.** Rules are evaluated in the order they appear in the config. A multiplier applied after a base rule and per-unit rule will multiply both. A multiplier applied before a per-unit rule will not affect that per-unit rule.
- **Unknown lookup values warn, don't fail.** A user submits an answer the config didn't enumerate (e.g. via a free-text fallback). The engine warns but does not crash. The submission still produces an estimate.
- **Missing required answers fail loudly.** If a per-unit rule references a key that has no answer and the step that should have populated it was visible (per `visibleWhen`), the engine throws. This is a config bug.
- **Multipliers below 0.5 or above 3.0 produce a config-load-time warning.** Not a hard limit, but extreme multipliers usually indicate a misconfiguration.

---

## 5. Worked example: fencing reference config

A representative fencing scenario:

```
- Length: 20m
- Terrain: difficult
- Material: composite
- Old fence removal: yes
- Gravel boards: yes (20m)
- Gates: 1
```

Reference config (abridged for clarity):

```json
{
  "currency": "GBP",
  "rules": [
    { "id": "base", "kind": "base", "amount": 600, "description": "Base fencing job" },
    { "id": "length", "kind": "per-unit", "quantityKey": "fence.length", "amountPerUnit": 200, "description": "Per-metre fence" },
    { "id": "material", "kind": "lookup", "lookupKey": "fence.material",
      "amounts": { "closeboard": 0, "picket": -100, "composite": 400 }, "description": "Material upgrade" },
    { "id": "terrain", "kind": "multiplier", "lookupKey": "terrain",
      "factors": { "normal": 1, "difficult": 1.25, "severe": 1.5 },
      "appliesTo": "running-total", "description": "Terrain difficulty" },
    { "id": "removal", "kind": "addon", "amount": 150, "toggleKey": "removeOldFence", "description": "Old fence removal" },
    { "id": "gravel", "kind": "addon", "amount": 8, "quantityKey": "fence.length", "toggleKey": "gravelBoards", "description": "Gravel boards" },
    { "id": "gates", "kind": "addon", "amount": 180, "quantityKey": "gates", "description": "Gates" }
  ],
  "variance": { "mode": "percentage", "value": 0.15 },
  "rounding": { "mode": "nearest", "to": 50 }
}
```

Step-by-step evaluation:

| Step | Rule | Contribution | Running total |
|---|---|---|---|
| 1 | base | +600 | 600 |
| 2 | length (20 × 200) | +4000 | 4600 |
| 3 | material (composite) | +400 | 5000 |
| 4 | terrain (difficult, ×1.25 on 5000) | +1250 (delta) | 6250 |
| 5 | removal (toggled on) | +150 | 6400 |
| 6 | gravel (20 × 8, toggled on) | +160 | 6560 |
| 7 | gates (1 × 180) | +180 | 6740 |

- Total: **£6,740**
- Variance ±15%: low = 6740 × 0.85 = 5,729; high = 6740 × 1.15 = 7,751
- Rounded to nearest £50: **low = £5,750**, **high = £7,750**
- Display: *"Projects like this typically cost between £5,750 and £7,750 + VAT."*

This worked example is also a unit test fixture. Any change to the engine that changes this output without an accompanying config change is a regression.

---

## 6. How to add a new trade

The acid test of the engine. Adding "landscaping" must require zero engine changes for the common case. The steps:

1. **Identify the pricing model.** Talk to the trades business. What's the base price? What are the per-unit costs (per square metre of patio, per linear metre of edging)? What multipliers apply (access difficulty, ground type)? What add-ons (lighting, drainage)?
2. **Identify the questions.** What does the wizard need to ask to feed the model? Map each question to an `AnswerKey`.
3. **Write `config/trades/landscaping.json`** with steps and pricing rules.
4. **Validate** the config loads against the Zod schema.
5. **Write worked examples** as unit test fixtures, like the fencing example above.
6. **Build.**

If you find yourself wanting to add a new `kind` of rule (e.g. a tiered pricing rule where the per-unit price varies by quantity bands), that **is** an engine change. It is allowed, but it is an architectural decision and gets an ADR. The bar is: "is this a pricing pattern we expect to see in multiple trades?"

Anticipated future engine extensions, in rough order of likelihood:

1. **Tiered per-unit rules** — first 10 units at £X, next 10 at £Y. Useful for area-based work.
2. **Minimum-price clamps** — "no job under £500", regardless of calculation.
3. **Combination rules** — "if A and B are both selected, add an extra £Z." Avoidable with multipliers in v1.
4. **Calendar-aware pricing** — peak-season multipliers. Out of scope for v1.

---

## 7. What the engine does not do

To prevent feature creep, the explicit list of things outside this engine's responsibility:

- **Currency conversion.** GBP only. A future multi-currency need is a separate epic.
- **VAT calculation.** The engine outputs ex-VAT or inc-VAT based on `vatBehavior` configuration; the user-facing display is "+ VAT" or "inc. VAT" suffix copy. We do not break VAT down or compute it differently.
- **Discount codes.** Not in v1. If a future need arises, this is a new rule kind.
- **Deposit calculation.** The wizard does not collect deposits.
- **Quote PDF generation.** A future workflow can build a PDF from the breakdown; the engine doesn't render documents.
- **Price comparison across competitors.** Not in scope; the engine knows about one business at a time.

---

## 8. Testing strategy

The pricing engine is the easiest part of the system to test thoroughly and the most expensive part to get wrong. Test coverage targets:

- **100% branch coverage** of `pricing-engine.ts`. The engine is pure; coverage is cheap to achieve.
- **Fixture-based tests.** Each fixture is `{ config, answers, expected }`. Adding a scenario is adding a fixture, not adding test code.
- **Property-based tests** for invariants: "for any valid config and answers, low ≤ total ≤ high"; "for any config, an empty answers object produces a result equal to the sum of unconditional base rules."
- **Snapshot tests for the breakdown.** A breakdown drift is a regression in human-readable output even if the totals match.
- **Config validation tests.** A handful of deliberately broken configs (missing required field, invalid multiplier range, unknown rule kind) must each produce a clear error message.

---

## 9. Backwards compatibility and versioning

The `schemaVersion: 1` field on the config exists so we can evolve the schema without breaking existing deployments.

- **Adding optional fields** is non-breaking and stays at version 1.
- **Adding a new rule kind** is non-breaking (older configs that don't use it still load) and stays at version 1.
- **Renaming a field, removing a field, or changing semantics** requires `schemaVersion: 2` and a documented migration.

When a v2 ships, the engine loads both — for one release cycle — so client configs can be migrated on their next deploy, not all at once.
