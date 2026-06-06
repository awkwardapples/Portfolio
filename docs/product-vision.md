# Product Vision

**Last updated:** 2026-06-06 (during pre-5.3 planning)

This document captures the medium-term product vision for the Quote Wizard
template repository. It is **not** an implementation specification — it makes
no commitments to build anything. It records what the product is intended to
become, so each implementation step can be sanity-checked against the shape
of the longer-term goal.

If reality diverges from this document, update the document; do not pretend
the divergence isn't happening.

## Product summary

A **reusable template repository** for building lead-generation websites with
embedded quote wizards, targeted at trade and service businesses (handyman,
fencing, landscaping, paving, decking, electrical, plumbing, etc.).

The repository is forked-and-customized per client. Clients run independent
WordPress installations on their own hosting. The template is the source of
truth for shared structure; per-client adaptation happens by editing well-
defined variation points in the cloned repository.

**Anti-goals:** This is not a multi-tenant SaaS. It is not an operator-editing
CMS. It is not a hosted platform. Clients do not configure their sites at
runtime. Developers (or the project owner) clone, adapt, and deploy per client.

See ADR-0014 for the formal scope commitment.

## Sites the template must support

The first client is a London-area **handyman business** offering services
across multiple trades, including but not limited to:

- General garden maintenance
- Fencing, decking, sheds
- Paving and patios, driveways, steps
- Jetwash
- Artificial grass
- Natural grass (turf)
- General handyman services across trades (plumbing, electrical, carpentry, etc.)

Future clients will be other trade businesses with their own service catalogs.
The template must support arbitrary trade-business service combinations.

## Structural constants (every client site)

These are commitments the template enforces. Every client site has these
properties; they are not variation points.

- Five-route site structure: `/` (Home), `/services`, `/our-work`, `/contact`,
  `/quote`. Routes can be hidden per client if not wanted, but the underlying
  structure is the same.
- A primary navigation bar with the business logo at top-left and a "Get a Free
  Quote" CTA at top-right.
- The CTA links to `/quote`.
- The home page contains a short business description (e.g., "Trusted
  construction and handyman services in London and the south east") prominent
  near the top.
- The quote wizard is mounted on `/quote` (and optionally embedded on the
  landing page).
- The site uses the closed Tailwind design system established in Step 4.0
  (ADR-0012). All visual styling follows those constraints.
- Photo upload is supported in the wizard via the existing 4.8 capability.
- Submission flows through `qw/v1/submit` to Make.com (or a per-client
  equivalent if a client uses a different integration).

These structural constants are the template's promise. Every adaptation
preserves them.

## Variation points (per-client)

These are the surfaces a developer changes per client to make each site look
and feel distinct. The template provides the variation surface; clients do
not configure these at runtime.

### Content variation

- Business name, tagline, contact details, hours (in `site-content.ts`).
- Services list (in `services-content.ts`).
- Portfolio entries (in `work-content.ts`), including images. Should be
  easy to add to — the client may want to update portfolio photos over time.
- Wizard configuration: pricing, materials, options (in service-specific config
  files, registered via the vertical registry).
- Primary color (via `goqw_primary_color` option or equivalent).

### Visual variation (to be built in Step 5.6, see roadmap)

The template must support enough visual variation that two adjacent client
sites do not look like siblings. The intended variation surface:

- **Navbar styles:** white-with-black-text, black-with-white-text, transparent
  with no bar (buttons only), and combinations thereof.
- **Navbar layout:** buttons-left + CTA-right, buttons-center + CTA-top-right,
  buttons-right + CTA-right-adjacent. The CTA remains stylized consistently
  with the site theme (e.g., blue site → blue CTA).
- **Background system:** a subtle profession-relevant image with a color tint
  applied. Both image and tint configurable per client.
- **Landing page layout:** either (a) quote wizard form embedded directly on
  the home page, or (b) home page with a CTA button leading to `/quote`. Both
  valid; client chooses.
- **Optional widgets:** Google business reviews badge (optional, client's
  choice), call-now and email bar above the navbar (optional, client's choice).

### Service variation

- Which services the client offers (which verticals are present in the
  registry, which are removed).
- Per-service wizard configs (pricing, materials, options).
- Per-service photo upload steps (optional per service).

## Deferred capabilities (with triggers)

These are capabilities discussed during planning but deliberately not built
yet. See `docs/technical-debt.md` for the formal catalog.

- **Interactive pricing configuration tool.** Client (or developer) sets prices
  via UI rather than editing config files. Trigger to build: config-file
  editing becomes a real bottleneck after multiple client adaptations.
- **Operator-editing CMS.** Out of scope per ADR-0014. Will not be built
  unless a fundamental product direction change occurs.
- **Multi-tenant runtime tenant switching.** Out of scope per ADR-0013. Will
  not be built.
- **Themes registry / per-client theme system.** Fork-and-customize is the
  model. Will not be built.
- **Internationalization.** Out of scope unless a multi-language client
  requirement emerges.

## Discipline commitments

These commitments shape every implementation step:

1. **Build for the next genuinely needed thing, not the next plausible thing.**
   Speculative work for hypothetical future clients is rejected. Real client
   needs are the trigger.
2. **The runbook is the empirical test of the template.** A capability that
   exists in the codebase but is not exercised by the canonical reference
   deployment is not considered shipped (see ADR-0014 amendment).
3. **Verify before continuing.** Every step that affects the WordPress-deployed
   system includes operational verification, not just code gates.
4. **The template stays a template.** It is forked per client; it does not
   become a hosted product.
5. **Structural constants stay constant.** Variation points are explicit.
   Per-client configuration is a forking activity, not a runtime activity.
