# Audit D — DB_HOST Onboarding Documentation Gap (5.14.1)

_Performed: 2026-07-17_

## Current LocalWP setup coverage

`docs/onboarding.md` Step 3 ("Create the LocalWP site") mentions LocalWP's
per-site MySQL port only once, and only in the context of `wp`/WP-CLI needing to
run from LocalWP's own site shell:

> Once the site is running, note its database port: LocalWP assigns each site
> its own MySQL port (for example `10005`). You rarely need it directly, but it
> is the reason WP-CLI and database tools must be run from LocalWP's own shell
> — running them from a generic terminal can connect to the wrong database.

This is true but incomplete. It covers the case where `wp` is run from the
_wrong_ shell (fixed by using LocalWP's site shell). It does not cover the case
the SCB pilot actually hit: a fresh LocalWP site's generated `wp-config.php`
ships with `define( 'DB_HOST', 'localhost' )` — no port — which fails outright
for **any** direct MySQL connection (including some LocalWP site-shell contexts
and any tooling that reads `wp-config.php` directly rather than going through
`wp`), because LocalWP's MySQL never listens on the default port 3306.

The onboarding guide has no section instructing a new engineer to check or set
`DB_HOST`'s port at all. Nothing currently tells a reader that `wp-config.php`
may need manual editing after site creation.

## Where the new section belongs

Directly after **Step 3 — Create the LocalWP site** (`docs/onboarding.md`,
currently ends around the Kadence theme note) and before **Step 4 — Link the
plugin into WordPress**. This keeps the onboarding steps in the order a new
engineer actually performs them: create site → fix DB_HOST → link plugin →
activate → verify.

## Secondary gap found: OpCache

Not in the original DB_HOST scope, but found during the same pass: nothing in
`docs/onboarding.md` explains that PHP OpCache can serve a stale compiled
version of a plugin PHP file after a source edit, independent of the
`pnpm build-plugin` step (which only rebuilds the _React bundle_, not the PHP
source — PHP files are `require`d directly, no build step, so this is a
pure PHP-runtime caching issue, not a build-pipeline gap like the one 5.5a-
remediation fixed). The existing **Troubleshooting** section covers stale
_React_ assets (`pnpm build-plugin` + hard refresh) but has no equivalent entry
for stale _PHP_ behavior after editing plugin source. Added as its own
subsection under **Deploying the plugin to a WordPress install (Step 5.2)**,
next to the existing debug-logging subsection, since both are "things that bite
you mid-development-loop on a LocalWP site."

## Fix implemented

Two new subsections added to `docs/onboarding.md`:

1. "LocalWP MySQL Port Configuration" — inserted after Step 3.
2. "Plugin Development — OpCache Awareness" — inserted under the Step 5.2
   deployment section, after the existing debug-logging subsection.
