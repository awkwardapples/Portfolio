# ADR-0009: Public config allowlist and PHP ↔ React boundary contract

**Status:** Accepted
**Date:** 2026-05-16

## Context

Step 3E ships the WordPress ↔ React asset integration. Before bundling assets and wiring enqueueing, we must answer: **what configuration values cross the PHP → browser boundary, and how do we enforce the discipline that secrets never leak?**

Operational constraint #1 (recorded in ADR-0007) requires that no secrets ever reach the browser. The plugin holds (or can hold via `wp-config.php` constants) several sensitive values: the Make.com webhook URL, agency notification email, potentially future API tokens. None of these should appear in `window.GOQW_CONFIG` or any other browser-readable surface.

We need a discipline that is **architectural** rather than relying on developer vigilance.

## Decision

We introduce a single class, `Agency\QuoteWizard\Frontend\PublicConfig`, with one public method `build()` that returns the exact set of fields exposed to the browser as `window.GOQW_CONFIG`.

The discipline is enforced by **enumeration, not exclusion**:

- `PublicConfig::build()` lists every field explicitly.
- Adding a new field to the browser surface requires editing this one method.
- Editing this method requires a PR + code review.
- No reflection, no `get_object_vars`, no "automatically expose all `goqw_*` options".

`Settings` (which knows about sensitive values via the `wp-config.php` constant → `wp_options` → default precedence chain) is consumed by `PublicConfig`, but the consumer side picks **which** Settings methods to call. The sensitive methods (`Settings::webhook_url()`, `Settings::agency_notification_email()`) are simply never called from `PublicConfig`.

## The contract (version 1)

The fields exposed in version 1 of the contract:

| Field             | Type                | Source                       | Sensitivity                       |
| ----------------- | ------------------- | ---------------------------- | --------------------------------- |
| `contractVersion` | `1` (literal)       | constant                     | n/a                               |
| `businessName`    | `string`            | `Settings::business_name()`  | public — appears in wizard UI     |
| `businessPhone`   | `string`            | `Settings::business_phone()` | public — appears in fallback CTAs |
| `businessEmail`   | `string`            | `Settings::business_email()` | public — appears in fallback CTAs |
| `primaryColor`    | `string` (hex)      | `Settings::primary_color()`  | public — branding                 |
| `calendlyUrl`     | `string`            | `Settings::calendly_url()`   | public — post-submission CTA      |
| `restNamespace`   | `'qw/v1'` (literal) | constant                     | n/a                               |
| `restUrl`         | `string` (URL)      | `rest_url('qw/v1')`          | public — needed for submission    |
| `restNonce`       | `string`            | `wp_create_nonce('wp_rest')` | per-request CSRF token            |
| `pluginVersion`   | `string`            | `GOQW_VERSION` constant      | public — useful for support       |
| `buildTimestamp`  | `string` (ISO 8601) | manifest mtime               | public — useful for support       |

## Fields explicitly forbidden from the contract

| Field                               | Reason                                       |
| ----------------------------------- | -------------------------------------------- |
| Make.com webhook URL                | Sensitive endpoint; abuse vector if leaked   |
| Agency notification email           | Internal address                             |
| Any `GOQW_*` wp-config.php constant | Server-only by definition                    |
| HubSpot API tokens                  | Not in WP — but mentioned for the discipline |
| SMTP credentials                    | Same                                         |
| Current user's WP user info         | Privacy                                      |
| Wizard submissions / lead data      | Privacy                                      |

## Contract versioning

`contractVersion` is a hard integer.

- **Bump** when: a field is renamed, removed, or changes semantics.
- **Do NOT bump** when: a new optional field is added (forward-compatible).

When the version bumps, the React side detects it via `config-loader.ts` and emits a console warning. For one release cycle the PHP side can emit both v1 and v2, then v1 is removed.

## Alternatives considered

**A. Auto-expose all `goqw_*` options to JS.**

- Pros: zero code to maintain.
- Cons: the next sensitive option added accidentally appears in `window.GOQW_CONFIG`. Direct violation of constraint #1.

**B. Allowlist as an array of strings.**

- Pros: minimal code.
- Cons: still requires a code change, but the change is opaque ("which value comes from what?"). Doesn't help type safety on the React side.

**C. Explicit method (chosen).**

- Pros: every field traceable to a source; the diff in a PR is obvious; TypeScript ambient declaration mirrors the PHP method literally; static analysis sees both sides.
- Cons: slightly more code than (A) or (B). Worth it.

## Consequences

**Easier:**

- Reviewers can verify in 30 seconds that no sensitive field leaked.
- TypeScript catches drift on the React side via `GoqwPublicConfig` ambient type.
- Adding a contract-version bump is a deliberate event with a clear migration path.
- A future engineer searching for "what does the browser see?" finds one method.

**Harder:**

- Two files to keep in sync: `PublicConfig.php` (server) and `global.d.ts` (client).
- The duplication is intentional. Generating one from the other was considered (e.g. JSON Schema → both sides) and rejected as premature for our scale.

**To revisit:**

- If the contract grows past ~20 fields and the duplication becomes a real maintenance cost, consider a code-generation step.
- If a future workflow needs to expose values that vary per-page (e.g. trade type from a shortcode attribute), the contract grows a `pageContext` sub-object. That is an additive change, no version bump needed.
