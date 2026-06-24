# wp_head() Audit — Pre-5.10a State

**Date:** 2026-06-24  
**Purpose:** Document current state of `<head>` emission before SEOMetaEmitter is added.

## Current react-host.php `<head>` output

File: `plugins/quote-wizard/templates/react-host.php`

```php
<head>
  <meta charset="<?php bloginfo( 'charset' ); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php bloginfo( 'name' ); ?></title>
  <link rel="profile" href="https://gmpg.org/xfn/11">
  <?php wp_head(); ?>
</head>
```

### Finding: Hard-coded `<title>` using `bloginfo('name')`

Line 21 of `react-host.php` emits `<title><?php bloginfo('name'); ?></title>`. This outputs
the WordPress site title (e.g., "fencing-lead-platform-dev") identically on every React route.
It is not route-specific and does not respond to per-route SEO configuration.

**Action required:** Remove this explicit `<title>` tag. SEOMetaEmitter hooks into
`pre_get_document_title` (which feeds WordPress's `_wp_render_title_tag()` call inside
`wp_head()`) to emit route-specific titles. The native WordPress title tag machinery emits the
`<title>` element from within `wp_head()` itself — no explicit `<title>` in the template.

### wp_head() plugins already injecting into `<head>`

When verified on the canonical LocalWP site (`fencing-lead-platform-dev.local`), the following
content appears from `wp_head()`:

- WordPress generator meta tag
- WordPress emoji detection scripts (standard, not removable without filter)
- WordPress admin bar CSS (when logged in)
- Plugin-injected stylesheet (`quote-wizard-style.css` via `AssetLoader`)
- Plugin-injected script (`quote-wizard.js` via `AssetLoader`)
- Plugin-injected `window.GOQW_CONFIG` inline script via `wp_add_inline_script`

### No existing custom meta tags

As of pre-5.10a, there are **no** custom `<meta name="description">`, Open Graph, or Twitter
card tags in the output. SEOMetaEmitter adds all of these fresh with no collision risk.

### No title-related filters from other plugins

No theme or other plugin is registered on `pre_get_document_title`. SEOMetaEmitter's
`pre_get_document_title` hook (added in 5.10a) will be the sole consumer.

## What 5.10a changes

1. Remove hard-coded `<title>` from `react-host.php`.
2. Add `SEOMetaEmitter::register()` in `Plugin::boot()`.
3. `SEOMetaEmitter` hooks `wp_head` (priority 5) to emit meta description, canonical, OG, Twitter.
4. `SEOMetaEmitter` hooks `pre_get_document_title` to override the title for React routes.
5. `wp_head()` now also emits the route-specific `<title>` via WordPress's `_wp_render_title_tag()`.

## SiteRoutes::current_request_path() return type note

The spec draft mentions `?string` (nullable) but the actual implementation returns `string`
(always non-null — falls back to `'/'`). SEOMetaEmitter::emit() calls `get_content()` on the
string result directly; the null check on the content return value is the real guard.
