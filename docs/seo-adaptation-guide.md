# SEO Adaptation Guide

How to use and customize the template's SEO infrastructure for per-client
deployments.

**Audience:** Project owner performing per-client deployments. Assumes
familiarity with WordPress, wp-cli, and the template's fork-and-customize
workflow (see `docs/fork-procedure.md`).

**Scope:** This guide covers SEO Layer 1 (on-page basics), which is what
the template provides as of Step 5.10a. Layers 2-4 (LocalBusiness schema,
Service schema, sitemap.xml, robots.txt) are documented separately after
they are implemented in Step 5.10b. See the "Coming next" section at the
bottom.

**Last updated:** 2026-06-24

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

## Coming next: Layers 2-4 SEO infrastructure

The following is planned for Step 5.10b. **This section will be replaced with
actual usage instructions when 5.10b lands.** Until then, these capabilities
are NOT available in the template:

- **Layer 2 — LocalBusiness schema.** Structured JSON-LD data marking the site
  as a local business (name, address, phone, hours, service area). Important for
  local pack inclusion and "near me" search results.

- **Layer 3 — Service schema.** Structured JSON-LD describing each service the
  business offers. Helps search engines categorize the business's capabilities.

- **Layer 4 — sitemap.xml and robots.txt.** Crawlability infrastructure. Tells
  search engines where to find content and what to index.

When 5.10b is implemented, this guide will be extended with setup and
customization steps for each layer.

---

## Reference — Where things live in the codebase

For developers wanting to understand or extend the SEO infrastructure:

| File                                               | Purpose                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `docs/decisions/0023-seo-infrastructure.md`        | Architectural decision record — the why behind every design choice |
| `plugins/quote-wizard/src/SEO/SEORouteContent.php` | Per-route default content and option key resolution                |
| `plugins/quote-wizard/src/SEO/SEOMetaEmitter.php`  | `wp_head` hook and `pre_get_document_title` filter                 |
| `plugins/quote-wizard/assets/og-image-default.png` | Default OG placeholder image (1200×630, 13 KB)                     |
| `plugins/quote-wizard/src/Plugin.php`              | `SEOMetaEmitter::register()` called in `boot()`                    |

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
