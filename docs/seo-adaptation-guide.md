# SEO Adaptation Guide

How to use and customize the template's SEO infrastructure for per-client
deployments.

**Audience:** Project owner performing per-client deployments. Assumes
familiarity with WordPress, wp-cli, and the template's fork-and-customize
workflow (see `docs/fork-procedure.md`).

**Scope:** This guide covers all four SEO layers: Layer 1 (on-page basics),
Layer 2 (LocalBusiness schema), Layer 3 (Service schema), and Layer 4
(sitemap.xml and robots.txt).

**Last updated:** 2026-06-25

---

## What Layer 1 SEO provides

Every React-hosted route on a deployed client site emits the following,
server-side via `wp_head()`:

1. **Page title** — A unique `<title>` tag per route. Search engines display
   this in results and browser tabs.
2. **Meta description** — A 1-2 sentence summary used in search-result snippets.
3. **Canonical URL** — Tells search engines the authoritative URL for the page,
   preventing duplicate-content issues.
4. **Open Graph tags** — Used by Facebook, LinkedIn, Slack, and other platforms
   when the URL is shared. Controls the title, description, image, and type that
   appear in link previews.
5. **Twitter Card tags** — Used by X/Twitter for rich link previews.

These tags emit from PHP before the page is served. No JavaScript is required
for crawlers to read them.

---

## The five React routes

The template has five React-hosted routes. Each has its own SEO content:

| Route       | Default title                                | Default description summary                   |
| ----------- | -------------------------------------------- | --------------------------------------------- |
| `/`         | Acme Fencing — Professional Fencing Services | Services across south east. Get a free quote. |
| `/services` | Our Services — Acme Fencing                  | Services offered. Reliable, quality work.     |
| `/our-work` | Our Recent Work — Acme Fencing               | Examples of completed projects.               |
| `/contact`  | Contact — Acme Fencing                       | Get in touch for a quote.                     |
| `/quote`    | Get a Free Quote — Acme Fencing              | Use our online quote wizard.                  |

The canonical demo (Acme Fencing) uses fencing-specific default copy. Per-client
deployments override with their own business content.

---

## Per-client SEO customization

Each per-client deployment customizes SEO content through WordPress options.
There are three tiers, applied in priority order:

1. **Per-client `goqw_seo_*` option (highest priority)** — Stored in `wp_options`.
   Takes effect immediately when set; falls back to tier 2 when empty or absent.
2. **Template default** — Defined in `SEORouteContent.php`. Acme Fencing demo
   content. Takes effect for any option not explicitly set.
3. **Implicit fallback (lowest priority)** — If `SEORouteContent::get_content()`
   returns null (unrecognized route), WordPress's own title and no description
   are used. Does not apply to any of the five standard routes.

Options follow this naming pattern: `goqw_seo_<field>_<route_slug>`

### Route-to-slug mapping

| Route       | Slug                                   |
| ----------- | -------------------------------------- |
| `/`         | `home`                                 |
| `/services` | `services`                             |
| `/our-work` | `our_work` (hyphen becomes underscore) |
| `/contact`  | `contact`                              |
| `/quote`    | `quote`                                |

### Full options reference

| Option key                      | Default value (template)                     | Purpose                     |
| ------------------------------- | -------------------------------------------- | --------------------------- |
| `goqw_seo_title_home`           | Acme Fencing — Professional Fencing Services | Title for `/`               |
| `goqw_seo_title_services`       | Our Services — Acme Fencing                  | Title for `/services`       |
| `goqw_seo_title_our_work`       | Our Recent Work — Acme Fencing               | Title for `/our-work`       |
| `goqw_seo_title_contact`        | Contact — Acme Fencing                       | Title for `/contact`        |
| `goqw_seo_title_quote`          | Get a Free Quote — Acme Fencing              | Title for `/quote`          |
| `goqw_seo_description_home`     | (See `SEORouteContent.php` DEFAULTS)         | Description for `/`         |
| `goqw_seo_description_services` | (See `SEORouteContent.php` DEFAULTS)         | Description for `/services` |
| `goqw_seo_description_our_work` | (See `SEORouteContent.php` DEFAULTS)         | Description for `/our-work` |
| `goqw_seo_description_contact`  | (See `SEORouteContent.php` DEFAULTS)         | Description for `/contact`  |
| `goqw_seo_description_quote`    | (See `SEORouteContent.php` DEFAULTS)         | Description for `/quote`    |
| `goqw_seo_og_image`             | Plugin placeholder (`og-image-default.png`)  | URL of Open Graph image     |

---

## Per-client SEO setup checklist

Complete these steps when deploying for a new client.

### Step 1 — Write and set all page titles

Write a unique, descriptive title for each of the five routes. Aim for
50-60 characters. Include the business name and a key phrase.

Example titles for "Scott's Building Services":

```
/         Scott's Building Services — Surrey Construction & Repairs
/services Construction Services — Scott's Building Services
/our-work Recent Projects — Scott's Building Services
/contact  Contact Scott's Building Services — Surrey
/quote    Get a Free Quote — Scott's Building Services
```

Set each via wp-cli (run from LocalWP's site shell):

```bash
wp option update goqw_seo_title_home "Scott's Building Services — Surrey Construction & Repairs"
wp option update goqw_seo_title_services "Construction Services — Scott's Building Services"
wp option update goqw_seo_title_our_work "Recent Projects — Scott's Building Services"
wp option update goqw_seo_title_contact "Contact Scott's Building Services — Surrey"
wp option update goqw_seo_title_quote "Get a Free Quote — Scott's Building Services"
```

### Step 2 — Write and set all meta descriptions

Write a unique description for each route. Target 130-160 characters.
Describe what the user finds on that page. Include relevant keywords
naturally — do not keyword-stuff.

Example descriptions:

```
/         Scott's Building Services provides expert construction, repairs, and
          handyman services across Surrey. Free quotes for all projects.

/services Construction services from Scott's Building Services — fencing,
          decking, painting, and general repairs. Quality work guaranteed.

/our-work View recent construction and repair projects completed by Scott's
          Building Services across Surrey. See examples of our work.

/contact  Get in touch with Scott's Building Services for free quotes,
          consultations, or to discuss your construction project.

/quote    Get an instant free quote for construction, repairs, or handyman
          services in Surrey. Easy online quote wizard.
```

Set via wp-cli (same pattern as titles):

```bash
wp option update goqw_seo_description_home "Scott's Building Services provides expert construction, repairs, and handyman services across Surrey. Free quotes for all projects."
wp option update goqw_seo_description_services "Construction services from Scott's Building Services — fencing, decking, painting, and general repairs. Quality work guaranteed."
wp option update goqw_seo_description_our_work "View recent construction and repair projects completed by Scott's Building Services across Surrey. See examples of our work."
wp option update goqw_seo_description_contact "Get in touch with Scott's Building Services for free quotes, consultations, or to discuss your construction project."
wp option update goqw_seo_description_quote "Get an instant free quote for construction, repairs, or handyman services in Surrey. Easy online quote wizard."
```

### Step 3 — Set the Open Graph image

Either:

- Use the template placeholder (`og-image-default.png`) — ships with the
  plugin, shows "Acme Fencing" branding, so this should only be used
  temporarily.
- Upload a custom image and set its URL.

To create and set a custom image:

1. Create a PNG or JPG at exactly 1200×630 pixels.
2. Include the client's logo, business name, and brand colors.
3. Keep the file size under 300 KB.
4. Upload via WordPress Admin → Media → Add New.
5. Copy the full URL from the attachment details.
6. Set it:

```bash
wp option update goqw_seo_og_image "https://client-site.local/wp-content/uploads/2026/06/og-image.png"
```

To verify the current setting:

```bash
wp option get goqw_seo_og_image
```

### Step 4 — Verify the SEO tags are correct

After setting all options, view source on each of the five routes and
confirm the expected output is present.

**What to check in view-source:**

```html
<!-- Title -->
<title>Your Title Here</title>

<!-- Description -->
<meta name="description" content="Your description here." />

<!-- Canonical -->
<link rel="canonical" href="https://your-site.local/" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Your Title Here" />
<meta property="og:description" content="Your description here." />
<meta property="og:url" content="https://your-site.local/" />
<meta property="og:image" content="https://your-site.local/.../og-image.png" />
<meta property="og:site_name" content="Business Name" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Your Title Here" />
<meta name="twitter:description" content="Your description here." />
<meta name="twitter:image" content="https://your-site.local/.../og-image.png" />
```

**Test Open Graph rendering (staging/production only):**

- https://www.opengraph.xyz/ — paste the URL; confirms OG preview appearance.
- https://metatags.io/ — alternative OG preview tool.
- https://cards-dev.twitter.com/validator — Twitter Card preview.

**Verify OG image loads:**

Take the `og:image` URL from view-source and paste it directly into a browser
address bar. The image should render at 1200×630.

---

## Common patterns and considerations

### Title length

Google truncates titles longer than 60 characters in search results. Keep
all five titles under 60 characters where possible.

Good pattern: `<Business Name> — <Page Topic>` or `<Page Topic> — <Business Name>`

Avoid: Generic copy ("Welcome to [Business]"), keyword lists, or titles that
don't reflect what the page actually contains.

### Description length

Meta descriptions over 160 characters get truncated. Under 120 characters
is often not informative enough. Aim for 130-160.

Descriptions directly affect click-through rate, not rankings. Write for
the human reader, not the algorithm.

### Local SEO

Per-client deployments benefit from including the service location in
titles and descriptions. "Surrey" or "South East London" in the homepage
title and description helps with "near me" and local service-area searches.

### Brand voice consistency

Copy should sound like the client's brand. If the client's website is
conversational, the SEO copy should be too. If it's formal, keep it formal.
Consistency between SEO previews and the actual page content improves
conversion once visitors arrive.

### Open Graph image best practices

- 1200×630 pixels (the Open Graph standard).
- File size under 300 KB (larger files slow preview loading).
- Business name or logo visible in the center third of the image.
- Brand colors, not the Acme Fencing deep-blue placeholder.
- Avoid small text (often unreadable at social preview thumbnail sizes).
- High contrast: the image may appear on white or dark backgrounds in different
  social platforms.

### og:type

All five routes use `og:type = "website"`. This is correct — none of the
routes are articles, products, or profiles. Do not change this.

---

## Verifying SEO after each change

Each time you update an option, hard-reload the affected page and view
source to confirm the new value appears. WordPress does not cache these
emissions, so changes take effect immediately.

```bash
# Confirm the option is set to what you expect:
wp option get goqw_seo_title_home

# Then hard-reload in the browser (Ctrl+Shift+R / Cmd+Shift+R).
# Then view source and search for <title>.
```

---

## Reverting to template defaults

To revert any SEO option to its template default, delete the option:

```bash
wp option delete goqw_seo_title_home
wp option delete goqw_seo_description_home
```

After deletion, the template default from `SEORouteContent.php` takes
effect immediately on the next page load.

To revert the OG image to the plugin placeholder:

```bash
wp option delete goqw_seo_og_image
```

---

## Layer 2 — LocalBusiness schema setup

`LocalBusinessSchemaEmitter` emits a `schema.org/LocalBusiness` JSON-LD block on every React
route. This tells search engines that the site represents a physical local business — critical
for local pack inclusion and "near me" searches.

### LocalBusiness options reference

| Option                             | Schema field   | Notes                                            |
| ---------------------------------- | -------------- | ------------------------------------------------ |
| `goqw_business_name`               | `name`         | Defaults to WordPress site name if unset         |
| `goqw_business_phone`              | `telephone`    | Omitted from schema when empty                   |
| `goqw_business_email`              | `email`        | Omitted from schema when empty                   |
| `goqw_business_address`            | `address`      | Multi-line; parsed automatically (see below)     |
| `goqw_business_address_structured` | `address`      | JSON override; takes precedence over the above   |
| `goqw_business_hours`              | `openingHours` | Comma-separated opening hours spec (see below)   |
| `goqw_business_service_area`       | `areaServed`   | Omitted from schema when empty                   |
| `goqw_business_price_range`        | `priceRange`   | E.g. `"££"`. Omitted from schema when empty      |
| `goqw_social_facebook`             | `sameAs` array | Full URL, e.g. `https://facebook.com/clientpage` |
| `goqw_social_instagram`            | `sameAs` array | Full URL                                         |
| `goqw_social_twitter`              | `sameAs` array | Full URL (use `https://x.com/handle`)            |
| `goqw_social_linkedin`             | `sameAs` array | Full URL                                         |

### Address format

Set `goqw_business_address` as a multi-line string — one part per line:

```
12 High Street
Guildford
GU1 3AA
```

The plugin parses this automatically:

- Line 1 → `streetAddress`
- Line 2 (when 3 lines) → `addressLocality`
- Last line → `postalCode`
- `addressCountry` is always `"GB"` (UK deployments)

For non-standard addresses or non-UK deployments, use `goqw_business_address_structured` instead —
a JSON string that maps directly to schema.org `PostalAddress`:

```bash
wp option update goqw_business_address_structured '{"@type":"PostalAddress","streetAddress":"12 High Street","addressLocality":"Guildford","addressRegion":"Surrey","postalCode":"GU1 3AA","addressCountry":"GB"}'
```

### Opening hours format

`goqw_business_hours` is a comma-separated list of opening hours specification strings as
defined by schema.org/openingHours:

```
Mo-Fr 08:00-18:00, Sa 09:00-14:00
```

Set via wp-cli:

```bash
wp option update goqw_business_hours "Mo-Fr 08:00-18:00, Sa 09:00-14:00"
```

Use `Mo Tu We Th Fr Sa Su` for days. `Mo-Fr` means Monday through Friday.

### LocalBusiness setup checklist

```bash
# Core business identity
wp option update goqw_business_name "Scott's Building Services"
wp option update goqw_business_phone "07700 123456"
wp option update goqw_business_email "hello@scottsbuilding.co.uk"

# Address (multi-line — use $'...' syntax for newlines in bash)
wp option update goqw_business_address $'12 High Street\nGuildford\nGU1 3AA'

# Opening hours
wp option update goqw_business_hours "Mo-Fr 08:00-18:00, Sa 09:00-14:00"

# Service area
wp option update goqw_business_service_area "Surrey and surrounding areas"

# Price range (optional)
wp option update goqw_business_price_range "££"

# Social profiles (set only the ones the client has)
wp option update goqw_social_facebook "https://facebook.com/scottsbuilding"
wp option update goqw_social_instagram "https://instagram.com/scottsbuilding"
```

### Verifying LocalBusiness schema

View source on any React route and search for `application/ld+json`. You should see a block like:

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Scott's Building Services",
  "telephone": "07700 123456",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "12 High Street",
    "addressLocality": "Guildford",
    "postalCode": "GU1 3AA",
    "addressCountry": "GB"
  }
}
```

Use Google's Rich Results Test (search for it) to validate the structured data.

---

## Layer 3 — Service schema setup

`ServiceSchemaEmitter` emits one `schema.org/Service` JSON-LD block per active service — one
block for each service the client offers. These help search engines understand what the business
does and can appear in rich results.

### Which services appear

By default (when `goqw_enabled_services` is empty), all 11 template services are included. This
option is already used by the wizard to determine which services to show — the schema emitter
reads the same option.

To limit schema to only the services the client actually offers:

```bash
# Example: client only does fencing, decking, and painting
wp option update goqw_enabled_services "fencing,decking,painting"
```

The full list of service IDs is:

| ID                | Service name          | Category          |
| ----------------- | --------------------- | ----------------- |
| `fencing`         | Fencing               | Landscaping       |
| `decking`         | Decking               | Landscaping       |
| `patio`           | Patio & Paving        | Landscaping       |
| `driveway`        | Driveway              | Landscaping       |
| `steps`           | Garden Steps          | Landscaping       |
| `painting`        | Painting & Decorating | Decorating        |
| `jetwash`         | Pressure Washing      | Exterior Cleaning |
| `general-repairs` | General Repairs       | Handyman Services |
| `plumbing`        | Plumbing              | Handyman Services |
| `electrical`      | Electrical            | Handyman Services |
| `carpentry`       | Carpentry             | Handyman Services |

Service names and descriptions are defined in `ServiceSchemaEmitter.php`'s `SERVICES` constant.
They are not configurable via options (they mirror `services-content.ts`).

The `areaServed` field on each Service schema block comes from `goqw_business_service_area` —
the same option as Layer 2.

### Verifying Service schema

View source on any React route and search for `"@type": "Service"`. You should see one block per
active service, each referencing the business by name in the `provider` field.

---

## Layer 4 — sitemap.xml and robots.txt setup

### sitemap.xml

The plugin generates a custom `/sitemap.xml` listing all five React routes. WordPress's built-in
sitemap (`/wp-sitemap.xml`) is disabled automatically — the custom one replaces it.

The sitemap is generated at request time. There are no configuration options required: it just
works once the plugin is active and rewrite rules are flushed (which activation handles).

To verify:

```bash
curl http://client-slug.local/sitemap.xml
```

You should see valid XML with five `<url>` entries (home, services, our-work, contact, quote).

**Overriding the last-modified date** (optional): By default `<lastmod>` shows today's date.
Override with:

```bash
wp option update goqw_sitemap_lastmod "2026-06-25"
```

This is useful when you know the content was last changed on a specific date. Delete the option
to revert to the dynamic fallback:

```bash
wp option delete goqw_sitemap_lastmod
```

### robots.txt

WordPress generates a `robots.txt` at the site root. The plugin appends a `Sitemap:` directive
pointing to `/sitemap.xml`. No setup is needed — it activates automatically.

To verify:

```bash
curl http://client-slug.local/robots.txt
```

The output should include:

```
Sitemap: http://client-slug.local/sitemap.xml
```

**When the site is private** (Settings → Reading → "Discourage search engines from indexing this
site"): the Sitemap directive is automatically omitted. This respects the privacy setting and
avoids submitting private sites to search engines.

### Submitting to search engines (staging/production only)

After going live, submit the sitemap to:

- **Google Search Console** — `https://search.google.com/search-console/`
  Add property → URL prefix → paste sitemap URL in Sitemaps section.
- **Bing Webmaster Tools** — `https://www.bing.com/webmasters/`
  Add site → submit sitemap URL.

---

## Reference — Where things live in the codebase

For developers wanting to understand or extend the SEO infrastructure:

| File                                                          | Purpose                                                |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| `docs/decisions/0023-seo-infrastructure.md`                   | ADR — architectural decisions and rationale            |
| `plugins/quote-wizard/src/SEO/SEORouteContent.php`            | Per-route default content and option key resolution    |
| `plugins/quote-wizard/src/SEO/SEOMetaEmitter.php`             | `wp_head` priority 5 + `pre_get_document_title` filter |
| `plugins/quote-wizard/src/SEO/LocalBusinessSchemaEmitter.php` | LocalBusiness JSON-LD, `wp_head` priority 10           |
| `plugins/quote-wizard/src/SEO/ServiceSchemaEmitter.php`       | Service JSON-LD (11 services), `wp_head` priority 11   |
| `plugins/quote-wizard/src/SEO/SitemapGenerator.php`           | Custom `/sitemap.xml`; disables WP core sitemap        |
| `plugins/quote-wizard/src/SEO/RobotsTxtCustomizer.php`        | Appends `Sitemap:` directive to `robots.txt`           |
| `plugins/quote-wizard/assets/og-image-default.png`            | Default OG placeholder image (1200×630, 13 KB)         |
| `plugins/quote-wizard/src/Plugin.php`                         | All `register()` calls in `boot()`                     |
| `plugins/quote-wizard/src/Activator.php`                      | All `add_option()` seeds including Layer 2 options     |

**To change the template-wide default content** (affects all fresh clones before
per-client customization): edit the `DEFAULTS` constant in `SEORouteContent.php`.

**To replace the template-wide default OG image** (affects all clones that haven't
set `goqw_seo_og_image`): replace `plugins/quote-wizard/assets/og-image-default.png`
with a new 1200×630 file.

---

## Troubleshooting

### "My title isn't showing / still shows Acme Fencing"

1. Confirm the option is set:
   ```bash
   wp option get goqw_seo_title_home
   ```
2. Confirm the slug matches the route. `/our-work` maps to `our_work` (underscore,
   not hyphen). If you set `goqw_seo_title_our-work` (with a hyphen), it has no
   effect.
3. Hard-reload the browser (`Ctrl+Shift+R`).
4. View source — look for `<title>` near the top of the `<head>`.
5. Verify the plugin is active and current:
   ```bash
   wp plugin status quote-wizard
   wp eval "echo GOQW_VERSION;"
   ```

### "Title shows LocalWP site name / shows blog name"

This means the `pre_get_document_title` filter is not firing. Most likely causes:

- The plugin is not active.
- The page is not a recognized React route (check that the URL matches one of
  the five paths exactly).
- A page-caching plugin served a cached copy without re-running PHP. Flush
  caches and hard-reload.

### "Open Graph preview still shows old image"

Facebook and LinkedIn cache Open Graph data aggressively (often for days).
After updating `goqw_seo_og_image`:

- **Facebook:** https://developers.facebook.com/tools/debug/ — paste the URL,
  click "Scrape Again."
- **LinkedIn:** https://www.linkedin.com/post-inspector/ — paste the URL.

Both tools force a cache refresh. Note: the change takes effect immediately for
any preview tool that doesn't cache (e.g., opengraph.xyz), but social platforms
will serve their cached version until you force a scrape.

### "Canonical URL is wrong"

The canonical URL is derived from `home_url($route)`. If the domain is wrong,
check WordPress's site URL setting:

```bash
wp option get siteurl
wp option get home
```

Both should match the public URL of the site. On LocalWP, this is typically
`http://client-slug.local`. On production, it should be `https://clientdomain.com`.

### "No description tag in view-source"

This means `SEOMetaEmitter::emit()` returned early. Check:

1. The URL is one of the five recognized paths (not `/wp-admin`, not a WP REST
   route).
2. The plugin is active.
3. Look in the plugin's error log for any PHP errors:
   ```bash
   wp eval "do_action('wp_head');" 2>&1 | head -50
   ```

### "No LocalBusiness JSON-LD block in view-source"

1. Confirm the plugin is active and you are viewing a React route (not `/wp-admin`).
2. Check `SiteRoutes::is_current_request_react_route()` is returning true for the URL.
   On LocalWP this requires the site root page and rewrites to be set up correctly.
3. If the business name, phone, and address options are all empty AND `goqw_business_name`
   doesn't fall back to anything, the schema still emits but fields are omitted. This is
   expected — set the options.
4. Run:
   ```bash
   wp eval "echo get_option('goqw_business_name');"
   ```
   If this returns empty, the option is not set — re-run the setup checklist.

### "sitemap.xml returns 404"

The sitemap rewrite rule requires flushed rewrite rules. Try:

```bash
wp rewrite flush
```

If it still 404s, deactivate and reactivate the plugin (which re-runs activation, which flushes
rules):

```bash
wp plugin deactivate quote-wizard && wp plugin activate quote-wizard
```

### "robots.txt does not contain Sitemap directive"

1. Visit `/robots.txt` — if it 404s, WordPress's virtual robots.txt is disabled by another
   plugin or theme. The `robots_txt` filter only fires if WordPress is generating the file.
2. Check if the site is set to private (Settings → Reading → "Discourage search engines"). The
   directive is intentionally omitted when `blog_public` is `0`.
3. Confirm the plugin is active.

### "Service schema shows services the client doesn't offer"

Set `goqw_enabled_services` to a comma-separated list of the service IDs the client offers:

```bash
wp option update goqw_enabled_services "fencing,decking,painting"
```

This controls both the wizard's service list and the Service JSON-LD schema.
