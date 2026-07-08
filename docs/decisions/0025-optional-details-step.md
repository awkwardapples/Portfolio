# ADR-0025: Optional Details Step

**Status:** Accepted (Step 5.13d, 2026-07-08)

## Context

After the contact-and-address step collects name, phone, email, and full address, the contractor may benefit from additional context: preferred timing, site-specific conditions (existing structure to remove, parking, pets), and free-form notes. This information is not required to generate an instant quote but helps the contractor prepare.

The step must be:

- Truly optional — users can submit without filling any fields.
- Universal across services (preferred timeframe, additional notes) with per-service supplementary fields.
- Positioned at the very end of each instant-quote wizard, after contact-and-address.
- Not added to manual-quote services (which already collect job description upfront).

## Decision

Introduce an `optional-details` step as the last step in each of the 7 instant-quote service configs. The step reuses the existing `StepSchema` field-step pattern with a new `allowSkip: boolean` flag (added to `StepSchema` in 5.13d) that enables a "Skip and Submit" button alongside the standard "Submit" button.

**Engine changes (minimal):**

- `StepSchema` gains `allowSkip?: z.boolean().optional()`.
- `NavigationControls` accepts `onSkip?: () => void`; renders "Skip and Submit" when provided.
- `StepRenderer` passes `onSkip` only when `isLast && step.allowSkip`; `handleSkip` dispatches `SUBMIT_REQUESTED` without triggering `showAllErrors`.

**Universal fields (all 7 services):**
| id | key | type | label |
| ------------------- | ------------------- | -------- | ---------------------------------------- |
| preferred_timeframe | preferred_timeframe | select | When would you like the work done? |
| additional_notes | additional_notes | textarea | Anything else we should know? |

All universal fields are `required: false`. Fencing includes `urgent` as an extra timeframe option (first in list).

**Per-service supplementary fields:**

| Service  | Additional fields (all `required: false`)                                             |
| -------- | ------------------------------------------------------------------------------------- |
| Fencing  | `gate_needed` (select yes/no); `gate_width` (select, conditional on gate_needed=yes)  |
| Decking  | `existing_deck_removal` (select yes/no)                                               |
| Painting | `furniture_handling`, `pets`, `customer_supplies_paint` (all select yes/no)           |
| Patio    | `existing_patio_removal` (select yes/no); `slope_assessment` (select 3 options)       |
| Driveway | `existing_driveway_removal` (select yes/no); `parking_during_work` (select 3 options) |
| Steps    | `existing_steps_removal` (select yes/no)                                              |
| Jetwash  | `specific_stains` (textarea); `time_preference` (select 3 options)                    |

**Step order (all instant-quote services, post-5.13d):**
`postcode_prestep → [service steps] → estimate → [extras?] → site_photos → contact-and-address → optional-details`

## Consequences

**Positive:**

- Users who want to provide context can do so. Users who don't can click "Skip and Submit" immediately.
- Contractors receive richer information without imposing a mandatory step.
- The `allowSkip` flag is reusable for any future "soft-terminal" step pattern.

**Negative:**

- One additional step in the instant-quote wizard flow. Completion rate impact is mitigated by the skip button.
- `allowSkip` adds a small surface area to `StepSchema`. The flag is ignored for all non-final steps (only rendered when `isLast && step.allowSkip`).

## Cross-references

- ADR-0022 (Wizard pre-step mechanism — pre-step id: postcode_prestep)
- ADR-0023 (SEO infrastructure)
- ADR-0024 (Wizard engine new step types — AnyStep discriminated union)
