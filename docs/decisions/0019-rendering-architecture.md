# ADR-0019: Rendering Architecture — Hybrid Plugin Template

**Status:** Accepted (Step 5.5b-architecture, June 2026)

## Context

The Quote Wizard template serves a React application on five public routes
(`/`, `/services`, `/our-work`, `/contact`, `/quote`) within a WordPress
installation. Prior to Step 5.5b-architecture, the React app was rendered
inside the standard WordPress page rendering pipeline: the active theme
(Kadence in the canonical and SCB deployments) wrapped the React app with its
header, footer, page title, and other chrome.

Visually this produced a nested-application appearance:

```
[WordPress/Kadence header]
[WordPress page title: "Quote Page"]
[  React-rendered app header (Home / Services / Our Work / Contact / CTA)  ]
[  React-rendered page content                                              ]
[  React-rendered app footer                                                ]
[WordPress/Kadence footer]
```

This is incompatible with `docs/product-vision.md`'s design constraint:
"Each client's website appears visually distinct, not template-derivative."
The WordPress chrome is visible on every page load and would always need to
be removed for any client deployment.

A foundational architectural decision is needed: how should WordPress render
the React-hosted routes such that the WordPress/theme chrome does not appear?

## Decision

Adopt Option C (Hybrid): a plugin-provided minimal page template is used for
React-hosted routes, while the theme's normal rendering remains active for
wp-admin and any non-React-hosted routes.

**Mechanism:** The plugin hooks into WordPress's `template_include` filter at
priority 100. When the request matches a React-hosted route (as defined in
`SiteRoutes::PATHS`), the filter returns the path to the plugin's own minimal
template (`plugins/quote-wizard/templates/react-host.php`). For all other
requests the filter returns the original template unchanged.

**Minimal template structure:** The plugin's template emits its own
`<!doctype html>`, `<html>`, `<head>`, `<body>` scaffold. It calls `wp_head()`
and `wp_footer()` to preserve plugin compatibility (admin bar, SEO plugins,
analytics, security plugins all continue to inject as they would on a normal
theme page). It does NOT call `get_header()`, `get_footer()`, or include any
other theme template parts. A `goqw-react-host` body class is applied to
allow future CSS targeting if needed.

**Scope guards:** The filter is a no-op in the admin context, during REST
requests, during WP-Cron, and during WP-CLI execution. Only frontend page
requests are affected. Routes not in `SiteRoutes::PATHS` are unaffected; the
theme continues to render them normally.

## Consequences

### Positive

- React-hosted routes render without WordPress/theme chrome. The visible
  product matches the `product-vision.md` design constraint.
- WordPress remains the CMS and operational backend. wp-admin, options, REST
  endpoints, plugin compatibility are all preserved.
- The theme stays in place for wp-admin and any future non-React surface;
  switching themes does not affect React routes.
- Plugin compatibility is preserved via `wp_head()` and `wp_footer()`.
- The architecture is reusable across all client clones with no per-client
  customization needed for the rendering layer.
- The `template_include` filter is the WordPress-canonical mechanism for
  overriding template selection; no hooks are abused.

### Negative

- The plugin now owns a piece of the rendering surface previously owned by the
  theme. This couples the plugin more deeply to WordPress's request lifecycle.
- Themes that enqueue assets in `header.php` rather than via
  `wp_enqueue_scripts` will not have those assets available on React routes.
  Most modern themes use the standard enqueue mechanism; fragile themes are not
  a supported use case.

### Risks accepted

- A future theme change might rely on suppressed theme template parts for some
  functionality. Mitigation: the architecture is per-route, not theme-wide.
- Theme CSS may still be enqueued via `wp_head()` on React routes if the theme
  registers it normally. This is acceptable: the React bundle takes visual
  precedence and theme stylesheets become inert background data.
- SEO meta tags emitted by `wp_head()` reflect WordPress's page-level data
  (Site Root page) rather than React route-specific content. This is accepted
  for 5.5b-architecture; richer per-route SEO meta is deferred to future work.

## Alternatives considered

### Option A — Full headless React control

WordPress serves a single nearly-empty HTML page; the React app's router
controls all visible output. WordPress is backend-only.

**Rejected because:** Too aggressive for the current product stage. The hybrid
(Option C) achieves the same visual outcome while preserving WordPress's role
as the CMS. Full headless would require the plugin to own SEO meta tags,
structured data injection, and other concerns that have not been needed yet.

### Option B — Embedded React (state before this ADR)

The React app mounts inside the theme's standard page rendering pipeline. The
theme's header, footer, and page title remain visible.

**Rejected because:** Fails the design constraint. The nested-application
appearance is incompatible with client deployments and would not pass any
client review.

### Option C variants considered

- **Plugin-provided page template via `theme_page_templates` filter.** Rejected
  because it requires the Site Root page to be manually configured to use the
  plugin's template via wp-admin. The `template_include` approach is automatic
  for all matching routes with no per-site manual configuration.

- **`template_redirect` with custom output.** Rejected because it bypasses the
  WordPress template hierarchy entirely. `template_include` returning a custom
  template file is the WordPress-canonical mechanism and less invasive.

## Implementation

- `plugins/quote-wizard/src/Routing/RenderingArchitecture.php` — filter class
- `plugins/quote-wizard/templates/react-host.php` — minimal template
- `plugins/quote-wizard/src/Plugin.php` — registers the filter at boot
- `plugins/quote-wizard/tests/Unit/Routing/RenderingArchitectureTest.php` — tests

## Cross-references

- ADR-0014 (Reference Template Product Scope) — establishes that clones must
  appear visually distinct; this ADR satisfies that constraint at the rendering
  layer.
- ADR-0016 (Site Shell and Reference Pages) — defines the five React-hosted
  routes.
- `docs/product-vision.md` — design constraints driving this decision.
- `docs/phase-5-evidence.md` — 5.5b-architecture verification recording the
  first operational enforcement of this architecture.

## Amendment (2026-06-12): Asset Enqueue Gate Bug (Step 5.5b-architecture-fix)

**Bug discovered post-deployment:** React-hosted routes rendered blank pages.
The JavaScript bundle was not enqueued; the React app never mounted.

**Root cause:** `AssetLoader::current_page_has_shortcode()` was the sole gate
controlling bundle enqueueing. Under the minimal template (`react-host.php`),
WordPress's `the_content()` is never called and shortcode evaluation never
fires. The gate always returned false for React routes; the bundle was never
enqueued regardless of request path.

**Fix:** A shared helper `SiteRoutes::is_current_request_react_route()` is
added. It consolidates the scope guards (admin, REST, CRON, CLI) and path
recognition into a single callable method. `AssetLoader` gains a private
`should_enqueue_for_request()` method that returns
`SiteRoutes::is_current_request_react_route() || self::current_page_has_shortcode()`.
`maybe_enqueue()` is updated to call `should_enqueue_for_request()` instead
of `current_page_has_shortcode()` directly.

**Refactor:** `RenderingArchitecture::filter_template_for_react_routes()` and
`RouteInterceptor::maybe_intercept()` are updated to delegate their inline
scope guards to `SiteRoutes::is_current_request_react_route()`. Behavior is
preserved; guard duplication is eliminated.

**Lesson recorded in ADR-0018:** Operational verification must confirm visible
React UI render, not just HTML response shape. See ADR-0018 amendment
(2026-06-12).
