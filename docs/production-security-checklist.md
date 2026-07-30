# Production Security Checklist

Living reference for deploying this WordPress plugin + React wizard to a real
client's production site. Last full audit: 2026-07-24 (see the audit report
in that session's summary / `docs/component-registry.md` for the detailed
findings this checklist was built from).

---

## 1. Required environment variables / secrets

See `.env.example` at the repo root for the full, commented reference. This
project has **no `.env`-loading mechanism** — WordPress reads secrets from
`wp-config.php` PHP constants (or a `wp_options` fallback for two of them).
"Environment variable" below means "the value that constant/option holds,"
not a literal `.env` file.

| Name                                                    | Where it belongs                                                                    | Sensitive?                                                  | Fallback if unset                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GOQW_MAKE_WEBHOOK_URL`                                 | `wp-config.php` constant (preferred) or `wp_options.goqw_webhook_url`               | **Yes — server-only**                                       | Empty string; submissions still validate but no notification fires. Confirm this is acceptable before going live, or set it.                                                                                                                                                         |
| `GOQW_TURNSTILE_SECRET_KEY`                             | `wp-config.php` constant (preferred) or `wp_options.goqw_turnstile_secret_key`      | **Yes — server-only**                                       | Empty string; `Settings::turnstile_configured()` returns false, and `BotProtection` silently skips Turnstile (honeypot + rate limiting still run). Fine for a site that hasn't set up Turnstile yet; not fine if you believe Turnstile is protecting the form and it silently isn't. |
| `GOQW_AGENCY_NOTIFICATION_EMAIL`                        | `wp-config.php` constant (preferred) or `wp_options.goqw_agency_notification_email` | Internal, not highly sensitive                              | Falls back to WordPress's own `admin_email` option                                                                                                                                                                                                                                   |
| `goqw_turnstile_site_key`                               | `wp_options` (via wp-admin or WP-CLI)                                               | No — public by Cloudflare's own design, safe in the browser | Empty string; same effect as above                                                                                                                                                                                                                                                   |
| Standard WP `DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_HOST` | `wp-config.php`                                                                     | **Yes**                                                     | N/A — WordPress itself won't run without these                                                                                                                                                                                                                                       |

**Why constants over `wp_options` for the three sensitive values**: a
constant defined in `wp-config.php` never appears in a database dump, a
`wp_options` table export, or a WP-CLI `option list`. Prefer constants for
anything genuinely sensitive; `wp_options` (settable from wp-admin) is fine
for values that are annoying but not dangerous to leak, or that a
non-technical client needs to edit themselves.

## 2. Where each secret belongs (and where it must never appear)

- **Belongs**: `wp-config.php` on the production server only, set directly
  on the host (or via the hosting provider's own secrets/env-var UI if it
  proxies into `wp-config.php`). Never in a file inside this repository.
- **Never belongs**: any file tracked by git, any file under `apps/wizard/src`
  (it will end up in the compiled JS bundle — anyone can view-source it),
  any documentation file, any test fixture using a _real_ value instead of
  an obviously-fake placeholder, any Jupyter notebook or onboarding doc used
  as a personal runbook.
- **Frontend-accessible values must only be public-safe ones.** The single
  enforcement point is `plugins/quote-wizard/src/Frontend/PublicConfig.php`
  — it hand-picks every field the browser is allowed to see. Adding a new
  field to `window.GOQW_CONFIG` requires a deliberate code change there; it
  cannot happen by accident.

## 3. Deployment steps

1. On the production server, add the three sensitive constants to
   `wp-config.php` (above the `/* That's all, stop editing! */` line):
   ```php
   define( 'GOQW_MAKE_WEBHOOK_URL', 'https://hook.eu1.make.com/<real-id>' );
   define( 'GOQW_TURNSTILE_SECRET_KEY', '<real-secret>' );
   define( 'GOQW_AGENCY_NOTIFICATION_EMAIL', 'agency@example.com' );
   ```
2. Set the Turnstile **site** key and business display fields via wp-admin
   or WP-CLI (`wp option update goqw_turnstile_site_key "..."`, etc.) —
   these are not sensitive and don't need a constant.
3. Run `pnpm build` (or the root `pnpm build`, which also runs
   `build-plugin.mjs`) and deploy the resulting `plugins/quote-wizard/`
   directory — never hand-edit anything inside `assets/dist/` on the server.
4. Confirm the site's Turnstile widget is configured for the **production
   domain** in the Cloudflare dashboard (a site key is domain-scoped;
   reusing a dev/staging key on the live domain will fail validation).
5. Point the Make.com scenario's webhook module at the **client's own**
   destination spreadsheet/WhatsApp template before activating it — never
   leave it pointed at a template/demo destination.

## 4. Verification steps (run before every production deploy)

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Then, specifically for secret hygiene:

- `grep` the compiled `apps/wizard/dist/*.js` and `*.css` for the literal
  strings of your real webhook URL and Turnstile secret — both must return
  zero matches. (They structurally can't appear — nothing in the frontend
  source reads them — but verify empirically after every build, not just
  by assumption.)
- Confirm `window.GOQW_CONFIG` in a browser console on the live site
  contains only the fields listed in §2 above, nothing else.
- Confirm `wp-config.php` is not web-readable (standard Apache/nginx
  WordPress hardening — it should 403 if requested directly over HTTP).

## 5. Common mistakes to avoid

- **Using a real secret as test fixture data.** Several existing tests use
  the real Turnstile _site_ key as fixture data instead of an obviously-fake
  placeholder. Harmless today (site keys are public by design), but the
  _habit_ is the risk — never do this for the secret key, a webhook URL, or
  anything else genuinely sensitive, even in a test file.
- **Treating a personal onboarding notebook as a safe place for real
  values.** A Jupyter notebook, scratch doc, or "notes to self" file
  committed to the repo is committed to the repo — git history keeps every
  value that ever touched it, and if the remote is public, so does the
  internet. Keep operational runbooks with real client secrets in a
  password manager or a private, non-versioned location — commit only
  genericised versions with `<placeholder>` values.
- **Assuming `.env.*.local` covers `.env.production`.** It doesn't (a real,
  found gap in this repo) — `.env.production` has no `.local` suffix, so
  that pattern alone would let it slip through. Use a closed `.env*`
  pattern (with an explicit `!.env.example` re-allow) instead of an
  itemised list that has to be remembered and kept in sync by hand.
- **Adding a new field to `window.GOQW_CONFIG` without checking `PublicConfig.php`
  first.** The allowlist there is the only thing standing between "new
  business setting" and "new secret accidentally shipped to every visitor's
  browser." Always ask: does this field need to reach the browser, or only
  the PHP layer?
- **Rotating nothing after a public exposure.** If a real secret is ever
  found in a public commit, redacting the _current_ file is necessary but
  not sufficient — the old value is permanently compromised the moment it's
  public, regardless of whether it's later removed. Rotate it (issue a new
  webhook URL, a new Turnstile secret, etc.) in addition to cleaning the
  repo.

## 6. Known residual risk from this audit (not fixed here — requires your decision)

A real, live Make.com webhook URL (with its authentication token) was found
committed across several historical commits in `docs/Agency Docs/Technical
Onboarding.IPYNB`, and confirmed to already be present on `origin/main` of
the **public** GitHub repository `awkwardapples/scb-handyman`. The current
working-tree copy of that file has been redacted as part of this audit, but
**redacting the current file does not remove the value from git history** —
per your instruction, history was not rewritten. Two independent actions are
recommended (see the full report for detail): rotate the webhook in Make.com
and update the live site's option/constant to the new URL, and decide
whether to also make the GitHub repository private and/or scrub history.
