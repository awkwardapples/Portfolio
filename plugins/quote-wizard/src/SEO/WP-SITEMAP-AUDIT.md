# Phase 0 Audit — WP Core Sitemap (Step 5.10b)

Audit performed prior to SitemapGenerator implementation.

## Current sitemap state

- `/wp-sitemap.xml` — WordPress 5.5+ auto-generates this. Returns 200 with XML
  listing pages, posts, and other post types. For this template it lists the
  single Site Root page (`goqw-site-root`) and any sample/draft pages.
- `/sitemap.xml` — Returns 404. No custom sitemap exists.

## WP core sitemap disable mechanism

The `wp_sitemaps_enabled` filter is the canonical way to disable WordPress's
built-in sitemap:

```php
add_filter( 'wp_sitemaps_enabled', '__return_false' );
```

This must be registered before `wp_loaded` fires. Hooking it in `Plugin::boot()`
(called on `plugins_loaded`) is safe.

## Custom /sitemap.xml routing

WordPress's `add_rewrite_rule()` with `'top'` priority registers the rule before
any catch-all rules. The pattern `'^sitemap\.xml$'` will match `/sitemap.xml`
before any React route rewrite rule matches it.

Rewrite rule:

```php
add_rewrite_rule( '^sitemap\.xml$', 'index.php?goqw_sitemap=1', 'top' );
```

The `goqw_sitemap` query var must be registered via the `query_vars` filter.

## Rewrite flush

`Activator::activate()` already calls `flush_rewrite_rules()` at the end of
`setup_site_routing()`. The new sitemap rewrite rule (registered in `'init'` via
`SitemapGenerator::register()`) will flush correctly on plugin re-activation.

For development: after activating the plugin for the first time with this change,
visit **Settings → Permalinks** and click Save to flush the rewrite rules.

## Verification commands

```bash
# After deployment, verify:
curl -I http://fencing-lead-platform-dev.local/sitemap.xml     # expect 200 text/xml
curl -I http://fencing-lead-platform-dev.local/wp-sitemap.xml  # expect 404
```
