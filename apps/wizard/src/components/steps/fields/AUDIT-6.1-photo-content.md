# Audit 6.1-C: Photo Upload Step Content

_Compiled: 2026-07-22_

## Correction to spec assumption

The spec assumes `apps/wizard/src/domain/steps/photo-upload/`. That directory
does not exist. The photo upload UI is `PhotoField.tsx` at
`apps/wizard/src/components/steps/fields/PhotoField.tsx` — one of several
field-type renderers under `components/steps/fields/`, selected via the
field registry by `type: 'photo'`. There is no dedicated "photo upload step"
component; `site_photos` is an ordinary classic field step (in the
`Step`/`fields[]` schema) whose single field has `type: 'photo'`, defined
per-vertical in each `*.config.ts` fixture (see Audit B for the list of 11
fixtures).

## Current step title / description (config-level, per vertical)

Identical boilerplate across all 11 wizard fixtures (fencing, decking,
patio, driveway, jetwash, steps, painting, carpentry, electrical, plumbing,
general-repairs):

```ts
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

## Render order (`PhotoField.tsx`), top to bottom

1. `StepCard` header — step `title` + `description` (rendered by the
   generic classic-field-step renderer, above all fields).
2. `<legend>` — the field's `label` ("Upload 2–5 photos so we can usually
   confirm...").
3. **`field.help` paragraph** (`PhotoField.tsx:179-183`) — currently "Up to
   5 photos. We accept JPEG, PNG, and WebP." This is the existing slot for
   "helper text below the step title/description but above the upload
   area" that the spec asks for.
4. Existing photo thumbnails (if any).
5. Compressing indicator (if active).
6. The file `<input>`, plus a **hardcoded** component-level tip paragraph
   (`PhotoField.tsx:247-249`): "JPEG, PNG, or WebP — up to {maxCount}
   photo{s}, 5 MB each". This duplicates the current `field.help` text
   almost exactly and is not config-driven.

## Is there a place for helper text?

Yes — `field.help` (point 3 above) already renders in exactly the position
the spec wants, and is config-driven per `FieldSchema.help` (an existing,
already-strict-object-legal key; no schema change needed). Since the format
constraints in the current `field.help` ("JPEG, PNG, or WebP...") are
already restated verbatim by the component's own hardcoded tip (point 6),
the current `help` text is redundant with the UI that already surrounds it.

## Resolution applied (4.3)

Replace `field.help` on the `site_photos` field with the industry-guidance
copy, in the four wizards explicitly in 6.1's scope (fencing, decking,
patio, driveway — the same four wizards touched for feet equivalents).
The format-constraint sentence it displaced is not lost — it remains
visible via the component's own hardcoded tip paragraph (point 6).

Not touched: jetwash, steps (garden steps), painting, carpentry, electrical,
plumbing, general-repairs. The suggested guidance text ("obstacles like
trees or sheds", "connection points to your house or property boundary",
"access for equipment") is landscaping/exterior-project-specific language;
it fits exterior hard-landscaping wizards but would read oddly on an
indoor-trade wizard (electrical, plumbing) or a wizard already outside a
garden context. Kept to the four wizards the rest of 6.1 already scopes to,
rather than rewriting all 11 fixtures' photo copy under this step.
