# Engineer Onboarding — Growth Ops Quote Wizard

> **Adapting the template for a new client?** See `docs/adaptation-runbook.md`
> for the complete clone-and-customize workflow. This file covers the local
> development environment and the plugin deployment procedure; the adaptation
> runbook covers per-client content, services, wizard configuration, and
> WordPress options.

This guide takes you from a fresh clone to a running wizard on your machine in about 30 minutes. It is written PowerShell-first because the first client environment runs on Windows + LocalWP, but every project script is cross-platform, so macOS/Linux engineers can follow the same steps with their own shell.

It reflects the system as it actually exists after the Phase 3 scaffold work (Steps 3A–3G). The wizard UI itself is still a placeholder card at this stage — Phase 4 builds the real wizard. What you are setting up here is the full development loop: build the React app, package it into the WordPress plugin, run it inside WordPress, and understand what the CI gates check.

## What you are setting up

The project is a monorepo with two halves that meet at a build step:

- `apps/wizard` — the React/TypeScript frontend, built with Vite. Package name `@growth-ops/wizard`.
- `plugins/quote-wizard` — the WordPress plugin (PHP, PSR-4) that hosts the built React app, exposes a shortcode, and will route submissions to Make.com in Phase 5.

The build pipeline compiles the React app and copies the compiled assets into the plugin. WordPress serves the plugin; the plugin enqueues the compiled assets on any page that uses the `[quote_wizard]` shortcode.

## Prerequisites

Install these before you start. Versions matter — CI runs the same ones.

| Tool     | Version | Notes                                                                                                                |
| -------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| Node.js  | 20.x    | The repo pins this in `.nvmrc`. Use nvm-windows or Volta if you juggle Node versions.                                |
| pnpm     | 9.x     | The package manager for the JS workspace. `npm install -g pnpm` or `corepack enable`.                                |
| PHP      | 8.1     | For the plugin's quality tools. LocalWP bundles a PHP runtime, but you also need a CLI PHP 8.1 for Composer scripts. |
| Composer | 2.x     | PHP dependency manager.                                                                                              |
| LocalWP  | Latest  | Local WordPress environment. Download from localwp.com.                                                              |
| WP-CLI   | Latest  | Command-line WordPress control. LocalWP can open a shell with `wp` available.                                        |
| Git      | Latest  |                                                                                                                      |

A note on PHP on Windows: the simplest path is to use the PHP binary LocalWP ships, or install PHP 8.1 via a tool like Chocolatey (`choco install php --version=8.1`). The project docs refer to `local-composer` in places — that is shorthand for "Composer running against the PHP 8.1 you use for this project." If you have a single PHP 8.1 on your PATH, plain `composer` is fine.

## Step 1 — Clone and install (about 5 minutes)

```powershell
git clone <your-repo-url> Handy-Man
cd Handy-Man

# Install the JS workspace dependencies (root + apps/wizard)
pnpm install
```

`pnpm install` reads `pnpm-lock.yaml` and installs exactly the locked versions. If it complains about a frozen lockfile, you are on an older lockfile — run `pnpm install` without flags locally to update it, but never commit a lockfile you did not intend to change (CI fails on a stale lockfile).

Then install the plugin's PHP dependencies:

```powershell
cd plugins\quote-wizard
composer install
cd ..\..
```

## Step 2 — Build the wizard into the plugin (about 2 minutes)

The single command that compiles the React app and copies the assets into the plugin:

```powershell
pnpm build-plugin
```

What this does, in order:

1. Cleans stale build output from both `apps/wizard/dist` and the plugin's `assets/dist` (preserving `.gitkeep`).
2. Builds the React app with Vite.
3. Validates the Vite manifest — fails hard if it is missing or malformed.
4. Copies exactly three files into `plugins/quote-wizard/assets/dist/`: `manifest.json`, the hashed JS bundle, and the hashed CSS. Source maps are deliberately not copied.

You should see output ending in something like:

```
[GOQW][build] Final plugin dist contents (4 files):
[GOQW][build]   .gitkeep
[GOQW][build]   manifest.json
[GOQW][build]   wizard.<hash>.js
[GOQW][build]   wizard.<hash>.css
[GOQW][build] Build complete.
```

If you see a `.js.map` line, something regressed — that file should never reach the plugin. CI has a guard that fails on exactly this.

## Step 3 — Create the LocalWP site (about 10 minutes, first time only)

1. Open LocalWP and create a new site. A reasonable name is `fencing-lead-platform-dev`.
2. Accept the defaults (PHP 8.x, MySQL, nginx or Apache — either works).
3. Once the site is running, note its database port: LocalWP assigns each site its own MySQL port (for example `10005`). You rarely need it directly, but it is the reason WP-CLI and database tools must be run from LocalWP's own shell — running them from a generic terminal can connect to the wrong database. This bit us during development; always use LocalWP's "Open site shell" for `wp` commands.
4. Set the active theme to **Kadence**. The wizard relies on the normal WordPress content-render lifecycle. Block/Full-Site-Editing themes that use a "canvas" template can bypass that lifecycle and prevent the shortcode from rendering. Kadence is the confirmed-working theme for the first client. (If a future client uses an FSE theme, the fix is to place the shortcode on a content-rendering template, not the canvas template.)

## LocalWP MySQL Port Configuration

A fresh LocalWP site's generated `wp-config.php` ships with
`define( 'DB_HOST', 'localhost' )` — no port. LocalWP does not run MySQL on the
default port 3306; every site gets its own port (typically in the 10000–11000
range), so this default fails outright for any direct database connection,
including some tooling that reads `wp-config.php` rather than going through
`wp`. (Step 3, point 3, above covers the related but separate issue of running
`wp`/database tools from the wrong shell — this section covers fixing the
config file itself.)

### Finding your MySQL port

**Option 1 — LocalWP UI:** click your site in LocalWP, open the "Database" tab,
note the port shown.

**Option 2 — PowerShell**, from LocalWP's own site shell:

```powershell
wp config get DB_HOST
```

If this already shows a port (`localhost:10012`), LocalWP set it correctly at
site creation and you can skip the rest of this section.

### Updating wp-config.php

If `DB_HOST` has no port, edit
`C:\Users\<you>\Local Sites\<site>\app\public\wp-config.php`:

```php
// Before
define( 'DB_HOST', 'localhost' );

// After (replace 10012 with the port from LocalWP's Database tab)
define( 'DB_HOST', 'localhost:10012' );
```

Verify from LocalWP's site shell:

```bash
wp db query "SELECT 1;"
# Should return: 1
```

Without this fix, `wp db` commands and any direct MySQL connection fail with
`Can't connect to MySQL server on 'localhost:3306'` — even from LocalWP's own
site shell.

## WP_TEMP_DIR Configuration (LocalWP)

On Windows via LocalWP, PHP's default temporary directory (`C:\Windows\TEMP`) is
not writable by the PHP process LocalWP runs. The plugin's photo-upload path calls
`wp_tempnam()` (see `Submissions\PhotoStorage`) to write a decoded photo to a temp
file before handing it to WordPress — if PHP can't resolve a writable temp
directory, that call fails and the photo upload fails with it.

**Fix:** add to `wp-config.php` (before `/* That's all, stop editing! Happy
publishing. */`):

```php
define( 'WP_TEMP_DIR', 'C:/Users/YOUR-USER/Local Sites/YOUR-SITE/app/public/wp-content/uploads/tmp' );
```

Replace `YOUR-USER` and `YOUR-SITE` with your actual values. `wp_tempnam()` checks
`WP_TEMP_DIR` first, before falling back to PHP's system default — defining it
here takes precedence regardless of the underlying OS temp configuration.

Create the directory:

```powershell
$tmpDir = "C:\Users\YOUR-USER\Local Sites\YOUR-SITE\app\public\wp-content\uploads\tmp"
if (-not (Test-Path $tmpDir)) { New-Item -ItemType Directory -Path $tmpDir }
```

Verify from LocalWP's site shell:

```bash
wp eval "echo 'writable: ' . (is_writable(WP_TEMP_DIR) ? 'YES' : 'NO') . PHP_EOL;"
```

Should return `writable: YES`.

**Not required for Linux production hosts** — `/tmp` is typically writable there,
so this is a LocalWP/Windows-specific step, not something to carry into a
production deployment checklist.

## Step 4 — Link the plugin into WordPress (about 3 minutes)

You want the plugin in your repo to be the same plugin WordPress runs, so edits show up without copying files around. Use a directory symlink (junction) from the LocalWP plugins directory to your repo's plugin folder.

In an **elevated** PowerShell (Run as Administrator):

```powershell
# Adjust both paths to your machine.
$wpPlugins = "C:\Users\<you>\Local Sites\fencing-lead-platform-dev\app\public\wp-content\plugins"
$repoPlugin = "C:\Agency_Files\Github_Repos\Handy-Man\plugins\quote-wizard"

New-Item -ItemType Junction -Path "$wpPlugins\quote-wizard" -Target $repoPlugin
```

Then activate it (from LocalWP's site shell, so `wp` talks to the right database):

```powershell
wp plugin activate quote-wizard
```

Activation creates the database table `wp_goqw_submissions`, seeds ten `goqw_*` options (including `goqw_wizard_id` and `goqw_enabled_services`; see ADR-0013), and schedules a daily cleanup cron event (`goqw_prune_submissions`).

## Step 5 — Put the wizard on a page (about 3 minutes)

```powershell
# Create a page containing the shortcode and capture its ID
$pageId = wp post create --post_type=page --post_status=publish --post_title="Quote Wizard Test" --post_content="[quote_wizard]" --porcelain

# Print its URL
wp post url $pageId
```

Open that URL in a browser. You should see the placeholder card: a heading with the business name, a "Scaffold OK" badge in the client accent colour, and a small plugin-version line. That confirms the full chain works — WordPress rendered the shortcode, the plugin enqueued the compiled React assets, the React app mounted, and the public config crossed from PHP to the browser.

If instead you see a normal page with no card, the most likely cause is the theme/template (see Step 3, point 4): confirm Kadence is active and that the page is not using a blank "canvas" template.

## Step 6 — Verify the install (about 2 minutes)

Run these from LocalWP's site shell. They confirm each part of the system is healthy.

```powershell
# The table exists with its columns
wp db tables --all-tables-with-prefix | Select-String "goqw"     # expect wp_goqw_submissions

# The eleven options seeded (includes goqw_wizard_id, goqw_enabled_services, goqw_site_root_page_id — see ADR-0013)
wp option list --search="goqw_*" --format=count                  # expect 11

# A couple of specific options
wp option get goqw_primary_color                                 # expect a hex colour, default #0F4C81
wp option get goqw_plugin_version                                # expect the plugin version

# The shortcode renders the mount div
wp eval "echo do_shortcode('[quote_wizard]');"                   # expect <div id="qw-root" data-mount="quote-wizard"></div>

# The REST route is registered (returns 501 until Phase 5 implements it)
# Visit in a browser or use Invoke-WebRequest:
$r = Invoke-WebRequest -Uri "http://fencing-lead-platform-dev.local/wp-json/qw/v1/submit" -Method POST -SkipHttpErrorCheck
$r.StatusCode                                                    # expect 501

# The cleanup cron event is scheduled
wp cron event list | Select-String "goqw_prune_submissions"      # expect one event
```

## Photo upload deployment checklist (Step 4.8)

If the wizard config includes a `photo` field type, the following must be
verified before the deployment goes live:

1. **Make.com workflow handles media.** The forwarded payload now includes a
   `media` array (see ADR-0015 amendment). Update the Make.com scenario to
   parse and route `media[].files[].dataBase64` correctly. Without this, photo
   data is captured in the database but silently ignored by the downstream
   workflow.

2. **PHP upload limits.** Confirm `upload_max_filesize` and `post_max_size` in
   `php.ini` are at least `15M`. The wizard enforces a 9 MB client-side cap,
   but the PHP limit is the hard ceiling. The default on many hosts is 8 MB,
   which would cause silent rejection.

3. **Smoke test.** Upload a multi-photo quote, confirm the submission row in
   `wp_goqw_submissions` has a non-null `media_json` column, and confirm
   Make.com received the media array.

### Photo display in local development

Photos uploaded via the wizard are stored at local URLs like
`http://your-site.local/wp-content/uploads/goqw/...`. These URLs are only
accessible from your own machine. Google Sheets' `IMAGE()` formula (part of the
Make.com → Sheets workflow, see `docs/make-com-integration.md`) fails to render
images from local URLs because Google's servers cannot reach them — this is
expected behavior during local testing, not a broken pipeline.

**In production** (a real, publicly-reachable domain), `IMAGE()` renders normally.

For local demonstration, either:

- View the photo directly in WordPress admin (Media Library), which can display
  local URLs from the same machine.
- Use a tunneling service like ngrok to temporarily expose the local site with a
  publicly-reachable URL.

## Bot protection deployment checklist (Step 5.13f)

Bot protection (honeypot + rate limiting + Cloudflare Turnstile, ADR-0027) is
**enabled by default** on every install — honeypot and rate limiting need no
setup. Turnstile is optional per client and needs a one-time Cloudflare setup:

1. **Create a Cloudflare Turnstile widget.** Cloudflare Dashboard → Turnstile
   → Add widget. Add the client's live domain(s). "Managed" mode is
   recommended (silent for most visitors, falls back to an interactive
   challenge only when Cloudflare's risk signal is uncertain).

2. **Set the keys.**

   ```bash
   wp option update goqw_turnstile_site_key "0x..."
   wp option update goqw_turnstile_secret_key "0x..."
   ```

   The site key is public (embedded in client-side HTML by Cloudflare's own
   design) and appears in the wizard's browser console/network tab — that is
   expected, not a leak. The secret key must never be committed to the repo;
   set it directly on the deployment target.

3. **Optional: adjust the rate limit** (default 5 submissions per IP per
   hour):

   ```bash
   wp option update goqw_rate_limit_per_hour 10
   ```

4. **Optional: disable bot protection entirely** (not recommended — only for
   debugging a suspected false-positive block):

   ```bash
   wp option update goqw_bot_protection_enabled 0
   ```

5. **Smoke test.** Submit the wizard normally — Turnstile should validate
   silently (no visible challenge for a real user in Managed mode). Then, in
   DevTools, manually set the honeypot input's value and submit — confirm the
   request is rejected with `validation_failed` (400), indistinguishable from
   an ordinary validation error.

If the site key/secret key are left blank (the default), the deployment still
gets honeypot + rate limiting; Turnstile (Layer 3) is simply skipped. This is
a safe default for a pilot that hasn't set up Cloudflare yet.

## Duplicate submission prevention (Step 5.13g)

Duplicate detection (ADR-0028) is **always on, with no configuration** — there
is no option to set or key to configure. A submission whose `contact_email` or
`contact_phone` matches a non-duplicate submission from the last 24 hours is
still saved (with photos) but flagged `is_duplicate`/`duplicate_of` in
`wp_goqw_submissions` and never forwarded to Make.com/WhatsApp; the user still
sees a success screen, with different copy ("We already have your request").

**Smoke test.** Submit the wizard once normally, then submit it again with the
same email or phone within 24 hours — the second submission should still show
a success screen, but no second WhatsApp notification/Sheets row should
appear. Query the table directly to confirm the flag:

```bash
wp db query "SELECT id, is_duplicate, duplicate_of, created_at FROM wp_goqw_submissions ORDER BY id DESC LIMIT 5;"
```

## Data protection & consent (Step 5.14)

Every wizard now has a required consent checkbox (`data_processing_consent`) on its
last mandatory step — `contact-and-address` for instant-quote services, `address` for
manual-quote services (never the skippable `optional-details` step). The checkbox is
enforced both client-side (the wizard won't let you advance without it) and
server-side (`Submissions\ConsentValidator` — a crafted request that skips the UI
entirely is still rejected with `400 consent_required`, nothing persisted).

A real Privacy Policy page is live at `/privacy` (linked from the site footer on every
page), rendering content from `apps/wizard/src/site/content/privacy-content.ts` — there
is no wp-admin page to edit for this; it's a client-side route like `/contact`.

Submission records are now automatically deleted after `Settings::retention_days()`
(default 90 days, `goqw_retention_days` option) via a daily wp-cron job
(`Cron\PruneSubmissions`, hooked to the pre-existing `goqw_prune_submissions` event).
Photo retention (6 months, `Cron\PhotoRetention`) is unchanged and runs independently.

**Smoke test.** Submit the wizard once with the consent checkbox ticked — should
succeed as normal. Try submitting via a raw `curl` POST to `qw/v1/submit` without a
`data_processing_consent` answer — should get back `400 { errorCode:
'consent_required' }` and no new row in `wp_goqw_submissions`. Then confirm consent was
recorded on a real submission:

```bash
wp db query "SELECT id, consent_given, consent_timestamp FROM wp_goqw_submissions ORDER BY id DESC LIMIT 5;"
```

Visit `/privacy` in a browser and confirm the page renders (not a redirect to Home) and
the footer's "Privacy Policy" link on any page navigates there.

To smoke-test retention without waiting 90 days, backdate a row and trigger the cron
manually:

```bash
wp db query "UPDATE wp_goqw_submissions SET created_at = DATE_SUB(NOW(), INTERVAL 91 DAY) WHERE id = 1;"
wp cron event run goqw_prune_submissions
wp db query "SELECT id FROM wp_goqw_submissions WHERE id = 1;"
```

The last query should return no rows.

## The daily development loop

Once set up, your inner loop is short.

**Working on the React app's look and behaviour** — run the Vite dev server for instant hot-reload at `http://localhost:5173`:

```powershell
cd apps\wizard
pnpm dev
```

This runs the app standalone with a stubbed config (the same shape the plugin injects), so you can iterate on UI without WordPress in the loop. Stop it with Ctrl+C.

**Seeing your changes inside real WordPress** — rebuild and refresh the page:

```powershell
pnpm build-plugin
# then hard-refresh the wizard page in your browser
```

**Before you push** — run the same gates CI runs, so you find problems locally first:

```powershell
# JS/TS side
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build-plugin

# PHP side
cd plugins\quote-wizard
composer lint
composer analyse
composer test
cd ..\..
```

There is a shortcut for the JS checks: `pnpm check` runs `format:check`, `lint`, and `typecheck` together.

## Packaging a distributable plugin

When you need a plugin ZIP to upload to a client's WordPress (or to hand off), use:

```powershell
pnpm package-plugin
```

This builds fresh first, then produces `dist/quote-wizard-<version>.zip`. The ZIP is built from an explicit allowlist — only the plugin entry file, `uninstall.php`, the PHP source, and the compiled assets are included. Development files (node_modules, Composer dev tooling, tests, source maps, dotfiles, anything matching secret-like names) are excluded by design, and the script refuses outright to include `.env` files, secrets, or oversized files. You can inspect the result:

```powershell
Expand-Archive -Path dist\quote-wizard-<version>.zip -DestinationPath dist\_inspect -Force
Get-ChildItem -Recurse dist\_inspect | Select-Object FullName
Remove-Item -Recurse -Force dist\_inspect
```

Upload via wp-admin → Plugins → Add New → Upload Plugin, or `wp plugin install dist\quote-wizard-<version>.zip --activate`.

## What CI checks, and what "green" means

Every push to `main` and every pull request triggers GitHub Actions. Two jobs run in parallel:

**JS/TS (Node 20):** installs with a frozen lockfile (fails if `pnpm-lock.yaml` is stale), then runs `format:check`, `lint`, `typecheck`, and `build-plugin`. After the build it asserts that no source map leaked into the plugin's assets and that the manifest is present.

**PHP (8.1):** installs Composer dependencies, then runs `composer lint` (PHPCS — warnings fail, not just errors), `composer analyse` (PHPStan), and `composer test` (Pest).

A green run means: the lockfile is current, formatting is consistent, the linters and type checker are clean, the production build pipeline works on a clean Linux machine, no source maps are shipping, and all PHP quality gates pass. Because CI runs the exact commands you run locally, a green local run should mean a green CI run. If CI fails but your machine passed, the usual culprits are an uncommitted `pnpm-lock.yaml` or a file that only exists locally.

CI does not deploy anything, publish artifacts, or create releases. It is purely a set of gates. That boundary is intentional (see `docs/decisions/0011-ci-scope.md`).

## How the plugin is structured

```
plugins/quote-wizard/
  quote-wizard.php        Plugin header + PSR-4 autoloader + activation hooks
  uninstall.php           Removes the table and goqw_* options on delete
  src/
    Plugin.php            Boots the plugin: registers shortcode, hooks, REST route
    Activator.php         Creates table, seeds options, schedules cron
    Deactivator.php       Clears the cron event
    Frontend/
      Shortcode.php       The [quote_wizard] shortcode -> mount div
      AssetLoader.php      Enqueues the built assets; injects window.GOQW_CONFIG
      ManifestReader.php   Reads/validates the Vite manifest (fail-closed)
      PublicConfig.php     The allowlist of values exposed to the browser
    Rest/                 Submit endpoint + validation/sanitisation (stubs until Phase 5)
    Submissions/          Schema, repository, image handling (stubs until Phase 5)
    Admin/                Settings page (stub until Phase 5)
    Support/              Settings accessor, Logger
    Cron/                 Submission pruning (stub until Phase 6)
  assets/dist/            Built React assets land here (git-tracked via .gitkeep)
  tests/                  Pest unit tests
```

A few contracts are deliberately short and must not be renamed casually, because they are shared across the PHP/React boundary or are user-facing:

- Shortcode tag: `[quote_wizard]`
- REST namespace: `qw/v1`
- React mount element ID: `qw-root`

Operational names use the `goqw_` / `GOQW_` prefix (database table, options, cron hook, constants). The reasoning is in `docs/decisions/0008-psr4-over-wporg-conventions.md`.

## How config crosses from PHP to React

The plugin exposes a small, explicit set of values to the browser as `window.GOQW_CONFIG`. The exposed fields are enumerated in one place — `PublicConfig::build()` — and nothing else crosses the boundary. Sensitive values (the Make.com webhook URL, the agency notification email, anything in `wp-config.php`) are never exposed. If you need the browser to know a new value, you add it to that one method, and the matching TypeScript type in `apps/wizard/src/types/global.d.ts`. The reasoning and the full field list are in `docs/decisions/0009-public-config-allowlist.md`.

## Troubleshooting

**The wizard page shows no card, just a normal page.** Check the active theme is Kadence and the page is not on a blank "canvas" template. Block/FSE canvas templates can bypass the content render path that expands the shortcode. Confirm with `wp eval "echo do_shortcode('[quote_wizard]');"` — if that prints the mount div, the plugin is fine and the issue is theme/template placement.

**`wp` commands show an empty database or missing tables.** Run them from LocalWP's own site shell ("Open site shell"), not a generic terminal. LocalWP's MySQL runs on a per-site port; a generic shell can connect to the wrong database and show nothing. Also note that PowerShell mangles `%` wildcards in some SQL passed to `wp db query`; prefer `wp db tables --all-tables-with-prefix` and `wp option list --search="goqw_*"` over raw `SHOW TABLES LIKE '%goqw%'`.

**An admin-only red warning box appears above where the wizard should be.** That means the plugin could not find its compiled assets. Run `pnpm build-plugin`. The warning is only shown to logged-in administrators; ordinary visitors see nothing. The same condition is logged with the `[goqw-ops]` prefix — search the debug log with `Select-String -Path <debug.log> -Pattern "goqw-ops"`.

**`pnpm build-plugin` fails with a manifest error.** The Vite build did not produce valid output. Run `cd apps\wizard; pnpm build` directly to see the underlying build error.

**CI fails on the lockfile.** Run `pnpm install` locally, commit the updated `pnpm-lock.yaml`, and push.

## Services (Step 4.7)

### What a service is

A "service" is a complete `{ WizardConfig, PricingConfig }` bundle registered in
`src/domain/registry/verticals.ts`. "Service" and "vertical" are synonyms; the codebase
uses both names (see ADR-0013 amendment). Currently two services are registered:
`fencing` and `decking`.

### Adding a new service

1. Create a fixture file under `src/domain/fixtures/<name>.config.ts` following the
   pattern in `fencing.config.ts` (heavily commented; read it first).
2. Add the entry to `VERTICALS` in `src/domain/registry/verticals.ts`.
3. Add validation tests in `src/domain/fixtures/__tests__/<name>-validation.test.ts`.
4. Run `pnpm test` — the validator will fail-fast if the config is malformed.
5. For production, set the `goqw_enabled_services` WP option (see below) and ensure
   any Make.com workflow handles the new `wizardId` payload.

### Controlling which services are offered per deployment

The `goqw_enabled_services` option is a comma-separated list of service IDs. When it is
empty (the default), **all registered services are offered**.

```powershell
# Offer only fencing (bypass the selector)
wp option update goqw_enabled_services 'fencing'

# Offer both fencing and decking (selector shown)
wp option update goqw_enabled_services 'fencing,decking'

# Offer all registered services (selector shown for 2+)
wp option update goqw_enabled_services ''
```

When exactly one service is in the enabled set, the ServiceSelector is bypassed and the
wizard mounts immediately. Unknown IDs in the option are silently filtered out.

### Removing an unwanted service from a clone

If you are cloning this template for a single-trade client and do not want the decking
service at all, the cleanest approach is to delete the entry from `VERTICALS` in
`src/domain/registry/verticals.ts`. Setting `goqw_enabled_services` to the single
desired ID is also valid and does not require a code change.

## Site structure (Step 5.0)

### The two halves of the React app

After Step 5.0, the React application has two distinct halves:

- **`src/site/`** — the website shell and five reference pages. This is the part
  you edit when adapting the template for a new client: update the content modules
  in `src/site/content/`, change the page components in `src/site/pages/`, and
  the routing in `src/site/routing/routes.ts` if you add pages.

- **`src/components/`**, **`src/runtime/`**, **`src/domain/`** — the wizard widget.
  These are shared infrastructure that you do not touch per-client. The wizard is
  embedded on the `/quote` page by `QuotePage.tsx`.

`src/App.tsx` is a one-line mount of `<SiteApp />` and contains no business logic.

### Adapting content for a new client

Three files drive all the editorial content:

| File                                   | What to change                                     |
| -------------------------------------- | -------------------------------------------------- |
| `src/site/content/site-content.ts`     | Business name, tagline, contact, hero copy         |
| `src/site/content/services-content.ts` | Service names, summaries, descriptions             |
| `src/site/content/work-content.ts`     | Portfolio entries (replace with real project info) |

Type-checking catches mistakes — if you omit a required field, `pnpm typecheck` fails.

### Adding a new site page

1. Create `src/site/pages/YourPage.tsx`.
2. Add one entry to `ROUTES` in `src/site/routing/routes.ts` with the path, title,
   nav label, and element factory.
3. Run `pnpm test` and `pnpm typecheck`.

No router wiring beyond the route table entry is required.

**When you add a page, also add its path to `SiteRoutes::PATHS` in
`plugins/quote-wizard/src/Routing/SiteRoutes.php`.** The `CrossLanguageRoutesTest`
enforces that both lists match exactly and will fail `composer test` if they
diverge.

### ESLint boundary for site code

`src/site/**` files may NOT import from `@/domain/runtime/**` or `@/domain/pricing/**`
directly. Those are the wizard's internal concerns. Site code uses the registry
(`@/domain/registry`) and the React adapter (`@/runtime`) — both are allowed.
The boundary is enforced by ESLint and will fail `pnpm lint` if violated.

## Deploying to a WordPress site (Step 5.1)

The plugin self-configures on activation. Here is what happens and how to verify it.

### What happens on plugin activation

1. The `goqw_submissions` table is created (or upgraded).
2. Default options are seeded including `goqw_site_root_page_id = 0`.
3. A WordPress page with slug `goqw-site-root` and title "Site" is created.
4. Rewrite rules are registered for `/services`, `/our-work`, `/contact`, `/quote`.
5. `flush_rewrite_rules()` is called.
6. **Front-page policy**:
   - If no front page was configured (`show_on_front = 'posts'`): the Site Root page
     is set as the front page automatically.
   - If a front page was already configured: settings are left alone, and a
     one-shot admin notice appears explaining the manual step.

### Verification commands (WP-CLI)

```bash
# Confirm Site Root page was created and ID is stored
wp option get goqw_site_root_page_id

# Confirm all 11 options were seeded
wp option list --search="goqw_*" --format=count

# Confirm rewrite rules are present
wp rewrite list | grep goqw

# Confirm front page is set
wp option get show_on_front    # should be 'page'
wp option get page_on_front    # should match goqw_site_root_page_id

# Smoke test: all five routes should return 200 with the SPA shell
curl -s -o /dev/null -w "%{http_code}" http://your-site.local/
curl -s -o /dev/null -w "%{http_code}" http://your-site.local/services
curl -s -o /dev/null -w "%{http_code}" http://your-site.local/contact
```

### If the front-page notice appears

Go to **Settings → Reading**, set "A static page" → "Front page" to the page
titled "Site" (slug: `goqw-site-root`).

### Caching

The plugin sends `Cache-Control: no-cache` on the Site Root page. If your site
uses a full-page caching plugin (W3 Total Cache, WP Super Cache, etc.), add the
Site Root page to its exclusion list so the data-initial-path attribute is always
fresh.

### The [quote_wizard] shortcode still works

Step 5.1 is purely additive. Any page with `[quote_wizard]` continues to render
the wizard widget exactly as before. The new routing mechanism is a separate code
path.

## Deploying the plugin to a WordPress install (Step 5.2)

These steps deploy a freshly-built plugin artifact to a real WordPress install
(LocalWP, staging, or production). They are required after any code change that
affects the bundle or the PHP plugin source.

### Prerequisites

- Node and pnpm installed (versions per `package.json` engines).
- PHP and Composer installed (versions per `composer.json` requirements).
- Access to the WordPress install's filesystem and command-line (wp-cli).

### Procedure

1. **Build the plugin artifact from a clean working tree.**

   From the project root:

   ```powershell
   pnpm install
   pnpm build
   ```

   `pnpm build` is a composed script that runs both stages of the plugin
   build in sequence:
   1. `pnpm -r build` invokes Vite (via `apps/wizard`'s build script) to
      compile the TypeScript/React source into `apps/wizard/dist/`.
   2. `pnpm build-plugin` stages the compiled output into
      `plugins/quote-wizard/assets/dist/`, which is the directory the
      WordPress plugin loads its assets from.

   Running only `pnpm -r build` does NOT stage the output for the plugin.
   The plugin directory's `assets/dist/` will remain stale, and the
   deployed bundle will not reflect recent source changes. The composed
   `pnpm build` exists specifically to prevent this gap, which previously
   caused multiple debugging episodes during operational verification
   work.

   If you ever need to run the stages separately (for debugging, profiling,
   or inspecting intermediate output), the underlying commands remain
   available:

   ```powershell
   pnpm -r build        # produces apps/wizard/dist/
   pnpm build-plugin    # stages into plugins/quote-wizard/assets/dist/
   ```

   This separation is useful for diagnosing whether a build failure is in
   the Vite compilation step or the staging step.

2. **Verify the manifest contains relative paths.**

   Open `plugins/quote-wizard/assets/dist/manifest.json` and confirm all `file`
   entries are relative paths (e.g. `wizard.AbC123.js`). If any contain
   absolute paths or Windows drive letters (`C:/`), the build is corrupted.
   Do not proceed.

3. **Deactivate the plugin in the target WordPress install.**

   ```bash
   wp plugin deactivate quote-wizard
   ```

4. **Delete the existing plugin directory.**

   ```bash
   wp plugin delete quote-wizard
   ```

   This ensures no stale files remain. The plugin's options and database table
   persist (uninstall.php is only invoked on explicit uninstall via wp-admin or
   `wp plugin uninstall`, not deactivate-and-delete).

5. **Copy the new plugin directory.**

   Copy `plugins/quote-wizard/` (the directory at the project root, with the
   freshly-built `assets/dist/`) into the WordPress install's `wp-content/plugins/`.

6. **Activate the plugin.**

   ```bash
   wp plugin activate quote-wizard
   ```

7. **Clear caches.**

   ```bash
   wp cache flush
   wp transient delete --all
   ```

   And, in the browser, hard-reload the site (Ctrl+Shift+R or equivalent) or use
   "Clear site data" in dev tools.

8. **Verify the deployment.**

   ```bash
   wp plugin list
   ```

   Confirm the version matches `GOQW_VERSION` in `quote-wizard.php`.

   ```bash
   wp eval "echo GOQW_PLUGIN_URL;"
   ```

   Confirm this returns a clean URL of the form
   `http://yoursite.local/wp-content/plugins/quote-wizard/`.

   Visit the front of the site and confirm the React app loads.

> **Per-client SEO customization:** After deploying for a new client,
> follow `docs/seo-adaptation-guide.md` to set per-client SEO content
> (titles, descriptions, Open Graph image). The plugin ships with Acme
> Fencing demo copy by default; this must be replaced for every real client.

> **Full per-client content customization:** To replace all Acme Fencing
> placeholder content (site identity, footer, home page sections, services,
> portfolio, wizard service availability, and all SEO options) in a single
> pass, use `docs/llm-customization-handoff.md`. Provide a business profile
> JSON and follow the 12 sequential tasks. Suitable for LLM agent automation
> or manual step-by-step adaptation.

### Enabling debug logging (optional)

For diagnostic purposes when setting up a new client site, you may want WordPress
debug logging enabled. This helps identify issues with plugin activation, submission
forwarding, or other operational concerns.

In your LocalWP site's `wp-config.php`, ensure these lines exist **before**
`/* That's all, stop editing! Happy publishing. */`:

```php
if ( ! defined( 'WP_DEBUG' ) ) {
    define( 'WP_DEBUG', true );
}
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
@ini_set( 'display_errors', 0 );
```

**Important:** Only ONE `define( 'WP_DEBUG', ... )` should exist. A duplicate
definition causes a PHP warning that is echoed before REST responses, corrupting
the JSON body. The `if ( ! defined( ... ) )` guard prevents this. Set
`WP_DEBUG_DISPLAY` to `false` so notices go to `wp-content/debug.log` and are
not prepended to REST responses. For production deployments, set `WP_DEBUG` to
`false`.

### Plugin development — OpCache awareness

PHP OpCache caches _compiled_ PHP bytecode, independent of `pnpm build-plugin`
(which only rebuilds the React bundle — plugin PHP files are `require`d
directly with no build step of their own). If you edit a plugin PHP file
in-place on a running LocalWP site and OpCache is enabled, WordPress can keep
serving the previously-compiled version of that file until the cache is
invalidated.

**Symptom:** the debug log references a line number or behavior that doesn't
match the current file content, or an error persists after you've already
fixed the code that caused it.

**Fastest fix — deactivate/reactivate the plugin** (from LocalWP's site shell):

```bash
wp plugin deactivate quote-wizard
wp plugin activate quote-wizard
```

**Alternative — restart the LocalWP site:** click Stop in the LocalWP UI, wait
a few seconds, click Start.

**Last resort — touch the plugin's main file** to bump its mtime, which some
OpCache configurations use as an invalidation signal:

```powershell
$file = "C:\Users\<you>\Local Sites\<site>\app\public\wp-content\plugins\quote-wizard\quote-wizard.php"
(Get-Item $file).LastWriteTime = Get-Date
```

This is unrelated to the symlink-vs-copy distinction in the daily development
loop above — OpCache staleness can happen either way, since it caches compiled
bytecode per file path regardless of how that path was populated.

### Common pitfalls

- **Stale caches.** Browser caching, page caching plugins, and CDN caching can
  serve old assets even after deployment. Always hard-reload and flush caches.
- **Half-deployed state.** Do not copy individual files over a running plugin
  directory. Always deactivate-delete-redeploy as a unit. Mixed file versions
  produce unpredictable failures.
- **Symlinks.** Do not symlink the plugin source repository into wp-content/plugins/.
  This causes WordPress's URL resolution to inject absolute filesystem paths into
  asset URLs. Copy files; do not link.

## Where to read more

Architecture decisions live in `docs/decisions/` as numbered ADRs. The ones most useful early:

- `0008` — why the plugin uses PSR-4 and the `goqw_` prefix rather than wordpress.org conventions.
- `0009` — the PHP-to-React public config boundary.
- `0010` — the build pipeline and packaging design (amended in 5.1 with WP routing strategy).
- `0011` — what CI does and deliberately does not do.
- `0016` — site shell architecture, routing decisions, wizard-embedding approach.
