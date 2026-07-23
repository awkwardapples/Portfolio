# SCB Handyman — Pricing Intake Questionnaire

**Purpose:** exhaustive list of questions to ask Shane so the 7 instant-quote services
can be calibrated with real pricing before launch. Every field below maps directly to a
value in `apps/wizard/src/domain/fixtures/{service}.config.ts`'s `PricingConfig`. Until
answered, each service ships with the template's placeholder figures (clearly rough,
not calibrated to SCB's actual rates).

**Format reminder for whoever fills this in:** all money answers should be given as a
normal `£` amount (e.g. "£85 per metre") — I'll convert to integer pence when I apply
them. Do not give decimals in the final config; that conversion is handled during
implementation, not by the client.

---

## 1. Fencing

- **Base rate per linear metre** for your baseline fence type (currently modelled as
  feather edge). What do you charge per metre for a standard feather-edge fence at
  standard height?
- **Type premiums/discounts relative to that base** — as a % more or less than feather
  edge, or as a direct £/m rate, for:
  - Closeboard
  - Panel
  - Chain link
- **Height premiums/discounts** — as a % or direct rate, for:
  - Low (up to 1.2m / 4ft)
  - Standard (1.5–1.8m / 5–6ft) — this is the baseline height
  - Tall (over 1.8m / 6ft)
- **Extras (flat add-on price each):**
  - Gate supply and fit — how much?
  - Removing and disposing of an existing fence — how much?
- **Minimum job price** — smallest amount you'd ever invoice for a fencing job,
  regardless of length.
- **Maximum sane job price** — a ceiling above which the instant estimate should stop
  and just say "contact us" rather than quote a number (used as a sanity cap, e.g.
  £50,000).
- **Price rounding** — do you prefer quoted estimates rounded to the nearest £5, £10,
  £25, or no rounding?
- **Estimate range spread** — the wizard shows a range (e.g. "£1,275–£1,725") rather
  than one number. What % either side of the calculated price reflects your real-world
  quote variance? (Template default is ±15%.)

_(Note: `fencing-details` step — terrain, post material, gravel boards — is currently
pure metadata for your own quote prep and has no pricing effect. Flag if you'd like any
of those to actually change the price.)_

---

## 2. Decking

- **Base rate per square metre** for your baseline material (currently modelled as
  softwood).
- **Material premiums** — % or £/m² more than softwood, for:
  - Hardwood
  - Composite
- **Extras (flat add-on price each):**
  - Steps supply and fit — how much?
  - Integrated deck lighting — how much?
- **Minimum job price.**
- **Maximum sane job price / cap.**
- **Rounding preference.**
- **Estimate range spread** (default ±15%) — does this match your real quote variance?

---

## 3. Patio & Paving

- **Base rate per square metre** for your baseline material (currently modelled as
  450×450 riven slabs).
- **Material premiums** relative to that base, for:
  - Indian sandstone
  - Sawn sandstone
  - Porcelain
- **Edging cost** (flat add-on):
  - Block edging — how much?
  - Kerb edging — how much?
  - (No edging = £0, already assumed)
- **Extra: steps supply and fit** — flat add-on price?
- **Minimum job price.**
- **Maximum sane job price / cap.**
- **Rounding preference.**
- **Estimate range spread** (default ±15%).

---

## 4. Driveway

- **Base rate per square metre** for your baseline material (currently modelled as
  Driveline 50 block paving).
- **Material premiums** relative to that base, for:
  - Tegula style block paving
  - Resin bound
  - Marshall Drivesys (permeable)
- **Extras (flat add-on price each):**
  - Kerb edging supply and fit — how much?
  - Steps supply and fit — how much?
- **Minimum job price.**
- **Maximum sane job price / cap.**
- **Rounding preference.**
- **Estimate range spread** (default ±15%).

---

## 5. Garden Steps

- **Base rate per step** for your baseline shape/material (currently modelled as
  brick, straight).
- **Shape premiums** relative to that base:
  - Curved or semi-circular
  - "Not sure — let's discuss" (an uncertainty allowance — what % extra covers your
    risk of quoting blind here?)
- **Material premiums** relative to brick:
  - Slate
  - Portland stone
  - Cast stone
  - Granite
- **Extras (flat add-on price each):**
  - Step threads (horizontal face) — how much?
  - Step risers (vertical face) — how much?
- **Minimum job price.**
- **Maximum sane job price / cap.**
- **Rounding preference.**
- **Estimate range spread** (default ±15%).

---

## 6. Painting & Decorating

- **Base rate per room** — what's your standard charge for painting a typical room
  (walls only, average size)?
- **Does the price change based on what's being painted?** Currently "what to paint"
  (walls / ceilings / skirting / doors / window frames) is collected but has **no
  pricing effect** at all — every room costs the same regardless of scope selected.
  Do you want this to actually change the price (e.g. ceilings add X%, doors are Y
  flat rate each)? If yes, I'll need a rate for each item; if no, confirm the flat
  per-room rate is fine as-is.
- **Minimum job price.**
- **Maximum sane job price / cap.**
- **Rounding preference.**
- **Estimate range spread** (default ±15%).

_(Note: "surface repairs needed" and "customer supplying paint" are currently
informational only, no price effect. Flag if either should discount/increase price —
e.g. a discount if the customer supplies their own paint.)_

---

## 7. Pressure Washing (Jetwash)

- **Base rate per square metre** for your baseline surface (currently modelled as
  the general rate, no material-specific baseline beyond a decking premium).
- **Surface premiums** relative to that base:
  - Patio or paving (baseline, or does this need its own rate?)
  - Driveway
  - Decking or timber (currently the only premium modelled — is a premium correct here,
    and if so how much?)
  - Path or steps
- **Minimum job price** (smallest callout charge).
- **Maximum sane job price / cap.**
- **Rounding preference.**
- **Estimate range spread** (default ±15%).

---

## General questions that apply across all 7 services

1. **Currency/VAT:** Are these prices VAT-inclusive or exclusive? Are you VAT
   registered? (Affects whether "+ VAT" needs to appear near the estimate — a
   copy change, flagged separately if needed.)
2. **Seasonal/regional adjustment:** Do you charge differently for jobs further from
   Guildford, or at busier times of year? (The engine has no built-in mechanism for
   this — it would need to be a flat allowance baked into the base rate, or is out of
   scope for the instant estimate and handled at the manual follow-up stage.)
3. **Confidence check:** For each service, on a 20m fence / 20m² deck / 25m² patio /
   45m² driveway / 5-step job / 4-room paint job / 35m² pressure wash (i.e. the
   "medium" bracket typical values already in the wizard), does the template's
   placeholder price land roughly right, roughly double, or roughly half what you'd
   actually quote? This alone would let me sanity-check whichever numbers you send
   back.

---

_This questionnaire covers Task 8b of `docs/llm-customization-handoff.md`. Once
answered, I'll convert every £ figure to integer pence and update the seven
`*.config.ts` fixture files directly — no further input needed from you beyond the
numbers above._
