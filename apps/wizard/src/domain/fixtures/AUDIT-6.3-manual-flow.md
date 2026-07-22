# Audit 6.3-B: Manual Quote Flow Pattern

_Compiled: 2026-07-22_

## Source

Read `general-repairs.config.ts` and `plumbing.config.ts` in full and
diffed them. Per `general-repairs.config.ts`'s own header comment: "per
ADR-0021 Decision 3, all manual-quote services share a uniform step
structure; only the description prompt differs." Confirmed byte-for-byte:
`electrical.config.ts` and `carpentry.config.ts` follow identically (also
confirmed by the existing shared test suite,
`domain/fixtures/__tests__/manual-quote-configs.test.ts`, which already
runs the same structural assertions against all four via `it.each`).

## Standard step sequence — 7 steps, in this exact order

| #   | Step id              | Fields                                                                                                                                         | Required         |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | `description`        | one `textarea` field (`work_description`)                                                                                                      | required         |
| 2   | `urgency`            | one `select` field (`urgency`: emergency/this_week/this_month/flexible)                                                                        | required         |
| 3   | `property`           | one `select` field (`property_type`: residential/commercial)                                                                                   | required         |
| 4   | `site_photos`        | one `photo` field, `maxCount: 5`                                                                                                               | **not** required |
| 5   | `contact_preference` | one `radio` field (phone/email/either)                                                                                                         | required         |
| 6   | `contact`            | `contact_name` (required), `contact_phone` (**not** required — differs from instant-quote's `contact-and-address`), `contact_email` (required) | mixed            |
| 7   | `address`            | `postcode` (required) + `data_processing_consent` (required checkbox)                                                                          | required         |

**Critical finding — no dedicated postcode-first step in the config
itself, and no `optional-details` step at all.** This contradicts two of
the spec's assumptions:

1. The spec's illustrative flow was "postcode → project description →
   photos → contact → optional details → submit." The real flow is
   `description → urgency → property → site_photos → contact_preference
→ contact → address` — description **first**, postcode **last**
   (bundled with consent), and **no optional-details step exists for any
   manual-quote service** (confirmed by
   `manual-quote-configs.test.ts`'s own regression test: "`$id` does not
   have an optional-details step").
2. There is no config-level "postcode step" to reuse at all, because
   postcode is collected twice at two different layers — see next
   section.

## Where postcode actually comes from — engine-level pre-step, not config

`src/site/pages/QuotePage.tsx` prepends `addressPreStep`
(`domain/wizards/address-prestep.ts`, step id `postcode_prestep`, field
key `postcode`) to **every** resolved service's `SessionConfig` via
`preSteps: [addressPreStep]` — unconditionally, regardless of
`quoteMode`. So at runtime, every manual-quote service actually shows
`postcode_prestep` (from the engine) **before** its own `description`
step, and then asks for postcode _again_ in its own final `address` step.
This is existing, pre-6.3 behavior across all 11 services, not something
introduced here — the shared field `key: 'postcode'` in both places means
the second occurrence is pre-filled from the first (per
`address-prestep.ts`'s own comment: "auto-fill any postcode field in
subsequent steps via the shared key"), so the user isn't asked to retype
it, just to (harmlessly) re-confirm a pre-filled field. Not a target for
this step to fix (`fencing.config.ts` and every other config has the same
characteristic); `other.config.ts` follows the same convention as every
other service for consistency — it does **not** define its own leading
postcode step, matching every existing config.

## Common step types used

All 7 steps are classic field steps (`fields[]`, no `stepKind`) — no
`estimate-display`/`visual-card-selector`/`size-bracket-selector` appears
anywhere in a manual-quote config (those only make sense for
`quoteMode: 'instant'`, where a price is actually computed and shown).

## Text-area / description field pattern

`type: 'textarea'`, always the sole field on its own dedicated
`description` step, `required: true`, with a `help` string giving the
user guidance on what to include (e.g. "The more detail you give, the
more accurate our quote will be."). This **already is** "a dedicated
project description step" (D5=B) — for "Other," reusing this exact
pattern with Other-specific copy satisfies D5 with zero new mechanism.
See `AUDIT-6.3-textarea.md` for the field type's full schema.

## Notes/description location

Always step 1 (`description`), never bundled with any other field or
folded into the contact step. Consistent across all four manual
verticals.
