# ADR-0023: SEO Infrastructure

**Status:** Accepted (Step 5.10a/5.10b, June 2026)

## Context

`docs/product-vision.md` §2.4 specifies that the template provides SEO at four layers:

1. On-page basics: titles, meta descriptions, canonical URLs, Open Graph, Twitter cards.
2. Local SEO: LocalBusiness structured data schema.
3. Service schema: per-enabled-service structured data.
4. Performance and crawlability: sitemap.xml, robots.txt.

The architecture must work without requiring React to be JS-executed by crawlers. SEO content
must be present in the raw server-sent HTML. This is the same constraint that governs the
rendering architecture (ADR-0019): the minimal template bypasses the theme, so all head content
is plugin-owned.

## Decision

### SEO emission strategy

PHP-emitted, route-aware. The plugin's `SEOMetaEmitter` class hooks into the `wp_head` action
and emits route-appropriate SEO content:

- For React routes (per `SiteRoutes::is_current_request_react_route()`): emit per-route SEO
  content from `SEORouteContent`.
- For all other contexts (wp-admin, REST, CRON, CLI, unrecognized paths): no emission.

The `<title>` element is NOT emitted directly by `SEOMetaEmitter`. Instead, `SEOMetaEmitter`
hooks `pre_get_document_title` to override the title string for React routes. WordPress's
`_wp_render_title_tag()` function, which runs inside `wp_head()`, consumes this value and emits
the `<title>` element. This integrates cleanly with WordPress's title machinery (SEO plugins,
theme wrappers) without bypassing it.

The explicit `<title><?php bloginfo('name'); ?></title>` previously in `react-host.php` was
removed in Step 5.10a. The title is now emitted from within `wp_head()`.

### Per-route content

`SEORouteContent::get_content(string $route)` returns `{title, description, og_type}` for each
of the 5 React routes. Content has three resolution tiers:

1. **Per-client goqw option** (e.g., `goqw_seo_title_home`). Takes precedence when non-empty.
2. **Template default** in `SEORouteContent::DEFAULTS`. Acme Fencing demo content; usable
   out of the box and adapted by per-client clone.
3. **Fallback**: `get_bloginfo('name')` is available at emission time if needed; Tier 2
   defaults are preferred as they provide full, descriptive strings.

Route-to-slug mapping: `'/'` → `'home'`, `'/services'` → `'services'`,
`'/our-work'` → `'our_work'`, `'/contact'` → `'contact'`, `'/quote'` → `'quote'`.

### Open Graph image

A placeholder 1200×630 PNG ships in `plugins/quote-wizard/assets/og-image-default.png`
(generated at Step 5.10a; ~13 KB). Per-client clones replace with their own branding
via the `goqw_seo_og_image` option. The image URL is emitted as `og:image` and
`twitter:image` on all routes.

### Layer implementation timing

- **Layer 1** (on-page basics — titles, meta descriptions, canonical, OG, Twitter): Step 5.10a.
- **Layer 2** (LocalBusiness structured data schema): Step 5.10b.
- **Layer 3** (Service structured data schema, per enabled service): Step 5.10b.
- **Layer 4** (sitemap.xml, robots.txt): Step 5.10b.

## Files

| File                                                       | Role                                          |
| ---------------------------------------------------------- | --------------------------------------------- |
| `plugins/quote-wizard/src/SEO/SEORouteContent.php`         | Per-route content map + option resolution     |
| `plugins/quote-wizard/src/SEO/SEOMetaEmitter.php`          | wp_head hook + pre_get_document_title hook    |
| `plugins/quote-wizard/src/Plugin.php`                      | Registers SEOMetaEmitter in boot()            |
| `plugins/quote-wizard/templates/react-host.php`            | Removed hard-coded title; relies on wp_head() |
| `plugins/quote-wizard/assets/og-image-default.png`         | 1200x630 placeholder OG image                 |
| `apps/wizard/src/components/selection/ServiceSelector.tsx` | Category back button (Layer 1 UX)             |
| `apps/wizard/src/runtime/hooks/useCategorySelection.ts`    | isCategoryFilterActive pure helper            |

## Consequences

### Positive

- Crawlers without JS see complete SEO metadata (title, description, canonical, OG, Twitter)
  on every React route's server-sent HTML.
- Per-client customization via goqw options is consistent with the existing footer-content
  and wizard-config option pattern.
- Template defaults are usable immediately; per-client refinement is optional and isolated
  to option values, not code.
- `pre_get_document_title` integration means title overrides are visible to other WP plugins
  that read the document title (e.g., analytics, XML sitemaps) rather than bypassing WP.
- WordPress's `_wp_render_title_tag()` respects the `bloginfo('charset')` context and
  HTML-escapes the title value automatically.

### Negative

- New plugin module (SEO/) increases plugin code surface by 2 PHP classes.
- Route-to-content map in PHP must be updated if React routes are renamed (mitigated by
  `CrossLanguageRoutesTest` which will surface any PATHS divergence).

### Risks

- If another plugin hooks `pre_get_document_title` at the same or higher priority, titles
  could conflict. Mitigated by hook priority 10 (default) on the filter — most SEO plugins
  use higher-numbered priorities, leaving room for override if needed.
- `wp_head` priority 5 fires before most other plugins. This is intentional (our tags appear
  early in `<head>`) but could theoretically conflict with a plugin that removes duplicate tags.
  No such conflict was observed in the LocalWP environment.

## Amendment: Layers 2-4 implementation (Step 5.10b)

### Layer 2 — LocalBusiness JSON-LD schema

`LocalBusinessSchemaEmitter` hooks `wp_head` at priority 10 (after `SEOMetaEmitter` at priority 5).
It is scope-guarded to React routes only (`SiteRoutes::is_current_request_react_route()`).

**Option architecture discovery:** The footer is TypeScript-only (`footer-content.ts`). There is no
`goqw_footer_content` WP option. `LocalBusinessSchemaEmitter` reads from discrete WP options:

| Option                                            | Schema field   | Notes                                |
| ------------------------------------------------- | -------------- | ------------------------------------ |
| `goqw_business_name`                              | `name`         | Falls back to `get_bloginfo('name')` |
| `goqw_business_phone`                             | `telephone`    | Omitted when empty                   |
| `goqw_business_email`                             | `email`        | Omitted when empty                   |
| `goqw_business_address`                           | `address`      | PostalAddress heuristic (see below)  |
| `goqw_business_address_structured`                | `address`      | JSON override; takes precedence      |
| `goqw_business_hours`                             | `openingHours` | Comma-separated spec strings         |
| `goqw_business_service_area`                      | `areaServed`   | Omitted when empty                   |
| `goqw_business_price_range`                       | `priceRange`   | Omitted when empty                   |
| `goqw_social_facebook/instagram/twitter/linkedin` | `sameAs`       | Array; omit empty                    |

**PostalAddress heuristic** (for `goqw_business_address`, multi-line):

- Line 0 → `streetAddress`
- Line 1 (when 3+ lines) → `addressLocality`
- Last line → `postalCode`
- `addressCountry` defaults to `'GB'`
- Override with `goqw_business_address_structured` (JSON string) to skip heuristic.

Eight new options added to `Activator::set_default_options()`: `goqw_business_address`,
`goqw_business_hours`, `goqw_business_service_area`, `goqw_business_price_range`,
`goqw_social_facebook`, `goqw_social_instagram`, `goqw_social_twitter`, `goqw_social_linkedin`.

### Layer 3 — Service JSON-LD schema

`ServiceSchemaEmitter` hooks `wp_head` at priority 11 (one after LocalBusiness at 10, ensuring
provider context is emitted first). Also scope-guarded to React routes.

**Service registry discovery:** There is no PHP service registry. `ServiceSchemaEmitter` contains
a static `SERVICES` constant with all 11 services, mirroring `apps/wizard/src/site/content/services-content.ts`.
When services are added or renamed in TypeScript, `SERVICES` must be updated in the same commit.
See `src/SEO/SERVICE-REGISTRY-AUDIT.md`.

`get_active_services()` filters by `goqw_enabled_services` (comma-separated IDs). Empty = all 11.
This mirrors `listEnabledServiceIds()` on the TypeScript side.

Each `Service` schema block contains: `@type`, `name`, `description`, `provider` (LocalBusiness
reference with name), `category` (human-readable label from `CATEGORY_LABELS`), and `areaServed`
(from `goqw_business_service_area`, omitted when empty).

### Layer 4 — sitemap.xml and robots.txt

**WP core sitemap disabled** via `add_filter('wp_sitemaps_enabled', '__return_false')` in
`SitemapGenerator::register()`. This prevents `/wp-sitemap.xml` from being generated or served.

**Custom sitemap rewrite:** `'^sitemap\.xml` → `'index.php?goqw_sitemap=1'` registered at
`'top'` priority in `init`. The `goqw_sitemap` query var is registered via `query_vars` filter.
`template_redirect` at priority 1 intercepts and calls `generate_sitemap_xml()`, then exits.

The 5 React routes are listed in `ROUTE_METADATA` with priorities (1.0 → 0.7) and
`changefreq: monthly`. Last-modified date comes from `goqw_sitemap_lastmod` option or
`gmdate('Y-m-d')` as a fallback.

**robots.txt customization:** `RobotsTxtCustomizer` hooks `robots_txt` filter at priority 10,
appending `Sitemap: <home_url>/sitemap.xml`. When `blog_public` is `'0'` (private site), the
directive is omitted to respect the crawl-discouragement setting. WordPress's default robots.txt
already disallows `/wp-admin/` and `/wp-login.php`; those are not duplicated.

Note: the `robots_txt` filter parameter was renamed from the natural `$public` to `$blog_public`
to avoid a PHPCS reserved-keyword warning (`$public` is a reserved PHP keyword).

### Audit files

Three markdown audit documents in `src/SEO/` record Phase 0 findings (not shipped to production,
excluded via `.distignore`):

- `WP-SITEMAP-AUDIT.md` — WP core sitemap behavior and disable mechanism
- `FOOTER-OPTIONS-AUDIT.md` — footer architecture (TypeScript-only), new options needed
- `SERVICE-REGISTRY-AUDIT.md` — service registry architecture (TypeScript-only), sync discipline

## Files (updated)

| File                                                          | Role                                               |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `plugins/quote-wizard/src/SEO/SEORouteContent.php`            | Per-route content map + option resolution          |
| `plugins/quote-wizard/src/SEO/SEOMetaEmitter.php`             | wp_head priority 5 + pre_get_document_title        |
| `plugins/quote-wizard/src/SEO/LocalBusinessSchemaEmitter.php` | LocalBusiness JSON-LD, wp_head priority 10         |
| `plugins/quote-wizard/src/SEO/ServiceSchemaEmitter.php`       | Service JSON-LD (11 services), wp_head priority 11 |
| `plugins/quote-wizard/src/SEO/SitemapGenerator.php`           | Custom /sitemap.xml; disables WP core sitemap      |
| `plugins/quote-wizard/src/SEO/RobotsTxtCustomizer.php`        | Appends Sitemap directive to robots.txt            |
| `plugins/quote-wizard/src/SEO/WP-SITEMAP-AUDIT.md`            | Audit: WP core sitemap findings                    |
| `plugins/quote-wizard/src/SEO/FOOTER-OPTIONS-AUDIT.md`        | Audit: footer options discovery                    |
| `plugins/quote-wizard/src/SEO/SERVICE-REGISTRY-AUDIT.md`      | Audit: service registry discovery                  |
| `plugins/quote-wizard/src/Plugin.php`                         | Registers all 4 new emitters in boot()             |
| `plugins/quote-wizard/src/Activator.php`                      | 8 new add_option() calls for Layer 2 options       |
| `plugins/quote-wizard/templates/react-host.php`               | Removed hard-coded title; relies on wp_head()      |
| `plugins/quote-wizard/assets/og-image-default.png`            | 1200×630 placeholder OG image                      |

## Cross-references

- ADR-0019: Rendering architecture (react-host.php template)
- ADR-0020: Section library architecture
- ADR-0017: Category navigation (category back button is adjacent to this work)
- `docs/product-vision.md` §2.4: SEO infrastructure specification
