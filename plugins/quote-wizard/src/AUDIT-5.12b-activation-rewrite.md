# Audit C — Plugin Activation Rewrite Flush (5.12b)

_Performed: 2026-07-07_

## File examined

`plugins/quote-wizard/src/Activator.php`

## Current behavior

`Activator::activate()` calls `setup_site_routing()` which:

1. Creates the Site Root page (`SiteRootPage::ensure()`)
2. Applies front-page policy (`FrontPagePolicy::apply_on_activation()`)
3. Calls `RewriteRegistrar::register()` — adds React route rewrite rules directly
4. Calls `flush_rewrite_rules()` — flushes all registered rewrite rules to DB

`flush_rewrite_rules()` IS present and runs at the correct position (after
`RewriteRegistrar::register()`). React routes work immediately after activation.

## Bug: SitemapGenerator rewrite rule not flushed

`SitemapGenerator::register()` hooks `add_rewrite_rule()` to the `init` action:

```php
add_action( 'init', array( __CLASS__, 'add_rewrite_rule' ) );
```

During plugin activation, the WordPress `init` hook has already fired BEFORE the
activation hook runs. Because the plugin was not yet active during that `init` fire,
`SitemapGenerator::add_rewrite_rule()` was never called. Therefore:

- When `flush_rewrite_rules()` runs in `setup_site_routing()`, the sitemap rewrite
  rule (`^sitemap\.xml$`) has NOT been registered in WordPress's in-memory rules.
- The rule is flushed to the database WITHOUT the sitemap entry.
- After activation, subsequent requests fire `init`, which calls
  `SitemapGenerator::add_rewrite_rule()` and adds the rule in memory — but it is
  never flushed to the database until a manual `wp rewrite flush` is run.

**Result:** `/sitemap.xml` returns 404 after a fresh plugin activation until
`wp rewrite flush` is run manually (which is what SCB had to do).

React route rewrites are NOT affected because `RewriteRegistrar::register()` is
called directly in `setup_site_routing()`, not via a hook.

## Fix

Add a direct call to `SitemapGenerator::add_rewrite_rule()` in `setup_site_routing()`
before `flush_rewrite_rules()`, mirroring the pattern used for `RewriteRegistrar`:

```php
use Agency\QuoteWizard\SEO\SitemapGenerator;

private static function setup_site_routing(): void {
    $page      = new SiteRootPage();
    $policy    = new FrontPagePolicy( $page );
    $registrar = new RewriteRegistrar();

    $page->ensure();
    $policy->apply_on_activation();
    $registrar->register();
    SitemapGenerator::add_rewrite_rule();  // add this line
    flush_rewrite_rules();
}
```

`SitemapGenerator::add_rewrite_rule()` is public and static — it can be called
directly without any side effects. Calling it both here (activation) and via the
`init` hook (every normal request) is safe because `add_rewrite_rule()` is idempotent
(WordPress deduplicates rules by regex key).

## Verification

After this fix:

1. Fresh activation (deactivate → delete → reinstall → activate)
2. `curl -I http://site.local/sitemap.xml` → HTTP 200 without any manual flush
