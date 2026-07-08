# Audit C — Current Contact Data Collection (5.13c)

Date: 2026-07-08
Step: 5.13c Phase 0 Audit C

## Current pre-step (engine-level, all wizards)

`addressPreStep` is injected before every wizard via `SessionConfig.preSteps`. It collects:

| field key     | label         | required |
| ------------- | ------------- | -------- |
| contact_name  | Your name     | true     |
| postcode      | Your postcode | true     |
| contact_phone | Phone number  | true     |
| contact_email | Email address | true     |

All fields are `type: 'text'`. Format validators applied via FORMAT_VALIDATORS:
`postcode` → validatePostcode, `contact_email` → validateEmail, `contact_phone` → validatePhone.

## Instant-quote services — inline contact step

All 7 instant-quote services have a `contact` step (id: `'contact'`) that collects the
same contact keys. Because the keys match the pre-step keys, answers auto-fill:

| field key     | label         | required | step position      |
| ------------- | ------------- | -------- | ------------------ |
| contact_name  | Your name     | true     | varies per service |
| contact_email | Email address | true     | varies per service |
| contact_phone | Phone number  | false    | varies per service |

The `contact` step appears after `estimate` in every instant-quote service. The user
typically sees the fields already filled from the pre-step answers.

**No full street address is collected in any instant-quote service today.**

### Fencing contact step position

Step index 4 (after: size → type → height → estimate → **contact** → extras)

### Decking contact step position

Step index 3 (after: size → material → estimate → **contact** → extras)

### Painting contact step position

Step index 3 (after: rooms → what_to_paint → estimate → **contact** → extras)

### Patio contact step position

Step index 3 (after: size → material → estimate → **contact** → extras)

### Driveway contact step position

Step index 3 (after: size → material → estimate → **contact** → extras)

### Steps contact step position

Step index 4 (after: shape → material → count → estimate → **contact** → extras)

### Jetwash contact step position

Step index 3 (after: size → surface_type → estimate → **contact**, no extras)

## Manual-quote services — inline contact collection

All 4 manual-quote services collect contact details in two steps at the end:

1. `contact` step (index 5): contact_name, contact_phone, contact_email
2. `address` step (index 6): postcode (key: `'postcode'`)

With the current 4-field pre-step, these fields are auto-filled from pre-step answers.
After 5.13c reduces the pre-step to postcode-only, the `contact` step in manual-quote
services will no longer be auto-filled (except `postcode` in the `address` step).

## 5.13c target state

### Pre-step (all wizards)

Reduced to postcode-only. New id: `'postcode_prestep'` (avoids collision with end step).

| field key | label         | required |
| --------- | ------------- | -------- |
| postcode  | Your postcode | true     |

### End-of-wizard contact step (instant-quote services only)

New step added, replacing the existing `contact` step. Id: `'contact-and-address'`.

| field key     | label         | required | Format validator |
| ------------- | ------------- | -------- | ---------------- |
| contact_name  | Your name     | true     | none             |
| contact_phone | Phone number  | true     | validatePhone    |
| contact_email | Email address | true     | validateEmail    |
| full_address  | Full address  | true     | none             |

`full_address` is a new field key (not in FORMAT_VALIDATORS). Required=true; validated
by the standard required/non-empty check only.

### Manual-quote services

Pre-step reduces to postcode-only. The existing `contact` and `address` steps remain
unchanged. Contact details (name, phone, email) are no longer auto-filled by the pre-step
— the user fills them manually at the `contact` step.

## Impact on existing tests

### `address-prestep.test.ts` (5 tests) — ALL must be rewritten in Commit 2

Tests verify 4 fields, all required, all type=text, and specific keys. After reducing
to 1 field, all 5 tests need rewriting.

### Per-service validation tests — step index assertions

Tests that verify step sequence (e.g., `fencing-validation.test.ts`) check step ids.
The `'contact'` step id changes to `'contact-and-address'`, so expected step arrays
must be updated in Commits 3 and 4.

### `manual-quote-configs.test.ts` — unchanged

Manual-quote step sequence remains the same. Tests unaffected except that the pre-step
wiring is engine-level (not tested in these config unit tests).

## Inline validation — no changes to FORMAT_VALIDATORS

The keys `contact_email` and `contact_phone` already appear in FORMAT_VALIDATORS.
Moving these fields from the pre-step to the end-of-wizard step does NOT require changes
to FORMAT_VALIDATORS — validation applies to any `type: 'text'` field whose `key` is in
the map, regardless of which step it appears in.

`full_address` is NOT added to FORMAT_VALIDATORS — only required/non-empty validation applies.
