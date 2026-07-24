# SCB Handyman — Design Bible

**Status:** Living reference (Phase 6.x — UI customization, in progress).
The five original foundation sign-off items (§15) were approved via
`docs/ui-overhaul-plan.md` and are implemented in `tokens.ts`/
`tailwind.config.ts` — this document has been updated to match rather than
left describing them as pending (see §2, §4, §5, §7, §10). One of the five,
motion timing, was further amended during that same approval
(150ms/250ms/400ms replacing the original 120ms/180ms pair) — reflected
throughout §7/§11 below.
**Author role:** Lead Product Designer / UI Architect
**Scope:** Presentational only. No routing, hooks, contexts, state, business
logic, analytics, or WordPress integration changes. See "Implementation
Rules for Claude Code" (§15) for the exact file boundary.

**Relationship to existing documents:**

- **ADR-0012** (Phase 4 UX and design-system constraints) remains **fully
  intact and binding**. This document does not amend, soften, or reinterpret
  it — it is the detailed design system that operates _inside_ its
  constraints. Where this document and ADR-0012 appear to conflict, ADR-0012
  wins and this document is wrong and needs fixing.
- **`docs/product-vision.md`** governs structure: the 7-section home page
  order, the behavioral/visual layer separation (ADR-0020), the 6 fixed
  routes, and the per-client customization model. This document does not
  change any of that — it fills in the visual language _within_ the
  `Layout.tsx` files that model already designates as the customization
  surface.
- **`apps/wizard/src/design/tokens.ts`** is the existing, enforced token
  source of truth. This document treats it as ground truth and proposes a
  small number of clearly-marked _extensions_ (never replacements, never
  exceptions). Every extension proposed here is listed again in §15 as an
  explicit, separate sign-off item — nothing in this document should be
  implemented by inference.

**No phase is immutable until the final UI audit is complete.** The
homepage ships as one continuous composition, not a stack of independently
finished phases. If implementing a later section reveals that an earlier
one used the wrong token, the wrong spacing step, or a weaker pattern than
one established since — fix the earlier section in the same phase, don't
postpone it. `docs/component-registry.md` records these retroactive fixes
exactly like forward ones: what changed, why, and what it was checked
against. This applies until the project owner signs off a final,
whole-site UI audit; after that point, changes go through the normal
review process again.

---

## Non-negotiables at a glance

These are load-bearing and repeated throughout this document. If any
recommendation below ever seems to contradict one of these, the
recommendation is wrong.

1. **Flat UI. No gradients, no glassmorphism, no neon, no decorative
   blur.** (ADR-0012, enforced at the Tailwind config level — the utilities
   literally do not exist.)
2. **One neutral scale + one accent colour.** No second accent, ever.
3. **Shadows are functional only** — they communicate stacking order
   (something floats above something else), never decoration.
4. **One border radius** for rectangular surfaces, one `full` radius for
   pills/circles. Nothing in between.
5. **One typeface** (Inter, already self-hosted), one fixed type scale, one
   spacing scale.
6. **One animation language**: opacity, transform (translate/scale) only.
   Never animate layout-affecting properties. Always respect
   `prefers-reduced-motion` (already implemented globally).
7. **No spinners, ever.** Skeletons only, matching final layout exactly.
8. **The 7-section home page order, the 6 routes, and every CTA's
   destination are structural constants.** This document only ever
   discusses how things look, never what exists or where it links.

---

## 1. Overall Design Vision

### The thesis

The brief asks for "Linear, Stripe, Vercel" quality and explicitly rejects
"corporate, template, generic, AI-generated." Those two asks are not in
tension — they're the same ask. What makes Linear's product feel premium
isn't a visual ingredient (gradient, glow, glass) you can bolt on. It's the
**absence** of ingredients: one accent colour used with total discipline,
generous and consistent whitespace, a type scale that never wavers, motion
that appears only when it earns its place, and every surface at rest until
interaction gives it a reason to move.

The "AI-generated SaaS landing page" look this brief wants to avoid — hero
with a soft purple-to-blue gradient blob, glassmorphic pricing cards,
gradient-text headlines, a spotlight that follows the cursor, floating
3D shapes — is, unhelpfully, also what a lot of _actual_ AI page generators
default to, precisely because those effects are easy to fake and hard to do
with real restraint. Genuine premium-feeling product design in 2026 (Linear,
Stripe's app surfaces, Vercel's dashboard, Raycast, Arc) has moved the
_other_ direction: flatter, quieter, more typographic, more confident in
whitespace. This Design Bible follows that direction deliberately, not as a
constraint we're working around, but because it is the more premium choice.

### What "premium" means for a Guildford handyman site specifically

SCB Handyman is not a SaaS product. The visitor is a homeowner in Surrey
with a broken fence panel or a leaking tap, often on a phone, often in a
hurry, often not especially interested in "design." Premium here means:

- **Instantly legible** — the visitor understands what the business does
  and how to get a quote within 2 seconds of landing, no interpretation
  required.
- **Calm, not clever** — nothing on the page competes with the primary
  action (get a quote / call now). No decorative motion draws the eye away
  from the CTA.
- **Trustworthy through craft, not claims** — consistent spacing and
  typography read, subconsciously, as "a real business paid attention to
  this," which does more for trust than any badge or testimonial carousel.
- **Fast** — a trade customer on a building site with patchy 4G should get
  a usable page in under two seconds. Every visual decision in this
  document is compatible with that (see §13).

### Reference translation table

The brief's reference list is useful as a description of _quality bar_, not
literal visual style. Here is what each reference actually contributes to
this system, and — critically — what is explicitly **not** being borrowed:

| Reference                             | What we take                                                                                                                                             | What we explicitly reject                                                                                                              |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Linear** (primary)                  | Restraint; one accent used sparingly; confident type hierarchy; hairline borders instead of shadows on static cards; instant, precise micro-interactions | Linear's dark-mode-first palette (we are a light, neutral-first trade site); its purple accent (ours is chosen for this brand, see §2) |
| **Stripe**                            | Clarity of information hierarchy; disciplined use of a single accent for interactive elements only                                                       | Stripe's occasional decorative gradients on marketing pages — explicitly out of scope under ADR-0012                                   |
| **Vercel** (typography)               | Typographic confidence — large, tight-tracking headings, generous line-height on body copy                                                               | Vercel's monospace accents / terminal aesthetic (not appropriate for a trade audience)                                                 |
| **Apple** (whitespace)                | Generous section padding; content given room to breathe; never cramped                                                                                   | Apple's large-scale photographic hero treatments (SCB doesn't have a photo budget/library for that yet — see §9 Hero)                  |
| **Notion** (cards)                    | Flat cards defined by a hairline border, not a shadow; consistent internal padding                                                                       | Notion's colour-coded tags/emoji system (explicitly banned — no emojis, ADR-0012 §3)                                                   |
| **Raycast** (motion)                  | Fast, precise, no-nonsense transitions; motion that resolves in well under 300ms                                                                         | Raycast's dark, command-palette-specific visual language                                                                               |
| **Arc Browser** (interaction quality) | The _feeling_ of an interface that responds instantly and precisely to touch/click                                                                       | Arc's playful, colourful, personality-driven visual identity — wrong tone for a trades business                                        |

### The one sentence test

Every section, every component, every animation in this document should
pass this test: **"Does this help a Surrey homeowner understand what SCB
Handyman does and get a quote, faster or with more confidence?"** If a
design choice's honest answer is "it looks impressive," it fails the test
and does not belong in this system, regardless of how it appears in any
reference site.

---

## 2. Colour System

### Existing system (ground truth — do not replace)

`apps/wizard/src/design/tokens.ts` already defines a disciplined,
11-step neutral scale, two semantic state colours, and one runtime-
configurable accent:

| Token                              | Value                                                | Role                                                         |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `neutral.0`                        | `#ffffff`                                            | Page surface                                                 |
| `neutral.50`                       | `#f7f8f9`                                            | Sunken surface (subtle section differentiation)              |
| `neutral.100`                      | `#eceef0`                                            | Skeleton fill                                                |
| `neutral.200`                      | `#dde0e4`                                            | Default border                                               |
| `neutral.300`                      | `#c3c8ce`                                            | Strong border (inputs, emphasis dividers)                    |
| `neutral.400`                      | `#868d96`                                            | Subtle text (placeholders, disabled)                         |
| `neutral.500`                      | `#6b7280`                                            | Muted text (secondary copy, captions)                        |
| `neutral.600`–`800`                | —                                                    | Reserved, rarely used — dark UI chrome if ever needed        |
| `neutral.900`                      | `#14171a`                                            | Ink (primary text)                                           |
| `state.danger` / `dangerSurface`   | `#b42318` / `#fdf3f2`                                | Validation errors only                                       |
| `state.success` / `successSurface` | `#1f7a4d` / `#f1f8f4`                                | Confirmation states only                                     |
| `primary` (accent)                 | `--goqw-primary` CSS var, default `#1C4A3D` ("Pine") | The **one** accent — CTAs, links, focus rings, active states |

This is already a correct, professional system. Nothing about the neutral
scale or state colours needs to change.

### Accent colour: Pine (approved and live)

The original template fallback (`#0F4C81`, a corporate navy) has been
replaced. Given the brand personality — trustworthy, premium, friendly,
dependable, **local**, modern — and given that navy-blue is the single most
common accent colour among trade and handyman competitor sites (a direct
contributor to the "generic template" feeling this brief explicitly wants
to avoid), the fallback was changed.

**Pine — `#1C4A3D`**

A deep, desaturated forest green. Rationale:

- **Differentiating**: almost no competing local handyman/trade site uses
  green as a primary accent — blue and safety-orange dominate the category.
  This alone does real work against "looks like every other trade site."
- **On-brand**: SCB was founded by a Merrist Wood–trained landscape
  gardener. A pine/forest tone is an honest, understated nod to that
  heritage without being literal (no leaf icons, no green-and-brown
  "eco" cliché).
- **Reads as premium, not seasonal**: at this depth and desaturation it sits
  closer to Linear's confident, slightly unusual accent choices than to a
  bright "landscaping green." It works equally well against white
  (`neutral.0`) and sunken grey (`neutral.50`) surfaces.
- **Meets contrast requirements**: `#1C4A3D` against `neutral.0` produces a
  contrast ratio comfortably above WCAG AA's 4.5:1 for text use, and above
  3:1 for the large-text/UI-component threshold — verify precisely at
  implementation time per §12.

**Backup option: Clay — `#8A4A34`**

A warm, muted terracotta/rust. Rationale: warmer and more "friendly" than
Pine, evokes brick/timber/craftsmanship, still highly differentiated from
category-standard blue/orange. Slightly higher risk of reading as
"seasonal/autumnal" rather than timeless — Pine is the stronger
recommendation, Clay is the fallback if Pine tests poorly with the client.

Both are delivered through the **existing** `--goqw-primary` mechanism —
this is a CSS variable value change, not a token-architecture change, and
carried zero engineering risk. **Approved and live**: the fallback in
`tokens.ts`'s `accentCssExpression` is now `28 74 61` (Pine); Clay remains
the documented fallback option, unused. Contrast verified at
implementation time: ~10.02:1 against `neutral.0` — comfortably exceeds
WCAG AAA (7:1), let alone the AA (4.5:1) minimum.

**Phase 11 correction — "approved and live" above described the code
fallback, not what visitors actually saw.** `accentCssExpression` is `rgb(var(--goqw-primary, 28 74 61) / <alpha-value>)` — the `28 74 61` (Pine)
only applies when `--goqw-primary` is unset. WordPress's `AssetLoader`
always sets that variable explicitly from the `goqw_primary_color` database
option (`Settings::primary_color()`), which on this site had never been
changed from the template's own demo default (`#0F4C81`, a blue) — meaning
every accent-coloured pixel on the live site was rendering that demo blue
regardless of what this document or `tokens.ts` said, until the option
itself was updated (Phase 11 — Runtime Branding). The code was never wrong;
the two-tier fallback (CSS default, then a WordPress-configurable runtime
override) worked exactly as designed. The lesson for future per-client
customization work: verify the _database_ value, not just the token source,
before declaring a colour "live."

### Usage discipline

- The accent appears on: primary buttons, links (in body copy), active/
  selected states, focus rings, small progress/percentage indicators, and
  nothing else.
- The accent **never** appears as a section background, a card background,
  or body text colour. Large fields of accent colour read as corporate; a
  small, precise accent applied consistently reads as designed.
- Never introduce a second accent "for variety." If a section needs visual
  separation, use `surface-sunken` (`neutral.50`), not colour.
- State colours (`danger`, `success`) are reserved for literal validation/
  confirmation feedback — never repurposed as decorative "status pills" or
  category tags.

### Dark surface system (Phase 12 — Dark Premium Theme Refinement)

A deliberate evolution, not a light-vs-dark ambiguity: the section-library
homepage/service-page sequence moved from an all-`surface`/`surface-sunken`
(light) treatment to a dark, photo-forward one, at explicit client
direction. This is still **one neutral scale, one accent** (ADR-0012 rule 2) — every new token below is a _named role for an existing neutral-scale
step_, not a second palette. Nothing here loosens "flat, no gradients, no
glassmorphism": every dark surface is a flat fill, exactly like the light
ones it replaces.

**New tokens** (`tokens.ts` / `tailwind.config.ts`):

| Token                   | Value                      | Role                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `surface-dark`          | `neutral.900`              | Primary dark section tone (Hero, Intro, Process, Why Choose Us)                                                                                                                                                                                                                                                                                                   |
| `surface-dark-raised`   | `neutral.800`              | Alternating dark tone, one step lighter (Services Preview, Projects, FAQ)                                                                                                                                                                                                                                                                                         |
| `surface-dark-elevated` | `neutral.700`              | Card/panel fill _within_ a dark section — one step lighter again, so a card reads as raised, not recessed (Services Preview's tiles)                                                                                                                                                                                                                              |
| `border-inverse`        | `neutral.600`              | The one hairline-border colour for any dark surface, lighter than all three above so it stays visible against each                                                                                                                                                                                                                                                |
| `text-inverse`          | `neutral.0` (pre-existing) | Headings/primary text on any dark surface                                                                                                                                                                                                                                                                                                                         |
| `text-inverse-muted`    | `neutral.300`              | Secondary/muted text on a dark surface — `text-muted` (`neutral.500`) only reaches ~4.4:1 against `neutral.900`, not a safe default; this reaches ~10.7:1                                                                                                                                                                                                         |
| `primary-inverse`       | `#64C4A9` (static)         | Pine, lightened (same hue/saturation, L 20%→58%) for TEXT/icon/border use _specifically on dark surfaces_ — Pine itself only reaches ~1.8:1 as text against `neutral.900`. Verified ~8.6:1 against `surface-dark`, ~7.1:1 against `surface-dark-raised`. **Never used as a fill** — Pine (`bg-primary`) remains the one accent background everywhere, unaffected. |

**Known limitation**: `primary-inverse` is a static hex, not wired to the
runtime `--goqw-primary` CSS variable the base accent uses. If a future
client changes `goqw_primary_color`, this token will not automatically
follow — deriving a contrast-safe tint from an arbitrary brand colour at
runtime is a real architecture question for a future phase, not folded
into this one.

**Section assignment** — alternates in sequence, never the same tone twice
in a row, reusing only the two steps above (no third invented for
"variety"): Hero (photo + `bg-neutral-900/70` scrim, the darkest, most
dramatic moment) → Intro (`surface-dark`) → Services Preview
(`surface-dark-raised`, cards on `surface-dark-elevated`) → Process
(`surface-dark`) → Projects (`surface-dark-raised`) → Why Choose Us
(`surface-dark`, "darker trust-focused") → FAQ (`surface-dark-raised`,
the closing tone) → Footer (`surface-dark`, so the page doesn't jump back
to a light strip immediately after a dark FAQ — inferred, not explicitly
requested, but a direct consequence of making FAQ dark).

On service landing pages, all 4 consecutive `intro`-kind blocks share the
same `surface-dark` tone (Intro doesn't internally alternate) — accepted
as the right restraint rather than adding an alternating-index prop to a
component for one page type's benefit.

**A real bug found while wiring this up**: `ServiceHero`'s heading/
subheading used the literal classes `text-inverse`/`text-inverse/90`.
Tailwind doubles a same-named utility prefix (exactly like the existing
`text-text`, `border-border`, `border-border-strong` convention) — the
actually-generated class is `text-text-inverse`, never bare `text-inverse`.
`text-inverse` alone matches nothing, so `ServiceHero`'s heading has had no
colour utility applied at all since Phase 10, falling through to the
browser default over a dark photo+scrim. Fixed in `ServiceHero`, and
written correctly from the start in every new Phase 12 file. Numeric-key
tokens (`surface-dark`, `primary-inverse`, etc.) don't have this trap since
their key doesn't repeat the utility prefix — only tokens literally named
`text-*`/`border-*`/`bg-*` do.

**Phase 13 extension — the dark system now covers persistent chrome and
every route, not just the section library.** Phase 12 deliberately left
the header/nav light, reasoning the brief hadn't asked for it; Phase 13's
explicit "the navbar should visually belong to the same design system"
reversed that. `SiteShell`'s outer wrapper (`bg-surface-dark`) is the
single shared background behind every route — home, service pages, and
the simple inner pages (Contact, Services, Our Work, Privacy, Quote) alike
— fixed once at that one shared layer, not per page. `IconButton` gained
the same `surface?: 'light' | 'dark'` pattern `Card` already established,
for its two now-dark call sites (the mobile menu trigger and its close
button). `Tooltip` needed no change — it was already unconditionally dark
(`bg-neutral-800`), a deliberate pre-existing choice independent of page
theme, not a light/dark distinction to unify.

**Genuine bug found and fixed**: `SiteShell`'s wrapper was still
`bg-surface` after Phase 12 — invisible on home/service pages (every
section already paints its own full-width background over it) but with
two real, visible consequences: a sliver of white showing through
`Footer`'s own `mt-12` gap above its border, and every inner page
rendering fully white, since `PageContainer` has no background of its own
and those pages have no section-level backgrounds to cover it. Both are
downstream symptoms of the same one missed layer, not independent bugs —
fixing `SiteShell` resolved both without touching `PageContainer` or any
individual page.

### A fourth dark surface: the navbar gets its own tone, not a section tone (Phase 14)

`surface-nav` (`#213231`, a 70/30 blend of `neutral.800` and Pine) is
distinct from `surface-dark`/`surface-dark-raised`/`surface-dark-elevated`
— it exists because the persistent header/mobile-menu chrome has a
different job than a section: it needs to read as "the brand's surface,"
not as one more step in the section-tone alternation, and the supplied
logo's dark artwork needed a lighter (but still clearly dark, still
restrained) background to read at all against `surface-dark`. Reusing
`surface-dark-raised` here was considered and rejected — that tone is
already claimed by the section hierarchy (Services Preview, Projects, FAQ
all sit on it), and giving the navbar the same value would blur "this is
chrome" and "this is a section" into one visual role.

Accepted, documented limitation: the logo's darkest navy strokes still
only reach ~1.2:1 contrast against even this lightened surface — a real
constraint of pairing dark artwork with any sufficiently dark, restrained
background, not something a token choice alone fixes without abandoning
"subtle, not visually dominant." WCAG exempts logotypes from its text
contrast criteria for exactly this reason; this is a deliberate trade-off
the brief explicitly asked for (do not return to white, do not make the
surface visually dominant), not an oversight.

### Premium card interior pattern (Phase 14 — Services Preview)

Services Preview's tiles gained a small, reusable interior pattern: the
service icon sits in a `bg-primary/10` circular badge (Pine at 10% opacity
— the existing `<alpha-value>`-backed accent token already supports this,
no new colour), and linked cards show a small `aria-hidden` arrow that
shifts right and adopts `text-primary-inverse` on hover/focus
(`group-hover`/`group-focus-within`, transform-only, `duration-fast`).
Inspired by the shadcn/21st.dev ecosystem's common "service card" shape,
rebuilt from this project's own tokens rather than ported wholesale — no
new component library, no new visual language, same `Card` primitive
underneath. Available as a pattern for any future card that wants the same
treatment; not extracted into its own component since it only has the one
call site so far.

### A fourth type-scale step: `3xl` (Phase 15 — one focal headline size)

`2xl` (30px) was the largest step and was described as "rare, top-level."
Phase 15 needed the homepage Hero headline to become the page's
unambiguous focal point — genuinely larger than anything the scale had,
not reachable by reusing an existing step. `3xl` (2.5rem/40px, line-height
1.15) is the answer: a real, closed addition to the type scale (not a
one-off arbitrary value), reserved for the one "this is the focal
headline" moment a page gets. Used responsively (`text-2xl lg:text-3xl`
on Hero) rather than flatly, so mobile still gets a comfortable size and
desktop gets the full display treatment.

### A narrow, documented exception to the closed motion durations (Phase 15)

The sitewide rule is still exactly 150/250/400ms, one easing curve, no
exceptions for anything driven by the general `duration-*` utilities or
the `transitionDelay` scale. Hero's own hand-choreographed entrance
sequence was already a separate, bespoke mechanism before this phase —
its per-element delays (`80ms`, `160ms`) were never part of the general
`transitionDelay` scale, baked directly into each named `animation` string
instead. Phase 15 extended that same already-bespoke mechanism one step
further: `goqw-hero-heading` now uses a dedicated `600ms` duration so the
homepage's one focal headline animates in noticeably slower than every
other element, deliberately breaking the 400ms ceiling for this single,
narrow, already-special-cased entry. `motion.durationSlow` (400ms) itself
is untouched and still governs the subheading and every other `duration-
slow` use sitewide — this is not a fourth general tier, and should not be
reached for outside this one entry without a similarly explicit reason.

---

## 3. Typography System

### Typeface: keep Inter

Inter is already self-hosted (`src/assets/fonts/inter-variable.woff2`,
`font-display: swap`, no third-party font requests — consistent with
ADR-0007's privacy posture). This is not a compromise: Inter is Linear's own
production typeface. No change needed or recommended.

### Existing type scale (ground truth)

| Token  | Size | Line-height | Recommended usage                                             |
| ------ | ---- | ----------- | ------------------------------------------------------------- |
| `xs`   | 12px | 1.5         | Legal text, image captions, timestamps                        |
| `sm`   | 14px | 1.55        | Secondary/supporting copy, form labels, nav links             |
| `base` | 16px | 1.55        | Body copy default — never go smaller for body text            |
| `lg`   | 20px | 1.5         | Section intros, lead paragraphs, sub-headings                 |
| `xl`   | 24px | 1.4         | Section headings (H2 level — "Our Services", "Why Choose Us") |
| `2xl`  | 30px | 1.3         | Page-level heading (H1 — Hero heading only)                   |

This is a deliberately small, fixed scale (six steps). It is correct as-is.
**Do not introduce a larger hero size "for impact."** Impact in this system
comes from whitespace and weight, not from a bigger number.

### Weight discipline

Three weights exist: `normal` (400), `medium` (500), `semibold` (600).

| Weight     | Usage                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `normal`   | All body copy, all paragraph text, all descriptions                                              |
| `medium`   | Nav labels, button labels, form labels, bullet-list lead words                                   |
| `semibold` | Headings only (`xl`/`2xl` sizes) and the single most important number/stat on a page, if present |

`semibold` is never used on body-length text. A whole paragraph in
semibold reads as shouting, not emphasis.

### Hierarchy rules

- Exactly one `2xl` element per page — the Hero H1. If a page ever needs a
  second page-level heading, it is `xl`, not a second `2xl`.
- Section headings (Intro, Services Preview, Process, Projects, Why Choose
  Us, FAQ) are all `xl`, all `semibold`, all left-aligned (see §9 — no
  centred vs. left-aligned inconsistency between sections).
- Body copy is always `base` or `lg` (lead paragraphs only), always
  `normal` weight, always `text` or `text-muted` colour — never accent
  colour, never a third grey.
- Line length for body copy: constrain to roughly 60–75 characters
  (`max-w-prose`-equivalent) even on wide desktop viewports. Full-width body
  text at desktop widths is a common "template" tell.

### Voice pairing

ADR-0012 §3 already mandates plain English, no marketing language, no
emojis. Typographically, this means headings should read like a person
speaking plainly ("Fence Panel Repair & Replacement in Guildford") rather
than a marketing headline with wordplay or forced alliteration. The
existing SEO landing page copy (Phase 1–5 work) is a correct model for this
— headings state the service and location, subheadings state the value
proposition in one plain sentence.

---

## 4. Spacing Scale

### Existing scale (ground truth)

4px base unit, closed set: `0, 4, 8, 11, 12, 16, 20, 24, 32, 48, 64, 80, 96`
(px — `11`/`20`/`24` added per below). This is correct for
**component-internal** spacing (padding inside a button, gap between an
icon and label, spacing between a heading and its body text).

### Macro-section steps (approved and live)

The original scale topped out at 64px — appropriate for component-level
spacing but tight for **section-level** rhythm on a full-bleed marketing
page at desktop widths. Two larger steps were added, used **only** for the
vertical padding between/within the 7 home sections and their
landing-page equivalents:

| Token | Value       | Usage                                      |
| ----- | ----------- | ------------------------------------------ |
| `20`  | 5rem / 80px | Mobile and tablet section vertical padding |
| `24`  | 6rem / 96px | Desktop section vertical padding           |

A third small addition, `11` (2.75rem / 44px), exists solely so `Button`'s
`lg` size can hit the WCAG touch-target minimum via `h-11` — not a
general-purpose spacing step (see §10).

This is the only proposed extension to the spacing scale, and it is
additive — the existing 9 steps are untouched and remain the source for
everything below section-level. This is a sign-off item (§15), not an
instruction to implement unilaterally.

### Vertical rhythm rules

- Every one of the 7 home sections uses the **same** top/bottom padding
  value (the new `20`/`24` step) at its breakpoint. No section is
  "cosier" or "airier" than its neighbour — inconsistent section padding is
  one of the fastest ways a page reads as assembled rather than designed.
- Internal section spacing (heading → body → CTA, card → card) always uses
  the existing 4–64px scale, never the new macro tokens.
- Never use arbitrary Tailwind values (`p-[37px]`) — this is already
  lint-banned by the closed token config and must stay that way.
- Horizontal page margins: consistent across all pages and all 7 sections
  (a single max-width container, centred, with consistent gutter at each
  breakpoint). The Hero must not be full-bleed while every other section is
  contained, or vice versa — pick one approach and apply it everywhere.

---

## 5. Elevation System

### Existing system (ground truth)

Exactly one functional shadow token, `elevated`
(`0 1px 2px 0 rgb(20 23 26 / 0.06), 0 2px 8px -2px rgb(20 23 26 / 0.08)`),
reserved for surfaces that visually float above the page — a tooltip today,
a modal in future. ADR-0012 is explicit: shadows communicate stacking
order, never decoration.

### Rule: static cards never get a shadow

Cards on the Services Preview, Why Choose Us, and Projects sections sit
**flat on the page**, differentiated from the background by a 1px
`border-border` hairline only — this is the Linear/Notion card model, and
it is more restrained (and more premium-reading) than a soft drop-shadow on
every card, which is a strong "template" signal.

### Second elevation step (approved and live)

One more shadow token, reserved for a genuinely higher stacking layer than
the existing `elevated` token. The condition for adding it ("only at the
point a modal/drawer is actually planned") was met in Phase 2 — the mobile
navigation drawer needs to sit above its own page-dimming scrim. The system
now has **two** total elevations, both strictly functional:

| Token      | Usage                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| `elevated` | Tooltip, dropdown, any single-layer floating surface                      |
| `overlay`  | Modal, drawer — the mobile nav panel, anything above a page-dimming scrim |

No third elevation exists or should be added without an equally concrete
new use case.

### Explicit bans

- No `hover:shadow-lg` on cards. If a card needs a hover affordance, use a
  border colour shift (`border-border` → `border-border-strong`) or a
  background tint (`surface` → `surface-sunken`), never a shadow that
  appears only on hover.
- No shadow on the Hero, on buttons, or on form inputs at rest. Buttons use
  fill/outline/text distinction for hierarchy (see §10), not elevation.

---

## 6. Border Radius System

### Existing system (ground truth) — correct as-is, no changes

| Token     | Value  | Usage                                                           |
| --------- | ------ | --------------------------------------------------------------- |
| `none`    | 0px    | Rare — full-bleed images, dividers                              |
| `DEFAULT` | 6px    | Everything: buttons, inputs, cards, the FAQ accordion, tooltips |
| `full`    | 9999px | Pills, icon-only circular buttons, avatar-shaped elements only  |

There is no third radius, ever. A component that seems to want a bigger
radius ("this card would look nicer more rounded") is a sign the component
needs different treatment (e.g. more internal padding), not a bigger
number pulled from nowhere. Mixed corner radii across a page is explicitly
called out in ADR-0012 as a banned pattern and is one of the most common
"AI-generated" tells (rounded-2xl hero, rounded-lg cards, rounded-full
buttons, rounded-none dividers, all on one page).

---

## 7. Motion System

### Tokens (approved, amended, and live)

| Token          | Value                                                | Usage                                                                 |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| `durationFast` | **150ms**                                            | Hover, focus, button press feedback                                   |
| `durationBase` | **250ms**                                            | Accordion, nav state changes, card hover                              |
| `durationSlow` | 400ms                                                | Scroll-reveal entrance, Hero load. Never used for hover/press states. |
| `easing`       | `cubic-bezier(0.4, 0, 0.2, 1)` (standard "ease-out") | The only curve in the system                                          |

The original proposal (120ms/180ms, plus a proposed-but-unset 400ms slow
tier) was amended during the `docs/ui-overhaul-plan.md` approval to
150ms/250ms/400ms — the brief's specified triad — and is now wired into
`tailwind.config.ts`'s `transitionDuration` theme (the bare `transition`
utility already uses `durationBase`; `duration-fast`/`duration-slow` cover
the other two tiers).

**No second easing curve exists.** `cubic-bezier(0.4, 0, 0.2, 1)` is used
for every animated property in the system, fast, base, or slow — this is
what "one animation language" means in practice.

`prefers-reduced-motion` is implemented globally (`index.css`) and forces
`animation-duration`/`transition-duration` to ~0 site-wide via a stylesheet
`!important` rule — this also covers CSS `animation`-based motion (not just
`transition`-based), confirmed during the Hero build (§9).

### Motion rules

1. **Only `opacity` and `transform` (translate/scale) are ever animated.**
   Never `height`, `width`, `margin`, `top`/`left`, or any property that
   triggers layout recalculation — this is both a jank risk and a Core Web
   Vitals (CLS) risk.
2. **Scroll-reveal fires once.** An element that has already animated into
   view on scroll does not re-animate if the user scrolls back up and down
   again. Re-triggering reads as gimmicky, not premium.
3. **Stagger, don't cascade dramatically.** When a group of items animates
   in (e.g. Why Choose Us value props, FAQ items), stagger by 40–60ms per
   item, capped at roughly 6 items — beyond that, animate the remainder
   together. A long, slow cascading reveal makes the page feel slower than
   it is.
4. **Entrance offset is small.** 8–12px vertical translate, never more.
   Large translate distances (40px+) read as "AI template" motion.
5. **Never animate on every scroll tick** (no parallax, no scroll-scrubbed
   effects — see §11 for the explicit rejection and rationale).
6. **Interactive feedback is instant or near-instant** (150ms, `durationFast`).
   A button that takes 300ms to visually acknowledge a click feels
   unresponsive, regardless of how "smooth" the easing curve is.
7. **CSS `animation` classes, not inline `style`, for anything stagger-
   delayed or dynamically offset.** This project's `react/forbid-dom-props`
   lint rule bans the `style` prop outright, project-wide, with no
   exceptions — discovered while building Hero's entrance sequence and its
   SVG stroke-drawing reveal. Any per-element stagger delay or dynamic
   offset (e.g. an SVG `stroke-dashoffset` reveal) must be baked into a
   named `animation` entry in `tailwind.config.ts`'s `extend.animation`
   (the same mechanism the skeleton pulse, `goqw-pulse`, already used),
   never set via a `style` object. This is a hard technical constraint, not
   a style preference — code review should reject any `style={{...}}` used
   for motion.

---

## 8. Interaction Guidelines

### The four states, always

Every interactive element (button, link, input, card-that-links-somewhere)
must have a deliberately designed: **rest, hover, focus-visible, and
active/pressed** state, plus **disabled** where applicable. A component
missing one of these (most commonly focus-visible) is unfinished, not
"simple."

- **Rest**: as specified per component in §10.
- **Hover** (pointer devices only): a single subtle change — background
  tint, border colour shift, or accent-colour text change. Never more than
  one property changes on hover.
- **Focus-visible**: already implemented globally — a 2px accent-colour
  outline with 2px offset (`index.css`). This is correct, WCAG-compliant,
  and must be preserved exactly as-is on every new/restyled component. Do
  not suppress it "for aesthetics."
- **Active/pressed**: a small, instant scale-down (approx. `scale(0.98)`)
  on buttons only. No colour change beyond what hover already applied.
- **Disabled**: reduced opacity (already implemented per Button primitive:
  `disabled:bg-primary/50` etc.) plus `cursor-not-allowed`. Never hide a
  disabled element — showing it, disabled, communicates the path exists.

### Touch targets

The brief requires 44×44px minimum touch targets. **This is currently not
met**: the `Button` primitive's `sm` size is 32px tall and `md` is 40px
tall. This is a concrete, actionable gap — see §12 and §15 for the specific
remediation (an additional button size token, not a rewrite of the
component).

### Cursor and pointer affordances

- `cursor: pointer` on every clickable element without exception (a link
  styled to look like a card must still show a pointer cursor).
- `cursor: not-allowed` on disabled interactive elements.
- **No custom cursor, no cursor-follow effects of any kind** (spotlight,
  magnetic pull, cursor trail). These are explicitly rejected — see §11.

### Scroll-triggered reveal (the one "wow" allowed)

The single motion effect this system actively recommends beyond basic
state transitions is a **restrained fade-and-lift reveal on first scroll
into view**, applied consistently to each of the 7 home sections (and their
service-landing-page equivalents) as a whole unit — not to every individual
element within a section. This is:

- Purposeful: it draws attention to each new section as the user scrolls,
  reinforcing the fixed narrative order (Hero → Intro → Services → Process
  → Projects → Why Choose Us → FAQ) the product vision already mandates.
- Restrained: 8–12px translate, opacity 0→1, 400ms, one easing curve, fires
  once, respects reduced motion.
- Aligned with performance: it's a compositor-only animation (opacity +
  transform), so it never causes layout shift or jank, even on a mid-range
  phone on a building site's 4G connection.

### Explicitly rejected interactions, with rationale

| Interaction from the brief                                   | Verdict                    | Why                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Magnetic buttons                                             | **Rejected**               | Cursor-follow physics is a novelty that reads as "template built to impress," not "trade business that gets the job done." Also has no touch-device equivalent, so mobile users (the majority of this audience) never see it — inconsistent experience by definition. |
| Cursor effects (custom cursor / spotlight-follows-cursor)    | **Rejected**               | Actively harms usability (replaces the OS's native cursor affordance), fails on touch devices entirely, and is one of the strongest "AI-generated demo site" tells in 2025–26. Also conflicts directly with ADR-0012's "no decorative" rule.                          |
| Parallax                                                     | **Rejected**               | Causes layout/compositing cost on scroll (jank risk on mid-range phones), is a common Core Web Vitals CLS risk if not implemented with extreme care, and adds nothing a Surrey homeowner needs from this page.                                                        |
| Background gradients / glassmorphism / spotlight backgrounds | **Rejected**               | Directly banned by ADR-0012; also the single biggest contributor to the "generic AI SaaS template" look this brief explicitly wants to avoid.                                                                                                                         |
| Animated underlines                                          | **Approved, narrow scope** | Nav links only — a width-reveal underline on hover/focus is a precise, low-noise way to show interactivity, well-precedented in Linear/Vercel's own nav treatments.                                                                                                   |
| Card elevation on hover                                      | **Approved, modified**     | Not a shadow (banned) — a border-colour shift or background tint instead. Same _intent_ (card responds to hover), correct _mechanism_ for this token system.                                                                                                          |
| Scroll reveal                                                | **Approved, narrow scope** | Section-level only, once-only, per the rules above.                                                                                                                                                                                                                   |
| Number counters                                              | **Approved, conditional**  | Only if a genuine stat exists to count (e.g. years trading, jobs completed) — see §9 Why Choose Us / Intro. Never invented for decoration.                                                                                                                            |

---

## 9. Section-by-Section UI Direction

The home page section order is fixed and unchanged: **Hero → Intro →
Services Preview → Process → Projects → Why Choose Us → FAQ → (footer
CTA)**. The same 7 section components (via the shared `renderSection`
helper introduced in the SEO work) are reused verbatim across the home page
and all 5 SEO service landing pages — so every direction below applies
uniformly across roughly 13 page instances, not just the home page. Design
once, correctly, and it is correct everywhere.

### Hero

**Purpose:** identify business + service + location + primary action within
2 seconds.

- **Layout — rebuilt Phase 12 (Dark Premium Theme Refinement), superseding
  the Phase 3 description below:** full-bleed photographic background,
  `bg-neutral-900/70` flat scrim (never a gradient), left-aligned text in a
  `max-w-2xl` column over it — explicitly reversing the Phase 3 "explicit
  don't" against this exact pattern (see the retired direction immediately
  below). The reversal was a direct, explicit client decision: the abstract
  illustration was "technically polished" but "does not communicate the
  business strongly enough" — real photography of real work reads as more
  premium _for this brief_ than an abstract mark, once real photography
  actually exists to use. `Hero/MeasuredDrawing.tsx` is deleted, not just
  unused — nothing in the current architecture references it. Still a
  separate component from `ServiceHero` (not merged): Hero stays
  full-viewport (`lg:min-h-screen`), the one full-bleed dramatic arrival
  moment; `ServiceHero` stays capped at ~600px for conversion-focused
  service pages. Same visual language, deliberately different scale.
  Falls back to a flat `bg-surface-dark` panel (not the drawing) if the
  image fails to load, matching `ServiceHero`/`Projects`' `onError`
  discipline — never a broken-image icon, never reintroducing the retired
  illustration as a fallback.
- Heading: `2xl`, `semibold`, `text-inverse` (was `neutral-900` — text is
  now always light-on-dark, since the section itself is always part of the
  dark surface family whether or not the photo loads). States the service +
  location plainly (the existing SEO landing page headings — "Fence Panel
  Repair & Replacement in Guildford" — are the correct model; the home page
  heading follows the same plain-statement pattern, not a slogan).
- Subheading: `lg`, `normal`, `text-inverse-muted` (was `text-muted`). One
  sentence, plain English, states the value proposition and area covered.
- Primary/secondary CTA: rendered via `buttonClassName('primary'|'secondary',
'lg')` (44px), never raw styled links — unchanged by the dark background,
  since `secondary`'s solid `bg-surface` white pill and `primary`'s solid
  Pine fill are both opaque regardless of what's behind them. **Copy note:**
  the actual current labels are "Get a free quote"/"Call us now" (home) and
  "Get Your Free Quote"/"Call Now" (service pages) — verified against the
  content files, not the earlier project brief's "Get FREE instant
  estimate," which was never implemented. This document describes
  presentation, not copy; harmonising the CTA wording across pages is a
  content decision for the project owner, out of scope for this UI pass.
- Motion: content fades/lifts in once on initial page load (not
  scroll-triggered, since it's above the fold) — 400ms heading/subheading,
  250ms CTA row, ~80ms stagger between them, via named CSS `animation`
  classes (never inline `style` — §7 rule 7), unchanged by Phase 12. The
  background photograph itself is deliberately **not** animated — Phase 12
  was explicit that the image shouldn't move unnecessarily; a static photo
  behind animated text is the correct reading of that constraint.

**Retired direction (Phase 3, superseded above — kept for history, not to
be reintroduced without an equally explicit client decision):** a two-zone
layout (headline/CTA left, `Hero/MeasuredDrawing.tsx`'s abstract technical/
blueprint line-art right) with an explicit rule against exactly the
full-bleed-photo-with-dark-overlay pattern the section now uses, on the
grounds that it's "the single most common generic-template hero pattern."
That rule was correct _in the absence of real photography_ — a stock-photo-
with-overlay hero with no real content behind it is generic. It stopped
applying once real photography of the client's own work existed to use
instead of a stock substitute; the pattern itself was never the problem,
an _empty_ version of it was.

### Intro

**Purpose:** brief company-defining narrative — who, where, why trust them.

- Layout: single column, generous max-width (~65ch for the body paragraph),
  left-aligned, consistent with Hero's alignment.
- Heading: `xl`, `semibold`.
- Body: `base`/`lg`, `normal`, `text` or `text-muted`.
- Bullet points (trust signals — "Fully insured," "Merrist Wood trained,"
  etc.): rendered as a simple checkmark list, not a card grid — this
  section is narrative, not a features grid (that's what Why Choose Us is
  for; don't duplicate the treatment).
- Optional secondary CTA: text-only or ghost button, low visual weight —
  this section supports the narrative, it doesn't need to re-sell the
  primary action.
- Motion: scroll-reveal, once, per §7/§8.

### Services Preview

**Purpose:** quick-read summary of services offered, linking to `/services`
and (where a dedicated landing page exists) directly to that page.

- Layout: card grid — 3 columns desktop, 2 tablet, 1 mobile. Consistent
  gap using the spacing scale (not the new macro tokens — this is
  component-level spacing).
- Cards: flat, `border-border` hairline, `bg-surface`, `rounded` (the one
  radius). No shadow at rest. Hover: border shifts to `border-strong` (or a
  subtle `surface-sunken` background tint) — never a shadow, per §5.
- Icon treatment: the existing inline SVG icon set (`ServicesPreview/icons`)
  rendered at a small, consistent size, in `text` or accent colour — never
  multi-colour illustrative icons, which breaks the single-accent
  discipline.
- Card heading: `sm`/`base`, `medium` — not `semibold` (semibold is
  reserved for section-level headings, not every card title on the page;
  overusing it flattens the hierarchy it's supposed to create).
- Card description: `sm`, `normal`, `text-muted`, 1–2 lines max.
- CTA at section end ("View all services"): text link with the animated
  underline treatment from §8.
- Motion: cards stagger-reveal on scroll, 40–60ms apart, capped at 6 items
  (matches the existing content — 6 services shown on the home page
  preview).

### Process

**Purpose:** set expectations for how the customer journey works.

- Layout: horizontal numbered sequence on desktop (3 steps side by side
  with connecting rule/arrow), stacked vertically on mobile.
- Step numbers: rendered in the accent colour, `lg`/`xl` weight — this is
  one of the few places a slightly larger accent-coloured numeral is
  appropriate, since it's structural (sequence), not decorative.
- Step heading: `base`, `medium`.
- Step description: `sm`, `normal`, `text-muted`.
- No icons needed here — numbers already carry the sequential meaning;
  adding icons on top is redundant decoration.
- Motion: reveal once on scroll, steps appearing left-to-right with a
  60–80ms stagger (reinforcing the sequence visually, not just via the
  numeral).

### Projects (Our Recent Work preview)

**Purpose:** portfolio teaser, building trust through evidence of real work.

- Layout: image-led grid, consistent aspect ratio across every image
  (critical — mismatched aspect ratios across a photo grid is a strong
  "unfinished" signal). 3 columns desktop, stacked mobile.
- Images: `rounded` (the one radius), `object-cover`, lazy-loaded (see
  §13), explicit width/height (or aspect-ratio CSS) to reserve layout space
  and prevent CLS before the image loads.
- Caption: project name only, `sm`, `medium`, positioned directly under
  the image with tight, consistent spacing.
- No shadow, no border around images — let the image edge be the edge.
- CTA at section end ("View more of our work"): same text-link + underline
  treatment as Services Preview, for consistency.
- Motion: reveal once on scroll, images fading/lifting in with a stagger.
- Explicit don't: no hover-zoom-into-image effect (a common template
  pattern) — it adds motion without adding information, and on a trade
  site the photo itself (evidence of quality work) should be the focus,
  not a cursor trick.

### Why Choose Us

**Purpose:** trust-signal section — direct answer to "why this business
over a competitor."

- Layout: grid of value props, 3 columns desktop, consistent with Services
  Preview's grid rhythm (visual consistency between the two card-grid
  sections reinforces "designed system," not "assembled sections").
- Each value prop: small accent-coloured icon or numeral marker (pick one
  approach and use it for every value prop on the page — never mix icons
  and numerals within the same section), `base`/`medium` heading, `sm`/
  `text-muted` description.
- No card border/background here — unlike Services Preview, this section
  can read as a plain grid without card containers, giving visual variety
  between the two grid sections while keeping the same underlying spacing
  rhythm. (This is a deliberate point of visual differentiation between
  two structurally similar sections — without it, Services Preview and Why
  Choose Us risk looking like the same component reused, which reads as
  repetitive rather than systematic.)
- If a genuine stat exists (years trading, jobs completed) it belongs here,
  as one number-counter treatment (see §8), never more than one per page —
  a page with five different animated counters feels like a dashboard, not
  a trust section.
- Motion: reveal once on scroll, staggered.

### FAQ

**Purpose:** answer pre-quote objections; reduce friction; SEO value.

- Layout: single-column accordion, full question visible at all times,
  answer expands/collapses.
- Accordion item: `border-border` hairline dividing each question (not
  individual card borders per item — a single bordered list reads calmer
  than a stack of separate bordered cards).
- Question: `base`, `medium`, with a small chevron/plus indicator that
  rotates on expand (transform only, per §7).
- Answer: `sm`/`base`, `normal`, `text-muted`, generous line-height.
- Expand/collapse motion: height-based accordion motion is a known
  exception to "never animate layout properties" — mitigate by animating
  via `grid-template-rows` (0fr → 1fr) or a measured-height transform
  rather than raw `height: auto`, so it stays compositor-friendly. If the
  chosen accordion primitive (see §10) already handles this correctly
  out of the box, prefer it over a custom implementation.
- Final CTA (already part of the FAQ section's own `cta` field): the
  section's closing element is the repeated primary CTA — same button
  styling as the Hero's primary CTA, for consistency of "this is the
  action" recognition site-wide.

### Footer

**Purpose:** fixed-structure contact/legal information, present on every
page.

- Layout: unchanged (existing responsive grid — 4-col desktop / 2-col
  tablet / stacked mobile, per the Step 5.8 implementation).
- Visual treatment: `surface-sunken` background (a subtle differentiation
  from the page body, using the existing neutral scale — never the accent
  colour as a footer background, which is a common but heavy-handed
  "corporate" pattern).
- Typography: `sm` throughout, `text-muted` for non-heading text, `medium`
  for column headings.
- Social icons: single-colour (`text-muted`, hover to `text`/accent),
  consistent size, each with a tooltip/aria-label (icon-only controls
  require this per ADR-0012 §7).

### Services page (`/services`)

- The directory list (Phase 2 SEO work) should read as a clean, scannable
  list, not a marketing section — this page's job is navigation, not
  persuasion. Consistent with Services Preview's visual language (same
  icon treatment) but simpler layout (list or 2-column grid, not
  necessarily full cards).
- Linked items (the 5 SEO landing pages) should be visually
  indistinguishable in weight from unlinked items until hover/focus — the
  fact that some items are clickable to a dedicated page is a technical
  detail, not something that should visually fragment the list into "premium
  items" vs "basic items."

### Our Work, Contact, Privacy pages

- Inherit all typography/spacing/colour rules above. No page-specific
  exceptions. Contact page's form inputs follow §10's input treatment
  exactly — a contact form that looks different from the quote wizard's
  inputs would be an inconsistency a careful visitor notices.

### Quote wizard shell

Out of visual-redesign scope in the sense that `components/` and `domain/`
are off-limits per the existing customization boundary (product-vision.md).
Where the wizard's own primitives (Button, Input, etc.) are shared with the
marketing pages (see §15's scope note), any visual refinement made there
(e.g. the 44px touch-target fix) benefits the wizard automatically, without
this document prescribing anything wizard-specific.

---

## 10. Component Recommendations

### Sourcing philosophy

The approved libraries (21st.dev, Magic UI, Aceternity, Origin UI, Motion
Primitives, shadcn, Cult UI) are **interaction and structure** references,
not visual skins to ship as-is. Several of these libraries' signature,
most-copied components are built specifically around gradients, glowing
borders, animated spotlight backgrounds, and glass/blur cards — i.e.,
exactly what ADR-0012 prohibits and what §1 identifies as the "generic
AI-generated" tell. **Every component pulled from any of these libraries
must be re-skinned to the closed token system before use** — its behaviour
(accessible keyboard handling, animation timing curve shape, structural
markup) can be adopted; its default colours, shadows, gradients, blur, and
border treatments cannot.

| Library               | Use for                                                                                                                                                               | Do not use their default                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **shadcn**            | Primary source. Accessible (Radix-based) primitives — dialog, dropdown, accordion, tooltip, tabs. Already close to unstyled by default, easiest to re-skin correctly. | Its default zinc/slate theme colours — replace with our neutral scale and single accent.                                                 |
| **Motion Primitives** | Scroll-reveal, stagger, and transition _behaviour_ (the timing/orchestration logic), text-reveal-on-scroll if ever needed                                             | Any built-in gradient text, glow, or blur-in effects bundled with a given primitive                                                      |
| **Magic UI**          | Number-ticker/counter _behaviour_ only (§8/§9's single stat use case)                                                                                                 | Its marquee/border-beam/shimmer/gradient components — all decorative, all rejected                                                       |
| **Origin UI**         | Accessible form primitive patterns (if the wizard's own `Input` ever needs a sibling for marketing-page forms, e.g. a newsletter/contact form)                        | Any pre-styled visual theme it ships with                                                                                                |
| **Aceternity**        | Reference only, for interaction _ideas_ (e.g. how a scroll-reveal is orchestrated) — expect to substantially rebuild rather than import directly                      | Its entire visual signature (spotlight cards, glowing borders, meteor/beam effects, 3D card tilts) — none of this belongs in this system |
| **21st.dev**          | Reference/inspiration browsing for layout ideas                                                                                                                       | Any component copied wholesale without a full re-skin pass                                                                               |
| **Cult UI**           | Reference only for structural component ideas (e.g. a well-built accordion or tab pattern)                                                                            | Its decorative variants                                                                                                                  |

**Rule of thumb:** if a component's demo/marketing page shows it glowing,
shimmering, or floating in 3D, treat that as a signal to extract only its
_interaction logic_, never its _visual output_.

### Buttons

Two variants exist and are correct: `primary` (filled, accent) and
`secondary`/`ghost` (outline/text). Recommended refinement:

- **Implemented:** a `lg` (44px) size closes the touch-target gap for all
  marketing-page CTAs; `sm`/`md` are unchanged and remain in use inside the
  quote wizard. A `destructive` variant was added at the same time for
  completeness (no current call site — uses the existing `danger` token,
  not a new colour).
- `buttonClassName(variant, size, className?)` is exported alongside
  `Button` for any element that must look identical but can't semantically
  be a `<button>` — a `Link`/anchor used for navigation, most commonly
  (Hero's CTAs, the Navbar's quote link). Never duplicate the variant/size
  class lists by hand.
- Primary CTA text is a plain, active-voice instruction — see §9 Hero's
  copy note for the actual current labels versus the earlier brief's
  proposed wording.
- Never more than one filled `primary` button visible in the same
  viewport at once. **Implemented in the Navbar (Phase 2)**: the quote
  link is `secondary` (outline) while the Hero is in view, switching to
  `primary` (filled) once scrolled past it — detected via
  `useHeaderScrollState`, which observes the Hero's own `id="hero"` DOM
  node rather than requiring any new prop/context.

### Cards

Flat, `border-border`, `rounded`, `bg-surface`, no shadow at rest, per §5.
Internal padding consistent across every card on the site (pick one value
from the spacing scale, e.g. `24px`/`spacing.6`, and use it everywhere a
card exists — Services Preview, Why Choose Us if cards are used there, any
future testimonial card).

### Accordion (FAQ)

Use shadcn's accordion primitive (Radix-based, correctly handles keyboard
nav, ARIA `aria-expanded`, and animated height via CSS custom properties
out of the box) re-skinned per §9's FAQ direction. Do not hand-roll a new
accordion — this is exactly the kind of solved, accessible primitive the
approved-library constraint exists to make available.

### Tooltip

Already exists as a primitive (`components/primitives/Tooltip.tsx`),
already mandated for every icon-only control per ADR-0012 §7. Extend its
usage to any new icon-only element introduced by this redesign (e.g. social
icons in the footer, if not already covered) rather than building a second
tooltip implementation.

### Number counter (conditional, single-use)

If a genuine stat is confirmed (years trading = 20, since founding 2006;
jobs completed if the client can supply a real figure), implement via
Magic UI's number-ticker _behaviour_ (count up once on scroll-into-view,
respects reduced motion by resolving instantly instead of counting), styled
in `text-900`/`semibold` at `xl` size with the unit/label at `sm`/
`text-muted` beneath it. Never fabricate a number — an invented "500+ happy
customers" is worse for trust than no stat at all, and directly
contradicts the project's "do not invent business information" discipline
already established for content work.

### Forms (Contact page)

Match the wizard's own `Input` primitive treatment exactly — same border,
radius, focus-ring, and label style. A contact form styled differently
from the quote wizard's forms would be the single fastest way to make the
site feel like two different systems stitched together.

---

## 11. Animation Recommendations

Consolidated from §7/§8's rules into a concrete build list:

| Effect                    | Where                                    | Timing                                                    | Property                                                                                                                       | Trigger                            |
| ------------------------- | ---------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Fade + lift entrance      | Every section, once                      | 400ms (`durationSlow`)                                    | opacity, translateY(8–12px)                                                                                                    | Scroll into view, once             |
| Staggered card reveal     | Services Preview, Why Choose Us, Process | 40–60ms stagger, capped ~6 items                          | opacity, translateY                                                                                                            | Scroll into view, once             |
| Hover colour/border shift | Buttons, links, cards                    | 150–250ms (`durationFast`/`durationBase`)                 | color, border-color, background-color                                                                                          | Pointer hover                      |
| Press feedback            | Buttons                                  | Instant (`durationFast`)                                  | `active:scale-95` (Tailwind's built-in scale utility — not an arbitrary `scale-[0.98]`, which the project's lint rule rejects) | Pointer/touch down                 |
| Animated underline        | Nav links, "view all" text CTAs          | 250ms (`durationBase`)                                    | transform: scaleX (width-reveal)                                                                                               | Hover, focus-visible               |
| Accordion expand/collapse | FAQ                                      | 250ms (`durationBase`)                                    | grid-template-rows or measured transform, opacity                                                                              | Click/keyboard activate            |
| Number count-up           | One stat, if it exists                   | 800ms–1.2s                                                | Text content via JS, no layout impact                                                                                          | Scroll into view, once             |
| Hero entrance             | Hero only                                | 400ms heading/subheading/visual, 250ms CTA, ~80ms stagger | opacity, translateY — CSS `animation` classes (`goqw-hero-*`), never inline `style`                                            | Page load (not scroll)             |
| SVG stroke-drawing reveal | Hero's visual anchor only                | 400ms per stage, staggered ~150ms apart                   | `stroke-dashoffset` via `pathLength={1}`/`strokeDasharray={1}` + CSS `animation`                                               | Page load, once, never re-triggers |

**Confirmed rejections** (repeated from §8 for completeness at
implementation time): magnetic buttons, cursor-follow/spotlight effects,
parallax, any gradient or glass-based motion, scroll-scrubbed/scroll-jacked
animation, auto-replaying carousels or marquees of unrelated content.

All timings above use the single existing easing curve
(`cubic-bezier(0.4, 0, 0.2, 1)`) — no exceptions, no per-component custom
curves.

---

## 12. Accessibility Rules

Baseline: **WCAG 2.1 AA minimum**, no exceptions.

- **Touch targets**: 44×44px minimum for every interactive element.
  **Current gap**: `Button` primitive's `sm` (32px) and `md` (40px) sizes
  fall short — remediation is a new `lg` (44px) size used for all
  marketing-page CTAs (see §10), not a change to the existing sizes' use in
  denser contexts.
- **Colour contrast**: every text/background pairing must hit 4.5:1 (body
  text) or 3:1 (large text ≥24px/semibold ≥18.66px, and UI component
  boundaries). The recommended accent (`#1C4A3D` on `neutral.0`/`neutral.50`)
  must be verified against this threshold before implementation — treat
  this as a required check, not an assumption, in §15's pre-flight list.
- **Keyboard navigation**: every interactive element reachable and
  operable via keyboard alone, in a logical tab order matching visual
  order. The existing `SkipLink` component must remain first in the tab
  order on every page — do not let a redesigned Hero accidentally place
  decorative elements before it in DOM order.
- **Focus-visible**: the existing global 2px accent outline (`index.css`)
  is correct and must be preserved on every restyled component — never
  replace it with a subtler custom focus style "to match the design," and
  never suppress it via `outline: none` without an equally visible
  replacement (there is no reason to do either here).
- **ARIA labels**: every icon-only control (social icons, accordion
  chevron if it's a separate button, any icon-only nav item) needs an
  accessible name — either visible text, `aria-label`, or the existing
  `Tooltip` primitive (which already handles hover + keyboard focus + ARIA
  correctly, per ADR-0012 §7).
- **Motion sensitivity**: `prefers-reduced-motion` is already implemented
  globally and must continue to disable every animation/transition
  introduced by this redesign — this is a global CSS media query, not a
  per-component opt-in, so any new component automatically inherits it as
  long as it uses standard CSS transitions/animations rather than a JS
  animation library that bypasses the media query. If a JS-driven library
  (e.g. for the number counter or scroll-reveal orchestration) is used, it
  must explicitly check `prefers-reduced-motion` itself and skip/instantly-
  resolve the animation when set.
- **Semantic HTML first**: headings in strict hierarchical order (one H1
  per page, H2 for section headings, H3 within sections as needed) — this
  matters doubly here since it also directly affects the SEO landing
  pages' search performance, not just accessibility.

---

## 13. Performance Rules

- **No spinners, ever** (already enforced — `Skeleton` primitive exists,
  matches final layout, animates via opacity pulse only). Any new
  marketing-page loading state (e.g. a lazy-loaded image before it
  decodes) uses the same skeleton pattern, not a spinner.
- **Images**: lazy-load everything below the fold (Projects grid, Our Work
  page). Serve modern formats (WebP/AVIF) with a fallback. Always set
  explicit `width`/`height` or `aspect-ratio` so the browser reserves
  layout space before the image loads — this is the single biggest lever
  against Cumulative Layout Shift on an image-heavy Projects section.
- **Fonts**: already correct — self-hosted Inter, `font-display: swap`, no
  third-party font requests. No change needed.
- **Code-splitting**: the 5 SEO service landing pages currently share one
  route-level bundle with the rest of the site. As the number of landing
  pages grows, consider route-level lazy-loading (`React.lazy` per route
  element factory in `routes.ts`) so a visitor to one service page doesn't
  download the content for the other four. This is a recommendation for
  the implementation engineer to evaluate against actual bundle-size
  impact, not a mandate to implement immediately at 5 pages.
- **Memoization**: section components that render lists (Services Preview,
  Why Choose Us, FAQ, Projects) should avoid unnecessary re-renders — this
  is a standard React performance hygiene note, not a redesign-specific
  concern, since none of this content is expected to change after mount.
- **No layout-shifting animation** (repeated from §7 because it's also a
  performance rule, not just a motion-quality rule): only `opacity`/
  `transform` are animated, which are compositor-only properties and carry
  no layout or paint cost.
- **Core Web Vitals targets**: LCP under 2.5s (the Hero's heading/CTA
  should be the LCP element — keep it free of render-blocking dependencies
  and ensure any Hero graphic is optimized/lazy-appropriate), CLS under
  0.1 (achieved by the image `width`/`height` discipline above and by
  never animating layout properties), INP under 200ms (achieved by keeping
  interaction handlers light — this redesign introduces no new heavy
  client-side logic, only presentational animation).

---

## 14. Anti-Vibe-Coding Checklist

A concrete, enforceable checklist — every item ties to a specific rule
already stated above, so "did we follow the Design Bible" has one right
answer, not a matter of taste.

- [ ] **Spacing**: every gap/padding value is one of the closed scale's
      steps (`0–64px` component-level, `80px`/`96px` section-level). No
      arbitrary values.
- [ ] **Shadows**: at most two shadow tokens exist (`elevated`, and
      `overlay` if introduced), both functional (communicate stacking
      order), neither used decoratively on a static card.
- [ ] **Corner radius**: exactly two radius values in use (`6px` default,
      `full` for pills/circles). No third value anywhere.
- [ ] **Iconography**: one icon style throughout (the existing inline SVG
      line-icon set) — never mix icon sets, never introduce filled icons
      alongside outline icons.
- [ ] **Typography**: exactly one typeface, six type sizes, three weights.
      Every heading uses `semibold`; every body/description uses `normal`.
- [ ] **Colour**: exactly one accent colour in use across the entire site.
      No second "highlight" colour introduced for a specific section.
- [ ] **Animation language**: every animation in the codebase animates only
      `opacity`/`transform`, uses one of the three duration tokens, and the
      one easing curve. No component has a bespoke transition curve.
- [ ] **Empty states**: any list that could be empty (e.g. a service
      landing page with no Related Projects — already the case for 4 of
      the 5 SEO pages) either omits the section cleanly (the current,
      correct behaviour) or shows a designed, on-brand empty state — never
      a broken-looking blank gap or a placeholder Lorem Ipsum block.
- [ ] **Loading states**: every async/loading moment uses a skeleton that
      matches final layout exactly — never a spinner, never a layout that
      "pops" once content arrives.
- [ ] **Transitions between states**: every state change (hover → active,
      collapsed → expanded, loading → loaded) is animated per §7's rules,
      not an instant snap — but also never over-long (nothing exceeds
      400ms except the deliberate number-counter exception).
- [ ] **Button hierarchy**: never more than one filled `primary` button
      visible in the same viewport at once. Secondary actions are always
      visually subordinate.
- [ ] **Visual rhythm**: every one of the 7 home sections uses identical
      vertical padding, identical container max-width, identical heading
      treatment (size/weight/alignment) — scanning down the page should
      feel like one continuous system, not seven separately-built blocks.
- [ ] **No decorative language**: no gradients, no glassmorphism, no neon,
      no drop-shadowed floating cards, no cursor-follow effects anywhere in
      the shipped implementation, full stop.

---

## 15. Implementation Rules for Claude Code

### Scope boundary (repeats product-vision.md/ADR-0020, made explicit for

this workstream)

**Only these files are in scope for this redesign:**

- `apps/wizard/src/site/sections/*/Layout.tsx` (all 7 sections — Hero,
  Intro, ServicesPreview, Process, Projects, WhyChooseUs, FAQ)
- `apps/wizard/src/site/Footer/Layout.tsx`
- `apps/wizard/src/design/tokens.ts` — **extension only**, for the specific,
  enumerated additions in this document (two spacing steps, one motion
  duration, one button size, one conditional shadow token) — never a
  wholesale rewrite, never removal of an existing token, never introducing
  a token category this document doesn't call for (no `backgroundImage`,
  no `blur`, no second accent).
- `apps/wizard/tailwind.config.ts` — only to reflect the same enumerated
  token extensions above.
- `apps/wizard/src/components/primitives/Button.tsx` — **only** to add the
  new `lg` (44px) size variant called for in §10/§12. No other change to
  this file.

**Never touched by this redesign:**

- Any `index.tsx` (behavioral component) in `site/sections/*/` or
  `site/Footer/` — props, data transformation, and rendering delegation are
  unchanged.
- `apps/wizard/src/domain/`, `apps/wizard/src/runtime/`, any other file
  in `apps/wizard/src/components/` beyond the single `Button.tsx` addition
  above, `apps/wizard/src/site/routing/`, `apps/wizard/src/site/layout/`,
  and all PHP.
- The 7-section order, the 6 routes, any CTA's `href`/`onClick` destination,
  or any content string — this redesign is exclusively about how existing
  content and structure are rendered, never what exists.

### The `SectionLink` rule still applies

Every internal link inside a restyled `Layout.tsx` continues to use the
existing `SectionLink` helper (`@/site/routing/SectionLink`), never a raw
`<a>` for internal paths — this is inherited from ADR-0020's amendment and
is unaffected by anything in this document.

### Pre-flight checklist, before touching any file

1. Read the current file in full before editing (standing project rule).
2. Confirm the props interface accepted by `index.tsx` is unchanged after
   the `Layout.tsx` edit — the behavioral/visual contract must not shift.
3. Confirm no new Tailwind arbitrary-value class (`[...]`) is introduced —
   if a needed value doesn't exist in the token set, that's a signal to
   come back to this document and propose a token extension, not to reach
   for an arbitrary value.
4. Confirm no new colour, shadow, radius, or spacing value is introduced
   outside the closed sets defined in §2–§6 and their enumerated
   extensions.
5. Confirm any new animation only touches `opacity`/`transform` and uses
   an existing duration/easing token (or the one new `durationSlow` token
   defined in §7).

### After each `Layout.tsx` change

Run the full existing gate sequence: `pnpm lint`, `pnpm typecheck`,
`pnpm test`, `pnpm build` — then the operational/visible-UI verification
already mandated by ADR-0018: confirm the section renders visibly and
correctly in a real browser, not just that the gates pass. This applies
per-section (verify Hero in isolation) and then to the full home page
composition (verify all 7 sections together, in order, on both desktop and
mobile viewports) before moving to the next section.

### Foundation sign-off items — approved and implemented (Phase 1)

All five were approved via `docs/ui-overhaul-plan.md` and are live in
`tokens.ts`/`tailwind.config.ts`, documented in full in
`docs/component-registry.md`'s Phase 1 entry:

1. **Accent colour**: Pine `#1C4A3D` — live (§2).
2. **Spacing scale extension**: `20` (80px) / `24` (96px) — live (§4).
3. **Elevation extension**: `overlay` shadow token — live, used by the
   Phase 2 mobile nav drawer (§5).
4. **Motion token extension**: amended during approval to 150ms/250ms/
   400ms (not the originally proposed 120ms/180ms/400ms) — live (§7).
5. **Button size extension**: `lg` (44px) — live, plus a `destructive`
   variant added at the same time for completeness (§10).

### Patterns established during Hero (Phase 3) — genuinely new, not duplicated above

- **Motion implementation constraint**: `react/forbid-dom-props` bans the
  `style` prop project-wide. Any stagger-delayed or dynamically-offset
  animation must be a named CSS `animation` in `tailwind.config.ts`, never
  an inline `style` object (§7 rule 7).
- **Illustration style precedent**: where a section needs a decorative
  visual device (not a photo, not a literal icon), the established
  language is an abstract technical/blueprint-style line drawing — thin
  single-colour strokes, `pathLength={1}`/`strokeDasharray={1}`-driven
  reveals, one or two elements in the accent colour at most, never a
  numeral or figure that could be mistaken for an invented statistic.
  `Hero/MeasuredDrawing.tsx` is the reference implementation.
- **Two-zone editorial layout**: Tailwind's built-in `w-3/5`/`w-2/5`
  fraction utilities (not `grid-cols-[...]`, which the arbitrary-value
  lint rule rejects) are the established pattern for a text/visual split
  layout — available for any future section that needs one.
- **`buttonClassName` reuse**: any element that must look like a button but
  can't semantically be one (a `Link`/anchor used for navigation, most
  commonly) uses the exported `buttonClassName(variant, size)` helper
  rather than duplicating Button's class list — already used by Hero's
  CTAs and the Navbar's quote link.

### Two hero patterns, deliberately different (established Phase 10, updated Phase 12)

Both patterns are now photo + flat scrim + text — the distinction that
matters is scale/purpose, not "photo vs. illustration" (that distinction
existed only between Phase 10 and Phase 12; see the Hero entry above for
the retired direction it replaced).

- **Home page Hero** is the one full-viewport (`lg:min-h-screen`), most
  dramatic arrival moment for the whole site — full-bleed photograph,
  `bg-neutral-900/70` scrim (one step darker than `ServiceHero`'s, since
  it's the darkest section in the sitewide tone hierarchy). This scale
  stays unique to the home page.
- **`ServiceHero`** (service landing pages only) is a separate, shared
  component, not a variant of Hero: a capped-height (`min-h-service-hero`,
  ~600px on desktop; content-driven on mobile, no forced minimum), full-
  bleed photograph with a flat `bg-neutral-900/60` scrim — never a
  gradient — behind the same heading/subheading/CTA treatment as Hero
  (identical type scale, `buttonClassName` sizes, entrance-motion classes).
  Interior/service-style pages optimise for conversion and immediate
  service recognition over the home page's full-viewport drama. The
  photograph is the only intentional visual difference between the 5
  service pages — layout, spacing, and every other element are identical.
  A missing/unloaded image degrades to a flat `bg-surface-dark` panel
  (updated Phase 12 from `bg-surface-sunken` to match the sitewide dark
  system; same `onError` pattern as `Projects`), never a broken-image icon.

### How to add a real photograph to any content file (established Phase 10 asset integration)

Import it as an ES module from `src/assets/images/` — e.g. `import x from
'@/assets/images/service-hero-fencing.webp'` — and reference the imported
constant as the content field's value, never a string literal path like
`/images/foo.jpg`. Vite's already-configured `assetFileNames` rule
fingerprints and emits the file so it resolves correctly wherever the
plugin's compiled assets are deployed; a bare absolute path only resolves
if a file happens to exist at the WordPress site's literal document root,
which nothing in this project's build/deploy pipeline produces. `Projects`'
placeholder images still use the old, broken convention only because no
real photography has been supplied for them yet — the next real photo
added anywhere on the site should use the import convention, not be a
reason to add a second one.

If any documented rule above is ever rejected or amended, the
corresponding section of this document should be updated to match before
implementation, so the Design Bible and the shipped system never silently
diverge — the same discipline `product-vision.md` already applies to
itself.

---

_End of Design Bible. This document is the complete presentational
specification for Phase 6.x UI customization. It does not contain and
should never need to contain code — any question about "how exactly" to
implement a rule here that isn't answered by this document should be
raised as a question against this document, not resolved ad hoc in
component code._
