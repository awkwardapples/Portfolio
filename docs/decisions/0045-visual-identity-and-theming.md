# ADR-0045: Visual identity and theming through a token contract

**Status:** Accepted
**Date:** 2026-10-04 (Portfolio Pass 3)

## Context

Spec section E defines the identity: a light paper surface for reading, a pure black stage for identity and music, and one tungsten accent that lights things on stage and works as a highlighter on paper, never as text there. The site reuses the wizard's components (spec U.4), which were styled for SCB Handyman through semantic token names (`primary`, `surface`, `text-muted` and so on). The site must take on the new identity without rewriting those components.

## Decision

**One token file.** `apps/site/src/design/tokens.ts` holds the palette (spec E.2), the type scale, spacing with the section rhythm (64, 80 and 128 px; 48 px under a section heading), radii by role (4 px media, 6 px controls), the two functional shadows and the motion timings. The Tailwind config, the contrast test and the style guide all read it. Like the wizard's, the site's Tailwind theme replaces Tailwind's defaults, so gradients, blur, unknown colours and `animate-spin` produce no CSS.

One value is derived rather than taken from E.2: `paper-sunken` (`#E0E2DF`), the midpoint of paper and rule, for sunken areas and skeletons, where graphite text still reaches 4.5:1. The state colours (danger, success) are for paper only: on stage they fall below 4.5:1, so forms never sit on stage.

**The theme contract.** `apps/wizard/src/design/theme-contract.ts` lists every token name the wizard's reusable components use. The site's theme is typed `satisfies ThemeContract`, and two tests enforce it at run time:

- in the wizard: its own config defines every contract name;
- in the site: Tailwind compiles the wizard's components under both themes, and the test fails if any class that produces CSS under the wizard's theme produces none under the site's.

The site maps the wizard's names onto the palette. `primary` is **ink, not tungsten**: the components put `text-inverse` on `primary` and also on the dark tooltip, so `text-inverse` has to stay light, and light text on a tungsten fill would be unreadable. Primary buttons are ink with paper text (19:1); tungsten stays the light on stage (the stage's primary buttons, the current-page underline there) and the highlighter on paper (text selection).

**Type.** STIX Two Text for headings and reading, IBM Plex Sans for the interface, both self-hosted from the `@fontsource-variable` packages through the site's own `@font-face` rules for Latin and Latin Extended only. Only the STIX roman file is preloaded. Fallback faces (Times New Roman, Arial) carry `size-adjust` and ascent and descent overrides measured from the real fonts by `scripts/font-fallbacks.mjs`, so the swap does not shift the layout.

**Surfaces and focus.** `data-surface="paper"` or `"stage"` sets a section's colours and its focus ring through a `--focus-ring` variable: ink on paper, tungsten on stage, 2 px with a 2 px offset.

**Navigation without a framework.** The nav's behaviour (the condensing bar, following the surface beneath, the phone drawer) is a small TypeScript module, not a React island. React's runtime alone would use most of the homepage's 40 kB JavaScript budget (spec P.1). The behaviour is ported from the wizard's `useHeaderScrollState`, `MobileMenu` and `useFocusTrap`. The drawer is a native modal `<dialog>`, which provides the dialog semantics, keeps focus inside and closes on Escape; the script adds focus return, scroll lock and backdrop dismissal. Without JavaScript, the menu button is a link to the footer navigation.

**Routes that do not exist yet** are not linked in production builds (`src/lib/routes.ts`): each pass that builds a page marks its route ready. `astro dev` links everything.

**Tooltips.** Icon-only controls in Astro templates show a CSS tooltip from `data-tooltip` on hover and keyboard focus, which Escape dismisses (WCAG 1.4.13). React islands use the wizard's own `Tooltip`.

**Smaller decisions:**

- The footer is on stage.
- LinkedIn links carry a text label only, because Simple Icons removed the LinkedIn mark at LinkedIn's request. GitHub, YouTube and Spotify use Simple Icons marks beside their labels.
- A `/dev/styleguide` page (development only) shows every token, type size and component state, including the wizard's components in this theme.

## Alternatives considered

- **Tungsten as `primary`.** Rejected: unreadable light-on-tungsten text in the wizard's buttons, and the destructive button and tooltip share the same `text-inverse`.
- **Forking the wizard's components.** Rejected: spec section 0 keeps the engine and primitives unchanged; the contract re-themes them instead.
- **A React island for the navigation** (spec P.2 mentions `client:idle`). Rejected for the budget reason above; the behaviour, not the framework, is what the spec carries over.

## Consequences

- A token change is one edit in `tokens.ts`; the contrast test rechecks every text and control pair (spec R), and the contract test rechecks the wizard components.
- **The 320 px conflict.** At 320 px the compact "Start a conversation" button and the menu button cannot both fit beside the name without horizontal scroll, which spec O forbids. The button shows in the bar from 360 px and is always in the drawer.
- The wizard's inputs are 40 px tall, below spec O's 44 px targets. Fixing that through the theme would change what `h-10` means everywhere, so it is handled when the contact wizard is built (Pass 6).
- The accent has not yet been checked against stills from Josh's footage (spec E.2). If it clashes, only the `tungsten` token changes.
