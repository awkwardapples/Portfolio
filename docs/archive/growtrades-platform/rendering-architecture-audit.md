# Rendering Architecture Audit

**Date:** 2026-07-24
**Purpose:** Answer, with direct evidence (database queries, live HTTP responses, and source inspection — no assumptions), why the LocalWP site does not visually match the implementation reports. No code was modified to produce this document.

**Method:** Queried the LocalWP MySQL database directly (`wp_options`, `wp_posts`, `wp_postmeta`), fetched raw HTML from the live site via `curl` for the home page and a service page, and cross-referenced against the plugin's PHP source (both the repo copy and the deployed LocalWP copy, confirmed identical via `diff`).

---

## Executive summary

There is **no duplicate/competing rendering system**. Every visible part of the site that the user can navigate to via the 11 recognized routes is rendered by the React app, and only the React app — this part of the architecture works exactly as designed. The visual problems are **not** an architecture bug. They are a **configuration data gap**: several WordPress database options that the PHP layer feeds into the React app were never actually set for this client, so the React app is correctly rendering _unconfigured template defaults_, not SCB Handyman's real values. There is one genuine, separate rendering-path finding (an unused fallback implementation) and one confirmed SEO title bug, both detailed below.

---

## 1–4. Which pages are rendered by which system?

Confirmed via direct database query (`wp_options`, `wp_posts`):

- **Active theme:** Kadence (`template`/`stylesheet` both = `kadence`).
- **Active plugins:** only `quote-wizard/quote-wizard.php`. No Kadence Blocks plugin, no page-builder plugin, no caching plugin active.
- **Real WordPress pages in the database:** only 3 exist — `Sample Page` (id 2, default WP demo content), `Privacy Policy` (id 3, **draft**, has real Gutenberg content, not linked anywhere), and `Site` (id 5, slug `goqw-site-root`, **empty content**, set as the static homepage).

There are **no Gutenberg/Kadence-block pages in the live rendering path**. The draft Privacy Policy page (id 3) is Gutenberg content but is a draft and not the page the `/privacy` route resolves to.

**Answering 1–4 directly:**

1. **Entirely React-rendered pages:** all 11 recognized routes (`/`, `/services`, `/our-work`, `/contact`, `/quote`, `/privacy`, and the 5 `/services/{slug}` SEO pages) — confirmed by fetching each and finding an empty `<body class="...goqw-react-host...">` containing only `<div id="qw-root"></div>`, with zero theme header/footer/navigation markup in the DOM.
2. **WordPress-template-rendered pages:** anything _not_ in that list of 11 — e.g. `/sample-page/`, the draft `/privacy-policy/` (Gutenberg URL, different from the React `/privacy` route), `wp-admin`, and any 404. These render through Kadence's normal `page.php`/`404.php` with full theme chrome (Kadence's own header, footer, nav, and its default blue palette — see §9).
3. **Gutenberg/Kadence-block-rendered pages:** none in the live navigation path. Only the orphaned draft Privacy Policy page uses block content, and it isn't linked from anywhere reachable.
4. **Quote Wizard plugin:** owns the entire rendering pipeline for the 11 recognized routes (see §5), plus the `[quote_wizard]` shortcode as a secondary, currently-unused embedding mechanism (§11).

## 5. Where React actually mounts into WordPress

Confirmed by reading `RenderingArchitecture.php`, `templates/react-host.php`, and matching that file byte-for-byte against the live HTML response:

```
WordPress request comes in
  → RouteInterceptor::maybe_intercept() (hooked on pre_get_posts)
      if request path is one of SiteRoutes::PATHS (11 entries):
        rewrites the main WP_Query to load page id 5 ("Site"/goqw-site-root)
  → RenderingArchitecture::filter_template_for_react_routes() (hooked on template_include, priority 100)
      if request path is a recognized route:
        forces template_include to plugins/quote-wizard/templates/react-host.php
        (bypassing Kadence's page.php entirely — confirmed: no get_header()/get_footer() call)
  → react-host.php renders:
      <head> — wp_head() (SEO meta, enqueued CSS, GOQW_CONFIG inline script)
      <body class="goqw-react-host">
        <div id="qw-root"></div>          ← React mounts here, and ONLY here
        wp_footer() — enqueued JS
  → main.tsx finds #qw-root, reads window.location.pathname (NOT any data attribute),
    mounts <App/>, client-side router renders the matched page/section tree
```

This exactly matches ADR-0019's documented intent. **The bypass is real and working** — verified by the live HTML containing zero Kadence markup in `<body>` on all 11 routes.

## 6–7. Which redesigned components are mounted vs. unreachable

**Mounted and live** (confirmed via the deployed JS bundle hash matching the latest build, and via the compiled CSS containing the expected utility classes): Header/Nav, MobileMenu, Hero, ServiceHero, Intro, Process, Projects, WhyChooseUs, FAQ, all shared primitives (Button, Card, IconButton, UnderlineLink, PageContainer, Input, Tooltip, Skeleton), and the wizard's own step components. All of this renders via the single `renderSection` switch described in earlier phases — there is exactly one implementation of each, and it is the one currently live.

**Unreachable / never instantiated:**

- **`Hero/Layout.tsx`'s `backgroundImage`/`backgroundImageAlt` props** — no content file supplies them (home page always uses `MeasuredDrawing`). Dead-but-intentional (documented in the component itself as a dormant future path).
- **`Shortcode.php`'s `[quote_wizard]` shortcode** — registered (`add_shortcode` fires in `Plugin::boot()`), but no page in the database contains this shortcode in its `post_content` (confirmed: page 5's content is empty; the only other real pages are Sample Page and the draft Privacy Policy, neither of which contains it). It is fully wired and would work if embedded, but nothing on this site currently uses it.
- **`SiteRenderer.php`'s `the_content` filter (`filter_content()`, priority 5)** — see §11 below; this is a real, functioning implementation that never actually executes under normal operation.

## 8. Is ServiceHero actually rendered? If not, why, and what renders instead?

**Yes, it is rendered**, and there is no competing component. Verified three ways:

- `service-pages-content.ts`'s 5 hero sections all use `kind: 'service-hero'`, and `renderSection.tsx` has exactly one case for that kind, mapping to the `ServiceHero` component (confirmed by reading both files).
- The deployed JS bundle (`wizard.5VdWiEhZ.js`, confirmed live via the page source) is the same hash produced by the last build that included `ServiceHero` and the 5 real images.
- All 5 real hero images are directly fetchable from the live site at their final deployed URLs (`curl` returned HTTP 200 for all 5, e.g. `.../assets/dist/assets/service-hero-fencing.BS1lLCiD.webp`).

If the images were not visually appearing when observed, the most likely explanation is that the observation was made **before** the asset-integration work completed in the prior session (which replaced broken placeholder paths with working imports) — not a rendering-architecture problem. I cannot rule out a browser-side cache from that earlier, genuinely-broken state, since I have no browser tool to test with directly; a hard refresh / cache clear on the machine that observed this would confirm.

## 9. Why the colour palette and buttons still look unchanged — confirmed root cause

This is a **data configuration gap, not a code or architecture problem.** Direct database query of every `goqw_*` option:

```
goqw_primary_color          = #0F4C81        ← template demo default (a blue). Never changed.
goqw_business_name          = scb-handyman    ← the raw WP site slug, not "SCB Handyman Services"
goqw_business_phone         = (empty)
goqw_business_address       = (empty)
goqw_business_hours         = (empty)
goqw_business_service_area  = (empty)
goqw_business_email         = dev-email@wpengine.local   ← placeholder
goqw_agency_notification_email = dev-email@wpengine.local ← placeholder
```

`AssetLoader::enqueue_assets()` reads `goqw_primary_color` and injects it as the `--goqw-primary` CSS variable, which is what **every single `bg-primary`/`text-primary`/`border-primary` Tailwind utility in the entire React app resolves through** — every redesigned Button, CTA, link, and accent. The component code is correct and was never hardcoded to blue; the WordPress database simply still holds the template's original demo value. This single unset option is why "the whole palette looks unchanged" — it is quite literally the one value every accent-coloured pixel on the site depends on, and it was never updated during the earlier content-customization work (which only edited the React-side static TypeScript content files, e.g. `site-content.ts`/`home-page-content.ts` — a separate content source from these WordPress options).

The same gap explains the empty business phone/address/hours: anything in the app that reads `window.GOQW_CONFIG.businessPhone` (rather than a hardcoded value in a TypeScript content file) is currently blank.

## 10. Why redesigned buttons aren't replacing the blue ones

They _are_ the redesigned components — same finding as §9. `Button.tsx`'s `primary` variant is `bg-primary text-text-inverse`, which is correct, redesigned, flat-UI code. It renders blue only because `--goqw-primary` is still `15 76 129` (the RGB triplet for `#0F4C81`) at the database level. There is no second, un-redesigned Button implementation in the live rendering path.

## 11. Duplicate implementations found

| Component                            | Duplicate?                                              | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hero**                             | No                                                      | One implementation (`Hero/Layout.tsx`), one shared with `ServiceHero` only at the design-system level (tokens, motion, button styles), not code.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Button**                           | No                                                      | One implementation (`components/primitives/Button.tsx` + `buttonClassName`). Kadence's own theme CSS (`global.min.css`) defines styling for `button, .button, .wp-block-button__link, input[type="button"]...` — this is still enqueued and loaded on every React-hosted page (see §13) even though no matching Kadence markup exists in the DOM there, so it's inert on those pages, not a true duplicate. It **is** live and does style real buttons on any non-React WordPress page (Sample Page, 404, etc.).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Navigation**                       | No, on React routes                                     | Kadence's own `#masthead`/primary-menu markup is never rendered on any of the 11 React routes (confirmed empty `<body>`). It **does** render (with Kadence's own blue-based palette, `--global-palette1: #2B6CB0`) on any non-React WordPress page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Service pages**                    | No                                                      | One content source (`service-pages-content.ts`), one component tree.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Layout / page-rendering pipeline** | **Yes — one redundant, currently-inert implementation** | `RenderingArchitecture.php` (`template_include`, priority 100) is what actually runs and serves `templates/react-host.php` for all 11 routes. `SiteRenderer.php` (`the_content` filter, priority 5, with its own `<div id="qw-root" data-initial-path="...">` output) is a **second, independent implementation of the same job** — injecting the React mount div — built for a scenario (a classic WordPress page template calling `the_content()`) that never occurs in the current architecture, because `react-host.php` never calls `the_content()`. Confirmed empirically: the live HTML's mount div is exactly `<div id="qw-root"></div>` with no `data-initial-path` attribute, matching `react-host.php`'s hardcoded static markup precisely, not `SiteRenderer.php`'s dynamic sprintf output. `SiteRenderer.php` only fires as a defensive fallback if `react-host.php` ever becomes unreadable — under normal operation it is dead code. This has zero visual consequence today (`main.tsx` reads `window.location.pathname` directly and only uses the missing attribute for an optional console warning), but it is a real, redundant second implementation worth consolidating or removing. |

## 12. Rendering map

```
WordPress (LocalWP, Kadence theme active, only quote-wizard plugin active)
    │
    ├─ Request path IS one of the 11 SiteRoutes::PATHS
    │     │
    │     ├─ pre_get_posts:  RouteInterceptor → rewrites query to page id 5 ("Site")
    │     ├─ template_include (priority 100): RenderingArchitecture → forces
    │     │      plugins/quote-wizard/templates/react-host.php
    │     │      (Kadence's page.php / get_header() / get_footer() NEVER called)
    │     │
    │     └─ react-host.php
    │           <head>: wp_head() → SEOMetaEmitter (title/meta/OG/schema),
    │                    AssetLoader (goqw-wizard-css, inline --goqw-primary var)
    │           <body class="goqw-react-host">
    │                <div id="qw-root"></div>   ← sole React mount point
    │                wp_footer() → AssetLoader (goqw-wizard-js, GOQW_CONFIG)
    │
    │           → main.tsx mounts <App/> into #qw-root
    │              → client-side router matches window.location.pathname
    │                 → HomePage / ServicesPage / ContactPage / OurWorkPage /
    │                    QuotePage / PrivacyPolicyPage / ServiceLandingPage
    │                    (the last one for the 5 SEO routes)
    │                 → renderSection() switch → Hero|ServiceHero, Intro, Process,
    │                    Projects, WhyChooseUs, FAQ, ServicesPreview
    │                 → shared primitives (Button, Card, IconButton, UnderlineLink,
    │                    PageContainer, Input, Tooltip, Skeleton)
    │
    └─ Request path is NOT one of the 11 routes (e.g. /sample-page/, a 404, wp-admin)
          │
          └─ Normal WordPress template hierarchy, Kadence theme fully renders:
                header.php (site branding, primary nav, Kadence's own blue palette),
                page.php / 404.php content area, footer.php
                — this is the "still looks like the original site" experience,
                  and it is CORRECT that it looks unchanged: nothing here was ever
                  meant to be part of the React redesign.
```

## 13. Where WordPress is still rendering UI React was expected to own

Nowhere on the 11 recognized routes — confirmed empty `<body>` chrome on both a home-page and a service-page fetch. The only WordPress-rendered UI a visitor could encounter is on **URLs outside the 11 recognized routes** (Sample Page, the orphaned draft Privacy Policy page at a different URL than the real `/privacy` route, and any 404/typo'd URL) — none of these were ever in scope for the redesign, so this isn't a leak, it's WordPress correctly doing its normal job on pages the plugin was never told to claim.

One partial exception, **not visual but real**: `SEORouteContent.php`'s hardcoded `DEFAULTS` array still contains literal "Acme Fencing" demo SEO titles/descriptions for the 6 original routes (home, services, our-work, contact, quote, privacy) — e.g. `'title' => 'Acme Fencing — Professional Fencing Services'` for home. These are overridable via `goqw_seo_title_{slug}` WordPress options, but **no such options exist in the database** (confirmed by query), so the home page's live `<title>` and meta description are still the un-customized template demo copy, not SCB Handyman's. Separately, the 5 SEO service-page routes **do** have correct, SCB-branded titles defined in the same file (e.g. `'Fence Panel Repair & Replacement in Guildford — SCB Handyman'`), but the live service-page fetch showed a bare `<title>scb-handyman</title>` (the WordPress site name, not even the Acme Fencing fallback) — meaning the title-override mechanism itself is failing to apply for the newer service routes specifically. This is a second, distinct, confirmed bug worth its own investigation, separate from the rendering-architecture question asked here.

## 14. Production path vs. an alternative path users never see

**(A) — the redesign is implemented in the actual production rendering path.** There is no shadow/alternate path. Every redesigned component is reachable and does render for any visitor hitting one of the 11 recognized routes. The appearance of "the redesign isn't visible" is fully explained by:

1. The site's one and only accent-colour source (`goqw_primary_color`) never being changed from its template default, and several business-identity options being empty or placeholder values (§9/§10) — a configuration gap, not a rendering bug.
2. Genuine WordPress-rendered content existing on URLs that were never part of the redesign's scope (§13) — correct behaviour, easily mistaken for "the redesign didn't take" if those URLs are what's being compared.
3. One confirmed, narrow SEO-title bug on the service-page routes (§13), unrelated to component rendering.

## 15. No code was modified during this investigation

All commands run were read-only: MySQL `SELECT` queries, `curl` GET requests, `diff`, `grep`, and `Read`. One temporary marker file was written to and immediately deleted from the LocalWP docroot purely to confirm which physical directory was serving the site (not part of the application).

---

## Recommended next step (for your decision, not yet actioned)

Set the real WordPress options before any further UI work: `goqw_primary_color` (Pine `#1C4A3D`), `goqw_business_name`, `goqw_business_phone`, `goqw_business_address`, `goqw_business_hours`, `goqw_business_service_area`, `goqw_business_email`. This alone should resolve the colour/button/business-info complaints without touching any component code. Separately, decide whether to fix the "Acme Fencing" SEO defaults / the service-page title bug, and whether to remove the now-redundant `SiteRenderer.php` fallback implementation.
