# ADR-0012: Phase 4 UX and design-system constraints

**Status:** Accepted (recorded ahead of Phase 4; not yet implemented)
**Date:** 2026-05-23

## Context

Before Phase 4 (core wizard implementation) begins, the product owner has set explicit UX and design-system constraints that will govern all future UI work. They are recorded here as **binding requirements** so that every Phase 4 component, style token, and piece of copy can be checked against them, and so the design intent cannot drift over the course of implementation.

**This ADR records constraints only. Nothing here is implemented in Step 3H, which is documentation-only.** Implementation begins in Phase 4 and must conform to everything below.

## Decision

The following are binding for all Phase 4 (and later) UI work.

### 1. Visual design system (strict)

- No gradients, glassmorphism, neon, or decorative styling.
- Flat UI only.
- Exactly one primary neutral background + one accent colour. The accent is the per-client `primaryColor` already plumbed through `PublicConfig` / `--goqw-primary` (ADR-0009).
- No decorative shadows. Shadows permitted **only** where they convey functional hierarchy (e.g. a modal layer above the page), never as ornament.
- Clean, structured layout. No "vibe-coded" aesthetics.

### 2. Typography

- One real, professional font (not a system-default stack). The specific face is to be chosen at the start of Phase 4 and recorded then; it must be self-hosted or loaded in a way that does not leak data to third parties (consistent with the privacy posture in ADR-0007).
- Body line-height between 1.5 and 1.6.
- Strict vertical rhythm between sections.
- No cramped or uneven spacing anywhere; spacing follows a consistent scale.

### 3. UX writing

- All UI text in plain, human English.
- No marketing language ("empower", "unleash", "next-gen", and similar).
- No emojis anywhere in the UI.
- Write like a real person explaining a tool simply.

**Emoji enforcement is mechanical, not reliant on review vigilance:**

- Source files: the `local/no-emoji` ESLint rule (in `eslint.config.js`) catches emojis in JSX text and string literals at lint time, failing CI before code can merge.
- Validation messages: the `EMOJI_RE` assertion in `src/domain/__tests__/error-tone-and-public-config.test.ts` verifies that no validation issue message contains a Unicode emoji. Both surfaces are covered independently.

### 4. Loading states

- No spinners anywhere.
- All loading uses skeleton loaders that reflect the real layout structure.
- Skeletons must match the final UI layout precisely (same boxes, same positions), so the transition from skeleton to content causes no layout shift.

### 5. Caching and perceived performance

- Cache previously loaded data to avoid repeated loading delays.
- Returning to a previous wizard step must feel instant (no re-fetch, no re-render flash).
- Minimise the perception of repeat network latency.

### 6. Optimistic UI

- For actions that succeed ~99% of the time, update the UI immediately rather than waiting for the server.
- Roll back only if the server reports failure.
- Applies to step navigation, form submission, and step completion.
- Note for implementation: this interacts with the durable-storage-first submission path (ADR-0001) and the synchronous Make.com forwarder (ADR-0005). Optimistic UI governs the **client presentation**; it must not weaken the server-side guarantee that a submission is persisted before any third-party forward. The rollback path must reconcile with the real server result.

### 7. Micro-interactions

- All icon-only buttons must have tooltips.
- Tooltips describe the function in plain language.
- Tooltips must be accessible: available on both hover and keyboard focus, with appropriate ARIA semantics.

## Consequences

**Easier:**

- Phase 4 design decisions have a single reference; reviewers check components against this list.
- The "one accent colour" rule aligns with the existing `primaryColor` contract — no new theming mechanism needed.
- Skeleton-over-spinner and optimistic-UI rules are decided up front, so component APIs can be designed for them from the start rather than retrofitted.

**Harder / watch-outs:**

- Optimistic UI must be reconciled carefully with ADR-0001 (durable-first) and ADR-0005 (synchronous forwarder). The client may show success optimistically, but the user-facing final state must reflect the real server outcome, including the 502 path defined in ADR-0005. This needs deliberate design in the submission step.
- Skeletons that "match the final layout precisely" require the final layout to be known before the skeleton is built; this constrains the order of component work (build the real layout, then derive the skeleton from it).
- Caching wizard step data for instant back-navigation needs a clear cache-invalidation story (e.g. if pricing config changes mid-session). To be designed in Phase 4.

## Relationship to other ADRs

- **ADR-0009** (public config allowlist): the accent colour and any other display values come through the existing allowlist; this ADR does not add new data crossing the boundary.
- **ADR-0001 / ADR-0005** (durable-first, synchronous forwarder): optimistic UI is a presentation concern layered on top; it must not alter those server-side guarantees.
- **ADR-0007** (operational security): font loading and any third-party assets must respect the no-data-leakage posture.

## Status note

Recorded during Step 3H (documentation step). Implementation deferred to Phase 4. No code in Phase 3 implements any of these constraints.

## Amendment — 2026-06-03: user-supplied photo thumbnails (Step 4.8)

The "no decorative imagery" principle in §1 applies to ornamental visual
elements chosen by the developer. **User-supplied content is explicitly
exempt.**

In Step 4.8 the `PhotoField` component displays thumbnail previews of photos
the user has selected. These thumbnails are functional UI: they confirm which
files have been attached, allow the user to review and remove them, and reflect
state the user owns. They are not decorative imagery in the sense ADR-0012
restricts.

Future contributors should not attempt to suppress photo thumbnails by citing
the no-imagery rule. The rule governs developer-authored visuals, not user
content rendered by the application.
