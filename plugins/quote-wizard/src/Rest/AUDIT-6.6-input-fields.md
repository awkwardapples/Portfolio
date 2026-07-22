# Audit A — User Input Entry Points (Step 6.6)

Enumerates every field a user can populate, classified as **structured**
(safe by validation/shape — no free-form string content) or **free-text**
(arbitrary string content — requires sanitization at the outbound boundary).

## Method

The wizard's field-type registry is the single source of truth for what a
field's answer _can_ be shaped like — `apps/wizard/src/domain/config/field-types.ts`:

```ts
export const FIELD_TYPES = [
  'text',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'number',
  'dimensions',
  'photo',
  'review',
] as const;
```

Every fixture config under `apps/wizard/src/domain/fixtures/*.config.ts` was
grepped for `type: 'text'` / `type: 'textarea'` to enumerate which answer
`key`s actually carry free text in this template (see command below). All
other field types are structurally constrained by the schema/renderer, not
by any server-side sanitizer.

```powershell
Get-ChildItem apps/wizard/src/domain/fixtures -Filter *.config.ts |
  Select-String "type: '(text|textarea)'" -Context 4,0
```

## Classification

### Free-text (requires sanitization)

| Answer key           | Field type                                    | Present in                                                                         |
| -------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `contact_name`       | text                                          | every service config                                                               |
| `contact_phone`      | text                                          | every service config                                                               |
| `contact_email`      | text                                          | every service config                                                               |
| `full_address`       | text                                          | every service config                                                               |
| `postcode`           | text                                          | `postcode_prestep` (engine-level, all wizards) + some per-service contact steps    |
| `additional_notes`   | textarea                                      | fencing, decking, driveway, patio, painting, jetwash, steps (manual-quote generic) |
| `work_description`   | textarea                                      | carpentry, electrical, plumbing, general-repairs, other (manual-quote services)    |
| `specific_stains`    | textarea                                      | jetwash                                                                            |
| photo `originalName` | string, nested in a `photo` field's `files[]` | any service with a photo field                                                     |
| photo `mimeType`     | string, nested in a `photo` field's `files[]` | any service with a photo field                                                     |

None of these have a corrected assumption at the _set of keys_ level — the
spec's framing ("contact fields, postcode, text areas, optional details") is
accurate. The one addition found by this audit that the spec's own
enumeration missed: **photo `originalName`/`mimeType` are user-supplied
strings that flow into the outbound payload** (as part of `media_json` and
the answer's own `files[]` array) and are not covered by "text/textarea
fields" framing — see `AUDIT-6.6-data-flow.md`.

### Structured (safe by validation, no sanitization needed)

`select`, `radio`, `checkbox` — answer values are constrained to the
option-id set defined in the wizard config (an unrecognized value fails
`validateStep()`/`answer-validation.ts` client-side, and is simply an
opaque string server-side with no special outbound meaning since it never
reaches Sheets/WhatsApp as attacker-controlled formatted content beyond
being a plain string — see note below).

`number`, `dimensions` — numeric; `is_array($answers)` and the client
schema constrain shape. No sanitization applicable (numbers can't carry
formula/HTML payloads).

`review` — terminal, non-input step type; contributes no answer.

**Correction to a possible over-reading of "structured = no sanitization
needed":** `select`/`radio`/`checkbox` values are still arbitrary strings
at the PHP boundary (a crafted REST request bypassing the wizard UI can
submit _any_ string for these keys, not just a valid option id — the client
schema is UX-only, per D9/ADR-0029's established trust-boundary principle).
Decision for this step: **`InputSanitizer::sanitize_for_outbound()` is
applied uniformly to every string value in the answers map, regardless of
the field's nominal type**, rather than trying to maintain a type-aware
allowlist server-side that would need to stay in sync with each wizard
config. This is simpler, safe (sanitizing an already-safe short option-id
string is a no-op), and closes the crafted-request gap the "structured
fields are exempt" framing would otherwise leave open.

## Consent field

`data_processing_consent` — a `checkbox` field, answer is `['agreed']` or
`[]`/absent (see `ConsentValidator.php`). Structured; not user-authored
free text.
