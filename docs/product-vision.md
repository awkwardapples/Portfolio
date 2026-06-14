# Product Vision

_Last updated: 2026-06-14 (Step 5.6 — comprehensive rewrite)_

This document is the single source of truth for the template's identity. Every
implementation step from here forward references it. If implementation surfaces
a conflict with what's written here, update this document before proceeding —
divergence that is not recorded is technical debt.

---

## What this template is (and isn't)

This is a **reusable template repository** for building lead-generation
websites with embedded quote wizards. The initial focus is handyman and trades
businesses (fencing, decking, painting, paving, general repairs, etc.). The
pattern generalises to any local service business that collects quotes and
converts them to leads.

**Fork-and-customize** is the deployment model (ADR-0014). Each client gets
their own git fork of this repository. Updates to the template flow downstream
via `git merge` from the `template` remote. There is no multi-tenant runtime,
no operator-editing CMS, and no hosted platform. A developer (or the project
owner) clones, adapts, and deploys per client.

**WordPress is the integration layer, not the site.** WordPress acts as the
CMS and REST submission backend. The React application controls the entirety
of what the user sees via the plugin-provided minimal page template
(`templates/react-host.php`), which replaces the active theme's template for
React-hosted routes. WordPress and Kadence chrome do not appear alongside the
React app (ADR-0019). On non-React surfaces (wp-admin, REST, cron), WordPress
renders normally.

**Each client site must look visually distinct.** A client site must not read
as "a template derivative." This is the motivating constraint behind the
behavioral/visual layer separation described in this document — per-client
visual customization (including 21st.dev-style prompts) modifies Layout
components without touching behavioral components, wire contracts, or WordPress
integration.

**Anti-goals.** This is not:

- A multi-tenant SaaS (ADR-0014).
- An operator-editing CMS. Clients do not configure their sites at runtime.
- A hosted platform. Every client runs their own WordPress installation.
- A themes registry or theme system.

---

## Template Capabilities

### Site shell and routing

Five named routes are registered in the template and enforced by the WordPress
routing layer (ADR-0019, Step 5.1):

| Route       | Page                 |
| ----------- | -------------------- |
| `/`         | Home                 |
| `/services` | Services             |
| `/our-work` | Our Work / Portfolio |
| `/contact`  | Contact              |
| `/quote`    | Quote Wizard mount   |

The React router is a pure function of `pathname`. Navigation dispatches
`goqw:navigate` custom events (no library router). `SiteRoutes` in PHP and
`routes.ts` in TypeScript are kept in lockstep and verified by
`CrossLanguageRoutesTest` in the PHP test suite.

A primary navigation bar appears at the top of every page with the business
name/logo at top-left and a "Get a Free Quote" CTA at top-right. The CTA
links to `/quote`. These are structural constants — they are not per-client
variation points.

Routes can be hidden per client if unwanted, but the underlying route
structure is fixed. Adding a sixth route is a template-level change, not a
per-client customization.

### Homepage section library

The home page is composed of a sequence of sections drawn from a library of
seven standard sections. Each section is included or excluded per client;
section ordering is per-client; all section content is per-client.

#### The 7 standard sections

**1. Hero**

The landing experience. Business name, primary tagline, and the primary CTA
(typically "Get a Free Quote"). The Hero is the first visible element on the
page. It sets the visual tone of the site and drives the primary conversion
action. Every client site includes the Hero.

**2. Intro**

A brief company-defining narrative. Typically used as an "About us" statement:
who the business is, where it operates, and why customers should trust it.
Contains a heading, body text, and an optional secondary CTA (e.g., "Learn
more" or "See our work"). May be excluded for clients who prefer the Hero to
carry all above-the-fold content.

**3. Services Preview**

A brief list of the services the client offers, each with a short description
or icon. Links to the Services page or individual service detail pages. Ends
with a "View all services" CTA. Serves as a quick-read summary for visitors
who want to know what the business does before scrolling further.

**4. Process**

A numbered step-by-step explanation of how a customer engages with the
business: from first contact to job completion. Typically 3 to 5 steps (e.g.,
"01 — Contact us, 02 — Receive a quote, 03 — We complete the job, 04 — You
approve the work"). Sets expectations and reduces inquiry hesitation. Often
titled "How it works."

**5. Projects / Recent Work**

A portfolio teaser. A photo grid or masonry layout with brief introductory
text. Links to the Our Work page for more. Used to demonstrate quality and
build trust with prospective customers. May be excluded if the client has no
portfolio photos at launch; the section is added once photos are available.

**6. Why Choose Us**

A trust-signal section. Four to six reasons / value propositions, each with a
heading and a brief descriptive sentence (e.g., "Fully insured," "10 years
experience," "No call-out fee," "Free quotes," "Local to you"). May use icons
per value proposition. Designed to answer the question "why this business over
a competitor."

**7. FAQ**

Five to ten commonly-asked questions with collapsible or visible answers.
Addresses pricing transparency questions, scope questions, geographic coverage
questions, and payment questions. Reduces pre-quote friction. Also contributes
to SEO (FAQ schema markup).

#### Footer

The footer is template-fixed in structure and is not part of the section
library. Per-client customization provides content values for the footer's
content slots (see Per-Client Customization Model below). The footer appears
on every page; it is not composable.

#### Default section order

The default order for new client sites:

```
Hero → Intro → Services Preview → Process → Projects → Why Choose Us → FAQ
```

A final CTA block (repeated CTA above the footer) is implicit. Per-client
configuration decides whether this CTA block mounts the quote wizard inline
or uses a contact-info prompt.

The section order is editable per client via the composition file (see below).

#### Section composition mechanism (Pattern A)

Each page has a single composition file that lists which sections to include,
in what order, and what configuration each section receives.

Example composition file: `src/site/content/home-page-content.ts`

```ts
export const homePageSections = [
  {
    section: 'hero',
    config: {
      heading: 'Trusted handyman services across London',
      tagline: 'Fencing, decking, repairs, and more — free quotes.',
      cta: { label: 'Get a Free Quote', href: '/quote' },
    },
  },
  {
    section: 'services-preview',
    config: { services: enabledServices },
  },
  {
    section: 'process',
    config: {
      steps: [
        { number: '01', heading: 'Contact us', body: '...' },
        { number: '02', heading: 'Receive a quote', body: '...' },
        { number: '03', heading: 'We complete the work', body: '...' },
      ],
    },
  },
  // ... further sections
] as const;
```

Including a section means listing it. Excluding a section means removing it
from the array. Reordering sections means reordering the array. There is no
toggle flag or feature system — the composition file is the source of truth.

#### Section component architecture (behavioral/visual layer separation)

Each section is implemented as two files:

```
src/site/sections/
├── Hero/
│   ├── index.tsx     ← Behavioral component
│   └── Layout.tsx    ← Visual component (per-client customizable)
├── Intro/
│   ├── index.tsx
│   └── Layout.tsx
├── ServicesPreview/
│   ├── index.tsx
│   └── Layout.tsx
├── Process/
│   ├── index.tsx
│   └── Layout.tsx
├── Projects/
│   ├── index.tsx
│   └── Layout.tsx
├── WhyChooseUs/
│   ├── index.tsx
│   └── Layout.tsx
└── FAQ/
    ├── index.tsx
    └── Layout.tsx
```

**`index.tsx` — the behavioral component.** Owns:

- The props interface for the section (the contract between the composition
  file and the section implementation).
- Any data transformation (mapping raw config to the shape the Layout needs).
- Any business logic (e.g., deriving CTA href from a service slug).
- Rendering delegation: calls `<Layout {...transformedProps} />`.

The behavioral component does not own any HTML structure, class names,
animation, or visual styling. It is a pure adapter from config → Layout props.

**`Layout.tsx` — the visual component.** Owns:

- All HTML structure (semantic markup, div hierarchy).
- All Tailwind class names.
- All animation and transition logic.
- All visual composition (grid, flex, spacing, color, typography).

The Layout component does not own any business logic, data derivation, or
WordPress integration. Its props contract is defined by `index.tsx`.

**Why this separation matters.** Per-client visual customization (including
21st.dev-style redesign prompts) targets `Layout.tsx` only. The behavioral
component is never touched during per-client customization. This guarantees
that customization cannot accidentally break data flow, navigation,
submission, or any WordPress integration surface. A designer can prompt a
fresh visual Layout for the Hero section without knowing anything about how
the wizard or submission pipeline works.

Content data flows inline: the behavioral component passes content directly
from the composition-file config to the Layout as props. There is no
indirection via a content context or a data-fetching layer. This keeps the
section's data flow readable at a glance in the composition file.

### Handyman wizard service library

The template provides nine wizard configurations covering the most common
handyman services. Client sites choose which services to offer from this
library. Clients may also add genuinely-new services not in the library, but
that is a per-client implementation task — it does not extend the template.

#### Instant-quote services (5)

These services can produce a price in the browser from the answers the user
provides. The wizard calculates the price, shows it to the user before
submission, and the lead is delivered to Make.com with the price included.

| Service                              | Status   |
| ------------------------------------ | -------- |
| Fencing                              | Exists   |
| Decking                              | Exists   |
| Painting & decorating                | To build |
| Patio / paving / driveways           | To build |
| Pressure washing / exterior cleaning | To build |

All five services use `quoteMode: 'instant'` (ADR-0017). The pricing engine
computes price from the wizard field answers using the service's
`PricingConfig`. The price is displayed to the user before they submit.

#### Manual-quote services (4)

These services involve too many site-specific variables for a browser-side
formula to produce a reliable price. The wizard collects the customer's
requirements and contact details, captures the lead, and the business
follows up with a quote directly.

| Service                         | Notes                             |
| ------------------------------- | --------------------------------- |
| General repairs (catch-all)     | Broadest category; always enabled |
| Plumbing (light)                | Non-structural residential work   |
| Electrical (light)              | Non-structural residential work   |
| Carpentry / shelving / assembly | Includes furniture assembly       |

All four services use `quoteMode: 'manual'` (ADR-0017).

#### Manual-quote wizard flow

The manual-quote flow uses the same wizard interface as instant-quote
services. The difference is behavioural, not visual:

1. The wizard collects service-relevant fields (description, free-text, job
   type, optional photo uploads, and contact information).
2. The pricing calculation step is **bypassed entirely** — the wizard
   transitions from `answering` directly to `submitting` without entering
   `validating` with a pricing requirement. The pricing engine is not invoked.
3. The submission fires the same REST endpoint (`qw/v1/submit`) and the same
   Make.com pipeline. The lead is captured with `quoteMode: 'manual'` in the
   wire payload.
4. The success screen displays a terminal message: "We can't give an automatic
   instant quote for this service. We'll be in touch with a quote shortly."
   The wording is per-service configurable.

The wizard engine is not modified per service. `quoteMode` in the
`WizardConfig` controls the flow; `transition()` handles the bypass.

### SEO infrastructure

The template provides four layers of SEO out of the box.

**Layer 1 — On-page SEO basics.**
Per-page `<title>` tags, meta descriptions, canonical URL links, Open Graph
tags (`og:title`, `og:description`, `og:image`, `og:type`), and Twitter card
tags. Emitted by the PHP plugin into `wp_head()` on every React route. Content
is per-page, per-client configurable.

**Layer 2 — Local SEO schema.**
`LocalBusiness` structured data (JSON-LD) with name, address, phone number,
email, opening hours, service area, and business type. Emitted once per site
into `wp_head()`. Values are per-client configuration. This schema helps Google
associate the business with local search queries and enables Knowledge Panel
features.

**Layer 3 — Service schema.**
`Service` structured data (JSON-LD) per enabled service. Associates the
business with the specific services it offers. Implementation split (to be
finalised in Step 5.10): emitted either from the PHP layer into `wp_head()`,
or by the React app via `react-helmet`-style injection. The React route is
preferred for co-location with the service config.

**Layer 4 — Performance and crawlability.**
`sitemap.xml` generation (all five routes + service detail pages if present),
`robots.txt` with appropriate directives, and page-load performance hygiene
(bundle size limits, lazy loading for portfolio images, no render-blocking
scripts beyond the wizard bundle itself).

**Out of scope for the template:** Content quality, blogging, Google Business
Profile setup, and link-building are per-client ongoing operational concerns.
The template provides the technical foundation; sustained SEO performance
requires per-client content effort.

Implementation is split between PHP (Layers 1, 2, 4) and the React layer
(Layer 3). The PHP plugin emits all wp_head() meta; React owns its own
document-head tags where co-location with service config is beneficial.

### Footer

The footer structure is template-fixed. Every client site has the same footer
layout. Per-client customization fills in the content slots.

**Standard footer content slots:**

| Slot                       | Example value                                |
| -------------------------- | -------------------------------------------- |
| Business name (display)    | SCB Handyman Services                        |
| Address (multi-line)       | 42 Acacia Avenue, London SE1 7QR             |
| Primary phone              | 07700 900123                                 |
| Secondary phone (optional) | 020 1234 5678                                |
| Primary email              | info@scbhandyman.co.uk                       |
| Hours of operation         | Mon–Fri 8am–6pm, Sat 9am–4pm                 |
| Service area description   | Serving South-East London and Surrey         |
| Social links               | Facebook, Instagram, TrustATrader (optional) |
| Copyright line             | Auto-generated from business name + year     |
| Privacy Policy link        | Per-client URL                               |
| Terms & Conditions link    | Per-client URL (optional)                    |

Structural changes to the footer layout (adding a second column, restructuring
the nav group) are template-level changes. They require deliberate review, not
per-client customization.

### WordPress integration

All five React routes are served via the plugin-provided minimal page template
(`templates/react-host.php`). The active theme's header, footer, and page
chrome are bypassed. `wp_head()` and `wp_footer()` are preserved for plugin
compatibility.

The React bundle is enqueued by `AssetLoader` when either the current request
matches a recognized React route (`SiteRoutes::is_current_request_react_route()`)
or when the page contains the wizard shortcode (`[quote_wizard]`). The
shortcode path preserves legacy/classic-template embedded usage.

The submission endpoint is `qw/v1/submit` (REST API). The submission pipeline
is: validate → persist → forward → respond (ADR-0015). Forwarding targets
the Make.com webhook URL configured per client.

WordPress page mapping: a single site root page backs all five routes via WP
rewrite rules. `RouteInterceptor` rewrites the main query to the site root
page for recognized paths. `RenderingArchitecture` swaps the template via
`template_include`. See ADR-0019 and Step 5.1 documentation.

---

## Architectural Principles

### Behavioral / visual layer separation

Every section in the homepage section library follows a strict two-file
pattern. The behavioral component (`index.tsx`) owns the section's props
interface, data transformation, and rendering delegation. The visual component
(`Layout.tsx`) owns all HTML structure, Tailwind class names, animation, and
visual composition.

**The rule:** per-client visual customization modifies only `Layout.tsx`. The
behavioral `index.tsx` is never modified during per-client work.

**Why the rule exists.** The rendering architecture (ADR-0019) means React
controls the entire visible site. This is a significant surface area. A change
to a section's visual layout must never be able to break its props contract,
its data flow, its navigation links, or its WordPress integration surface.
Splitting behavioral from visual makes it structurally impossible to break
the wire contract while doing visual work.

This principle applies to sections. It does not apply to the wizard engine or
submission pipeline (which have no visual component in the same sense) or to
the site shell (which is structural and not customizable per-client).

A future ADR-0020 may formalize this principle with explicit linting
enforcement. Until then, it is a stated design constraint enforced by code
review and developer convention.

### Wizard engine reuse

All nine services (five instant-quote, four manual-quote) use the same wizard
engine. The engine is not modified per service. Service differences are
expressed entirely through configuration:

- `WizardConfig`: phases, steps, fields, transitions.
- `PricingConfig`: pricing rules, material costs, minimum prices.
- `quoteMode`: `'instant'` or `'manual'` (controls the validating→submitting
  transition behaviour).

Adding a new service means writing a new config file and registering it in
the vertical registry (`src/domain/registry/verticals.ts`). No engine code
changes.

### Content-driven configuration

Per-client work is content and selection from pre-built options. It is not
modification of engine code, routing code, or infrastructure code.

A developer adapting the template for a new client:

1. Edits composition files to select sections and set content.
2. Edits the vertical registry to enable the client's chosen services.
3. Provides per-service config (or uses template defaults).
4. Provides footer content.
5. Optionally prompts new Layout components for visual distinction.

None of these steps require touching the wizard engine, the submission
pipeline, the WordPress routing layer, or the PHP plugin internals.

### Manual-quote pathway

Not every handyman service can be priced by a browser-side formula. Pricing a
fencing job from linear metres, material type, and post spacing is deterministic
and automatable. Pricing a "general repairs" job is not — it requires a
site visit.

The manual-quote pathway (`quoteMode: 'manual'`, ADR-0017) exists to capture
leads for services where pricing requires inspection. It does not bypass the
wizard — the wizard still collects requirements and contact information. It
bypasses the pricing engine and the pricing display. The lead is submitted to
Make.com with the same payload structure; the business then follows up with a
manual quote.

This means the template can cover the full service offering of a handyman
business — not just the algorithmically priceable subset.

---

## Per-Client Customization Model

### What's editable per-client

| Surface                                  | How                                            |
| ---------------------------------------- | ---------------------------------------------- |
| Site-wide copy and headings              | `src/site/content/site-content.ts`             |
| Services list (display content)          | `src/site/content/services-content.ts`         |
| Portfolio entries and photos             | `src/site/content/work-content.ts`             |
| Home page section selection and order    | `src/site/content/home-page-content.ts`        |
| Per-section content (text, images, CTAs) | Section config in composition file             |
| Wizard services enabled                  | Vertical registry                              |
| Per-service wizard config                | Service-specific fixture files                 |
| Per-service pricing config               | Service-specific fixture files                 |
| Primary brand color                      | `goqw_primary_color` WP option or CSS variable |
| Footer content (all slots)               | Footer content config file                     |
| Make.com webhook URL                     | `goqw_webhook_url` WP option                   |
| WP site name and tagline                 | WordPress admin — Settings → General           |
| Section Layout visuals                   | `src/site/sections/SectionName/Layout.tsx`     |

### What's not editable per-client

| Surface                                   | Reason                                         |
| ----------------------------------------- | ---------------------------------------------- |
| Wizard engine                             | Shared; bug fixes flow to all clients          |
| Submission endpoint and pipeline          | Contract-versioned; changes are template-level |
| WordPress routing and rewrite rules       | Structural constant                            |
| WordPress integration architecture        | ADR-0019 is a template-level decision          |
| Behavioral section components (index.tsx) | Changing these is a template-level change      |
| Site shell (header structure, routes)     | Structural constant; all clients share this    |
| PHP plugin internals                      | Template-level; changes flow via merge         |

Structural changes to items in the "not editable" list require a deliberate
template-level step (with an ADR if appropriate) and then flow downstream to
all client forks via `git merge`.

### The 21st.dev customization workflow

When a client requires visual customization beyond primary color and copy, the
21st.dev workflow is used to produce new Layout components.

**Step-by-step:**

1. Identify which section(s) are being visually redesigned (e.g., "the Hero
   section needs to look more premium — large full-width background photo with
   text overlay and glassmorphism CTA block").

2. Write a focused prompt that targets only the Layout component:

   > "Redesign the visual layout of the Hero section using a full-width
   > background photo with a dark tint overlay. The business name should appear
   > large and white at the top-left. The CTA button should use a
   > glassmorphism card with a white border and backdrop blur. Keep all prop
   > names, button click handlers, and href values unchanged. Output replaces
   > `Hero/Layout.tsx` only; `Hero/index.tsx` is untouched."

3. The generated Layout must satisfy the same props interface as the existing
   `Hero/Layout.tsx`. Validate by TypeScript compilation and visual inspection.

4. Test the section in isolation (visual check, no layout regression in browser).

5. Test the full home page composition (all sections render correctly together).

**Hard constraints during 21st.dev customization:**

- Button `onClick` handlers and `href` values must be passed through unchanged.
  The Layout receives them as props; it does not define them.
- Form `onSubmit` and submission-related props must pass through unchanged.
- Navigation `href` values must come from props, not be hardcoded in Layout.
- All data (business name, section copy, service list) comes from props passed
  from the behavioral component. The Layout does not import content directly.
- No new `import` statements that reach into `src/domain/**`, `src/runtime/**`,
  or WordPress integration code. Layout components are pure presentation.

The 21st.dev workflow means a developer can give a client visually distinctive
sections without understanding the wizard engine, routing, or submission
pipeline. The separation boundary makes this safe.

### Deployment lifecycle (per-client)

1. **Fork the template** per `docs/fork-procedure.md`. Set up the `template`
   remote for future upstream merges.

2. **Configure business information.** Edit footer content config, set primary
   color, update WordPress site name/tagline via admin.

3. **Select services.** Enable the client's chosen services in the vertical
   registry. Disable services not offered. Confirm instant vs. manual
   classification matches the client's pricing model.

4. **Configure per-service content.** Update wizard copy (headings, labels,
   help text). Update pricing config for instant-quote services. Confirm
   manual-quote terminal message copy.

5. **Compose the home page.** Edit the composition file to select sections,
   set their order, and provide per-section content (headings, body text,
   CTA labels, photo references, FAQ entries, process steps, etc.).

6. **Apply visual customization.** If the client requires visual distinction
   beyond the default layout, use the 21st.dev workflow per section.

7. **Verify locally.** Run all gates and perform operational verification per
   ADR-0018. Confirm React UI renders visibly in browser, not blank.

8. **Deploy to production.** WordPress on the client's hosting (Step 6.0 for
   the first client).

9. **Receive upstream template updates.** When the template adds a new section,
   service, or infrastructure improvement, merge from the `template` remote
   and resolve any per-client customizations that need updating.

---

## Roadmap

### Completed

| Phase     | What                                                             |
| --------- | ---------------------------------------------------------------- |
| 1–3       | Architecture, ADRs, repo scaffold, build pipeline, CI, packaging |
| 4         | Wizard engine, services, submission pipeline, photo uploads      |
| 5.0–5.1   | Site shell, 5 reference pages, WordPress page mapping            |
| 5.2       | OV-001 remediation — end-to-end WordPress verification           |
| 5.3–5.4   | Adaptation runbook, Make.com integration documentation           |
| 5.5a      | Category navigation + manual-quote mode capabilities             |
| 5.5a-rem  | Wire contract fix; ADR-0018 enforcement; build pipeline fix      |
| 5.5b      | Fork procedure documentation                                     |
| 5.5b-arch | Rendering architecture — plugin-provided minimal template        |
| 5.5b-fix  | Asset enqueue gate fix — React bundle now loads on React routes  |
| 5.6       | Product vision rewrite + roadmap revision (this document)        |

### Template completeness sequence (up next)

| Step | What                                                     |
| ---- | -------------------------------------------------------- |
| 5.7  | Section library: composition mechanism + 7 sections      |
| 5.8  | Footer: template structure + per-client content slots    |
| 5.9  | Wizard service library: 9 services (5 instant, 4 manual) |
| 5.10 | SEO infrastructure: Layers 1-4                           |
| 5.11 | Per-client customization tooling refinement              |

### After template completeness

| Step | What                                        |
| ---- | ------------------------------------------- |
| 5.12 | SCB-specific deployment (first real client) |
| 6.0  | Production IONOS deployment                 |
| 6.1+ | Second and subsequent clients               |

### Long-term considerations (not yet planned)

These may become planned steps after the template is complete and live with
the first client:

- **Multi-language support.** Triggered by a multi-language client requirement.
- **Multi-currency support.** Triggered by a client operating across
  currency boundaries.
- **Admin UI for non-technical customization.** Triggered if config-file
  editing becomes a genuine bottleneck across multiple clients.
- **Hosted vs. self-hosted WordPress options.** Currently all clients run
  their own WordPress installations. Hosting consolidation may be considered
  after several clients are live.
- **Backend SaaS extraction.** Intentionally deferred per ADR-0013 and
  ADR-0014. Will not be built unless a fundamental product direction change
  is deliberate and documented.

---

## Discipline commitments

These commitments govern every implementation step:

1. **Build for the next genuinely needed thing.** Speculative work for
   hypothetical future clients is rejected. Real client needs, revealed by
   actual client onboarding, are the trigger for new capabilities.

2. **The runbook is the empirical test.** A capability that exists in the
   codebase but is not exercised in a deployed canonical site is not
   considered shipped (ADR-0014 amendment). Operational verification is
   required for every step that affects the WordPress-deployed system.

3. **Verify before continuing.** Every step includes gate clearance (lint,
   typecheck, tests, build) and operational verification. Code gates are
   necessary but not sufficient. React must render visibly in a browser,
   not just produce correct HTML shape (ADR-0018 amendment, 2026-06-12).

4. **The template stays a template.** It is forked per client. It does not
   become a hosted product, an operator-editing CMS, or a multi-tenant
   runtime. ADR-0013 and ADR-0014 are the formal commitments.

5. **Structural constants stay constant.** Five routes, one navigation bar,
   one quote wizard per site, one submission endpoint. Per-client
   configuration is content, selection, and visual layer — not structural
   changes.

6. **Changes flow via git merge.** Template improvements land in the template
   repository and flow downstream to client forks via `git merge` from the
   `template` remote. Client customizations live in the fork; they survive
   the merge because they touch different files (Layout components, content
   files) from template changes (behavioral components, routing, plugin).

---

## Cross-references

| ADR      | Relevance                                                                                 |
| -------- | ----------------------------------------------------------------------------------------- |
| ADR-0012 | Flat UI design system constraints; no inline styles, no hex in components, no gradients   |
| ADR-0013 | Vertical registry system — `resolveVertical(wizardId)` as the service selection mechanism |
| ADR-0014 | Fork-and-customize is the deployment model; anti-goals formally committed                 |
| ADR-0015 | Submission pipeline: validate → persist → forward → respond; HTTP status contract         |
| ADR-0017 | Category navigation + manual-quote pathway; `quoteMode` field in wire payload             |
| ADR-0018 | Wire contract discipline; visible-UI browser verification required (not just HTML shape)  |
| ADR-0019 | Rendering architecture; plugin-provided minimal template; asset enqueue gate              |
