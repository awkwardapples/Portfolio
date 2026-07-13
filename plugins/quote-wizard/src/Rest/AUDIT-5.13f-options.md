# Audit B — WordPress Options Currently Used (5.13f)

_Performed: 2026-07-13_

## Existing options (from `Activator::set_default_options()`)

| Option key                                                            | Purpose                                                               |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `goqw_webhook_url`                                                    | Make.com webhook URL (also `GOQW_MAKE_WEBHOOK_URL` constant override) |
| `goqw_agency_notification_email`                                      | Ops notification email                                                |
| `goqw_business_name`                                                  | Public — wizard UI                                                    |
| `goqw_business_phone`                                                 | Public — wizard UI                                                    |
| `goqw_business_email`                                                 | Public — wizard UI                                                    |
| `goqw_primary_color`                                                  | Public — branding                                                     |
| `goqw_calendly_url`                                                   | Public — post-submit CTA                                              |
| `goqw_plugin_version`                                                 | Internal — set to `GOQW_VERSION`                                      |
| `goqw_wizard_id`                                                      | Selects the active vertical                                           |
| `goqw_enabled_services`                                               | Comma-separated service allowlist                                     |
| `goqw_enable_category_navigation`                                     | Bool — category selector phase                                        |
| `goqw_business_address` / `_hours` / `_service_area` / `_price_range` | SEO Layer 2 (LocalBusiness schema)                                    |
| `goqw_social_facebook` / `_instagram` / `_twitter` / `_linkedin`      | SEO Layer 2 (sameAs)                                                  |

## Naming pattern

- Prefix: `goqw_` (enforced by PHPCS `WordPress.NamingConventions.PrefixAllGlobals`,
  configured in `phpcs.xml.dist` with prefixes `goqw_`, `GOQW_`, `Agency\QuoteWizard`).
- Sensitive values (webhook URL) support a same-named-but-uppercase `GOQW_*` PHP
  constant that takes precedence over the option — see `Support/Settings.php`'s
  documented precedence chain (constant → option → default). This is the existing,
  established pattern for secrets; it is reused for the Turnstile secret key rather
  than inventing a new convention.
- All options are seeded with `add_option()` in `Activator::set_default_options()`
  (idempotent — `add_option()` is a no-op if the option already exists).

## Existing settings-access class

`Support/Settings.php` is a "typed access to plugin settings" class that already wraps
`get_option()`/constant-precedence for `webhook_url()`, `business_name()`,
`retention_days()`, etc. — precisely the responsibility the spec's proposed
`Support/BotProtectionConfig.php` would duplicate. **Deviation from spec:** the new
bot-protection getters are added to `Settings.php` instead of a new parallel class, to
avoid two competing "typed settings" abstractions in the same namespace. See ADR-0027.

## New options for 5.13f

| Option key                    | Type   | Default | Exposed to browser?                                                                                                               |
| ----------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `goqw_bot_protection_enabled` | bool   | `1`     | No (server-side gate only)                                                                                                        |
| `goqw_turnstile_site_key`     | string | `''`    | **Yes** — via `PublicConfig::build()` (public by Cloudflare's own design; site keys are meant to be embedded in client-side HTML) |
| `goqw_turnstile_secret_key`   | string | `''`    | No — sensitive, server-side verification only, supports `GOQW_TURNSTILE_SECRET_KEY` constant override like the webhook URL        |
| `goqw_rate_limit_per_hour`    | int    | `5`     | No                                                                                                                                |

All four seeded in `Activator::set_default_options()` alongside the existing options.

## `PublicConfig::build()` — the browser-exposure boundary

`Frontend/PublicConfig.php`'s own docblock states the architectural rule directly:
"Adding a new field to what the browser sees REQUIRES a code change in this one method.
There is no automatic mechanism that exposes new options." This is exactly where
`turnstileSiteKey` must be added — it is the single, already-established extension
point for anything the React app needs to read from `window.GOQW_CONFIG`, and its
"Fields explicitly NOT exposed" comment block is where `turnstileSiteKey` should be
listed as _not_ excluded (i.e., explicitly confirmed safe to expose) to keep the
documented allowlist accurate. The secret key must never appear in this method.
