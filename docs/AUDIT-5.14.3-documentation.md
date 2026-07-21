# Audit C — Documentation State (5.14.3)

_Performed: 2026-07-17_

## `WP_TEMP_DIR` — not mentioned anywhere in `onboarding.md`

A full-text search of `docs/onboarding.md` for `WP_TEMP_DIR` returns zero matches, as
of the end of Step 5.14.1 (which added the "LocalWP MySQL Port Configuration" and
"Plugin Development — OpCache Awareness" sections but did not touch temp-directory
configuration — that gap wasn't identified until this step's diagnosis) and Step
5.14.2 (documentation-only changes were ADR-0031 and the standard doc set; no
onboarding.md changes).

## What LocalWP-specific guidance currently exists

`onboarding.md` already has, from prior steps:

- Step 3's LocalWP MySQL port note (points readers to LocalWP's own site shell for
  `wp`/database tools).
- Step 5.14.1's "LocalWP MySQL Port Configuration" section (fixing `wp-config.php`'s
  `DB_HOST` directly) and "Plugin Development — OpCache Awareness" subsection.
- The existing "Enabling debug logging" subsection (`WP_DEBUG`/`WP_DEBUG_DISPLAY`).

None of these cover PHP's temp-directory resolution. `wp_tempnam()` (used since Step
5.13e, load-order-fixed in 5.14.1) writes into whatever PHP resolves as its system
temp directory unless `WP_TEMP_DIR` is explicitly defined in `wp-config.php` —
WordPress's own `wp_tempnam()` implementation checks `WP_TEMP_DIR` first, then falls
back to `sys_get_temp_dir()`. On a Windows/LocalWP install, the PHP-CGI worker process
LocalWP runs frequently cannot write to the OS-default temp path
(`C:\Windows\TEMP`) due to how LocalWP sandboxes its per-site PHP processes, which is
a distinct failure mode from either of the two bugs 5.14.1/5.14.2 already fixed (this
one prevents the temp file from ever being created or read at all, rather than
misusing a file that was created successfully).

## Local URL / Google Sheets IMAGE() behavior — not mentioned anywhere

No existing section explains that photo URLs stored during local development
(`http://your-site.local/...`) are not reachable from Google's servers, so the
Make.com → Google Sheets `IMAGE()` formula workflow (documented in
`docs/make-com-integration.md`) cannot render them during local testing. This is a
reasonable and expected limitation, not a bug, but it isn't written down anywhere —
an engineer testing locally could reasonably conclude the photo pipeline is broken
when it is actually working correctly for a local-only URL.

## Fix implemented

Two additions to `docs/onboarding.md`:

1. A "WP_TEMP_DIR Configuration (LocalWP)" section, placed immediately after the
   existing "LocalWP MySQL Port Configuration" section (Step 5.14.1) — both are
   "things to fix in a fresh LocalWP site before the plugin works correctly," so
   grouping them keeps the onboarding sequence in the order an engineer actually hits
   these issues.
2. A "Photo Display in Local Development" note, placed in the photo-upload deployment
   checklist section (Step 4.8) where the existing Make.com media-handling note
   already lives — the natural home for "what to expect when testing photos."
