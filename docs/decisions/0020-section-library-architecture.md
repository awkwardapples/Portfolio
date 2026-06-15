# ADR-0020: Section Library Architecture

**Status:** Accepted
**Date:** 2026-06-14 (Step 5.7)

## Context

`product-vision.md` (Step 5.6) specified that the template's home page is
composed from a library of standard sections, where each section follows a
strict behavioral/visual layer separation to enable per-client visual
customization without modifying business logic or WordPress integration.

The existing `HomePage.tsx` is a monolithic component that imports content
directly and renders it inline. This is not customizable per-client without
modifying the component itself.

## Decision

Adopt a per-section folder structure with strict behavioral/visual separation.

### Folder structure (per section)

```
apps/wizard/src/site/sections/
  SectionName/
    index.tsx       — Behavioral component (named export)
    Layout.tsx      — Visual layer (default export)
    types.ts        — Content type for this section
    __tests__/      — Unit tests
```

### Behavioral component (`index.tsx`)

Owns:

- The props interface for the section (contract between composition and section).
- Data transformation from content config to Layout props.
- Behavioral state (e.g., open/closed set for FAQ collapsibles).
- Event handler wiring (e.g., CTA navigation patterns).

Does NOT own any HTML structure, CSS classes, or visual presentation.

### Visual component (`Layout.tsx`)

Owns:

- All HTML structure and semantic markup.
- All Tailwind class names and responsive breakpoints.
- Animations (when added per-client).
- Visual composition (grid, flex, spacing, color, typography).

Does NOT own any business logic, data derivation, or WordPress integration.
Receives all data as props from the behavioral component.

### Composition (Pattern A — per section page)

Each page using the section library has a single composition file
(e.g., `home-page-content.ts`) that exports an ordered array of typed
section configurations. The array element order determines render order.
Including a section means including it in the array. Excluding it means
removing it. Reordering means reordering the array.

### Type model

A discriminated union `SectionConfig` type (discriminated by `kind`) provides
strong typing for the composition array. Each section contributes one union
member. The composition file is fully type-checked.

```ts
export type SectionConfig =
  | (BaseSectionConfig & { kind: 'hero'; content: HeroContent })
  | (BaseSectionConfig & { kind: 'intro'; content: IntroContent });
// ... one entry per section
```

### Per-client customization target

Per-client visual customization replaces `Layout.tsx` for the sections being
customized. `index.tsx` is never modified during per-client work. The props
interface defined in `index.tsx` is the stable contract.

The 21st.dev customization workflow (product-vision §Per-Client Customization
Model) targets `Layout.tsx` exclusively with prompts that explicitly state:
"Output replaces Layout.tsx only; index.tsx is untouched."

## Consequences

### Positive

- Per-client visual customization cannot accidentally break behavioral logic,
  navigation, or WordPress integration surface.
- Each section is independently testable (behavioral and visual in isolation).
- The composition file is strongly typed; incorrect section configs are caught
  by TypeScript.
- New sections can be added by following the established pattern.
- Composition is data-driven; reordering is a one-line change.

### Negative

- More files per section (3-4 per section vs. 1 previously).
- Layout component visual primitives are not shared across sections
  (deliberate: per-client replaces individual Layout files; shared primitives
  would couple multiple sections to a change).

### Risks

- A careless 21st.dev prompt might modify `index.tsx` instead of only
  `Layout.tsx`. Mitigation: the prompt template in product-vision explicitly
  names the target file and says index.tsx is untouched.
- The behavioral component's prop interface may evolve, requiring per-client
  Layout updates after template upgrades. Mitigation: prop interfaces are part
  of the section's stable contract; changes require deliberate review.

## Cross-references

- ADR-0014 (Fork-and-customize — the per-client model this architecture serves)
- ADR-0019 (Rendering architecture — React controls the full page visual)
- `docs/product-vision.md` §Template Capabilities → Homepage section library
- `docs/product-vision.md` §Architectural Principles → Behavioral/visual layer separation
- `docs/product-vision.md` §Per-Client Customization Model → 21st.dev workflow

---

## Amendment — Section internal links (June 2026, Step 5.7-remediation)

The original ADR-0020 did not specify how section components handle internal
links. The 5.7 implementation used plain `<a href={...}>` tags throughout,
which caused two operational problems discovered during 5.7 OV:

1. WordPress's `redirect_canonical` intercepted React route requests and
   redirected them to `/` (because the loaded post is always Site Root). This
   was fixed separately by `CanonicalRedirectGuard` (PHP routing layer).

2. Even with the redirect fixed, plain `<a>` tags trigger a full-page reload
   rather than client-side navigation, producing a visible flash and losing
   React state.

**This amendment specifies:** section Layout components MUST use the
`SectionLink` helper (`@/site/routing/SectionLink`) for any link. `SectionLink`
uses the site router's `Link` component for internal hrefs (starting with `/`)
and a plain `<a>` for external hrefs (`tel:`, `mailto:`, `https://`, etc.).

This applies to all 7 standard sections and any future sections added to the
library. The `SectionLink` component is NOT imported in behavioral `index.tsx`
files — link rendering is a visual concern that belongs in `Layout.tsx`.

The `isInternalLink(href: string): boolean` helper is exported from
`SectionLink.tsx` for unit testing.
