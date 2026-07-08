# Audit B — Current Photo Upload Position (5.13c)

Date: 2026-07-08
Step: 5.13c Phase 0 Audit B

## Instant-quote services (7 total)

None of the 7 instant-quote services have a photo upload step. Photo upload is
being ADDED in 5.13c, not relocated from a prior position.

| Service  | Photo step exists? | Config file                          |
| -------- | ------------------ | ------------------------------------ |
| fencing  | No                 | `domain/fixtures/fencing.config.ts`  |
| decking  | No                 | `domain/fixtures/decking.config.ts`  |
| painting | No                 | `domain/fixtures/painting.config.ts` |
| patio    | No                 | `domain/fixtures/patio.config.ts`    |
| driveway | No                 | `domain/fixtures/driveway.config.ts` |
| steps    | No                 | `domain/fixtures/steps.config.ts`    |
| jetwash  | No                 | `domain/fixtures/jetwash.config.ts`  |

## Manual-quote services (4 total)

All 4 manual-quote services have a `site_photos` step at index 3 (step 4 of 7),
between `property` and `contact_preference`.

| Service         | Photo step id | Position (0-indexed) | maxCount | required |
| --------------- | ------------- | -------------------- | -------- | -------- |
| general-repairs | site_photos   | 3                    | 5        | false    |
| plumbing        | site_photos   | 3                    | 5        | false    |
| electrical      | site_photos   | 3                    | 5        | false    |
| carpentry       | site_photos   | 3                    | 5        | false    |

Photo field configuration (same across all 4 manual-quote services):

```typescript
{
  id: 'site_photos',
  key: 'site_photos',
  type: 'photo',
  label: 'Photos of the area (optional but helpful)',
  maxCount: 5,
  required: false,
  help: 'Up to 5 photos. We accept JPEG, PNG, and WebP.',
}
```

## Target configuration for 5.13c (instant-quote services)

New `site_photos` step to be added at position after `extras` (or after `estimate`
for jetwash which has no extras):

```typescript
{
  id: 'site_photos',
  title: 'Photos',
  description: 'Add photos of the project area.',
  fields: [
    {
      id: 'site_photos',
      key: 'site_photos',
      type: 'photo',
      label: 'Upload 2–5 photos so we can usually confirm the estimate without arranging a site visit',
      maxCount: 5,
      required: false,
      help: 'Up to 5 photos. We accept JPEG, PNG, and WebP.',
    },
  ],
}
```

**Photo upload is optional (required: false) and accepts 0–5 photos per spec Option C (R3).**

## Target step sequence per service after 5.13c

| Service  | New step sequence                                                                              |
| -------- | ---------------------------------------------------------------------------------------------- |
| fencing  | fence_size → fence_type → fence_height → estimate → extras → site_photos → contact-and-address |
| decking  | deck_size → material → estimate → extras → site_photos → contact-and-address                   |
| painting | rooms → what_to_paint → estimate → extras → site_photos → contact-and-address                  |
| patio    | patio_size → material → estimate → extras → site_photos → contact-and-address                  |
| driveway | driveway_size → material → estimate → extras → site_photos → contact-and-address               |
| steps    | shape → material → step_count → estimate → extras → site_photos → contact-and-address          |
| jetwash  | area_size → surface_type → estimate → site_photos → contact-and-address                        |

(Note: jetwash has no extras step — photos follow estimate directly.)

## Impact on manual-quote services

Manual-quote `site_photos` step position is **unchanged**. No modifications to the 4
manual-quote service configs in 5.13c (apart from pre-step reduction in Commit 2,
which is engine-level only).

## Existing tests affected

`manual-quote-configs.test.ts` test `$id has a photo field with maxCount 5 (not required)`
references the `site_photos` step. This test is unaffected — manual-quote configs are
unchanged by Commit 4 (photo relocation affects only instant-quote configs).

New tests in Commit 4 will verify:

- Photo step exists at correct index in each instant-quote config
- `required: false`, `maxCount: 5`
- `type: 'photo'`
