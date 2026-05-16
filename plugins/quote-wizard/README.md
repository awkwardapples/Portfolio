# `plugins/quote-wizard` — the WordPress plugin

The PHP side of the quote wizard system. Hosts the React app, exposes the REST submission endpoint, persists submissions, and forwards to Make.com.

For project-wide context see the [repository root README](../../README.md) and [`docs/`](../../docs).

---

## Status

| Phase                       | Status                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| **Step 3D** (this scaffold) | ✅ Plugin activates, shortcode renders mount div, `goqw_submissions` table created, tooling wired |
| **Step 3E**                 | React bundle enqueueing                                                                           |
| **Step 5.1**                | Real submission handler (Validator, Sanitiser, ImageHandler, Repository, MakeForwarder)           |
| **Step 5.7**                | wp-admin Settings page                                                                            |
| **Step 6.5**                | Submission pruning cron                                                                           |

Files marked "STUB FOR STEP 3D" in their docblock are placeholders with correct signatures but no behaviour. They exist so the autoloader, hook wiring, and class hierarchy are real now, and so step 5.1 has a clear place to put code.

---

## Configuration model

Settings are resolved in this precedence order (highest first):

1. **PHP constant in `wp-config.php`** — for secrets and pinning production values.
2. **`wp_options` entry** — settable via wp-admin Settings page or WP-CLI.
3. **Compiled-in default** — never a real value.

The recognised constants and options:

| Constant (`wp-config.php`)       | wp_options key                   | Public-safe?       |
| -------------------------------- | -------------------------------- | ------------------ |
| `GOQW_MAKE_WEBHOOK_URL`          | `goqw_webhook_url`               | **No** — sensitive |
| `GOQW_AGENCY_NOTIFICATION_EMAIL` | `goqw_agency_notification_email` | Internal only      |
| _(none — option only)_           | `goqw_business_name`             | Public             |
| _(none — option only)_           | `goqw_business_phone`            | Public             |
| _(none — option only)_           | `goqw_business_email`            | Public             |
| _(none — option only)_           | `goqw_primary_color`             | Public             |
| _(none — option only)_           | `goqw_calendly_url`              | Public             |

Code reads settings via `Agency\QuoteWizard\Support\Settings::*`. The browser only ever receives the fields exposed by `Settings::public_config()` — adding a sensitive field there would require a code change, not a config change.

---

## Architecture

```
quote-wizard.php              ← Plugin entry. Header, autoloader, hooks.
src/Plugin.php                ← Wires hooks. Called once per request.
src/Activator.php             ← Runs once on activation: schema + defaults + cron.
src/Deactivator.php           ← Clears scheduled events.

src/Submissions/
  Schema.php                  ← goqw_submissions table SQL (dbDelta-formatted).
  Repository.php              ← CRUD on submissions (stub).
  ImageHandler.php            ← Secure upload pipeline (stub).

src/Rest/
  SubmitController.php        ← POST /wp-json/qw/v1/submit (stub, returns 501).
  Validator.php               ← Server-side schema check (stub).
  Sanitiser.php               ← Input sanitisation (stub).

src/Frontend/
  Shortcode.php               ← [quote_wizard] renders mount div.
  AssetLoader.php             ← Enqueues React bundle (stub).

src/Support/
  Settings.php                ← Typed wrapper around config precedence chain.
  Logger.php                  ← Tagged error_log wrapper.

src/Admin/
  SettingsPage.php            ← wp-admin Settings page (stub).

src/Cron/
  PruneSubmissions.php        ← Daily retention cleanup (stub).
```

---

## Local development

### Prerequisites

- PHP 8.1+ (LocalWP provides this)
- Composer 2.x
- A LocalWP site for testing

### Setup

```bash
cd plugins/quote-wizard
composer install
```

### Quality gates

```bash
composer lint        # PHPCS — WordPress Coding Standards
composer lint:fix    # PHPCBF — auto-fix what it can
composer analyse     # PHPStan level 5
composer test        # Pest test suite
```

### Installing the plugin into your LocalWP site

Either symlink:

```bash
ln -s /absolute/path/to/this/plugin /path/to/LocalWP/site/app/public/wp-content/plugins/quote-wizard
```

Or copy:

```bash
cp -r . /path/to/LocalWP/site/app/public/wp-content/plugins/quote-wizard
```

Then activate via wp-admin > Plugins. The plugin will:

1. Create the `wp_goqw_submissions` table.
2. Seed default options.
3. Schedule the daily `goqw_prune_submissions` cron event.

Verify by adding `[quote_wizard]` to any page — you should see an empty `<div id="qw-root">` in the rendered HTML.

---

## Future security audit

Per the operational constraints documented at the start of Step 3D, a structured security review is scheduled in the final hardening phase. It will cover:

- Dependency vulnerabilities (Composer + npm)
- REST endpoint exposure (nonce + capability + rate limiting + payload bounds)
- Upload handling (MIME, size, filename, executable rejection)
- Secret management (constant precedence, no secrets in bundle)
- WordPress capability and nonce coverage
- Bundle inspection (no PII or secrets in shipped JS)
- OWASP attack-surface review

This is documented in `docs/05-risk-analysis.md` and tracked through the agency operations playbook.
