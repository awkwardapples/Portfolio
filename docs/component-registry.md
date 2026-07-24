# Component Registry

**Purpose:** source of truth for every implemented UI decision made during
the UI overhaul (`docs/ui-overhaul-plan.md`, built on `docs/design-bible.md`
and `docs/product-vision.md`). Updated after each area is implemented —
never speculatively ahead of the work. If a decision here needs revisiting,
change it here in the same commit that changes the code, so this document
never silently drifts from what's shipped.

**How to read an entry:** each records what the component is, where it
lives, what (if anything) it was adapted from, exactly what was changed
from any external source, why, its motion behaviour, and its accessibility/
performance posture — enough that nobody re-litigates a decision already
made here.

---

## Phase 1 — Foundation

No individual components in the usual sense — this phase established the
shared tokens and primitives every later section builds on.

### Design tokens (`apps/wizard/src/design/tokens.ts`)

**Source:** internal — extends the existing closed-token system, does not
replace it. No external library involved.

**Changes made:**

| Token                          | Before                         | After                                                                   | Reason                                                                                                                                                                                                      |
| ------------------------------ | ------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accentCssExpression` fallback | `15 76 129` (#0F4C81, navy)    | `28 74 61` (#1C4A3D, "Pine")                                            | Design Bible §2 sign-off. Verified >10:1 contrast on white (exceeds AAA). Differentiates from the blue/orange that dominate the local-trades category; nods to the business's landscape-gardening heritage. |
| `spacing.11`                   | _(did not exist)_              | `2.75rem` (44px)                                                        | Exists solely so `Button`'s `lg` size can hit the WCAG touch-target minimum via `h-11`. Not a general-purpose spacing step.                                                                                 |
| `spacing.20` / `spacing.24`    | _(did not exist)_              | `5rem` (80px) / `6rem` (96px)                                           | Macro section-level vertical rhythm (Design Bible §4 sign-off) — mobile/desktop section padding. Never used for component-internal spacing.                                                                 |
| `boxShadow.overlay`            | _(did not exist)_              | `0 4px 6px -1px rgb(20 23 26/0.1), 0 10px 24px -4px rgb(20 23 26/0.12)` | Second functional elevation tier, for the mobile nav drawer (Phase 2) sitting above a scrim. Design Bible §5's "only if a modal/drawer is actually planned" condition is now met.                           |
| `motion.durationFast`          | `120ms`                        | `150ms`                                                                 | UI Overhaul Plan §3 Amendment 1 — adopts the brief's specified timing triad.                                                                                                                                |
| `motion.durationBase`          | `180ms`                        | `250ms`                                                                 | Same.                                                                                                                                                                                                       |
| `motion.durationSlow`          | _(did not exist)_              | `400ms`                                                                 | Same — named slow tier for scroll-reveal/entrance, previously unset.                                                                                                                                        |
| `motion.easing`                | `cubic-bezier(0.4, 0, 0.2, 1)` | _(unchanged)_                                                           | Confirmed as the one curve, no exceptions.                                                                                                                                                                  |

**Design reasoning:** every value above is additive or a numeric adjustment
to an existing token — no new token _category_ was introduced (no
`backgroundImage`, no `blur`, no second accent). The closed-palette
enforcement mechanism (Tailwind's default theme fully replaced, not
extended) is untouched.

**Accessibility:** Pine's contrast ratio was calculated and verified
(~10.02:1 against white) before adoption, not assumed.

**Performance:** zero runtime cost — these are build-time CSS values.

---

### Tailwind config (`apps/wizard/tailwind.config.ts`)

**Source:** internal.

**Changes made:** wired `motion` tokens into `transitionDuration` (`DEFAULT`
= base/250ms, `fast` = 150ms, `slow` = 400ms) and `transitionTimingFunction`
(`DEFAULT` = the one easing curve). This means the bare Tailwind
`transition` utility now automatically uses our base timing/curve with no
extra class required, and `duration-fast` / `duration-slow` cover the other
two tiers. No second easing curve was added — `ease` (from `DEFAULT`) is the
only timing-function utility this config generates.

**Design reasoning:** motion tokens existed in `tokens.ts` since Phase 4 but
were never actually connected to Tailwind's utility generation before this
— nothing in the codebase referenced them. This is the first time "one
animation language" is enforceable via the type system/build rather than
just documented.

---

### Button (`apps/wizard/src/components/primitives/Button.tsx`)

**Source:** internal — extends the existing primitive (used by both the
wizard and, from this point on, marketing pages). No external component
library involved; this is the "one unified button system" the UI Overhaul
Plan calls for.

**Changes made:**

- Added `lg` size (`h-11 px-6 text-base` — 44px) for marketing-page CTAs.
  `sm`/`md` are byte-for-byte unchanged and remain in use inside the quote
  wizard (`EstimateDisplayStep.tsx`, `NavigationControls.tsx`) — verified via
  grep before editing that no call site would be affected.
- Added `destructive` variant (`bg-danger` family) — a completeness addition
  with no current call site, using the existing `danger` state token rather
  than introducing a new colour. Exists so the system has no missing tier if
  a destructive action is ever needed.
- Added `active:scale-95` (press feedback) and `duration-fast` (replacing
  the previous unscoped `transition-colors` with no explicit duration) to
  every variant.

**Design reasoning:** Design Bible §10/§12 sign-off items — the touch-target
gap identified in the original UI audit is now closed. Nothing about the
existing `sm`/`md`/`primary`/`secondary`/`ghost` behaviour changed.

**Motion behaviour:** hover/colour transitions at `duration-fast` (150ms);
press feedback is an instant `scale-95` on `:active`, reverting on release —
no separate timing needed since `transition-colors` doesn't cover
`transform`, so the scale change is inherently as fast as the browser can
paint it, which is correct for "instant" press feedback per Design Bible §7.

**Accessibility:** no change to existing focus-visible behaviour (inherited
from the global base layer). `lg` size directly closes the 44px WCAG
touch-target gap flagged in the original audit.

**Performance:** zero new dependencies; pure CSS class additions.

---

### IconButton (`apps/wizard/src/components/primitives/IconButton.tsx`)

**Source:** internal — extends the existing primitive. **Zero existing call
sites** (confirmed via repo-wide search before editing), so this is
purely additive with no regression risk.

**Changes made:** added a `size` prop (`sm` 32px, default — byte-for-byte
the original hardcoded behaviour; `lg` 44px, new). Added `duration-fast` to
the existing `transition-colors`.

**Design reasoning:** the mobile nav menu toggle (Phase 2) will be this
primitive's first real consumer and needs the 44px touch target; `sm`
remains available for any future denser context.

**Accessibility:** unchanged — the required `label` prop (driving both
`aria-label` and the paired `Tooltip`) was already structurally enforced by
the existing primitive and is untouched. This primitive was already a
correct model for "icon-only controls must have accessible labels and
tooltips" (ADR-0012 §7) before this overhaul; nothing here needed fixing.

**Performance:** zero new dependencies.

---

### Card (`apps/wizard/src/components/primitives/Card.tsx`)

**Source:** internal, hand-built. No external library — evaluated during
the UI audit (Aceternity's 3D Card/Card Spotlight/Glare Card/Wobble Card
were all rejected as decorative gimmicks; Card Hover Effect's default ships
a gradient/glow and wasn't worth adapting for something this simple) and
concluded the pattern itself is a two-line Tailwind recipe, not something
that benefits from an external component.

**What it is:** the one flat-card pattern for the whole product — hairline
`border-border`, single `rounded` radius, `bg-surface`, no shadow at rest,
ever. An optional `interactive` prop adds a border-colour-shift-on-hover
(never a shadow) for cards that link somewhere.

**Design reasoning:** Design Bible §5/§9/§10 — cards are flat and
differentiated by hairline border only; hover affordance comes from a
border/background change, never elevation. Deliberately **not** used by
Why Choose Us's value-prop grid (that section stays card-less on purpose,
per Design Bible §9, to visually differentiate two structurally similar
grid sections — Services Preview uses `Card`, Why Choose Us does not).

**Motion behaviour:** `interactive` variant transitions `border-color` at
`duration-fast`.

**Accessibility:** no interactive semantics of its own — a `Card` wrapping a
link inherits that link's accessibility, the card itself adds no ARIA.

**Performance:** zero new dependencies; a single small component.

---

### `useScrollReveal` + `scrollRevealClassName` (`apps/wizard/src/design/useScrollReveal.ts`)

**Source:** internal, hand-built. Evaluated against Aceternity's Motion
Primitives-adjacent scroll components during the audit and rejected as a
direct import — the actual requirement (fade+lift once, on first viewport
entry, respecting reduced motion) is a small, fully-specified behaviour
better served by an owned ~40-line hook than a dependency.

**What it is:** a shared `IntersectionObserver`-based hook returning a ref

- `isVisible` boolean, firing once and disconnecting (Design Bible §7:
  "scroll-reveal fires once"). Paired with `scrollRevealClassName(isVisible)`,
  which returns the Tailwind classes for the fade+lift transition (8px
  translate, the bare `transition` utility — which already covers both
  `opacity` and `transform` via Tailwind's default `transition-property` list,
  so no arbitrary `transition-[...]` class was needed).

**Design reasoning:** this is the "animation utility" / "shared interaction
state" the UI Overhaul Plan's Phase 1 calls for — every later section
(Services Preview, Why Choose Us, Projects, etc.) will use this same hook
rather than each re-implementing scroll-triggered reveal independently.

**Motion behaviour:** 400ms (`duration-slow`), the one easing curve, 8px
vertical offset — matches Design Bible §7/§11 exactly.

**Accessibility:** does not special-case `prefers-reduced-motion` itself —
the global CSS media query (`index.css`) already zeroes out all transition
durations sitewide, so the reveal becomes instant rather than animated for
those users automatically. No environment without `IntersectionObserver`
support is expected, but the hook falls back to revealing immediately
rather than hiding content forever if one is encountered.

**Performance:** zero new dependencies. One `IntersectionObserver` instance
per revealed element, disconnected immediately after firing — no ongoing
scroll-listener cost.

---

### Motion library decision (recorded, not yet installed)

Per the UI Overhaul Plan §7 sign-off: `motion` (the modern, smaller
successor to `framer-motion`) is **approved for narrow, later use** — the
mobile nav menu's exit animation (Phase 2) and any future coordinated
image cross-fade — using its lightweight `animate()`/`inView()` entry
points rather than the full `motion/react` component API wherever a simple
trigger-and-animate suffices. **Not installed in Phase 1** — nothing built
so far needed it; native CSS covered every Phase 1 need. Will be added as a
dependency in Phase 2 when the mobile menu's exit-animation requirement is
actually reached, not before.

---

## Phase 2 — Navbar

### Pre-implementation audit (recap)

**Current implementation before this phase:** `Header.tsx` was a static
bordered header with no scroll-awareness; `Nav.tsx` rendered every route
(including `/quote`) as an identically-styled plain text link with a static
`border-b-2` active indicator; on narrow viewports the link list simply
overflowed and scrolled horizontally (per ADR-0016) — **there was no mobile
menu at all**. Confirmed via `document.getElementById`/grep before editing:
`IconButton` had zero existing call sites (fully safe to extend), `Button`'s
`ghost`/`sm`/`md` are actively used inside the quote wizard (`ghost` in
`EstimateDisplayStep.tsx`, `secondary`/`primary` in `NavigationControls.tsx`)
— nothing here was touched.

**What must remain untouched, confirmed before coding:** `ROUTES` (routing
table), every route's `href`/destination, `showInNav` filtering logic,
`aria-current` semantics, the wizard's own `Button`/`IconButton` call sites
and their `sm`/`md`/`ghost` styling, all analytics (none exist on nav
interactions today — none were added; opening/closing the mobile menu is
local UI state, not tracked, consistent with nothing else on this site
being tracked client-side yet).

**Component research:** 21st.dev remained unauthenticated in this session
(same limitation as the original audit — `21st search` requires a signed-in
session or API key neither of which this non-interactive session can
supply). Aceternity's Floating Navbar / Resizable Navbar were reconsidered
and rejected again for the same reason as the original audit — both ship
backdrop-blur by default. No shadcn/Radix dependency was added — see the
`MobileMenu` entry below for why.

### Header (`apps/wizard/src/site/layout/Header.tsx`)

**Changes:** made `sticky top-0 z-30`. Border is `border-transparent` at
rest, transitions to `border-border` once `window.scrollY > 8px`
(`useHeaderScrollState`) — background stays `bg-surface` throughout, so
there is no colour swap, no height change, and therefore no CLS. Passes a
new `heroInView` value down to `Nav`.

**Design reasoning — one deliberate simplification, flagged rather than
silently decided:** the brief's "lightweight transparent/flat treatment"
could be read as a literal see-through header revealing the Hero behind it.
I implemented the border-only version instead: the current Hero (Phase 3,
not yet redesigned) is a solid `bg-primary` block, so building
transparent/inverse-text logic against it now would be discarded the
moment Phase 3's flatter, editorial Hero lands. The border-only treatment
satisfies "scroll-aware, zero layout shift" safely against both the old and
new Hero. Worth revisiting for a true overlay once Phase 3 exists.

**Motion:** `duration-base` (250ms) on the border-colour transition, per
spec.

### `useHeaderScrollState` (`apps/wizard/src/site/layout/useHeaderScrollState.ts`)

**What it does:** tracks `isScrolled` (scroll-position threshold) and
`heroInView` (whether the current page's Hero section is still
substantially in the viewport). Hero detection uses
`document.getElementById('hero')` — every Hero section already renders its
section `id` (always literally `'hero'` in every content file) onto its
root DOM node, so this needed **zero changes to Hero's own files** and no
new prop/context plumbing. Returns `heroInView: false` immediately on any
page with no Hero at all (Services, Our Work, Contact, Privacy, Quote), so
the CTA on those pages defaults correctly to filled/primary.

**Design reasoning:** re-runs its effects on `currentPath` change, since a
client-side route change can add/remove the observed DOM node without a
full page reload.

### Nav (`apps/wizard/src/site/layout/Nav.tsx`)

**Changes:**

- The `/quote` route no longer renders as a plain text link — it's a
  `Link` styled with `buttonClassName(heroInView ? 'secondary' : 'primary', 'md')`,
  giving the quote CTA real visual hierarchy against the other nav items for
  the first time.
- Other nav links: replaced the static `border-b-2` active indicator with
  an animated underline — a `scaleX` transform (`origin-left`,
  `duration-base`) that's permanently scaled in for the active route and
  reveals on hover/focus for inactive ones (Design Bible §11's "animated
  underline, narrow scope: nav links only").
- New mobile hamburger trigger (`IconButton size="lg"`, 44px,
  `aria-expanded`/`aria-controls` wired to the drawer) and `MobileMenu`,
  both hidden on desktop (`md:hidden`) exactly as the desktop link list and
  CTA are hidden on mobile (`hidden md:block` / `hidden md:inline-flex`) —
  no viewport shows both at once.

**Accessibility:** `aria-current="page"` behaviour is unchanged from the
original implementation. The mobile trigger's label toggles between "Open
menu"/"Close menu" so its accessible name always matches its current
action; `IconButton` already pairs it with a tooltip structurally (the
brief's "trigger is exempt from tooltip" was read as "not required," not
"forbidden" — showing one is harmless extra affordance and avoiding it
would have meant not reusing the existing primitive).

### MobileMenu (`apps/wizard/src/site/layout/MobileMenu.tsx`)

**Source:** hand-built, not a Radix/shadcn dependency. **Reconsidered
during implementation from the Phase 1 registry note** that assumed a
`motion`-library exit animation would be needed for this: it isn't. The
drawer is always mounted (never conditionally rendered) and visibility is a
pure `translate-x`/opacity class toggle — there is no unmount to animate,
so the earlier "install `motion` for this" plan was dropped as
unnecessary once actually building it. **`motion` remains uninstalled.**

**What it is:** a right-side slide-in panel (`role="dialog"
aria-modal="true"`) with:

- A flat, semi-transparent neutral scrim (`bg-neutral-900/50`, no blur) —
  implemented as a real `<button tabIndex={-1} aria-hidden>` rather than a
  `div` with an `onClick`, so a mouse/touch dismiss affordance exists
  without relying on a non-interactive element handling clicks.
- Focus trap via the new shared `useFocusTrap` hook (Tab/Shift+Tab cycle
  within the panel only).
- Escape closes and returns focus to the trigger button (via a `RefObject`
  passed down from `Nav`).
- Body scroll lock while open (`document.body.style.overflow = 'hidden'`,
  restored on close) — a small addition beyond the literal spec, included
  because an open mobile drawer with a scrollable page behind it is a
  common, easily-noticed rough edge.

**Why hand-built instead of a dependency:** the existing `Tooltip`
primitive already established this codebase's precedent — small, fully
owned accessibility primitives over a new library, for any interaction
surface that's simple and fully bounded (a fixed set of nav links + one
button, here). A general-purpose Dialog library is justified when content
is arbitrary/unknown ahead of time; this isn't that case.

**Motion:** panel slide (`translate-x-full` → `translate-x-0`) and scrim
fade, both `duration-base` (250ms), the one easing curve. Respects
`prefers-reduced-motion` via the existing global CSS override (no
JS-driven animation exists here to need its own check).

**Accessibility:** `role="dialog"`, `aria-modal="true"`, `aria-label="Site
navigation"`, focus moves into the panel on open and returns to the trigger
on close, full keyboard operability (Tab trap + Escape), 44px touch targets
throughout (menu trigger and close button both `size="lg"`).

**Performance:** zero new dependencies added.

### `useFocusTrap` (`apps/wizard/src/design/useFocusTrap.ts`)

Shared design-system utility (not Navbar-specific in principle, though this
is its first consumer) — a small, hand-built Tab/Shift+Tab cycle
implementation, documented above under `MobileMenu`.

### `buttonClassName` (`apps/wizard/src/components/primitives/Button.tsx`)

Exported the `Button` primitive's class-recipe as a standalone function so
a semantically-different element that must render identically (`Nav`'s
quote CTA, a `Link`/anchor, not a `<button>`) doesn't duplicate the variant/
size class maps. `Button` itself now calls this function internally —
zero behavioural change to the component, pure refactor enabling reuse.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **846/846 passed**, no
regressions (routing, active-state, and content tests all still green
unchanged). `pnpm build` clean (96.88 kB gzip, +1.31 kB — new Nav/
MobileMenu/hook code, no new dependency). Redeployed to the LocalWP site
and confirmed via `curl` that it serves the fresh bundle. No screenshot
tool is available in this environment — see the chat response for manual
verification steps.

## Phase 3 — Hero

### Design review (recap)

**Current implementation before this phase:** solid `bg-primary` full-bleed
colour fill, heading correctly at the `2xl` token size but rendered as a
plain white heading on a colour block (read as a banner, not an editorial
headline), CTAs as raw `<SectionLink>` elements with inline classes — not
using the Button system introduced in Phases 1–2 at all. No motion. No
visual anchor. Shared verbatim across the home page and all 5 SEO service
landing pages, so every change here applies to 6 page instances at once.

**Content preserved verbatim (confirmed from the actual content files, not
assumed):** every heading, subheading, and CTA label/href on the home page
and all 5 service pages — zero copy changes. Two pre-existing inconsistencies
were identified and deliberately left alone (home vs. service-page CTA
label wording differs slightly; the original project brief's "Get FREE
instant estimate" wording was never actually implemented) — flagged to the
project owner, not silently fixed, since fixing either would be a copy
change outside this phase's presentation-only scope.

**A content-shape gap, resolved conservatively:** the brief asked for trust
indicators in the Hero's typography hierarchy, but `HeroContent` has no
field for that. Decision: don't add one. Trust-building is already
explicitly Intro's job one section down; adding a new Hero content field
this round would cross from presentation into content for a claim this
component doesn't need to carry alone.

**Three directions re-evaluated** (conversion impact / brand fit /
implementation cost / performance impact / long-term maintainability) —
full detail in the chat record for `hero-approval-elevation`. Nothing had
changed since the direction was first agreed (still no real project
photography confirmed available), so **Option B (Premium Editorial)** was
reaffirmed, with **Option A (Craftsmanship Photography)** kept as the
pre-shaped upgrade path — the existing `backgroundImage`/`backgroundImageAlt`
props needed no type change at all to support this.

**Component research:** 21st.dev remained unauthenticated in this session
(unchanged limitation). Aceternity's catalog was reconsidered for the
visual anchor and for text/reveal treatments — nothing in it fits an
abstract technical-drawing composition (its closest categories, Text
Components and Backgrounds & Effects, are gradient/glow/particle-driven by
default, exactly what was rejected in the original audit); the
stroke-dasharray/dashoffset line-draw technique used here is a standard SVG
technique, not something a component library provides.

### Hero (`apps/wizard/src/site/sections/Hero/Layout.tsx`)

**Changes:** solid `bg-primary` fill replaced with `bg-surface`; single
centred column replaced with a two-zone flex layout (`md:w-3/5` text /
`md:w-2/5` visual — Tailwind's built-in fraction-width utilities, not
`grid-cols-[1.4fr_1fr]`, which the project's arbitrary-value lint rule
correctly rejected); raw `<SectionLink>` CTA styling replaced with
`buttonClassName('primary'|'secondary', 'lg')` (44px touch targets,
consistent with the rest of the unified Button system). The visual anchor
zone is hidden below `md` — mobile keeps headline/subheading/CTA compact
and visible without scrolling, per design-bible.md §9's mobile Hero
direction, rather than shrinking the visual onto the same screen.

**A real implementation correction, recorded honestly:** the first draft
used `useState`/`useEffect` plus inline `style` for the stagger-delayed
entrance and the SVG's `stroke-dashoffset` reveal. `pnpm lint` correctly
rejected this — `react/forbid-dom-props` bans the `style` prop outright,
project-wide, no exceptions. Rebuilt to use pure CSS `animation` classes
instead (see tailwind.config.ts changes below): no JS state at all for the
entrance sequence, matching the existing `goqw-pulse` skeleton animation's
established pattern more closely than the discarded approach did.

**Design reasoning — `backgroundImage` reinterpreted, not reused literally:**
the prop now swaps in a photo for the right-zone visual anchor specifically,
not a full-bleed section background. A full-bleed photo with text overlaid
on top is exactly the pattern design-bible.md §9 rejects, so "the photo
replaces the drawing in its own zone" is the correct reading of "Option A
upgrade path," not a literal reuse of the old treatment. No content file
sets these props today, so this is a live but currently dormant path.

### MeasuredDrawing (`apps/wizard/src/site/sections/Hero/MeasuredDrawing.tsx`)

**Source:** hand-built, not adapted from any library — see Component
Research above for why nothing in the approved libraries fit.

**What it is, per the `hero-approval-elevation` feedback rejecting a basic
roofline icon:** an abstract technical/blueprint-style drawing — corner
crop-marks framing the composition like a drafted sheet's bounds, a
post-and-brace structural motif (evoking fencing/decking construction
without being a literal cartoon fence), and an architectural dimension-line
annotation (extension lines + end ticks, **deliberately no numeral** — so
it reads unambiguously as a diagram convention, never as an invented
business statistic). Communicates precision/measurement/craftsmanship
through a genuinely different visual language than an icon would, while
staying within the flat, single-accent, no-illustration constraints of
design-bible.md.

**Motion — the strongest "craftsmanship feeling" requirement:** draws in
four sequential stages (frame → ground → structure → dimension annotation)
via `pathLength={1}`/`strokeDasharray={1}` and four `animate-goqw-hero-
draw-{1..4}` classes, each a 400ms (`durationSlow`) stroke reveal with an
increasing baked-in delay (0/150/300/450ms) — reads as the detail being
drafted in sequence, not appearing at once. Fires once on mount
(`animation-fill-mode: both` holds the drawn state); never re-triggers,
never loops.

**Accessibility:** `aria-hidden="true"` on the whole SVG — purely
decorative, adds nothing a screen reader needs.

**Performance:** zero image requests — inline SVG only. With no
`backgroundImage` supplied (true for every page today), the Hero's LCP
candidate is the heading text itself, about as fast as that metric gets.

### tailwind.config.ts — new keyframes/animations

Added `goqw-fade-up` (Hero heading/subheading/CTA entrance: opacity 0→1 +
translateY 8px→0) and `goqw-draw` (the SVG stroke reveal), plus seven named
`animation` entries deriving their durations from the existing `motion`
tokens and baking in only the stagger delays specific to Hero's
choreography (`goqw-hero-heading`, `-subheading`, `-cta`, `-visual`,
`-draw-1` through `-draw-4`). This is the same mechanism `goqw-pulse`
(the skeleton pulse) already used — extended, not replaced — and is
required rather than optional given `react/forbid-dom-props`'s blanket
`style` ban: there was no other lint-compliant way to express a
stagger-delayed or dynamically-offset animation in this codebase.

**Reduced motion:** no special-casing needed — the existing global
`prefers-reduced-motion` override in `index.css` forces `animation-duration:
0.01ms !important` on every element under `#qw-root`, and a stylesheet
`!important` rule overrides even an element's own `animation` shorthand
duration. Confirmed this covers the new Hero animations without any
additional code.

### Verification

`pnpm typecheck` clean. `pnpm lint` — clean on the second pass (first pass
correctly caught the `style`-prop and `grid-cols-[...]` arbitrary-value
violations described above; both fixed, not suppressed). `pnpm test` —
**846/846 passed**, including the pre-existing `hero.test.ts` (unaffected —
it only asserts `HeroContent`'s type shape, which didn't change). `pnpm
build` clean (97.31 kB gzip, +0.43 kB — new SVG markup and keyframes, no
new dependency). Redeployed to the LocalWP site; confirmed via `curl` that
it serves the fresh bundle, and separately verified in the compiled CSS
output that every new utility (`stroke-primary`, `stroke-text`,
`stroke-border-strong`, `md:w-3/5`, `md:w-2/5`, all seven `goqw-hero-*`
animations) actually compiled — not just assumed from the source.

**No screenshot tool is available in this environment** — manual
verification steps provided in the chat response.

## Phase 4 — Design System Propagation + Interaction Polish

Before any section redesign (Services Preview next), a consistency pass
across every shared interaction primitive, so later sections inherit one
settled interaction language rather than each re-deriving it.

### Implemented: IconButton press feedback

Added `active:scale-95` (matching Button), `disabled:active:scale-100` to
suppress it while disabled. Its first real consumers are the Navbar's
hamburger trigger and the mobile menu's close button (Phase 2) — until
Phase 2, `IconButton` had zero call sites, so this carried no regression
risk.

### Implemented: Card press feedback

Added `active:bg-surface-sunken` to the `interactive` variant, alongside
the existing hover border-shift. **Deliberately not** `active:scale-95`
(Button/IconButton's mechanism) — a card is a content region, not a
discrete control; scaling multi-line content on press reads as jitter,
not a crisp press. A background-tint shift is the correct mechanism for a
card's different physical metaphor, while still giving the same
"acknowledged your press" confirmation Button/IconButton now provide.

### Full primitive interaction audit

Requested before Services Preview: every reusable primitive's complete
state model (default/hover/focus-visible/active/disabled/loading/keyboard/
touch-target), checked against the Design Bible, the Hero implementation,
the motion tokens, and accessibility rules.

**Button** — ✅ no gaps. All four variants (`primary`/`secondary`/`ghost`/
`destructive`) and three sizes (`sm`/`md`/`lg`) correctly use closed
tokens throughout; `duration-fast` hover, `active:scale-95` press,
`disabled:cursor-not-allowed` + reduced opacity, native keyboard
activation (real `<button>`), `lg` meets 44px. No "loading" state exists
by design — submission pending-state is handled by disabling the button
via the `disabled` prop, and `WizardShell` unmounts the button row
entirely once real submission begins (a pre-existing, already-correct
pattern — ADR-0012's no-spinners rule leaves no in-between "submitting…"
button state to design).

**IconButton** — ✅ no gaps after this phase's fix. `label` prop
structurally required (can't construct one without it — TypeScript
enforced), driving both `aria-label` and the paired `Tooltip` (shows on
hover **and** keyboard focus, per ADR-0012 §7). `sm`/`lg` sizes, `lg`
meets 44px. Native `<button>` keyboard activation. Now has the same
press feedback as Button.

**Card** — ✅ no gaps after this phase's fix. Confirmed it does **not**
behave like a button visually: no scale transform on the base card (only
the interactive variant's background tint), no shadow at rest or on
hover ever, single radius, no 3D/glow/gradient anywhere in the primitive.
No "selected" state exists — no current consumer needs one; not added
speculatively.

**Links** (`Link.tsx`/`SectionLink.tsx`) — ✅ no gaps, and no changes
needed. Both are deliberately unstyled behavioral wrappers — hover/focus/
active treatment is applied by the consumer's `className`, not the
component itself. Verified this is applied consistently everywhere a link
is used as a CTA: Hero and the Navbar's quote link both use
`buttonClassName`, confirming the "link-styled-as-button uses the shared
button system" rule is already followed, not just documented. Nav's
regular text links use the Phase 2 animated-underline treatment. No
`:visited` styling anywhere (correct — a quote/contact/service-navigation
site has no reason to distinguish visited links, and adding one would be
decoration without purpose).

**Form controls** — audited, **not modified**: these are wizard-critical
(`Input`, `SelectField`, `TextareaField`, `CheckboxGroupField`,
`RadioGroupField`, `ValidationMessage`), and per this phase's explicit
instruction to preserve wizard logic, any change here is a proposal
pending approval, not something to implement unilaterally alongside the
lower-risk primitives above. Two genuine (minor) inconsistencies found:

1. `Input`/`SelectField`/`TextareaField` use a bare `transition-colors`
   with no explicit duration class — this resolves to `durationBase`
   (250ms, the Tailwind `transitionDuration.DEFAULT`), while Button/
   IconButton/Card now explicitly reach for `duration-fast` (150ms) for
   their interaction feedback. A field's border-colour change on focus is
   conceptually the same "quick feedback" moment as a button's hover —
   worth aligning to `duration-fast` for consistency, but not yet done.
2. `Tooltip` has **no transition at all** — it shows/hides via
   conditional mount with no fade. Every other interactive primitive in
   this audit now has an explicit duration-based transition; Tooltip is
   the one exception.

Both are small, presentation-only, low-risk changes (a duration class
addition; an opacity fade on an existing conditional render) — but
`Input` and `Tooltip` sit in the wizard's direct path (every field in
every one of 12 wizard verticals; every icon-only control including the
Navbar's own trigger), so flagged for explicit approval rather than
changed alongside Button/IconButton/Card, consistent with this phase's
"do not alter wizard logic" instruction and the extra caution a
"critical conversion flow" warrants.

**CheckboxGroupField/RadioGroupField** — ✅ no gap. Native `<input
type="checkbox|radio">` with `accent-primary` (ties the native tick/dot
colour to the one accent token). No custom transition exists or is
needed — native form-control state changes are instant by browser
convention, and adding a custom transition here would be motion without
a confirmable purpose.

### Interaction token rule — confirmed, no violations found

Every class-based transition across all audited primitives resolves to
one of exactly three durations (150ms/250ms/400ms) and the one easing
curve — no arbitrary CSS transitions, no new timing values introduced.

### Motion rule — confirmed, no violations found

Zero inline `style` usage across any audited primitive. Zero dynamic
animation offsets outside Hero's named `goqw-hero-*`/`goqw-draw-*`
classes (documented in Phase 3). `prefers-reduced-motion` coverage is
global (`index.css`) and applies uniformly to every primitive audited
here — no primitive needs its own reduced-motion branch.

### Accessibility checklist — confirmed, no violations found

Keyboard navigation preserved throughout (native interactive elements
everywhere — `<button>`, `<a>`, `<input>`, `<select>` — no custom
keyboard handling to get wrong). Focus indicators visible via the global
`:focus-visible` rule, untouched by any primitive change this phase.
Touch targets: `Button`/`IconButton`'s `lg` meet 44px; `sm`/`md` remain
in wizard-only dense contexts, unchanged and out of scope. ARIA labels
preserved — `IconButton`'s required `label` prop structurally prevents
an unlabelled icon-only control from ever being constructed. Icon-only
controls have tooltips — confirmed still true after this phase's changes
(`IconButton` unconditionally pairs with `Tooltip`; no icon-only control
exists outside `IconButton` in the audited set).

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **846/846 passed**
(no wizard-facing files were touched, so no wizard test could regress —
confirmed, not assumed, by running the full suite anyway). `pnpm build`
clean. Redeployed to the LocalWP site; confirmed via `curl` it serves the
fresh bundle.

**Manual verification:** click/tap the Navbar's mobile hamburger and its
close button — both should show a brief scale-down on press, matching
the desktop nav CTA's own press feedback. On a page with a linked card
(once Services Preview exists), pressing the card should show a brief
background tint rather than any movement.

## Phase 4B — Form Control Interaction Consistency

The two findings flagged at the end of Phase 4's audit, approved and
implemented as presentation-only changes.

### Input / SelectField / TextareaField — timing alignment

**Change:** `transition-colors` → `transition-colors duration-fast` in all
three. Nothing else touched — same DOM structure, same props, same
`onChange`/`onBlur` wiring, same `aria-invalid`/`aria-describedby`/
`aria-required` attributes, same validation/error rendering via
`FieldGroup`/`ValidationMessage`. Verified by diff, not just intent: each
edit changed exactly one string literal per file.

**Why:** these previously resolved to the Tailwind `transitionDuration.
DEFAULT` (250ms, `durationBase`) implicitly. Button/IconButton/Card all
explicitly reach for `duration-fast` (150ms) for their interaction
feedback; a field's focus/error border-colour change is the same category
of "quick confirmation" moment, not a "base" one. All form controls now
share the same interaction timing as every other primitive.

**Preserved (explicitly verified, not assumed):** validation logic, form
state, event handlers, controlled-input behaviour, wizard step behaviour,
error handling, loading behaviour, all accessibility attributes — none of
these files' logic was touched, only one Tailwind class per file.

### Tooltip — appearance transition

**Change:** the tooltip `<span>` is now always mounted; visibility is an
`opacity-0`/`opacity-100` class toggle (`transition-opacity duration-fast`)
driven by the existing `open` boolean, instead of conditionally rendering
the element only while `open`. No new state was added — same `useState`,
same `show`/`hide`/`onKeyDown` callbacks, same `aria-describedby` logic
(still only set when `open`, so assistive tech is never told about a
hidden tooltip's content). No timers, no delays, no new dependency.

**Preserved:** trigger behaviour (hover/focus/blur/Escape all unchanged),
positioning (`side` prop, absolute placement — unchanged), ARIA
relationships (`role="tooltip"`, `aria-describedby` — unchanged), keyboard
support (Escape-to-dismiss — unchanged).

**Why this is safe despite `Tooltip` being used inside `IconButton`,
which the Navbar now depends on:** the change is purely how visibility is
_expressed_ (class toggle vs. mount toggle) — the _conditions_ under which
it's visible are byte-for-byte identical to before.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **846/846 passed**.
`pnpm build` clean. Redeployed to the LocalWP site; confirmed via `curl`
it serves the fresh bundle.

**Manual verification:** hover any icon-only control (e.g. the Navbar's
mobile menu trigger) — the tooltip should now fade in/out rather than pop;
tab to a form field on the Contact page or in the quote wizard and confirm
the border-colour focus change feels marginally snappier than before (150ms
vs. the previous implicit 250ms) — a subtle difference, not a dramatic one.

## Phase 5 — Services Preview

### Format decision: bordered cards (Option A), confirmed over two alternatives

Compared against an editorial numbered layout (Option B) and image-led
modules (Option C) on brand fit / conversion clarity / maintainability /
consistency with Hero / mobile behaviour. **Rejected B**: Process already
uses numbers for _sequential_ steps; reusing them for 6 non-sequential
services risked implying a false order. **Rejected C**: needs real
per-service photography, which doesn't exist — the same blocking
dependency identified for Hero's Option A, and introducing photos
immediately below a deliberately photo-free Hero would read as
inconsistent. **A confirmed**: continues the flat/hairline-border language
Hero already established, reuses the existing `Card` primitive outright,
and makes each service's clickability unambiguous.

### Card primitive usage

Raw inline card styling replaced with `Card interactive={Boolean(service.
link)}`. Whole card is the click target — `SectionLink` wraps `Card`
(`<a>`/routed `Link` containing a `<div>`, valid HTML, not a clickable
`<div>`), not the reverse, and not a `<button>` masquerading as a link.
A service with no `link` renders a plain, non-interactive `Card` rather
than defaulting to an arbitrary href — `Card`'s own `interactive` prop
already models exactly this on/off distinction.

**Spec-drift fixes** (found during Phase 4's-adjacent design review, fixed
here): card titles changed `font-semibold` → `font-medium` (design-
bible.md §9 reserves `semibold` for section-level headings only); the
"View all services" CTA changed from a filled `bg-primary` button to a
text link with an animated underline (a filled CTA here would visually
compete with the Hero's still-likely-visible primary action on first
scroll — exactly the "never two filled primaries in one viewport" rule).

### New primitive: `UnderlineLink` (`components/primitives/UnderlineLink.tsx`)

Extracted rather than hand-duplicated, since "View all services" is the
second place needing this exact treatment (Nav's links were the first,
Projects' "View more of our work" will likely be a third). Implemented as
a small component, not a bare class-name function like `buttonClassName`
— the underline animates independently of the text via its own `<span>`,
so one className string can't express the two-node structure. **Not**
used to refactor Nav.tsx in this pass — Nav's version additionally needs
`aria-current`-driven "permanently underlined while active" behaviour this
simpler hover/focus-only version doesn't handle; consolidating the two is
a reasonable follow-up, flagged rather than done here to keep this change
scoped to Services Preview.

### Motion: controlled stagger, extending `useScrollReveal`

Two `useScrollReveal` calls total (heading block, card grid as a whole) —
calling the hook once per card would violate the rules of hooks. Each
card's individual stagger comes from a new `staggerIndex` parameter on
`scrollRevealClassName`, backed by a new closed `transitionDelay` Tailwind
theme (`delay-0` through `delay-6`, 60ms increments, replacing Tailwind's
default delay scale entirely so `delay-1000` and similar don't exist) —
plain conditional `className`, no inline `style`, no arbitrary values.
Capped at 6 (this section has exactly 6 services today; the helper clamps
defensively if that ever grows).

**Reduced motion — a real gap found and closed, not just reasoned about:**
zeroing `transition-duration` alone (the existing global rule) would still
leave staggered items appearing _sequentially over time_, just snapping
instead of animating — itself a motion pattern a reduced-motion user is
opting out of. Extended the same global `@media (prefers-reduced-motion:
reduce)` block in `index.css` to also zero `transition-delay`, so every
staggered group now appears together, instantly. This fix is generic —
it covers any future use of the new delay classes, not just this section.

### Content — audited, not modified

Confirmed no incorrect destinations: all 6 services' `link` resolves to
`/quote`, a valid, working route — none are broken or dead. One
**enhancement opportunity, not a bug**, flagged for the record: none of
the 6 use the `?service={id}` deep-link built during the SEO phase, so
clicking a card lands on the full 12-service selector rather than
preselecting. Left unchanged — editing `home-page-content.ts` is a content
change outside this UI pass's scope. No service IDs, routes, or content
strings were touched.

### Accessibility

Whole-card links preserve semantic navigation (`SectionLink` resolves to a
real `<a>`/routed `Link`, not a `<div>` with a click handler), keyboard
focus (native anchor, tab-reachable), visible focus state (inherited
global `:focus-visible` ring, unchanged), and correct `href` behaviour
(internal paths use client-side routing via `SectionLink`'s existing
internal/external branching — unchanged). Icons remain `aria-hidden="true"`
(already baked into each icon component) — decorative, the card's own
heading text carries the meaning.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **846/846 passed**,
including the pre-existing `services-preview.test.ts` (unaffected by
design — it only asserts `ServicesPreviewContent`/`ICON_MAP`'s shape, not
rendering). `pnpm build` clean. Redeployed to the LocalWP site; confirmed
via `curl` it serves the fresh bundle, and confirmed in the compiled CSS
that all seven `delay-{0-6}` utilities actually generated with the correct
millisecond values.

**Manual verification checklist:**

1. Scroll to Services Preview on the home page — heading fades/lifts in
   first, then the 6 cards reveal in a left-to-right, top-to-bottom
   cascade (~60ms apart), not all at once.
2. Hover a card — border darkens; press it (mouse-down) — background
   tints briefly. Tab to a card — visible focus ring appears around the
   whole card, not just inner text.
3. Click/tap anywhere on a card (not just text) — navigates to `/quote`.
4. Enable "reduce motion" and reload — all 6 cards (and the heading)
   appear together immediately, no visible stagger or fade.
5. Confirm "View all services" now reads as a text link with an
   underline that draws in on hover, not a filled button.

## Phase 6 — Intro (implemented ahead of Process)

Resequenced ahead of Process — the whole-homepage review this phase opened
with found Intro was the actual visible seam (sitting untouched between
two now-redesigned sections), not Process.

### Whole-homepage findings that drove this phase (not just Intro-local)

- **CTA repetition across five sections**: Intro, Process, Projects, Why
  Choose Us, and FAQ all rendered an identical filled `bg-primary` button —
  a homepage-wide hierarchy problem invisible when reviewing one section
  at a time. Adopted a standing per-section CTA rule going forward: Hero
  (filled, the one "start here" moment) → Services Preview (text link,
  already correct) → Intro (text link) → Process (none) → Projects (text
  link) → Why Choose Us (none — Reviews/testimonials are the payload) →
  FAQ (filled, the deliberate closing bookend). Applied to Intro now;
  Process/Projects/Why Choose Us/FAQ get theirs when each is redesigned.
- **Projects** wraps every image in a border (`overflow-hidden rounded
border border-border`) — contradicts design-bible.md §9's "no border, no
  shadow around images." Flagged for its own phase, not fixed yet.
- **Why Choose Us** uses bordered cards, identical in spirit to Services
  Preview's pre-Phase-5 raw styling — contradicts §9's deliberate
  card-less differentiation from Services Preview. Flagged for its own
  phase, not fixed yet.

### Retroactive fix: Hero and Services Preview's spacing tokens

**Real finding, not a formality**: implementing Intro correctly (using the
Phase 1 macro-spacing tokens, `py-20`/`py-24`) exposed that neither Hero
nor Services Preview actually used them. Hero was still `py-16 lg:min-h-
screen lg:py-24` (the _original_ 64px step on mobile/tablet, only the
desktop step had been updated); Services Preview was flat `py-16` with no
responsive step at all. Both fixed now: Hero → `py-20 lg:min-h-screen
lg:py-24`; Services Preview → `py-20 lg:py-24`. The macro spacing
extension approved in Phase 1 had, in practice, never actually been used
anywhere until this phase — now it is, consistently, across all three
implemented sections.

### Intro — Direction B implemented

**Layout**: asymmetric two-zone (`md:w-2/3` narrative / `md:w-1/3`
credibility panel), deliberately a different ratio from Hero's `w-3/5`/
`w-2/5` — same rhyming _structure_ (asymmetric split, echoing rather than
repeating Hero), different _proportion_, so the two sections don't share a
silhouette. Panel divider is `border-l`/`border-t` (vertical on desktop
where columns sit side by side, horizontal on mobile where they stack) —
a genuine per-breakpoint design decision, not a naive shrink.

**Exactly one visual anchor**: the credibility panel (an inline SVG quote
glyph + the single strongest fact, "Merrist Wood trained landscape
gardener" — bulletPoints[0], not fabricated). The remaining checklist
items render in neutral (`text-subtle`) rather than accent colour,
specifically so the accent stays confined to the one anchor rather than
appearing in three places in the same section (panel glyph, checklist
ticks, CTA) — a deliberate tightening beyond what the original Intro spec
said explicitly, in service of "exactly one anchor per section."

**Both SVG icons are hand-built**, not from any component library —
consistent with Hero's `MeasuredDrawing` precedent (thin single-colour
line/path glyphs) rather than reaching for an icon package for two shapes.

**Content**: `bulletPoints[0]` feeds the panel; `bulletPoints.slice(1)`
feeds the checklist — avoids showing the exact same string twice on
screen. No content file changed; this is purely how the existing array is
consumed.

**Motion**: one `useScrollReveal` call on the section wrapper; narrative
and panel reveal via `scrollRevealClassName`'s existing stagger parameter
(indices 0 and 1) — no new motion mechanism, reusing Phase 5's addition
exactly as intended.

**CTA**: `UnderlineLink` (text, not filled) — per the new homepage-wide
CTA hierarchy above.

### Hero/Services Preview reviewed for other forced changes — none found

Checked both against Intro's new patterns (asymmetric layout, one-anchor
discipline, `UnderlineLink` reuse). No further changes needed: Hero's own
two-zone split and single SVG anchor were already correct; Services
Preview's cards already use hairline borders as their primary device
(no accent overuse to correct). The only real drift was the spacing
tokens above.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **846/846 passed**.
`pnpm build` clean. Redeployed to the LocalWP site; confirmed via `curl`
it serves the fresh bundle.

**Manual verification checklist:**

1. Scroll from Hero into Intro — confirm the section reads noticeably
   quieter/more spacious than both its neighbours (deliberate density
   alternation), not another dense grid.
2. Confirm Intro's two-column split has a visibly different proportion
   than Hero's (narrower right-hand panel), not a repeated 60/40 split.
3. Confirm only the credibility panel (quote glyph + featured fact) uses
   the accent colour — checklist ticks and the CTA text should read as
   neutral/primary-link-only, not an accent-saturated section.
4. Narrow below `768px` — confirm the panel's divider switches from a
   left vertical rule to a top horizontal rule as the columns stack.
5. Confirm Hero's and Services Preview's vertical padding now visibly
   matches (both should feel like the same rhythm, not one tighter than
   the other).

## Phase 7 — Process

### Retroactive fix: `spacing.10` was missing — `Button` md and `Input` height silently broken since before this overhaul

**Genuine finding, discovered while sizing Process's step-number circles**,
not invented to look thorough: chose `h-8 w-8` for the circles and, before
committing to that size, checked the compiled CSS for `h-10`/`w-10` (used
by `Button`'s `md` size and `Input`'s height) to confirm what was actually
available. Neither existed. `10` had never been in the spacing scale — not
added during this overhaul, not present before it either. `Button`'s `md`
buttons and every `Input`/`SelectField` in the quote wizard have been
rendering with **no explicit height at all** (falling back to intrinsic
content height) for as long as those classes have existed.

**Fixed by adding `spacing.10: '2.5rem'`** (40px = 10 × 4px, consistent
with every other key in the scale) — zero changes to `Button.tsx` or
`Input.tsx` themselves, since they already correctly referenced `h-10`/
`w-10`; they just needed the token to exist. This retroactively fixes both
primitives site-wide, including inside the quote wizard, without touching
wizard logic — a pure missing-value fix, not a design change.

**Not touched, and not the same issue**: `Card`, `IconButton`, `Button`'s
`sm`/`lg` sizes — all use keys that were already present (`8`, `11`, `12`)
and were never affected.

### Process — implemented as a connected sequence, not a card grid

**Weakness in the original implementation**: three parallel items in a
flex row with a number, a heading, and a description — visually just
"a 3-column grid without borders," which sits too close to Services
Preview's own grid silhouette one section later, undermining "every
section has a different silhouette."

**What changed**: desktop now shows a threaded rail above the content —
numbered circles connected by a horizontal line (`lg:w-1/3` cells, matching
the content row's own column widths so the rail's nodes align with their
corresponding step) — reinforcing "this happens in order," which a
left-to-right row of unconnected numbers doesn't actually communicate on
its own. Mobile **deliberately drops the connecting line** rather than
attempting a vertical version of it: top-to-bottom stacking already reads
as sequential without a drawn line, so adding one there would be motion/
decoration without a confirmable purpose, not a simplification worth
flagging as a compromise.

**Accessibility, reasoned through, not assumed**: every step-number circle
(both the mobile version and the desktop rail's) is `aria-hidden="true"`.
The `<ol>`/`<li>` structure and each step's heading text already carry the
sequence and its meaning to assistive tech — the numerals are decorative
reinforcement for sighted users, not the only source of that information.
This matters concretely because the mobile circle is `lg:hidden` (i.e.
`display:none` at desktop widths, which would otherwise remove it from the
accessibility tree) — marking it decorative from the start means that
transition never risks silently dropping real content.

**CTA**: `UnderlineLink`, matching the homepage-wide hierarchy (Process's
content has no `cta` today, so this doesn't currently render, but the
Layout is correct if one is ever added — no filled button was reintroduced).

**Motion**: two `useScrollReveal` calls (heading block, step list) — the
same two-call pattern as Intro and Services Preview, not a new mechanism.
Each step staggers via `scrollRevealClassName`'s existing `staggerIndex`
parameter (indices 1-3). The desktop rail itself has no independent
animation — it's `aria-hidden` and purely reinforces what the (animated)
content row already shows.

**No icons** — per design-bible.md §9's original Process direction,
numbers already carry the sequential meaning; adding icons on top would be
redundant decoration. Confirmed, not just left alone by default.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **846/846 passed**,
including `process.test.ts` (unaffected — content-shape assertions only).
`pnpm build` clean. Confirmed in the compiled CSS that `h-10`/`w-10` now
generate real declarations (`height:2.5rem`/`width:2.5rem`) where they
previously produced nothing. Redeployed to the LocalWP site; confirmed via
`curl` it serves the fresh bundle.

**Manual verification checklist:**

1. Desktop (≥1024px): confirm a thin horizontal line runs between the
   three numbered circles above the step text, and that each circle sits
   roughly above its corresponding step's heading.
2. Narrow below 1024px: confirm the rail disappears and each step shows
   its own circle beside its text, stacked vertically, no line.
3. Scroll to Process: heading fades in first, then the three steps reveal
   in sequence (~60/120ms apart), not all at once.
4. Anywhere in the wizard or on the Contact page, check a `md`-sized
   button or a text input — both should now visibly look slightly taller/
   more proportioned than before (the `h-10` fix), not collapsed to
   whatever their padding alone produced.
5. Enable reduced motion and reload — heading and all three steps appear
   together instantly, no stagger.

## Phase 8 — Projects

(Referred to as "Phase 7" in chat, matching the brief's own count — this
registry's numbering runs one ahead of that since Intro was inserted
before Process as its own phase.)

### Image treatment — the drift fixed

**Confirmed the exact violation**: every image was wrapped in `overflow-
hidden rounded border border-border` — a real border, contradicting
design-bible.md §9's "no border, no shadow around images — let the image
edge be the edge." Fixed: the wrapping `<li>` border/overflow is gone;
`rounded` moved onto the `<img>` itself (still the one radius token,
still clips the image correctly via `object-cover`, just without a
border framing it).

### A second, related finding: no consistent aspect ratio

**Not previously flagged, found while fixing the border**: neither the
image nor its container had any height constraint or `aspect-ratio` set —
`object-cover`/`h-full` on the `<img>` had nothing to size against, so
each image would have rendered at its own natural intrinsic size,
un-cropped. Design-bible.md §9 explicitly calls "consistent aspect ratio
across every image" critical — mismatched ratios in a photo grid read as
unfinished. Fixed with `aspect-video` (16:9, Tailwind's built-in ratio
utility, not an arbitrary value) applied to both the real `<img>` and the
"Image coming soon" fallback `<div>` — so a failed image load no longer
shrinks that grid cell to a fixed 48px while its siblings stay whatever
height their own images happened to be.

### A third, real bug: the caption's name was conditional on description

**Genuine defect, not a style preference**: the original JSX rendered the
project name only _inside_ the `{project.description && (...)}` block —
meaning a project with no description would show no caption at all, not
even its name. `ProjectItem.description` is optional; `name` is required
and should never depend on whether a description exists. Fixed: name now
always renders; description renders conditionally beneath it, independent
of each other. No current content triggers this (all 4 placeholder
entries in `work-content.ts` have a description), so this was latent, not
visibly broken today — still a real fix, not a hypothetical one.

### Content — kept, not trimmed to match the original spec

Design-bible.md §9 originally said "caption: project name only." The
actual approved content (`work-content.ts`) includes real, useful
descriptions for every entry (problem/solution-style, not filler) —
suppressing that content to match a spec written before that copy existed
would be discarding real content for no benefit. Kept both name and
description; noting the deviation here rather than silently diverging
from what I wrote earlier.

### Layout identity

Deliberately not rebuilt as a `Card`-based grid — Services Preview already
owns that bordered-tile silhouette. With the border removed, a grid of
plain, consistently-cropped photographs with a simple text caption reads
as a different category of content (evidence of real work) even though
the grid skeleton (3 columns, responsive) is structurally similar. No new
component was introduced for this — an explicit "avoid unnecessary
components" instruction, and the existing `ul`/`li` grid needed no
additional structure once the card chrome was removed.

### CTA and motion

CTA switched to `UnderlineLink` ("View more of our work"), matching the
homepage-wide hierarchy. Motion: the same two-`useScrollReveal`-call
pattern as Services Preview/Process (heading, then the grid with
per-item stagger via `scrollRevealClassName`'s existing `staggerIndex`) —
no new animation pattern introduced.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **846/846 passed**,
including `projects.test.ts` (unaffected — content-shape assertions only).
`pnpm build` clean. Confirmed in compiled CSS that `.aspect-video` compiled
correctly (`aspect-ratio: 16 / 9`). Redeployed to the LocalWP site;
confirmed via `curl` it serves the fresh bundle.

**Manual verification checklist:**

1. Confirm no border or drop shadow around any project image — just the
   rounded corner and the image content itself.
2. Confirm all 4 project images render at the same width-to-height
   proportion (16:9), not stretched or mismatched against each other.
3. Temporarily break an image URL (or throttle network to force an error)
   — confirm the "Image coming soon" placeholder occupies the same
   footprint as a real image, not a small 48px sliver.
4. Scroll to Projects — heading reveals first, then the 4 tiles stagger
   in left-to-right/top-to-bottom.
5. Confirm "View more of our work" now reads as an underlined text link,
   not a filled button.

## Phase 9 — Why Choose Us

(Referred to as "Phase 8" in chat — this registry's numbering runs one
ahead since Intro was inserted before Process as its own phase.)

### Card-grid violation — removed, confirmed against the actual code first

Verified before touching anything: the original implementation used
`<li className="rounded border border-border bg-surface p-6">` per value
prop — a real card, contradicting design-bible.md §9's original,
deliberate decision to keep this section card-less specifically so it
doesn't repeat Services Preview's silhouette. Removed. Value props now
render as a plain list (bold heading + muted description, no border, no
background, no icon or numeral marker).

**One deliberate deviation from design-bible.md §9's own text, flagged
rather than silently applied**: §9 said each value prop should have "a
small icon or numeral marker." This phase's brief explicitly says avoid
unnecessary icons and decorative UI. Given the choice, restraint won —
no marker at all, just typographic hierarchy. Design-bible.md's actual
governing thesis (§1: restraint _is_ the premium mechanism) supports this
reading over its own more specific §9 suggestion.

### Testimonials — real content added, not invented

**`WhyChooseUsContent` extended** with an optional `testimonials?:
Testimonial[]` field (`{ quote, author }`) — the content-shape change
`ui-overhaul-plan.md`'s sign-off item 5 already anticipated and approved.
**The two testimonials supplied earlier in this project (Graham Jones,
A Rickard) were never actually added to any content file until now** —
added verbatim to `home-page-content.ts`, with one flagged, deliberate
edit: each testimonial's closing pleasantry/signature line ("Thank you
very much for your hard work…", "With Thanks") was trimmed, on the
reasoning that a letter's sign-off isn't testimonial content any more than
"Sincerely," would be — not a rewording of anything that remained. No
quote, rating, name, or statistic was invented; both authors' names are
used exactly as given.

**Presentation**: `QuoteIcon` (extracted from Intro — see below) + quote
text + `— {author}` attribution, two testimonials side by side on
`md:` and up, stacked on mobile. Separated from the value-prop list above
by a hairline top divider (`border-t border-border-strong`), not a card
boundary — keeps the section fully card-free while still visually
distinguishing "trust statements" from "customer evidence."

**Google Reviews / EmbedSocial**: structural placement only — a code
comment marks where the widget will mount once that phase is separately
approved. No third-party script, no widget ID, no visible placeholder
box added (an empty placeholder box would look broken, not "prepared").

### Shared pattern extracted: `QuoteIcon`

**Moved from a local function inside `Intro/Layout.tsx` to `design/
icons.tsx`**, exported, and re-imported by both `Intro/Layout.tsx` and
`WhyChooseUs/Layout.tsx` — the exact "used a second time, extract it"
trigger. `CheckIcon` (Intro's checklist glyph) stays local — it's only
used once so far, and extracting it now would be premature.

### Motion

Three `useScrollReveal` calls (heading, value-prop list, testimonials
block) — the same established pattern, no new mechanism. Value props and
testimonials each stagger via `scrollRevealClassName`'s existing
`staggerIndex` parameter.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **849/849 passed**
(846 + 3 new: testimonials-optional, testimonial shape, multiple
testimonials — all pure type/content-shape assertions, this codebase's
established test pattern). `pnpm build` clean. Redeployed to the LocalWP
site; confirmed via `curl` it serves the fresh bundle, and confirmed
"Graham Jones"/"A Rickard" are actually present in the deployed JS bundle
(not just assumed from the source diff).

**Manual verification checklist:**

1. Confirm no card borders anywhere in Why Choose Us — value props should
   read as a plain list, not bordered tiles.
2. Confirm the two testimonials appear below the value props, separated
   by a thin horizontal rule, each with a small accent-coloured quote
   glyph, side by side on desktop and stacked on mobile.
3. Confirm testimonial text matches exactly what was supplied — no
   paraphrasing, no added claims.
4. Scroll through the section — heading reveals first, then value props
   stagger in, then testimonials stagger in as you reach them.
5. Confirm no filled button appears in this section at all (the `cta`
   field is currently unset in content, so no CTA should render here).

## Phase 10 — FAQ

(Referred to as "Phase 9" in chat — same one-ahead numbering offset noted
in the two previous entries.)

### Real finding: the accordion had no animation at all

**Confirmed by reading the code, not assumed**: `{isOpen && <dd>...}`
conditionally mounted/unmounted the answer — content popped in and out
instantly, no transition of any kind existed. This phase's explicit
"accordion transition using existing motion rules, 150/250/400ms timing"
requirement is what surfaced it as worth fixing, not a pre-existing
complaint.

**Fixed with the documented, deliberate exception**: `grid-template-rows:
0fr -> 1fr`, the technique design-bible.md §9's original FAQ direction
already anticipated by name for exactly this case ("a known exception to
'never animate layout properties'... mitigate by animating via
`grid-template-rows`"). Two new closed tokens added to `tailwind.config.ts`
(`grid-rows-accordion-collapsed`/`-expanded`, `0fr`/`1fr`) so the toggle is
a plain conditional `className`, never an arbitrary value or inline style.
`transition-all duration-base` drives it — the one deliberate, narrow
exception to "only animate opacity/transform" in this entire overhaul,
scoped to this single element, not a general licence to reach for
`transition-all` elsewhere. The answer `<dd>` is now always in the DOM
(never conditionally unmounted), which is also the more robust
accessibility posture — a screen reader user landing on it directly is
never surprised by content that only exists while `isOpen` is true.

**Added `aria-controls`/`id` linking** each question's button to its
answer panel — present in neither the original implementation nor
requested explicitly this phase, but a natural, low-risk completion of
the `aria-expanded` pattern already there.

**Not added**: a chevron icon replacing the `+`/`−` text glyphs. Per this
phase's "avoid unnecessary icons" instruction, the existing minimal text
toggle already communicates state clearly — introducing an icon here
would be exactly the kind of decoration to avoid, not an improvement.

### CTA — the one section (besides Hero) using the filled `Button` treatment

Per this phase's explicit instruction, confirming the homepage-wide
hierarchy established since Intro: FAQ's CTA uses `buttonClassName
('primary', 'lg')` via `SectionLink` — not `UnderlineLink`. This is the
deliberate closing bookend after every objection has been addressed, the
one legitimate exception to "restrained CTA everywhere after Hero."

### Motion

Two `useScrollReveal` calls (heading, the `<dl>` as one block) — no
per-item stagger. Design-bible.md's own motion table never listed FAQ
among the sections needing staggered reveal (only Services Preview, Why
Choose Us, Process); adding one here would be inventing a requirement
that was never specified, not filling a gap.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **849/849 passed**,
no regressions. `pnpm build` clean. Confirmed in compiled CSS that
`.grid-rows-accordion-collapsed`/`-expanded` generated the correct
`grid-template-rows: 0fr`/`1fr` declarations. Redeployed to the LocalWP
site; confirmed via `curl` it serves the fresh bundle.

**Manual verification checklist:**

1. Click a question — confirm the answer now animates open/closed
   (slides/grows into view over ~250ms), not an instant pop.
2. Tab to a question with the keyboard, press Enter/Space — confirm the
   same animated expand, `aria-expanded` flips, and focus stays visible
   on the button throughout.
3. Confirm the final CTA ("Get a free quote") is a filled, solid button —
   the only one on the homepage besides Hero's.
4. Enable reduced motion and reload — accordion expand/collapse should be
   instant, no visible animation, but still functionally correct.
5. Scroll to FAQ — heading reveals, then the whole question list fades in
   as one block (not staggered per question).

## Phase 11 — Service Landing Pages (ServiceHero + Intro variant fix)

(Referred to as "Phase 10" in chat — same one-ahead numbering offset noted
in previous entries.)

### New component: `ServiceHero`

A separate, shared component from the home page `Hero` — not a variant of
it. All 5 service landing pages' first section changed from `kind: 'hero'`
to a new `kind: 'service-hero'`, added to `SectionConfig`
(`site/sections/types.ts`) and dispatched in the one shared
`renderSection.tsx` switch, same pattern as every other section kind. The
home page's own Hero and its dormant `backgroundImage` prop
(`Hero/Layout.tsx`) are untouched — that prop remains a possible future
upgrade path for the home page itself, unrelated to this new component.

**Real design constraint, not the home page Hero's treatment:** per the
approved direction, service pages optimise for conversion and service
clarity rather than the home page's full-viewport editorial moment. A new
narrowly-scoped token was added to `tailwind.config.ts`'s `extend`:
`minHeight: { 'service-hero': '37.5rem' }` (600px) — `lg:min-h-service-hero`
replaces Hero's `lg:min-h-screen` on desktop only; mobile has no forced
minimum height at all, sized by content/padding exactly like every other
non-Hero section (`py-20`), so the image can never push the CTA below the
fold on a short viewport.

Full-bleed background photograph (`absolute inset-0 object-cover`,
`aria-hidden`) with a flat scrim (`bg-neutral-900/60`) — the same
token-compliant, non-gradient technique already established for
`MobileMenu`'s backdrop (`bg-neutral-900/50`), reused rather than inventing
a second overlay mechanism. Heading/subheading/CTA reuse Hero's exact type
scale, `buttonClassName` sizes, and `animate-goqw-hero-*` entrance-motion
classes (no new keyframes) so the two hero patterns still read as one
system — the image is the only intentional visual difference between
service pages, exactly as specified.

**Graceful degradation for missing photography:** on `<img onError>`, the
photo and scrim are replaced with a flat `bg-surface-sunken` panel (text
switches from `text-inverse` to `text-text`/`text-text-muted`) — the same
pattern `Projects` already established for its placeholder images. This is
load-bearing right now: no real stock photography has been supplied yet,
so all 5 `heroImage` paths (`/images/service-hero-{serviceId}.jpg`) are
placeholders that don't exist on disk, same convention as the pre-existing
`/images/placeholder-fence-1.jpg` references in `Projects`/
`home-page-content.ts`.

### Real finding (carried over from the Phase 10 design review, now fixed): Intro's featured-quote extraction was misapplied to service pages

`IntroLayout` previously always treated `bulletPoints[0]` as a "featured
credibility fact" for a separate quote-styled panel. Correct for the home
page's one Intro block (4 independent, equally-quotable trust facts) but
wrong for service pages' "what we help with"/"who we help" blocks, whose
`bulletPoints` are ordered, full-coverage checklists — promoting the first
item silently dropped it from the visible list (e.g. fencing's
"what-we-help-with" would have shown only 6 of 7 services). This was a
real content-loss bug, confirmed against the actual `bulletPoints` arrays
for all 5 pages before fixing, not inferred.

**Fixed** by adding a required `variant: 'credibility' | 'checklist'`
field to `IntroContent`, set explicitly per block (never inferred from
list length, which was the rejected alternative — list length isn't a
reliable signal for which treatment is correct). `'credibility'` keeps the
home page's exact existing behaviour unchanged. `'checklist'` renders the
full `bulletPoints` list in the main column with nothing promoted out. Home
page's one Intro block: `'credibility'`. All 20 service-page intro blocks
(4 per page × 5 pages): `'checklist'`.

**Second real finding, caught while implementing the fix:** the main
column's width was unconditionally `md:w-2/3`, even when no featured panel
rendered — meaning every prose-only "problem"/"intro" block on all 5
service pages (no `bulletPoints` at all) has been rendering with a dead
1/3-width empty gap on desktop since the SEO phase first wired
`ServiceLandingPage` into `renderSection`. Fixed by making the main column
`w-full` whenever there's no featured panel (`hasFeaturedPanel` — true only
when `variant === 'credibility'` AND a `bulletPoints[0]` exists), not just
for the new checklist variant.

### Data model

`heroImage`/`heroImageAlt` live inside `ServiceHeroContent`
(`site/sections/ServiceHero/types.ts`), the same place every other
section's content lives (`ProjectItem.imageUrl`, `HeroContent
.backgroundImage`) — a small, flagged deviation from the brief's example
sketch of a top-level field on `ServicePageEntry`, chosen so `ServiceHero`
doesn't need a second, differently-shaped data path from every other
section.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **856/856 passed** (up
from 849; 7 new tests: Intro variant shape test, `ServiceHeroContent` shape
tests ×2, and 4 new/updated `service-pages-content.test.ts` assertions
covering the `service-hero` kind rename, per-page `variant` coverage, the
checklist-blocks-keep-full-bullet-list check, and unique `heroImage` paths
across all 5 pages). `pnpm build` clean. Confirmed in compiled output:
`.min-h-service-hero{min-height:37.5rem}` and
`.bg-neutral-900\/60{background-color:#14171a99}` both generated correctly;
the fencing page's `service-hero-fencing` image path and heading text are
present in the built JS bundle. Redeployed to the LocalWP site (both the
repo's `plugins/quote-wizard/assets/dist` and the LocalWP copy — caught and
corrected a stale-build mixup mid-deploy, see below); confirmed via `curl`
that both the home page and `/services/fence-panel-repair-guildford`
return HTTP 200 and serve the new build hashes.

**Deployment finding:** the repo's own `plugins/quote-wizard/assets/dist`
had fallen out of sync with `apps/wizard/dist` from an earlier session (a
stale build, different content hashes) — an initial copy accidentally
propagated that stale repo copy to LocalWP instead of the fresh build.
Caught by diffing file timestamps/hashes between `apps/wizard/dist` and the
repo's plugin dist before trusting the deploy; corrected by resyncing the
repo's plugin dist from `apps/wizard/dist` first, then redeploying to
LocalWP from there.

**Manual verification checklist:**

1. Visit any service page (e.g. `/services/fence-panel-repair-guildford`)
   — confirm the hero shows the flat `bg-surface-sunken` fallback panel
   (no broken-image icon) since no real photo exists on disk yet; heading/
   subheading/CTAs still render clearly.
2. Confirm the service hero is visibly shorter than the home page's Hero
   (~600px vs. full viewport) and that the primary/secondary CTAs are
   visible without scrolling on a typical desktop viewport.
3. Scroll to the "what we help with"/"who we help" blocks — confirm every
   list item is visible (nothing promoted into a separate panel) and the
   text column spans the full width.
4. Confirm the home page's Intro section is visually unchanged — the
   credibility panel with the featured quote still renders exactly as
   before.
5. Resize to mobile width — service hero content stays compact and legible
   with no forced tall image area pushing the CTA down.

## Phase 12 — ServiceHero Asset Integration + Shared Inner-Page Templates

(Referred to as a continuation of "Phase 10" plus the start of "Phase 11" in
chat — same one-ahead numbering offset noted in previous entries.)

### Real photography wired in for all 5 ServiceHero images

The 5 placeholder `heroImage` paths are now real photographs, imported as
ES modules from `src/assets/images/service-hero-{serviceId}.{ext}` rather
than string literal absolute paths. This is a genuine convention change
from how `Projects`' placeholder images still work (`/images/placeholder-
fence-1.jpg`, a bare absolute path) — and the reason for the change is a
real, previously-latent deployment gap this phase surfaced: a bare
`/images/...` path can only resolve if a file physically exists at the
WordPress site's document root, which nothing in this project's build or
deploy pipeline ever produces. It was never going to resolve to a real
image in production. The ES-module-import approach instead lets Vite's
existing `assetFileNames: 'assets/[name].[hash][extname]'` rule (already
configured in `vite.config.ts`, previously unused) fingerprint and emit the
files, resolved correctly relative to wherever the compiled JS bundle
itself is deployed — verified by `curl`-fetching each image directly from
the LocalWP site at its final hashed URL under the plugin's own
`assets/dist/assets/` path (all 5 returned HTTP 200).

**Required one small, additive tsconfig change**: `"types": ["vite/client"]`
added to `tsconfig.json`'s `compilerOptions` so TypeScript recognises
`import x from './foo.jpg'` as a valid module returning a string URL — no
new dependency, ships inside the already-installed `vite` package.

`heroImageAlt` text was rewritten against the actual photographs (viewed
directly, not assumed from filename) so alt text describes only what's
verifiably shown — e.g. the painting photo shows a freshly painted room
with dust sheets and a step ladder, not specifically a high/vaulted
ceiling, so the alt text doesn't claim one; the plumbing photo shows a
wrench on boiler pipework, not a visible leak, so the alt text says
"pipework and a boiler," not "leak repair."

**Not fixed in this phase**: `Projects`' own placeholder image path
convention (still `/images/placeholder-*.jpg`, still unresolvable). No real
project photography was supplied to migrate it to the same import
convention, and inventing a stand-in would violate "never fabricate"
imagery. Recommendation for whenever real portfolio photos are supplied:
follow the same `src/assets/images/` ES-module-import convention
established here, not the old bare-path convention.

**Deliberately not optimised further**: one image (`service-hero-plumbing`,
~1.3MB) is heavy for a first-viewport hero. No compression tooling
(sharp, imagemin, etc.) was added — the existing image-handling approach
sitewide has never had a compression pipeline, and the brief explicitly
asked not to introduce new dependencies for this. Flagged as a genuine
follow-up recommendation: re-export that file at a smaller dimension/
quality before launch.

### Service landing page visual QA — no additional defects found

Re-audited all 5 service pages against the checklist (identical shared
structure, hero/scrim legibility, CTA hierarchy, no homepage-only styling
leakage, mobile behaviour) after the real images landed. Everything held
by construction of the shared `renderSection` architecture — confirmed via
the passing test suite, the compiled-CSS checks from the previous phase,
and a full `curl` sweep of all 5 service routes plus the 4 simple inner
pages (home, contact, privacy, our-work, services directory) returning
HTTP 200 on the freshest deployed build. No new findings beyond what
Phase 11 already fixed.

### Shared inner-page templates — real duplication found and extracted

Audited `ContactPage.tsx`, `PrivacyPolicyPage.tsx`, `OurWorkPage.tsx`, and
`ServicesPage.tsx` (the site's other, simpler inner pages — not part of the
section-library architecture) for the "consistent containers / rhythm /
typography / CTA hierarchy / reusable primitives" requirement. Found real,
concrete duplication, not stylistic preference:

- **New `PageContainer` primitive** (`components/primitives/PageContainer.tsx`):
  the exact string `mx-auto max-w-3xl px-6 py-12` was hand-duplicated
  identically across all 4 files. Extracted per this project's own "extract
  on second duplication" rule. Deliberately kept at `max-w-3xl`, narrower
  than the section library's `max-w-5xl` — these are single reading-column
  pages, not space-filling marketing sections, so the narrower prose
  measure is a correct, different treatment, not an inconsistency to
  reconcile away.
- **Non-standard h2 styling fixed**: `ContactPage` and `PrivacyPolicyPage`
  both used a bespoke `text-sm font-medium uppercase tracking-wide
text-text-muted` treatment for h2 headings found nowhere else in the
  codebase — every redesigned section uses `text-xl font-semibold
text-text` for its h2. Standardised both pages to the sitewide h2 style
  so heading hierarchy reads consistently across the whole product, not
  just within the section library.
- **Duplicated hand-rolled CTA button markup fixed**: `ContactPage` and
  `ServicesPage` both hand-rolled an identical, non-token button recipe
  (`rounded border border-primary bg-primary px-4 py-2 text-text-inverse`)
  instead of the established `buttonClassName('primary', 'lg')` helper
  already used by every other CTA on the site (Hero, ServiceHero, FAQ, Nav,
  MobileMenu). Both switched to `buttonClassName`.
- **`OurWorkPage`'s hand-rolled bordered list item fixed**: `rounded border
border-border bg-surface p-6` is exactly the `Card` primitive's own
  recipe, duplicated by hand instead of reused. Each `<li>` now wraps a
  `Card`.
- **Considered and rejected**: reusing `UnderlineLink` for `ServicesPage`'s
  inline heading link. `UnderlineLink` is sized and coloured for a
  standalone `text-sm` CTA (e.g. "View all services"), not for text living
  inside an `h2` — forcing it in would shrink and recolour the heading.
  Left as a plain `underline hover:no-underline` anchor; not every text
  link is the same primitive just because both are links.

### Google Reviews / EmbedSocial — still gated, no live integration

No script, widget ID, or embed snippet has been supplied. Per the explicit
instruction not to wire up third-party code without real details, nothing
was added beyond what already existed: `WhyChooseUsLayout`'s structural
mount point (a comment marking exactly where the widget will render,
directly below the testimonials block, inside the same section — added
during the Why Choose Us phase). No fake review component, no invented
widget markup. Remaining requirements before this can actually be
implemented: the EmbedSocial widget reference/script snippet, confirmation
of the async/defer loading approach (to avoid blocking render), and a
decision on whether the script should load unconditionally or be deferred
until the section scrolls into view (performance/privacy consideration —
EmbedSocial's script and iframe are a third-party network request with
attendant privacy/GDPR notice implications for a UK site).

### Verification

`pnpm typecheck` / `pnpm lint` clean (including confirming zero
`eslint-disable` comments anywhere in `src/`, zero `style={` usage, zero
arbitrary bracket-value classes, zero raw hex colours in the touched
files). `pnpm test` — **856/856 passed**, no regressions (these simple
pages have no dedicated render tests, consistent with this codebase's
established test strategy). `pnpm build` clean; confirmed all 5 real
images emit with content hashes and are referenced correctly in the
compiled JS. Redeployed to LocalWP; `curl`-verified all 5 service routes,
the home page, and all 4 simple inner pages (`/contact`, `/privacy`,
`/our-work`, `/services`) return HTTP 200 on the fresh build hash, and all
5 hero images are directly fetchable at their final deployed URLs.

**Manual verification checklist:**

1. Visit each of the 5 service pages — confirm the real photograph now
   shows (no fallback panel) with legible white heading/subheading text
   over the scrim.
2. Visit `/contact`, `/privacy`, `/our-work`, `/services` — confirm
   consistent container width, consistent h2 styling, and that CTA buttons
   look identical to the ones used across the home page and service pages.
3. Resize each service page to mobile width — confirm the photograph
   supports rather than overwhelms the heading/CTA, matching the ~600px
   desktop / content-driven mobile height rule.
4. Tab through `/contact`'s CTA and `/services`' service links — confirm
   visible focus states throughout.

## Phase 13 — Runtime Branding & Production Configuration

Follows directly from the rendering architecture audit (`docs/rendering-architecture-audit.md`), which found the redesign's code was correct and fully live, but several runtime data sources were still unconfigured template defaults. This phase closes that gap. No section, primitive, or layout was redesigned or touched.

### Real finding: Vite's default `base` broke every JS-imported asset in production

The single most consequential fix this phase. `apps/wizard/vite.config.ts` had no `base` configured, so Vite defaulted to `base: '/'` — meaning any asset referenced via a JS `import` (the 5 ServiceHero photographs, the self-hosted Inter font) compiled to a **root-relative** URL, e.g. `/assets/service-hero-fencing.hash.webp`. Confirmed by extracting the literal string from the compiled bundle and `curl`-testing it directly against the live site: HTTP 404, because the plugin's assets are served from `/wp-content/plugins/quote-wizard/assets/dist/`, never from the domain root. This exactly explains "hero images don't appear, only the fallback" — the `<img>` element was present, the `src` was well-formed, the browser genuinely tried to load it, and `ServiceHero`'s existing `onError` handler correctly caught the resulting 404 and fell back to the flat panel exactly as designed. The component logic was never at fault.

**Fixed** by setting `base: './'` in `vite.config.ts`. This changes Vite's compilation strategy for JS-imported assets from a fixed absolute path to `new URL('assets/foo.hash.ext', import.meta.url).href` — resolved _at runtime_ against the URL of the currently-executing script, which is correct regardless of what subdirectory WordPress serves the plugin from. Verified directly: the compiled JS now contains `new URL("assets/service-hero-fencing.BS1lLCiD.webp", import.meta.url).href`, and the computed URL (`.../wp-content/plugins/quote-wizard/assets/dist/assets/service-hero-fencing.BS1lLCiD.webp`) returns HTTP 200 on the live site. The same fix also corrected the self-hosted Inter font, which was silently 404ing for the same reason and falling back to the system font stack the entire time — a second, previously-undiscovered instance of the identical bug, fixed by the same one-line change.

This does **not** affect `wizard.js`/`wizard.css` themselves, which were never affected by this bug — those are resolved dynamically and correctly by PHP (`ManifestReader::asset_url()` + `GOQW_PLUGIN_URL`), independent of Vite's `base` setting.

### Real finding: a WordPress-side SEO title bug, found while investigating why service pages showed no custom title

`SEOMetaEmitter` passes `SiteRoutes::current_request_path()` (the raw request path) directly into `SEORouteContent::get_content()`. WordPress's pretty-permalink URLs always carry a trailing slash (e.g. `/services/fence-panel-repair-guildford/`), but `SEORouteContent::DEFAULTS`' array keys never have one. The exact-string `isset()` lookup silently failed for every route except `/` itself (which has no trailing slash to strip either way), so all 5 SEO service pages — which _do_ have correct, SCB-branded titles already defined in `DEFAULTS` — fell through to `null` and WordPress's own default title (bare site name) instead.

**Fixed** by normalizing the route via the existing `SiteRoutes::normalize()` inside `SEORouteContent::get_content()` itself, rather than at each call site — so no future caller can reintroduce the same bug by forgetting to normalize first. Added a regression test (`SEORouteContentTest.php`) asserting a trailing-slash path resolves identically to its normalized form. Full PHP suite (`vendor/bin/pest`) — 279 passed, 4 skipped (unrelated), no regressions.

### Runtime branding configuration — set, not hardcoded

Per the audit, the entire visual "still looks like the demo template" impression traced to `wp_options`, not to any component. Set directly via the WordPress database (the plugin's own designed customization surface — `Settings.php` reads these at runtime, exactly as architected):

| Option                           | Was                            | Now                                                                                      |
| -------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `goqw_primary_color`             | `#0F4C81` (template demo blue) | `#1C4A3D` (Pine — already the CSS-level fallback and design-bible-approved brand accent) |
| `goqw_business_name`             | `scb-handyman` (raw WP slug)   | `SCB Handyman`                                                                           |
| `goqw_business_phone`            | (empty)                        | `07776 066965`                                                                           |
| `goqw_business_address`          | (empty)                        | `Guildford, Surrey, UK`                                                                  |
| `goqw_business_hours`            | (empty)                        | `Mon–Fri: 9:00–17:00`                                                                    |
| `goqw_business_email`            | `dev-email@wpengine.local`     | `shane@scbhandyman.co.uk`                                                                |
| `goqw_agency_notification_email` | `dev-email@wpengine.local`     | `shane@scbhandyman.co.uk`                                                                |
| `goqw_business_service_area`     | (empty)                        | `Guildford, Surrey and surrounding areas`                                                |

Every value reuses copy already established and approved in `site-content.ts` (business name, phone, address, hours) — nothing was invented. `goqw_business_price_range` was deliberately left empty: no approved value exists for it, and it's an optional field in `LocalBusinessSchemaEmitter` (simply omitted from the JSON-LD schema when unset), so leaving it blank is correct, not an oversight.

Also set the 12 per-route SEO options (`goqw_seo_title_home`, `goqw_seo_description_home`, and the same pair for `services`, `our_work`, `contact`, `quote`, `privacy`) with real SCB-branded copy, following the exact workflow already documented in `docs/seo-adaptation-guide.md`. This is the architecturally correct fix — `SEORouteContent.php`'s `DEFAULTS` array (still "Acme Fencing") was deliberately **not** edited, since it's the reusable template's own generic fallback, read only when no per-client option is set; editing it would have meant hardcoding one client's content into shared template code, exactly what the options layer exists to avoid.

### Searched for remaining demo/placeholder content

Project-wide search for "Acme" and placeholder email patterns found no other production-facing occurrences — every other match is either a legitimate description of the template's own generic defaults (docs, ADRs, the `SEORouteContent.php` `DEFAULTS` array itself) or test fixtures/code-comment examples (`example.com` in format-validator tests and an API-shape comment), none of which are visible to a real visitor.

### `SiteRenderer.php` — evaluated, not removed

The rendering audit flagged this as a redundant `the_content`-filter implementation that never fires under normal operation, since `RenderingArchitecture.php`'s `template_include` hook always wins first and its `react-host.php` template never calls `the_content()`. Re-examined for removal this phase per the explicit instruction to remove it "only if... tests confirm no regression" and "do not remove working infrastructure unnecessarily."

**Decision: kept, not removed.** It is not true dead code — it is `RenderingArchitecture`'s own documented fallback path: if `templates/react-host.php` ever becomes unreadable (`filter_template_for_react_routes` explicitly checks `is_readable()` and logs a warning), WordPress falls through to the active theme's normal template, which _does_ call `the_content()` — at which point `SiteRenderer::filter_content()` becomes the only thing standing between a visitor and a completely blank content area (it injects the mount div **and** calls `AssetLoader::ensure_enqueued()`, producing a degraded-but-functional page: Kadence chrome wrapping a working wizard, rather than nothing at all). Removing it would trade a real, if rare, safety net for no functional benefit today. No code changed here.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **856/856 passed**. `vendor/bin/pest` (PHP) — **279 passed, 4 skipped**, including one new regression test for the SEO title trailing-slash fix. `pnpm build` clean; confirmed via compiled-bundle inspection that image/font URLs now use the `import.meta.url`-relative form. Deployed to LocalWP (JS/CSS/assets bundle **and** the updated `SEORouteContent.php` — the first branch of this whole project where a PHP source file needed redeploying alongside the JS build). `curl`-verified on the live site:

- Home page: `--goqw-primary: 28 74 61` (Pine, not the old blue), `businessName`/`businessPhone` correctly populated, `<title>` is the real SCB title.
- All 5 service pages: correct, distinct, SCB-branded `<title>` and meta description each.
- All 5 ServiceHero images: resolve at HTTP 200 at their real deployed URL (computed the same way the browser would via `import.meta.url`), not the old broken root-relative path.

**Manual verification checklist:**

1. Load the home page — buttons, links, and focus rings should now be a deep forest green (Pine), not blue.
2. Load each of the 5 service pages — each should show its real, distinct photograph in the hero, not the flat fallback panel.
3. View page source on any route — `<title>` should reflect real SCB Handyman content, never "Acme Fencing."
4. Check the browser's font rendering — body text should be Inter (self-hosted), not a system-font fallback.

## Phase 14 — Dark Premium Theme Refinement + Navigation + Hero Branding

Explicit client-directed visual refinement pass: move the section-library homepage/service-page sequence from light to a dark, photo-forward premium aesthetic; rebuild Hero around real photography instead of the `MeasuredDrawing` illustration; replace the navbar's text logo with the client's real logo image; fix a navbar scroll bug; restyle FAQ into the new system. All within the existing token architecture — no new theme, no WordPress/Kadence changes, no section-structure rewrites.

### New dark-surface token system

Full rationale and contrast verification lives in `docs/design-bible.md` §2 (new "Dark surface system" subsection) — not duplicated here. Summary: 4 new named colour tokens (`surface-dark`, `surface-dark-raised`, `surface-dark-elevated`, `border-inverse`, `text-inverse-muted`, `primary-inverse`), all either a named role for an existing neutral-scale step or (for `primary-inverse`) a lightened, contrast-verified tint of the one existing accent hue — never a second palette.

### Real, previously-undiscovered bug found while wiring dark text colours

`ServiceHero`'s heading/subheading used the literal classes `text-inverse`/`text-inverse/90`. Tailwind doubles a same-named colour key with its own utility prefix — exactly like this codebase's own pre-existing `text-text`, `border-border`, `border-border-strong` convention — so the actual generated class is `text-text-inverse`; bare `text-inverse` matches nothing. Confirmed by grepping the compiled CSS for both forms: `.text-text-inverse{...}` exists, `.text-inverse{...}` does not. This means `ServiceHero`'s heading has had **no colour utility applied at all** since Phase 10 — falling through to the browser/inherited default over a dark photo+scrim. Found only because this phase required writing several _new_ dark-text classes and cross-checking each one against the compiled output before trusting it. Fixed in `ServiceHero`; every new class written this phase was verified against the same rule from the start.

### Section-by-section dark tone application

Applied the tone sequence documented in the design bible across `Intro`, `ServicesPreview`, `Process`, `Projects`, `WhyChooseUs`, `FAQ`, and `Footer` (Footer's inclusion was inferred, not explicitly requested — a direct, necessary consequence of FAQ going dark, since leaving Footer light would put a jarring bright strip immediately after the new dark closing section).

- **`Card` primitive extended** with a `surface?: 'light' | 'dark'` prop (default `'light'` — every existing call site, e.g. Our Work, Contact, is byte-for-byte unaffected). `'dark'` uses `surface-dark-elevated`/`border-inverse`, used only by Services Preview's tiles.
- **`UnderlineLink` switched** from `text-primary`/`bg-primary` to `text-primary-inverse`/`bg-primary-inverse` unconditionally, not behind a new prop — every current call site (Intro, Services Preview, Process, Projects, Why Choose Us) is now on a dark surface, and Pine itself only reaches ~1.8:1 contrast against `neutral.900` as text, far below legible. If a future light-surfaced section needs this component again, it'll need a light/dark variant added at that time — none exists today because none is currently needed (no speculative prop added for a hypothetical case).
- **`Process`'s step-number circles and connecting line** (`border-primary`/`text-primary`/`bg-border-strong`) switched to `border-primary-inverse`/`text-primary-inverse`/`bg-border-inverse` for the same contrast reason.
- **`WhyChooseUs`'s testimonial `QuoteIcon`** switched to `text-primary-inverse` for the same reason.

### Hero rebuilt around real photography; `MeasuredDrawing` deleted

`Hero/Layout.tsx` fully rewritten: full-bleed photographic background (`absolute inset-0 object-cover`), flat `bg-neutral-900/70` scrim (one step darker than `ServiceHero`'s `/60`, reflecting Hero's role as the darkest section), replacing the two-zone headline-left/illustration-right layout. `Hero/MeasuredDrawing.tsx` deleted outright (confirmed zero remaining references — the only other hit was a historical doc-comment in `design/icons.tsx`, left as-is). `Hero/index.tsx` gained the same `useState`/`onError` image-fallback pattern already established by `ServiceHero`/`Projects` (falls back to a flat `bg-surface-dark` panel, not the deleted illustration, if the photo fails to load).

Still a separate component from `ServiceHero`, not merged — Hero keeps `lg:min-h-screen` (full-viewport, the one dramatic arrival moment); `ServiceHero` keeps its `~600px` cap. Text entrance motion (`animate-goqw-hero-heading/-subheading/-cta`) is unchanged; the background photograph itself is deliberately not animated, per the explicit "don't animate the image unnecessarily" instruction.

`home-page-content.ts` now supplies a real `backgroundImage`/`backgroundImageAlt`, reusing the already-integrated fencing garden photograph (`service-hero-fencing.webp`) rather than a new asset — the most broadly "premium home/garden" representative of the 5 supplied service photos, and consistent with fencing being the wizard's default vertical and SCB's founding trade. **Flagged tradeoff**: this is the same photo already used on the fencing service landing page — a visitor browsing both pages back to back would see it twice. Recommend the client supply a dedicated general-purpose hero photo if this duplication matters; not fixed here since no other asset was supplied for this purpose and inventing a stand-in would violate "never fabricate."

### Navbar logo

Replaced the text business-name link with the supplied logo image (`src/assets/images/logo-scb-handyman.png`, imported as an ES module — same Vite asset-pipeline convention established in Phase 11/13, no hardcoded filesystem path). Sized `h-10 w-auto` — matches the existing button/nav-content height already establishing the header's ~72px total height, so there's no layout shift. `alt` text is the real business name. Click-to-home, keyboard reachability, and focus visibility all come for free from the existing `Link` component — nothing bespoke needed.

**Real defect found in the supplied file, fixed with a CSS-only technique**: the PNG has a solid black background with no alpha channel (confirmed via the file's own PNG header — colour type 2, RGB, no transparency), and its own blue/navy colour scheme. Rendered as-is it would show as a black rectangle in the white header. Fixed with `mix-blend-screen` (a stock Tailwind utility, zero new dependencies): screen blend mode makes pure black contribute nothing against a solid white background, so the black reads as transparent while the lighter artwork stays visible. This is a neutralising workaround, not a true fix — flagged to the client that a transparent-background export of the logo is the correct long-term asset. The logo's own blue palette (vs. the site's Pine accent) is a separate, unresolved tension, also flagged, not resolved unilaterally — it's the client's real business mark, not a stylistic choice to override without being asked.

**Also flagged, not fixed**: the source file is 711KB, large for a ~40px-tall navbar mark. No compression tooling was added (matches this project's established "no new dependencies for image optimisation" position from Phase 11); recommend the client supply a smaller, ideally SVG or optimised transparent PNG, export.

### Navbar sticky scroll bug — root-caused, not patched

Investigated the exact reported symptom ("navbar moves slightly upward, only half remains visible at the top") against the actual layout: `SiteShell`'s flex wrapper, `Header`'s `sticky top-0` implementation, and `useHeaderScrollState`'s IntersectionObserver logic were all confirmed clean — no `overflow`/`transform` ancestor, no competing z-index, standard sticky usage. The symptom is the well-known WordPress admin-bar interaction: when a logged-in administrator views the front end, WordPress adds `body.admin-bar` and a fixed-position 32px (46px on narrow viewports) toolbar at true viewport y=0 with a very high z-index — a `position: sticky; top: 0` header still sticks to that same y=0, which sits _underneath_ the toolbar, so the toolbar visually occludes roughly the header's top half once it reaches the sticky boundary. Anonymous visitors never see this (no admin bar); any logged-in admin testing the live site does — almost certainly the actual testing scenario here.

**Fixed at the root cause**: added `id="site-header"` to the header (a plain lookup hook, not a style hook) and a `body.admin-bar #site-header { top: 32px }` rule (46px under `max-width: 782px`) in `styles/index.css` — the same offset-compensation approach WordPress's own admin-bar stylesheet uses for other fixed-position elements. Not a z-index workaround (which would only hide the conflict, not resolve the positioning), and not implemented as a Tailwind arbitrary-value class — a hand-written CSS rule conditional on a WordPress-controlled body class, which Tailwind utilities can't express, following the same precedent as the existing `prefers-reduced-motion` global override.

### A second, unrelated inconsistency fixed while in this file

`#qw-root :focus-visible`'s outline colour fallback (`rgb(var(--goqw-primary, 15 76 129))`) still hardcoded the old template demo blue, never updated to Pine (`28 74 61`) despite `tokens.ts`'s `accentCssExpression` fallback being corrected back in Phase 11/13. Both fallbacks only ever matter if `--goqw-primary` is somehow unset, but having two different fallback values for the same CSS variable was a real, if minor, drift bug. Fixed to match.

### Audit for remaining template styling

Re-swept all touched sections for leftover light-mode classes (`bg-surface`, `text-text`, `border-border-strong`, bare `text-primary`, etc.) after the dark-tone pass — all clean. Re-checked project-wide for "Acme" and the old demo blue hex — no remaining production-facing occurrences beyond what Phase 13 already resolved (only test fixture strings and the reusable template's own intentionally-generic `SEORouteContent.php` defaults remain, both correct as documented previously).

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **856/856 passed**, no regressions (`HeroContent`'s type shape is unchanged, so `hero.test.ts` needed no updates despite the full `Layout.tsx`/`index.tsx` rewrite). `pnpm build` clean; confirmed in compiled output: `.bg-surface-dark{...}`, `.bg-surface-dark-raised{...}`, `.bg-surface-dark-elevated{...}`, `.text-primary-inverse{color:rgb(100 196 169 ...)}`, `.mix-blend-screen{mix-blend-mode:screen}`, and both `body.admin-bar #site-header` rules all present with the expected values. Redeployed to LocalWP; `curl`-verified the homepage returns the fresh build hash, and both the logo and the home Hero's background image resolve at HTTP 200 at their real `import.meta.url`-relative computed paths (same verification technique established in Phase 13).

**Manual verification checklist:**

1. Load the homepage — Hero should now show a full-bleed photograph with a dark scrim behind the heading/subheading/CTAs, not the technical line drawing.
2. Scroll down — each section (Intro, Services Preview, Process, Projects, Why Choose Us, FAQ, Footer) should show a visibly distinct but harmonious dark tone, alternating rather than repeating consecutively.
3. Confirm the navbar shows the real SCB Handyman logo image, sized consistently with the existing header height, with no layout shift on load.
4. While logged into `wp-admin` in the same browser, scroll the front end — the header should now stay fully visible below the admin toolbar, not clipped.
5. Confirm Services Preview's cards read as distinct, slightly raised panels against their section background, not floating white rectangles.
6. Enable reduced motion — Hero's photo should always have been static (no animation to disable); text entrance should still respect the existing global reduced-motion override.
7. Tab through Services Preview's cards, Process's (now dark) content, and the FAQ accordion — confirm focus rings remain visible against the dark backgrounds.

**Remaining recommendations for the client** (not implemented, flagged only): supply a transparent-background export of the logo; consider a dedicated general-purpose Hero photograph distinct from the fencing service page's; consider compressing the logo file and the plumbing service-hero photo, both large for their display size.

## Phase 15 — Final Dark Theme Consistency Pass

Client-reported consistency bugs after Phase 14: navbar still white, a white line above the footer, FAQ "still blue," and inner pages (Services/Contact/Our Work/Privacy) still white. Investigated each against actual code and the live deployed state before changing anything, per the explicit "find the actual source of each remaining old colour, don't assume" instruction.

### Real, confirmed root cause: `SiteShell`'s wrapper was never updated in Phase 14

`SiteShell.tsx` — the one shared layout wrapping every route — was still `<div className="flex min-h-screen flex-col bg-surface">`. This single miss explains two of the four reported bugs at once:

- **"White line above the footer"**: `Footer`'s own `mt-12` margin-top sits _outside_ its border/background, so the gap between the end of `<main>` and the start of `Footer`'s own box showed whatever was behind both — `SiteShell`'s still-white wrapper.
- **"Inner pages still white"**: `ContactPage`/`ServicesPage`/`OurWorkPage`/`PrivacyPolicyPage` render their content directly inside `PageContainer`, which has no background of its own by design (a pure layout primitive) — the _only_ thing ever behind their content was this same wrapper.

Fixed by changing exactly one class, `bg-surface` → `bg-surface-dark`, on `SiteShell`'s root div — resolves both symptoms without touching `PageContainer` or any individual page, per the explicit "fix the shared source" instruction.

### Navbar — confirmed real, was intentionally deferred in Phase 12/14, not a bug until now

Phase 12 left `Header`/`Nav`/`MobileMenu` light on purpose (documented at the time as "the brief hadn't asked for it yet"). This phase's explicit instruction supersedes that. Changed:

- `Header.tsx`: `bg-surface` → `bg-surface-dark`; scrolled-state border `border-border` → `border-border-inverse`.
- `Nav.tsx`: link text `text-text`/`text-text-muted` → `text-text-inverse`/`text-text-inverse-muted`; the active-link underline indicator `bg-primary` → `bg-primary-inverse` (Pine itself is ~1.8:1 against `neutral.900` as a thin fill, the same reasoning already applied to `UnderlineLink`/`Process` in Phase 14).
- `MobileMenu.tsx`: drawer panel `bg-surface` → `bg-surface-dark`; nav items' active/inactive states moved to the `text-inverse`/`surface-dark-elevated` family; "Menu" label to `text-text-inverse-muted`.
- **`IconButton` extended** with a `surface?: 'light' | 'dark'` prop (default `'light'`, every other call site unaffected) for its two now-dark call sites (the hamburger trigger, the drawer's close button) — added as a typed prop rather than a `className` override because this primitive's own colour classes and an override would target the same CSS properties with nothing to resolve the conflict (this project deliberately has no `tailwind-merge`) — the same reasoning `Card`'s `surface` prop already established in Phase 14.
- `Tooltip` needed no change — confirmed it was already unconditionally dark (`bg-neutral-800`), a pre-existing, deliberate, page-theme-independent choice.

### FAQ — re-verified, found already correct; not a live bug

Re-read `FAQ/Layout.tsx` byte-for-byte against the Phase 14 registry entry: `bg-surface-dark-raised`, `text-text-inverse`/`text-text-inverse-muted`, `divide-border-inverse` are all already present and correct — no blue, no `bg-primary` outside the one legitimate filled CTA (Pine, not blue). Cross-checked the live deployed state independently: the deployed JS/CSS hash matches the last build, and `goqw_primary_color` in the database is still `#1C4A3D` (confirmed by direct query) — ruling out both a stale deployment and a reverted brand colour as explanations. No code change was needed or made to FAQ itself in this phase. Most likely explanation for the report: observed before the Phase 14 deploy had fully propagated to the browser being tested, or Pine's dark, desaturated green read as "blue" at a glance — flagged rather than silently assumed away.

### Inner pages — text and `Card` usage recoloured

With `SiteShell` now providing the dark background, each of the four simple inner pages needed its own text/`Card` colours updated to match (a mechanical recolour of already-established tokens, not a new per-page pattern):

- `ContactPage.tsx`: all headings/body text to `text-inverse`/`text-inverse-muted`; the email link `text-primary` → `text-primary-inverse`; the "Need an estimate?" `Card` → `surface="dark"`.
- `ServicesPage.tsx`: heading/description text to the `inverse` family.
- `OurWorkPage.tsx`: heading/description text to the `inverse` family; each project `Card` → `surface="dark"`.
- `PrivacyPolicyPage.tsx`: heading/section text to the `inverse` family.
- `QuotePage.tsx`: the one stray `text-text` in the misconfiguration fallback (`role="alert"`, shown only if the wizard can't resolve a service) → `text-text-inverse` — the only change made in this file. The wizard's own internals (`ServiceSelector`, `CategorySelector`, `WizardShell`, and everything inside them) were not touched; they remain the protected area they've always been.

### Logo — replaced with a genuinely transparent asset

The Phase 14 logo asset (colour type 2/RGB, no alpha) is superseded by a new supplied file confirmed to have a real alpha channel (colour type 6/RGBA) via the same PNG-header check used to diagnose the previous one. `mix-blend-screen` — which solved a black-background problem this new file doesn't have — is removed. **New finding**: the logo's own dark-navy wordmark has poor contrast directly against the now-dark header (a colour clash, separate from the transparency problem already solved) — addressed with a small `rounded bg-surface px-3 py-1` chip sized to the logo only, not a reintroduction of a white header; flagged to the client rather than silently accepted or unilaterally recoloured, since it's their real business mark.

### Broader blue/light audit

Searched for `#0F4C81` and bare light-mode class strings across `site/` and `components/primitives/`. Found and fixed one additional drift: `config-loader.ts`'s `DEFAULT_CONFIG.primaryColor` (the safe fallback used if `window.GOQW_CONFIG` is ever missing or malformed in production) was still `#0F4C81`; updated to `#1C4A3D` to match. Deliberately **not** changed: `apps/wizard/index.html`'s dev-only placeholder and `Settings.php`'s PHP-side option-default fallback — both are an intentionally generic, documented-as-linked dev/template fixture (`index.html`'s own comment: "Do not rely on this hex code for production styling"; the whole file's config block is placeholder data throughout — "Dev Site," `dev@example.test`, an outdated contract version — not just the colour), never served to a real visitor, and out of scope for a live-site consistency pass.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **856/856 passed**, no regressions. `pnpm build` clean; confirmed compiled CSS contains the new dark navbar/`IconButton` classes. Redeployed to LocalWP; `curl`-verified all 7 routes (home, contact, services, our-work, privacy, quote, and one service landing page) return HTTP 200 on the fresh build hash, and the new logo resolves at HTTP 200 at its real computed URL.

**Manual verification checklist:**

1. Load any page — header should be dark, matching the section system, with the logo legible on its small light chip.
2. Scroll to the footer on any page — no visible light-coloured seam between the last section/page content and the footer.
3. Visit `/contact`, `/services`, `/our-work`, `/privacy` — all should now read as the same dark site as the homepage, not a lighter "inner page" experience.
4. Open the mobile menu — drawer, links, and close button should all match the dark system.
5. Visit `/quote` — the wizard's own form UI is unchanged (protected); only the page chrome around it (header, and the rare misconfiguration fallback message) should reflect the dark theme.
6. Re-check the FAQ section specifically after this deploy to confirm whether the "still blue" report was a caching artifact — no source change was made there this phase since none was found necessary.

## Phase 16 — Hero Messaging, Premium Service Cards & Navbar Refinement

### 21st.dev component could not actually be retrieved — flagged, not silently substituted

The brief asked for `npx shadcn@latest add "https://21st.dev/r/ravikatiyar162/services-card"`, with an explicit instruction to inspect the real component before adapting it. Confirmed this is a hard blocker in this environment, not assumed: `21st whoami` reports not logged in; a direct fetch of the registry URL returns `{"error":"Authentication required"}`; `npx @21st-dev/cli add ravikatiyar162/services-card --print` resolves to a shadcn command referencing an unset `$API_KEY_21ST`; and `WebFetch` against the public page itself returns HTTP 403. No login flow is available in this non-interactive environment and no API key is configured. Rather than fabricate what that specific component contains, the Services Preview card refinement below is built from this project's own tokens, in the general spirit of that kind of "service card" pattern — flagged clearly as an original adaptation, not a port of that URL's real source. Recommendation: if the client wants that exact component, either supply a 21st.dev API key (`21st.dev/settings/api-keys`) or paste its source directly.

### Hero heading — the one approved copy change

`home-page-content.ts`'s Hero `heading` changed from `'SCB Handyman'` to the exact sentence supplied. Nothing else in the content object changed (subheading, CTAs, background image/alt untouched). Confirmed via the compiled bundle that the old string is fully gone and the new one appears exactly once. Service-page Hero (`ServiceHero`, a structurally separate component) and all 5 service pages' headings are untouched — confirmed via the same bundle grep.

**Typography adjustment** (explicitly permitted "only if required for readability"): the original short heading was sized for `text-2xl`/`max-w-2xl`. The new ~34-word sentence at that size would wrap to 6+ lines of large bold text, unbalancing the section. Dropped to `text-xl` (already an existing type-scale step — the same one section H2s use sitewide, not a new size) and widened the column to `max-w-3xl` (Tailwind's stock scale, already used elsewhere, e.g. `max-w-prose`/`max-w-5xl`). `ServiceHero`'s own `max-w-2xl` is untouched.

### Navbar surface — new `surface-nav` token

Added `surface-nav` (`#213231`) to `tokens.ts`/`tailwind.config.ts` — a Pine-tinted, deliberately-lighter-than-`surface-dark` tone for the header and mobile-menu drawer specifically (not reused from `surface-dark-raised`, which the section hierarchy already owns — see design-bible.md). `Header.tsx` and `MobileMenu.tsx`'s drawer panel switched from `bg-surface-dark` to `bg-surface-nav`.

**Logo chip removed**: per the explicit "adjust the navbar, not the logo" direction, the Phase 13 `bg-surface` chip around the logo is gone — the navbar's own lighter, tinted surface is now what's carrying the legibility requirement. Documented, accepted limitation (in both `tokens.ts` and the design bible): the logo's darkest navy strokes still only reach ~1.2:1 against this surface — verified by computing relative luminance for both, not assumed. Logotypes are WCAG-exempt from text contrast criteria, and the brief explicitly prioritised restraint ("do NOT return to white," "do NOT make it visually dominant") over maximising this specific pairing's contrast — a deliberate trade-off, not an oversight.

### Services Preview — premium card interior, in-house

Icon moved into a `bg-primary/10` circular badge (`h-11 w-11 rounded-full`); linked cards gained a small `aria-hidden` `ArrowIcon` (a new local SVG component in `ServicesPreview/Layout.tsx`, matching the existing per-file decorative-icon pattern already used by `Intro`'s `CheckIcon`/`Nav`'s `MenuIcon`) that translates right and switches to `text-primary-inverse` on `group-hover`/`group-focus-within`. No new copy — the arrow carries no text, matching "preserve all copy" for everything outside the one approved Hero heading change. Section heading, subheading, grid layout, `"View all services"` CTA, motion/stagger, routing, and whole-card click behaviour are all untouched.

**Genuine, unrelated lint bug found and fixed while verifying**: `pnpm lint` failed on the new Hero heading with "Gradients are banned" — the custom `GRADIENT_PATTERN` regex bare-matched `to-` as a substring, catching "to-do list" in the new copy. Root cause: `no-restricted-syntax`'s `Literal[value=/pattern/]` selector matches every string literal in every `.ts`/`.tsx` file, not just JSX `className` attributes, so a bare `from-|via-|to-` fragment (meant to catch Tailwind gradient colour-stop utilities) was always going to false-positive on ordinary prose containing those substrings (to-do, photo-, proto-, etc.) — this content file just happened to be the one that finally triggered it. Fixed by removing the three bare fragments from `GRADIENT_PATTERN`, keeping `bg-gradient-` and the three CSS gradient function names, which are unambiguous on their own. Not a coverage loss: this config's `tailwind.config.ts` never defines a `backgroundImage` theme key, so `bg-gradient-*` utilities don't exist to generate CSS from regardless — a bare `from-`/`via-`/`to-` fragment with no accompanying `bg-gradient-{dir}` base utility was always inert, gradient-wise, in this specific project.

### Verification

`pnpm typecheck` / `pnpm lint` clean (after the regex fix above). `pnpm test` — **856/856 passed**, no regressions. `pnpm build` clean; confirmed compiled CSS contains `.bg-surface-nav` at the correct RGB value and `.bg-primary\/10` at the correct opacity expression. Redeployed to LocalWP; `curl`-confirmed home, a service page, and `/contact` all return HTTP 200 on the fresh build hash, and confirmed via direct bundle grep that the old Hero heading string is gone, the new one appears exactly once, and the service page's own heading is untouched.

**Manual verification checklist:**

1. Load the homepage — confirm the new, longer Hero heading reads clearly at its adjusted size, CTAs and background photo unchanged.
2. Confirm the navbar reads as a dark, Pine-tinted surface — lighter than the sections below it, not white, not bright green.
3. Confirm the logo is more legible than Phase 13's near-black header, while acknowledging its darkest strokes remain low-contrast (documented, accepted trade-off).
4. Hover/focus a linked Services Preview card — confirm the icon badge and the arrow's rightward shift + colour change, and that the whole card is still the click target.
5. Visit a service landing page — confirm its Hero heading is unchanged and the shared navbar/logo/card refinements are visually consistent with the homepage.
6. Confirm Process, Projects, Why Choose Us, Intro, FAQ, Footer, the wizard, and all routing are visually and functionally identical to before this phase.

**Remaining recommendations for the client**: supply 21st.dev credentials (or the component's source directly) if the exact referenced card component is wanted rather than this in-house adaptation; consider whether the logo's contrast trade-off is acceptable long-term or whether a lighter/white-text export is worth commissioning.

## Phase 17 — Hero Messaging & Brand Presence Refinement

### Hero heading — the one approved copy change

`home-page-content.ts`'s Hero `heading` replaced with the exact new sentence supplied. Subheading, both CTA labels/destinations, background image/alt, section ordering, routing, and SEO all untouched — confirmed nothing else in the content object changed. Service-page Heroes (`ServiceHero`, a structurally separate component) are untouched; confirmed via bundle grep that the fencing page's own heading is still present unchanged.

### Headline becomes the homepage's focal point — new `3xl` type-scale step

`2xl` (30px) was already the largest existing step. Making the headline "noticeably larger... the first thing a visitor's eye is drawn to" without an arbitrary value meant the scale itself needed a genuine new step: `3xl` (2.5rem/40px, tokens.ts). Applied responsively — `text-2xl lg:text-3xl` — so mobile keeps a comfortable size and desktop gets the full display treatment. This is a real, closed, reusable type-scale addition (documented in design-bible.md), not a one-off inline size.

### Spacing hierarchy — a genuine inversion found and corrected

Read the existing spacing before touching it, per the audit-first instruction: heading→subheading was `mt-6` (24px) and subheading→CTA was `mt-10` (40px) — the CTA group was _more_ separated from its subheading than the subheading was from the headline it supports. Backwards from "headline, clearly separate supporting block, tightly-attached CTA." Corrected to `mt-10` (heading→subheading) and `mt-4` (subheading→CTA) — the larger gap now precedes the smaller one, matching the brief's explicit diagram. The subheading→CTA gap only ever shrank, never grew, per the "do not increase spacing below the supporting paragraph" constraint.

### Heading entrance — a second, narrow exception to the closed motion durations

`goqw-hero-heading`'s animation entry now hardcodes `600ms` instead of reusing `motion.durationSlow` (400ms) — the homepage's one focal headline animates in noticeably slower than the subheading/CTA, both unchanged. This is the same already-established exception mechanism Hero's entrance choreography already used (bespoke per-element delays baked into named `animation` strings, never part of the general `transitionDelay` scale) extended one step further to duration. `motion.durationSlow` itself is untouched everywhere else. Documented in design-bible.md as a narrow, one-entry exception, not a new general tier.

### Navbar logo — substantially larger

`Header.tsx`'s logo grew from `h-10` (40px) to `h-16` (64px, an existing spacing-scale step). `items-center` already handled vertical balance regardless of height, so no other alignment change was needed. **Consequential fix**: `useHeaderScrollState.ts`'s `IntersectionObserver` `rootMargin` (`-72px`, tuned to the old ~72px total header height) was updated to `-96px` to match the header's new ~96px height (16px padding + 64px logo + 16px padding) — otherwise the Hero-in-view detection driving the Nav CTA's primary/secondary swap would have started firing slightly early relative to where the Hero actually passes under the now-taller header. Found by tracing what actually depends on the header's height, not assumed.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **856/856 passed**, no regressions (confirmed no test asserts the specific heading text or the old `rootMargin` value before changing either). `pnpm build` clean; confirmed compiled CSS for `.text-3xl` (40px/1.15), `.h-16` (64px), and `.animate-goqw-hero-heading` (`.6s`, distinct from the subheading's `.4s`); confirmed via bundle grep the new heading text appears once and the service page's own heading is untouched. Redeployed to LocalWP; `curl`-confirmed home and a service page return HTTP 200 on the fresh build hash.

**Manual verification checklist:**

1. Load the homepage — confirm the headline is now clearly the largest, most prominent element, comfortable to read at every breakpoint.
2. Confirm the gap above the supporting paragraph is clearly larger than the gap between it and the CTA buttons.
3. Watch the Hero load — the headline should visibly settle in slower than the subheading/CTA, not simultaneously.
4. Confirm the navbar logo is substantially larger, crisp, and the navbar doesn't look cramped on mobile.
5. Scroll past the Hero — confirm the Nav CTA still flips from outline to filled at the right moment (verifying the `rootMargin` fix).
6. Visit a service landing page — confirm its Hero heading, and everything else, is unchanged.

## Phase 18 — Services Preview Card Consistency & Icon Refinement

### Real bug found and fixed: card heights were never actually equal

CSS Grid's `<li>` items already stretched to match their row's tallest sibling by default (`align-items: stretch`, unmodified) — but nothing inside them inherited that stretched height. `SectionLink` is `block` (fills width only), and `Card` has no height rule of its own, so each _visible_ card box sat at its own content height regardless of its `<li>`'s actual stretched height, leaving invisible, uneven gaps below shorter cards. Fixed by adding `h-full` to both the `SectionLink` wrapper and the `Card` instance in `ServicesPreview/Layout.tsx` — no grid change, no change to `Card`'s own default recipe (so every other `Card` call site, e.g. Our Work, Contact, is unaffected), confirmed via compiled CSS (`.h-full{height:100%}`) and by re-reading the actual grid/child structure before touching anything, per the audit-first instruction.

### Two icons replaced, verified by actually rendering them first

Read every existing icon file (`Fencing`, `Decking`, `Patio`, `Plumbing`, `GeneralRepairs`) to confirm the shared signature before designing replacements: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth={1.5}`, round caps/joins, `aria-hidden`, `className` passthrough — no filled shapes, no second visual family anywhere in the existing set.

Rather than hand-write SVG path coordinates blind (no way to visually confirm the result otherwise), installed a lightweight, one-shot SVG rasteriser (`npx resvg-cli`, used only as a local dev-time verification aid — not added to the project's own dependencies) and actually rendered each candidate to PNG before finalising, at both a large preview size and the icon's real ~20px render size (`h-5 w-5` inside the card's badge). This caught two real design mistakes before they shipped:

- A first hose concept (a coiled squiggle + a 3-line spray fan converging from one point) rendered as an ambiguous abstract shape and then, in a second attempt, as a **magic wand with sparkles** — the exact opposite of "clearly communicates pressure washing."
- The fix: a wand/lance line + two water-droplet outlines, which reads unambiguously at both sizes.
- The new painting icon (a diagonal handle wedge + a flared, rounded bristle tip touching down with a stroke mark) was checked the same way and read clearly as a paintbrush on the first attempt.

`JetwashIcon` and `GeneralRepairsIcon`'s sibling `PaintingIcon` are the only two files changed; the other 9 icons in the set (`Fencing`, `Decking`, `Patio`, `Driveway`, `Steps`, `GeneralRepairs`, `Plumbing`, `Electrical`, `Carpentry`) are untouched.

### Verification

`pnpm typecheck` / `pnpm lint` clean. `pnpm test` — **856/856 passed**, no regressions (confirmed no test asserts specific icon path data before changing either file). `pnpm build` clean; confirmed compiled CSS contains `.h-full{height:100%}` and the compiled JS contains both new icons' path data with zero remnants of the old jetwash path. Redeployed to LocalWP; `curl`-confirmed home and a service page return HTTP 200 on the fresh build hash.

**Manual verification checklist:**

1. Load the homepage Services Preview — confirm all 6 cards are now exactly the same height in every row, at desktop (3-col), tablet (2-col), and mobile (1-col) widths.
2. Confirm Pressure Washing shows the new wand-and-droplets icon and Painting & Decorating shows the new brush icon, both matching the stroke weight/size/monochrome treatment of the other four.
3. Hover/focus a card — confirm the border-shift, background-tint, and arrow-shift behaviour are all unchanged from before this phase.
4. Confirm the four untouched icons (Fencing, Decking, Patio, General Repairs) are pixel-identical to before.
