# ADR-0016: Site shell and reference pages

**Status:** Accepted
**Date:** 2026-06-01

## Context

After Step 4.7 the wizard is a fully functional multi-service quote engine,
but it has no host site — `App.tsx` mounts the selector and wizard directly.
For the template-repo workflow (ADR-0014), a clone needs a real website
structure: home page, services page, portfolio page, contact page, and a
dedicated quote page that embeds the wizard.

## Decision

A new `src/site/` directory contains the website shell and five reference
pages. The pages are **concrete React components, not schema-driven templates.**
Content is in TypeScript modules (`src/site/content/*.ts`) imported directly
by pages. A cloner adapts a client's site by editing those modules and the
page components, then deploying.

### Layering

- `src/site/layout/` — `SiteShell`, `Header`, `Nav`, `Footer`, `SkipLink`.
- `src/site/pages/` — `HomePage`, `ServicesPage`, `OurWorkPage`, `ContactPage`, `QuotePage`.
- `src/site/routing/` — `routes.ts` (static table), `Router.tsx` (pathname-prop),
  `Link.tsx` (anchor wrapper).
- `src/site/content/` — `site-content.ts`, `services-content.ts`, `work-content.ts`.

### Routing

Hand-rolled minimal router. Five static routes. No `react-router-dom`. Pages
declare their path and element factory in the static route table. The Router
reads the `pathname` prop (passed from `SiteApp`), matches against the table,
renders the matched page (or `HomePage` as fallback). Internal links use
`Link` which calls `history.pushState` and dispatches a `goqw:navigate` custom
event. `SiteApp` owns the pathname state and subscriptions; `Router` is a pure
function of `pathname`. Native `popstate` events (browser back/forward) work
unchanged.

Scroll resets to top on `pushState` navigations but not on `popstate`
navigations (browser handles scroll restoration on back/forward).

### Wizard embedding

The wizard lives on `/quote`. `QuotePage` contains the selection-and-wizard
composition that previously lived in `App.tsx` — moved without modification.
Service selection state is local to `QuotePage`'s mount, so navigating away
and back to `/quote` resets selection. Session draft persistence (4.2)
preserves wizard answers across remounts for a chosen service.

### Content

Plain TypeScript modules. No CMS, no schema engine, no content registry, no
frontmatter, no JSON. A cloner edits the relevant `.ts` file and commits.
Type-checking catches structural mistakes (missing required fields). Pages
import the typed const and render its fields.

### Theming

Continues through the existing `--goqw-primary` token and closed Tailwind
palette. No new theme system, no theme registry, no per-client variants
beyond the existing accent colour mechanism. A client requiring a
fundamentally different look forks the codebase deliberately.

### Mobile navigation

Horizontal scroll on viewports too narrow to fit all nav items. No hamburger
menu in 5.0 — that is a real component with focus-trap and ARIA work that
can be added when a client deployment requires it.

## Alternatives considered

- **React Router DOM.** Rejected. Five static routes; adding a dependency
  is the wrong trade-off. Hand-rolled router is ~50 lines, replaceable later.
- **Single-page wizard with sections** (no separate routes). Rejected: a
  real business site has separable pages, and a quote-only page produces
  worse SEO and worse mental model.
- **Wizard kept mounted across all routes** (visibility-toggled rather than
  remounted). Rejected: structurally complex, mixes router concerns with
  feature lifecycle, and the wizard's own session persistence handles draft
  restoration cleanly.
- **Schema-driven pages.** Rejected per ADR-0014: target is (b) reusable
  template, not (c) operator-editing platform.

## Consequences

**Easier:**

- A new client is a clone + edit content + edit pages + ship.
- The wizard's relationship to the site is now structural: a feature on a
  page, not the entire application.
- Adding a 6th page is one route table entry + one page component.

**Harder:**

- Hand-rolled router will need extension if route params, route guards, or
  scroll restoration become real requirements. Documented trigger.
- WordPress page mapping (how `/services`, `/our-work` etc. are served when
  the React app is embedded in WP) is a deployment question not addressed
  in this step. **Acceptance criterion: 5.0 ships a Vite-dev-server functional
  site. WP integration is a separate deployment step.**

## Status note

Implements the (b) "reusable template repository" direction from ADR-0014.
Closes the gap between "the wizard works" and "the wizard lives somewhere."
