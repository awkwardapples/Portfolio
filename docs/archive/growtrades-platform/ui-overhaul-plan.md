# SCB Handyman — UI Overhaul Plan (Design Elevation Pass)

**Status:** Draft for sign-off — precedes Implementation Mode.
**Relationship to other documents:** `docs/design-bible.md` remains the
source of truth for every token, rule, and constraint. This document does
not replace it — it elevates the _ambition_ within it, and proposes a small,
enumerated set of amendments (never violations) where the current Bible is
genuinely too conservative for the brief's new bar. Every amendment here is
listed again in the sign-off section at the end, exactly like the Design
Bible's own §15 pattern — nothing below should be implemented by inference.

---

## 1. Global Experience Direction

### Visual personality

SCB Handyman should feel like **a craftsman who happens to have excellent
taste**, not a design agency who happens to do handyman work. The tension
we're solving: most local trade sites read as either (a) cheap and
DIY-built, or (b) an anonymous SaaS template with a fence photo dropped in.
Neither reads as _this specific business_. The personality we're building
toward:

- **Quietly confident**, not shouting. A business with 20 years of real
  work behind it doesn't need exclamation marks or gradient badges to prove
  it — the confidence shows in restraint.
- **Precise**, not decorated. Every visual choice should read as a decision,
  not a default.
- **Warm, not corporate.** The single biggest risk in "elevating" a trade
  site is drifting toward generic B2B SaaS polish. Warmth here comes from
  plain language, real photography (once available), and honest content —
  never from illustration style, mascots, or playful copy.

### Emotional response we want from a visitor

In order, in the first 5 seconds: **"this is a real, established business"**
→ **"they clearly know what they're doing"** → **"getting a quote looks
easy"**. Everything in this plan is in service of that sequence, in that
order. A visitor who feels delighted by a clever animation but isn't sure
the business is legitimate has had the wrong experience.

### Trust signals (the actual mechanism of "premium" here)

For a £200–£5,000-a-job local trade business, trust is the entire
conversion story — more than for a SaaS product, where curiosity alone can
drive a signup. Trust signals, in priority order:

1. **Evidence of real work** (Projects section, ideally photography —
   see §9).
2. **Specificity** (the SEO landing pages already do this well — "Fence
   Panel Repair & Replacement in Guildford," not "Quality Services").
3. **Third-party validation** (Google Reviews — see §10).
4. **Operational credibility** (established date, qualifications, service
   area — already in the content).
5. **Design quality itself** — a site that is precise and consistent
   subconsciously signals "this business pays attention to detail," which
   is exactly the quality being sold.

### Conversion strategy

One primary action exists on every page: get a quote. Everything else
(Call Now, browsing services, reading FAQs) either leads to that action or
removes a reason not to take it. The redesign's conversion job is to:

- Keep the primary CTA visually singular (Design Bible §10's "never two
  filled primary buttons in one viewport" rule, now applied navbar-wide too
  — see §6).
- Reduce hesitation via specificity and evidence (trust signals above),
  not via urgency tactics (no countdown timers, no "3 people viewing this
  now" — those are the "AI demo site" tells this brief also wants to avoid,
  and are dishonest for a business that doesn't actually have that
  information).
- Make the distance between "I'm interested" and "I've started a quote"
  feel short — this is a motion/interaction quality problem as much as a
  layout problem (see §8).

### Interaction philosophy

**Motion confirms, it doesn't perform.** Every animation in this system
should answer "what just happened, or what's about to happen" for the
user. A hover state confirms something is clickable. A scroll-reveal
confirms a new section has started. Motion that exists purely to look
impressive (parallax depth, cursor-follow, particle fields) fails this
test regardless of execution quality — this was correctly identified in
the prior audit and remains true here. The elevation in this pass comes
from **precision and consistency of the confirmable motion**, not from
adding motion that doesn't confirm anything.

---

## 2. Cohesive Design System Requirement

The failure mode this section exists to prevent: seven well-designed
sections that each individually look good but collectively look like seven
different Dribbble shots stitched together. The unifying mechanism is the
Design Bible's closed token system — but tokens alone don't guarantee
cohesion unless the same _patterns_ recur deliberately across surfaces.
This table is the cross-reference that makes cohesion checkable, not just
hoped for:

| Dimension                 | Single shared rule, applied everywhere                                                                                                                                                                                                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Spacing**               | One section-level rhythm (Design Bible §4's `20`/`24` tokens) for every section boundary, home page and service pages alike. One card-internal padding value, used by every card type (services, why-choose-us if cards are used, testimonial).                                                                                                                                |
| **Typography hierarchy**  | Exactly the six-step scale, same size→role mapping, on every page — a service landing page's H1 is the same size/weight as the home page's H1, never smaller "because it's a sub-page."                                                                                                                                                                                        |
| **Animation language**    | Every entrance uses the same three durations (see §8's amended timing) and the one easing curve, everywhere — nav, hero, cards, forms, reviews widget wrapper.                                                                                                                                                                                                                 |
| **Component patterns**    | One button component, one card pattern, one form-field pattern, one accordion pattern — reused, never re-invented per section. If Contact page needs a text input, it is visually and structurally the same component as the FAQ's... no, as the quote wizard's `Input` (already a Design Bible rule — repeated here as a cross-cutting one, not a Contact-page-specific one). |
| **Interaction behaviour** | Hover/focus/active states behave identically everywhere a given component type appears — a card hovers the same way in Services Preview and in a future testimonial grid.                                                                                                                                                                                                      |
| **Mobile experience**     | Every section's mobile layout is a designed reflow (stacked, same vertical rhythm), never a naive shrink — evaluated per-section in Implementation Mode, but governed by one shared rule: touch targets 44px, section padding drops to the mobile spacing step, never smaller text than `sm` for any body content.                                                             |

**Reviews/Testimonials and Forms** are included in this table even though
they aren't separate top-level sections (see §10 for why) — the point is
that wherever they appear, they inherit this same system, not a bespoke
one.

---

## 3. Design Bible Amendment Proposals

The brief explicitly invites finding where the Bible is "too restrictive."
Having gone through it section by section against this new ambition level,
here is the honest answer: **almost nowhere.** The Bible's restraint is not
a limitation to relax for "premium" — restraint _is_ the premium mechanism
here (this was the whole thesis of Design Bible §1, and nothing in this
brief's own "Not allowed" list — generic gradients, AI demo effects,
purposeless particles, excessive glassmorphism, random animations, visual
clutter — asks me to reconsider that thesis). What follows are the small,
genuine amendments this elevation pass does call for — deliberately kept
few, because inflating this list would be the same mistake as adopting
decorative components: doing something because we can, not because the
brief needs it.

### Amendment 1 — Motion timing (numeric adjustment only)

The Design Bible's existing tokens (`durationFast` 120ms, `durationBase`
180ms) are close to but not identical to this brief's specified triad
(150ms / 250ms / 400ms, max 600ms). Recommendation: **adopt the brief's
values as the canonical three durations**, replacing the close-but-slightly
different existing pair:

| Token          | Old value           | New value | Usage                                                           |
| -------------- | ------------------- | --------- | --------------------------------------------------------------- |
| `durationFast` | 120ms               | **150ms** | Hover, focus, button press feedback                             |
| `durationBase` | 180ms               | **250ms** | Standard transitions — accordion, nav state changes, card hover |
| `durationSlow` | _(proposed, unset)_ | **400ms** | Section entrance, scroll-reveal, hero load                      |

No new easing curve — `cubic-bezier(0.4, 0, 0.2, 1)` remains the only
curve in the system. Nothing animates longer than 400ms in practice; 600ms
is stated as a hard ceiling, never a target.

### Amendment 2 — "Environmental" hero imagery, narrowly scoped

The brief's "allowed" list includes "environmental backgrounds" and
"premium imagery." The Bible's existing Hero direction (§9) said no
full-bleed photo. The prior audit already resolved the _service-page_ hero
tension with a split-zone layout (image and text never overlap, so no
gradient scrim is ever needed) — this amendment formalizes that as the
approved pattern, and extends the same _option_ (not requirement) to the
home Hero if real photography becomes available (see §5, Direction A).
**Still not allowed under this amendment:** full-bleed background image
with text overlaid on top of it, at any opacity, with or without a scrim —
that specific pattern remains rejected regardless of image quality, because
the objection was never about the photo, it was about the layout collapsing
legibility and image into the same z-plane.

### Amendment 3 — One narrow allowance for "brand storytelling" motion

Scroll storytelling (the brief's term) is allowed **only** as sequenced
reveal of real content already in the page (e.g., a Projects section that
reveals each project as you scroll past it, or a before/after image pair
that cross-fades on scroll-into-view) — never as an invented narrative
structure requiring new copy/sections. This is not really a new allowance
so much as a clarification: the Bible's existing scroll-reveal rule (§7/§8)
already permits this; this amendment just names it explicitly so it isn't
second-guessed during implementation as "too plain."

### What is explicitly NOT being amended

Everything else stands exactly as written: no gradients, no glassmorphism,
no glow/neon, one accent colour, functional-only shadows, one radius, no
particles, no cursor-follow, no parallax, no magnetic buttons. The brief's
own "Not allowed" list (generic gradients, AI demo effects, purposeless
particles, excessive glassmorphism, random animations, visual clutter) is,
point for point, already what ADR-0012 and the Design Bible prohibit. There
is no daylight between "what this brief rejects" and "what the Bible
already rejected" — which is itself the strongest evidence that the
existing system doesn't need loosening to hit this brief's bar.

---

## 4. Hero Elevation Pass

Three genuinely distinct directions, evaluated honestly against what we
actually have available today (confirmed real content, no invented
photography or stats) versus what depends on an asset that doesn't exist
yet.

### Direction A — Craftsmanship + Photography

**Concept:** split-zone hero (per Amendment 2) — headline/CTA block on one
side, a single, real, high-quality photo of finished SCB work on the
other. No overlay, no text-on-image.

- **Brand fit:** the most direct expression of "craftsmanship" and "proof"
  — a visitor sees actual work in the first five seconds.
- **Conversion benefit:** photography of real work is the single highest-
  trust asset a trade business can show above the fold; likely the
  strongest conversion performer of the three _if_ the photo is genuinely
  good.
- **Technical approach:** static `<img>`, responsive `srcset`, explicit
  dimensions (zero CLS risk), lazy-loading not applicable since it's above
  the fold (should be priority-loaded as the likely LCP element instead).
- **Motion approach:** one-time fade+lift on load, same as text block,
  slightly staggered after the headline.
- **Accessibility:** descriptive `alt` text describing the specific work
  shown (not "hero image"); text block maintains full contrast since it
  never sits on the image.
- **Blocking dependency:** requires a genuinely strong, correctly-lit photo
  of SCB's own work — not stock photography (which reintroduces the
  generic-template problem this whole pass exists to solve). **Not yet
  confirmed available.**

### Direction B — Premium Editorial Layout

**Concept:** no photography at all. Pure typographic composition — large,
confident headline, generous whitespace, and a single restrained graphic
device (e.g., a subtle line-drawing composition built from the existing
service icon set, or simply an intentional asymmetric whitespace layout
with a single accent-coloured rule/marker) in the second zone instead of a
photo.

- **Brand fit:** the most literal "Linear/Stripe" translation — these
  references are themselves almost entirely typography-and-whitespace
  driven, not photography-driven, on their core marketing surfaces.
- **Conversion benefit:** slightly more restrained than Direction A, but
  zero risk of an off-brand or mediocre photo undermining the "premium"
  read — a bad photo hurts trust more than no photo.
- **Technical approach:** no image asset dependency at all; the graphic
  device is inline SVG (already the pattern used for service icons),
  trivial performance cost, no LCP risk.
- **Motion approach:** same fade+lift entrance; the graphic device can
  have one small additional touch — its individual line/shape elements
  drawing in sequence (SVG stroke-dashoffset animation, still
  opacity/transform-adjacent in spirit, still respects reduced-motion).
- **Accessibility:** simplest option — no photo means no risk of a
  decorative image being announced or an informative one being missed;
  the SVG device is marked `aria-hidden` (decorative).
- **Blocking dependency:** none. Fully buildable today with confirmed
  assets.

### Direction C — Modern Interactive Experience

**Concept:** typography-led like Direction B, but the second zone carries a
small, restrained interactive element: a slowly rotating trust-signal chip
cross-fading between 2–3 short, real proof points ("Established 2006,"
"Merrist Wood trained," "Fully insured") — not a photo, not a graphic
device, a small piece of _content_ given a moment of motion.

- **Brand fit:** directly serves "human connection" and "trust" from the
  brief without inventing anything — every proof point shown is already
  confirmed content, just given a moment in the spotlight (figuratively,
  not the Aceternity Spotlight effect).
- **Conversion benefit:** keeps a visitor's eye moving for an extra beat
  without asking them to do anything — a passive trust-building moment
  rather than a photo or static graphic.
- **Technical approach:** small local component state (which proof point
  is showing), CSS cross-fade only, no new dependency.
- **Motion approach:** 400ms cross-fade, one proof point every ~4 seconds,
  pauses entirely under `prefers-reduced-motion` (shows the first proof
  point statically rather than cycling) — this is the one direction where
  the reduced-motion behavior needs a deliberate fallback state, not just
  "instant instead of animated."
- **Accessibility:** the cycling text needs `aria-live="off"` or to be
  marked so screen readers aren't interrupted repeatedly — a real,
  non-trivial detail to get right, flagged here so it isn't missed in
  implementation.
- **Blocking dependency:** none — fully buildable today.

### Selected direction: **B now, A as the confirmed upgrade path**

Direction B (Premium Editorial) is the strongest choice _today_, for one
concrete reason: Directions A and C both compete for the same "second
zone," and A is strictly better than C if a good photo exists (real
craftsmanship evidence beats a rotating text chip), while B is strictly
safer than either if it doesn't. Rather than build C as a placeholder for
A, build B properly now — and the moment SCB supplies (or we source
through the business, never stock) a genuinely strong photo of finished
work, swap directly to Direction A using the same split-zone layout
structure. This avoids building and later discarding an interactive
component (C) purely as a stand-in.

**Recommendation, concretely:** build the Hero with Direction B's
typography/whitespace treatment now; keep the second-zone slot
structurally ready to receive a photo (same dimensions/position Direction A
would use) so the swap later is a content change, not a rebuild.

---

## 5. Navbar Elevation Pass

Beyond the audit's mobile-menu fix, a "premium navigation experience"
specifically means:

- **Scroll behaviour:** transparent-adjacent state at the very top of the
  page (page background shows through, no border) → solid `bg-surface` +
  `border-b border-border` once scrolled past roughly one viewport-height
  fraction (e.g. 24px of scroll). This is a state change (opacity/border),
  not a size change — the header does not shrink or grow, which would
  cause layout shift in content below it. Transition duration: the amended
  `durationBase` (250ms).
- **Active states:** keep the existing underline treatment (already
  correct — accent-coloured, `aria-current="page"`), but make the
  underline itself animate in (width 0→100%) the first time a page loads
  on that route, not just snap into place — a small, confirmable touch
  consistent with "motion confirms."
- **Transition states:** the mobile menu (open/close) is the main new
  transition surface — slide+fade in from the trigger, focus moves into
  the menu on open and returns to the trigger on close (full keyboard
  parity), backdrop is a **flat neutral scrim** (a plain semi-transparent
  `neutral-900` overlay, not a blurred one — opacity is not blur, this
  stays within the no-glassmorphism rule).
- **CTA prominence:** the primary CTA ("Get FREE instant estimate") gets a
  filled, accent button treatment _in the nav itself_ on desktop — this is
  the one place a second visible filled-primary-adjacent element is
  justified, since the nav CTA and a section's own CTA are rarely in the
  same viewport simultaneously (nav is fixed/sticky, so technically it's
  _always_ in viewport — meaning the Hero's primary CTA and the nav CTA
  **would** compete). Resolution: the nav's CTA uses the `secondary`
  (outline) button style while on the Hero (matching Design Bible §10's
  one-filled-button-per-viewport rule), and only switches to filled once
  scrolled past the Hero — a small scroll-driven style state, same
  mechanism as the background/border change above.
- **Trust perception:** business name treatment in the nav (currently
  plain text) gets slightly more typographic presence (the existing `lg`
  size, `medium` weight is fine — no logo exists yet, so this stays text-
  based; a wordmark/logo would be a content/brand asset decision outside
  this document's scope, flagged for awareness, not a blocker).

---

## 6. Component Library Process (elevation-specific notes)

The audit's per-section verdicts stand. Two additions specific to this
elevation pass:

- **Mobile menu:** shadcn's Sheet/Dialog primitive (Radix-based) is the
  right structural reference for the accessible open/close mechanics
  (focus trap, `Escape` to close, `aria-modal`) — reskinned to flat
  surfaces, no blur backdrop.
- **Reviews widget wrapper** (see §10): no component library involvement
  needed — this is a third-party embed wrapped in our own card/section
  chrome, not a UI-kit component.

The standing rule from the audit is unchanged: **"does a production-quality
pattern already exist that improves this?"** is answered per-component
during Implementation Mode, not pre-decided wholesale here.

---

## 7. Motion System (elevated, complete)

| Moment                                                                             | Duration | Property                                                    | Notes                                                                                                                |
| ---------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Page/Hero entrance                                                                 | 400ms    | opacity, translateY(8–12px)                                 | Staggered ~60ms between headline → subheading → CTAs                                                                 |
| Section scroll-reveal                                                              | 400ms    | opacity, translateY(8–12px)                                 | Fires once per section; 40–60ms stagger within a section's card grid, capped ~6 items                                |
| Button interaction (hover/press)                                                   | 150ms    | color, border-color, background-color; scale(0.98) on press | No property change beyond one per state                                                                              |
| Card interaction (hover)                                                           | 150ms    | border-color, background-color                              | Never shadow (Design Bible §5)                                                                                       |
| Navbar scroll state (background/border/CTA style)                                  | 250ms    | opacity, background-color, border-color                     | See §5                                                                                                               |
| Nav active-state underline                                                         | 250ms    | transform: scaleX                                           | Draws in once per route load                                                                                         |
| Mobile menu open/close                                                             | 250ms    | opacity, transform (translateY or scale)                    | `AnimatePresence`-style exit animation if `motion` is adopted (see below); otherwise CSS transition on unmount delay |
| Image transitions (e.g. Direction A hero swap-in, before/after cross-fade if used) | 400ms    | opacity                                                     | Never a wipe/slide on images — cross-fade only                                                                       |
| Scroll storytelling (Projects reveal)                                              | 400ms    | opacity, translateY                                         | Per Amendment 3 — sequenced reveal of real content only                                                              |

**Hard ceiling:** nothing in this system animates longer than 400ms in
practice; 600ms is the absolute rule-level maximum, intentionally never
approached.

### Motion library decision

Reconsidering the audit's "no new dependency" call against this brief's
explicit invitation to weigh it properly: the honest answer is **partial
adoption**, not all-or-nothing.

- **Native CSS + a small `IntersectionObserver` hook** remains correct for:
  entrance animations, hover states, scroll-reveal, button/card
  interaction — none of this needs a library; adding one for these would
  be dependency weight with no capability gain.
- **`motion`** (the modern, smaller successor to `framer-motion`) is
  justified specifically for: the mobile menu's **exit** animation
  (`AnimatePresence` solves "animate out before unmounting" in a way CSS
  alone handles awkwardly), and, if Direction A's photo swap or a future
  before/after comparison is built, coordinated cross-fade sequencing.
- **Import discipline:** use `motion`'s standalone `animate()`/`inView()`
  functions (the "mini" entry point, a few KB) rather than the full
  `motion/react` component API wherever the need is a simple
  trigger-and-animate, reserving `AnimatePresence` (heavier) only for the
  mobile menu's unmount case where it earns its weight. This keeps the
  bundle-size cost proportional to actual capability gained, which is the
  right test — not "avoid the library on principle."

All of the above respects `prefers-reduced-motion` — for CSS, the existing
global media-query kill-switch; for any `motion`-driven animation, an
explicit check (`useReducedMotion` or equivalent) that resolves instantly
rather than skipping the state change entirely (content must still appear/
the menu must still open, just without the animated transition).

---

## 8. Image & Visual Storytelling

Honest inventory of what exists today versus what this brief's ambition
assumes:

| Asset                                                      | Status                                        | Recommendation                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real project photography                                   | Not confirmed available (placeholders in use) | Needed for Direction A hero and a stronger Projects section. Flag to client as a concrete, high-value ask — likely the single highest-leverage asset for this entire redesign.                                                                                                              |
| Before/after pairs                                         | Not confirmed available                       | If SCB has any (common for fencing/decking/pressure-washing), a before/after cross-fade or slider (Aceternity's _Compare_ component is a reasonable structural reference, reskinned — flat border, no glow) is a strong trust device once real pairs exist. Not fabricated in the meantime. |
| Human presence (photo of Shane/team)                       | Not confirmed available                       | A small, real photo (not a stock "handyman" photo) alongside the Intro section's founder narrative would materially strengthen "human connection" — flagged as a recommendation, not assumed.                                                                                               |
| Testimonials (2 supplied earlier: Graham Jones, A Rickard) | Available                                     | See §9 — real, already-supplied content, should be used.                                                                                                                                                                                                                                    |
| Google Reviews                                             | Available via EmbedSocial once configured     | See §9.                                                                                                                                                                                                                                                                                     |

**Principle for all of the above:** every image/photo recommendation in
this plan is contingent on a real asset existing. Nothing here should be
implemented with a stand-in stock photo "for now" — a stock photo of an
anonymous tradesperson is precisely the generic-template signal this whole
effort exists to eliminate, and is worse than the current text-only Hero,
not better.

---

## 9. Testimonials & Google Reviews — placement, and a structural flag

**The structural tension, named plainly:** the brief asks for
Reviews/Testimonials as "first-class design elements" while also
reiterating, in the same message, that the 7-section order is fixed and
**no new sections may be added**. Those two instructions only resolve one
way: testimonials and the Google Reviews widget must live **inside** one of
the seven existing sections' content, not as an eighth section.

**Recommended placement: inside Why Choose Us.** That section's entire
purpose is "why this business over a competitor" — third-party validation
(reviews) and direct customer quotes (testimonials) are the most direct
possible evidence for exactly that claim, more so than in Intro (which is
narrative/about-us) or FAQ (which is objection-handling). Concretely: the
two supplied testimonials render as a small, flat, quote-styled block
(no card shadow, a large opening-quote glyph in the accent colour is the
one permitted decorative touch — typographic, not a gradient/image), and
the Google Reviews widget sits directly beneath them, both within Why
Choose Us's existing section boundary — same section-level padding, same
container width as everything else in that section.

**This requires one content-shape decision, flagged for approval, not
assumed:** `WhyChooseUsContent` (the existing type — heading, subheading?,
valueProps[], cta?) has no field for testimonials or an embed today.
Adding one is a small, additive type change (e.g. an optional
`testimonials` array and an optional `reviewsEmbed` config on that
content type) — presentational data, not business logic, but it is a
change to a shared content contract, so it's named here rather than
silently done.

**The real flag: EmbedSocial is not purely presentational.** Embedding a
third-party script:

1. Loads code from `embedsocial.com` on every page view — a genuine
   change to the "no third-party data leakage" posture (ADR-0007/ADR-0012)
   that every other decision in this system has been built to respect (the
   self-hosted font being the clearest existing example of that posture).
2. Almost certainly needs a **widget/account ID**, which is realistically
   a new WordPress option (the same low-footprint pattern as
   `goqw_webhook_url`) — a small, genuine touch to the WordPress
   integration surface this brief also says to preserve untouched.
3. Has its own cookie/tracking behaviour outside this project's control,
   which is worth a one-line mention in the privacy policy's "who we share
   data with" section (the same pattern already used for Make.com/
   Cloudflare Turnstile) rather than a silent omission.

**None of this blocks the design work** — the placement/styling/spacing
decision above stands regardless. But the actual _embedding_ (script tag,
widget ID plumbing, privacy policy line) is a distinct, small piece of
integration work that should be called out and approved on its own, not
bundled invisibly into "Why Choose Us gets restyled." Recommend treating
"Google Reviews integration" as its own step in the implementation order
(the brief's own list already puts it at step 13, near the end — this
plan agrees with that sequencing for exactly this reason: get the design
system right first, wire the one real third-party dependency in as a
deliberate, reviewed, final step).

---

## 10. Anti-Vibe-Coding Final Check (restated for this pass)

Unchanged from the Design Bible, repeated here because this document
introduces a genuine ambition increase and the checklist is the guardrail
against that ambition sliding into decoration:

- [ ] Does this look intentionally designed, or does it look like it
      arrived from a component library's demo page unchanged?
- [ ] Does this improve a Surrey homeowner's understanding of what SCB
      does and how to get a quote — or does it just look impressive?
- [ ] Does this increase trust through evidence (real work, real reviews,
      real specificity) rather than through visual polish alone?
- [ ] Does this improve conversion, or does it add a step/distraction
      between "interested" and "quote started"?
- [ ] Is this consistent with §2's cohesion table — same spacing,
      typography, motion, and component patterns as every other section?
- [ ] Would a senior product designer at Linear or Stripe approve this, or
      would they ask "why does this section move differently to the one
      above it"?
- [ ] Does this avoid looking like an Aceternity/21st.dev demo page —
      i.e., has every adopted component actually been re-skinned to our
      tokens, not just dropped in with its default theme?

---

## 11. Sign-off items — summary

Consolidated list of everything in this document that is a proposal, not
yet a decision, before Implementation Mode begins:

1. **Motion timing amendment** — 150ms / 250ms / 400ms replacing the
   Design Bible's 120ms/180ms (§3, Amendment 1).
2. **Hero direction** — build Direction B (Premium Editorial) now, with
   the layout structurally ready for a direct swap to Direction A once
   real project photography is supplied (§4).
3. **Navbar CTA behaviour** — outline style while Hero is in view, filled
   once scrolled past it, per the one-filled-button-per-viewport rule
   applied to a now-always-visible sticky nav (§5).
4. **Motion library** — adopt `motion`, scoped narrowly to the mobile
   menu's exit animation (and future image cross-fade needs), using its
   lightweight `animate()`/`inView()` entry points elsewhere rather than
   the full component API (§7).
5. **Testimonials/Reviews placement** — nested inside Why Choose Us
   (not a new section), requiring a small additive change to
   `WhyChooseUsContent`'s shape (§9).
6. **EmbedSocial as a distinct integration step** — third-party script +
   likely one new WordPress option (`goqw_google_reviews_widget_id`-style)
   - a one-line privacy policy addition, sequenced last (implementation
     step 13) and approved separately from the visual design work around it
     (§9).

Everything else in this document — the global direction, the cohesion
table, the elevated motion system's non-library items, the image/
storytelling recommendations, and the navbar's non-CTA behaviours — is
ready to implement once these six are confirmed.

---

_End of UI Overhaul Plan. On approval, Implementation Mode begins per the
brief's specified order (tokens → Navbar → Hero → Buttons → sections →
inner pages → Google Reviews → final polish), with `docs/component-
registry.md` initialized and updated after each area, exactly as
previously agreed._
