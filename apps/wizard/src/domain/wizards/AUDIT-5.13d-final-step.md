# Audit A — Current End-of-Wizard State per Service (5.13d Phase 0)

**Date:** 2026-07-08
**Purpose:** Confirm the final step of each instant-quote service before adding the optional-details step.

## Findings

All 7 instant-quote service configs were read from `apps/wizard/src/domain/fixtures/`.

### Fencing (`fencing.config.ts`)

- **Steps (7):** `fence_size` → `fence_type_step` → `fence_height_step` → `estimate` → `extras` → `site_photos` → `contact-and-address`
- **Current final step:** `contact-and-address` (index 6) — field step, 4 required fields
- **Optional-details will be:** index 7

### Decking (`decking.config.ts`)

- **Steps (6):** `deck_size` → `material_step` → `estimate` → `extras` → `site_photos` → `contact-and-address`
- **Current final step:** `contact-and-address` (index 5) — field step, 4 required fields
- **Optional-details will be:** index 6

### Painting (`painting.config.ts`)

- **Steps (6):** `rooms_step` → `what_to_paint_step` → `estimate` → `extras` → `site_photos` → `contact-and-address`
- **Current final step:** `contact-and-address` (index 5) — field step, 4 required fields
- **Optional-details will be:** index 6

### Patio (`patio.config.ts`)

- **Steps (6):** `patio_size` → `material_step` → `estimate` → `extras` → `site_photos` → `contact-and-address`
- **Current final step:** `contact-and-address` (index 5) — field step, 4 required fields
- **Optional-details will be:** index 6

### Driveway (`driveway.config.ts`)

- **Steps (6):** `driveway_size` → `material_step` → `estimate` → `extras` → `site_photos` → `contact-and-address`
- **Current final step:** `contact-and-address` (index 5) — field step, 4 required fields
- **Optional-details will be:** index 6

### Garden steps (`steps.config.ts`)

- **Steps (7):** `shape_step` → `material_step` → `step_count_step` → `estimate` → `extras` → `site_photos` → `contact-and-address`
- **Current final step:** `contact-and-address` (index 6) — field step, 4 required fields
- **Optional-details will be:** index 7

### Jetwash (`jetwash.config.ts`)

- **Steps (5, no extras):** `area_size` → `surface_type_step` → `estimate` → `site_photos` → `contact-and-address`
- **Current final step:** `contact-and-address` (index 4) — field step, 4 required fields
- **Optional-details will be:** index 5

## Manual-quote services (unchanged)

`general-repairs.config.ts`, `plumbing.config.ts`, `electrical.config.ts`, `carpentry.config.ts`
— all have `quoteMode: 'manual'` and do NOT receive the optional-details step.

## Step indices after 5.13d

| Service  | Old count | New count | optional-details index |
| -------- | --------- | --------- | ---------------------- |
| fencing  | 7         | 8         | 7                      |
| decking  | 6         | 7         | 6                      |
| painting | 6         | 7         | 6                      |
| patio    | 6         | 7         | 6                      |
| driveway | 6         | 7         | 6                      |
| steps    | 7         | 8         | 7                      |
| jetwash  | 5         | 6         | 5                      |
