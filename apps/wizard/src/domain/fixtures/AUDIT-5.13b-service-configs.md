# Audit A — Service Config Structure (5.13b pre-work)

All 7 instant-quote service configs live in `apps/wizard/src/domain/fixtures/`.

## 1. Fencing (`fencing.config.ts`)

**Step sequence:** dimensions → extras → site_photos → contact → review (5 steps)

| Step ID       | Type    | Fields                                                                                                         |
| ------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `dimensions`  | classic | `length_m` (number), `fence_type` (select: feather_edge/closeboard/panel), `height` (radio: low/standard/tall) |
| `extras`      | classic | `include_gate` (checkbox), `remove_old` (checkbox)                                                             |
| `site_photos` | classic | `site_photos` (photo, maxCount 5)                                                                              |
| `contact`     | classic | `contact_name`, `contact_email`, `contact_phone` (text)                                                        |
| `review`      | classic | `review_summary` (review)                                                                                      |

**Pricing quantity:** `length_m` → `unit: linear_metre`

---

## 2. Decking (`decking.config.ts`)

**Step sequence:** dimensions → extras → contact → review (4 steps)

| Step ID      | Type    | Fields                                                                                                        |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------- |
| `dimensions` | classic | `length_m` (number, required), `width_m` (number, optional), `material` (select: softwood/hardwood/composite) |
| `extras`     | classic | `include_steps` (checkbox), `include_lighting` (checkbox)                                                     |
| `contact`    | classic | `contact_name`, `contact_email`, `contact_phone`                                                              |
| `review`     | classic | `review_summary` (review)                                                                                     |

**Pricing quantity:** `length_m` → `unit: linear_metre`
**Note:** `width_m` is collected for contractor reference only — does not affect pricing.

---

## 3. Painting (`painting.config.ts`)

**Step sequence:** rooms → details → site_photos → contact → review (5 steps)

| Step ID       | Type    | Fields                                                                                                                 |
| ------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `rooms`       | classic | `room_count` (number), `what_to_paint` (checkbox: walls/ceilings/skirting/doors/windows)                               |
| `details`     | classic | `room_size` (select: standard/large/small), `ceiling_height` (select: standard/high), `paint_type` (select: water/oil) |
| `site_photos` | classic | `site_photos` (photo, maxCount 5)                                                                                      |
| `contact`     | classic | `contact_name`, `contact_email`, `contact_phone`                                                                       |
| `review`      | classic | `review_summary` (review)                                                                                              |

**Pricing quantity:** `room_count` → `unit: item`

---

## 4. Patio (`patio.config.ts`)

**Step sequence:** area_and_material → extras → site_photos → contact → review (5 steps)

| Step ID             | Type    | Fields                                                                                              |
| ------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `area_and_material` | classic | `area_m2` (number), `material` (select: riven_slabs/sandstone_indian/sandstone_sawn)                |
| `extras`            | classic | `drainage_m` (number), `edging` (select: block_edging/kerb_edging/none), `include_steps` (checkbox) |
| `site_photos`       | classic | `site_photos` (photo, maxCount 5)                                                                   |
| `contact`           | classic | `contact_name`, `contact_email`, `contact_phone`                                                    |
| `review`            | classic | `review_summary` (review)                                                                           |

**Pricing quantity:** `area_m2` → `unit: square_metre`

---

## 5. Driveway (`driveway.config.ts`)

**Step sequence:** area_and_material → extras → site_photos → contact → review (5 steps)

| Step ID             | Type    | Fields                                                                                                   |
| ------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `area_and_material` | classic | `area_m2` (number), `material` (select: driveline_50/tegula/drivesys)                                    |
| `extras`            | classic | `drainage_m` (number), `kerb_edging` (select: yes_edging/not_sure/no_edging), `include_steps` (checkbox) |
| `site_photos`       | classic | `site_photos` (photo, maxCount 5)                                                                        |
| `contact`           | classic | `contact_name`, `contact_email`, `contact_phone`                                                         |
| `review`            | classic | `review_summary` (review)                                                                                |

**Pricing quantity:** `area_m2` → `unit: square_metre`

---

## 6. Steps — garden steps (`steps.config.ts`)

**Step sequence:** design → dimensions_and_extras → site_photos → contact → review (5 steps)

| Step ID                 | Type    | Fields                                                                                                                                         |
| ----------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `design`                | classic | `shape` (select: straight/curved/not_sure), `material` (select: brick/slate/portland_stone/cast_stone/granite/not_sure), `step_count` (number) |
| `dimensions_and_extras` | classic | `step_length_m` (number, optional), `step_threads` (checkbox), `step_risers` (checkbox)                                                        |
| `site_photos`           | classic | `site_photos` (photo, maxCount 5)                                                                                                              |
| `contact`               | classic | `contact_name`, `contact_email`, `contact_phone`                                                                                               |
| `review`                | classic | `review_summary` (review)                                                                                                                      |

**Pricing quantity:** `step_count` → `unit: item`

---

## 7. Jetwash (`jetwash.config.ts`)

**Step sequence:** area → site_photos → contact → review (4 steps)

| Step ID       | Type    | Fields                                                                         |
| ------------- | ------- | ------------------------------------------------------------------------------ |
| `area`        | classic | `area_m2` (number), `surface_type` (select: patio/driveway/decking/path/other) |
| `site_photos` | classic | `site_photos` (photo, maxCount 5)                                              |
| `contact`     | classic | `contact_name`, `contact_email`, `contact_phone`                               |
| `review`      | classic | `review_summary` (review)                                                      |

**Pricing quantity:** `area_m2` → `unit: square_metre`

---

## Findings

- All 7 services follow an identical pattern: data-collection → (extras) → site_photos → contact → review.
- All use a single classic step approach with no `stepKind` on any step.
- Photo upload (`site_photos`) is present in 6/7 services; decking omits it.
- Review step is present in all 7 services.
- Contact fields (`contact_name`, `contact_email`, `contact_phone`) are repeated in all 7; the engine pre-step (ADR-0022) collects these first so they arrive pre-filled.
