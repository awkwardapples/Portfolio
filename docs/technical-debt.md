# Technical Debt Register

This file records conscious deferral decisions: things we knowingly skipped
and the trigger condition that should prompt revisiting them. It is not a
backlog; it is a record of trade-offs made deliberately.

## Media Retention Policy (deferred from Step 4.8)

**What was skipped:** Automatic pruning of photo data from `wp_goqw_submissions.media_json`.
Photos are stored indefinitely. On a busy deployment this column could grow significantly.

**Why deferred:** No production deployment yet. No client has raised a data retention or
storage concern. Adding a WP-Cron prune job introduces a policy decision (how long to
keep photos) that should be made with the client, not assumed.

**Trigger:** A client raises a privacy concern, GDPR request, or storage cost issue.
At that point, implement a configurable retention window (e.g. 30 days) via a WP-Cron
daily prune that sets `media_json = NULL` on rows older than the window, while
preserving `answers_json` for operational analytics.

---

## Photo Preview Thumbnails in sessionStorage (deferred from Step 4.8)

**What was skipped:** Persisting low-resolution preview thumbnails to sessionStorage so
the user sees what they uploaded after reloading the page, even though the full base64
bytes cannot be persisted (sessionStorage quota).

**Why deferred:** The re-attach affordance (indicator shown when metadata exists without
base64) handles the UX adequately for now. Thumbnail persistence adds complexity
(canvas downscale, separate sessionStorage key per file) for marginal UX improvement.

**Trigger:** User research or support reports showing that the "re-attach required"
indicator causes meaningful drop-off or confusion.

---

## Admin Replay UI for Failed Sends (deferred from Step 4.6)

**What was skipped:** A wp-admin screen listing `wp_goqw_submissions` rows with
`status = 'forward_failed'` and a button to re-forward them to Make.com without
browser involvement.

**Why deferred:** Current volume is low; failed rows are recoverable by the developer
directly in the database or via WP-CLI. A full admin UI adds significant scope.

**Trigger:** Ops team needs to re-forward rows without developer access to the database
(first real client deployment with non-technical operators).

---

## SSR / Static Rendering (deferred, out of scope for Phase 4–5)

**What was skipped:** Server-side rendering of the React SPA for SEO or initial-load
performance. Currently the site shell and all five pages are client-rendered.

**Why deferred:** The current clients are local trade businesses where SEO is managed
via Google Business and local citations, not technical on-page SEO. The wizard itself
is never crawled by search engines by design. SSR adds deployment complexity and a
Node.js process dependency.

**Trigger:** A client explicitly requires page content to be crawlable, or a performance
audit identifies first-contentful-paint as a blocking conversion issue.

---

## h-10 Tailwind Utility Hygiene (deferred from Step 4.3, still open)

**What was skipped:** `h-10` appears in several primitives. The spacing scale in the
Tailwind config only explicitly defines keys 0–16, and `h-10` is within range, but it
was not included in the closed "approved utilities" inventory in ADR-0012.

**Why deferred:** No visual regression observed; `h-10` (40px) is within the standard
Tailwind scale and renders correctly. Cleaning it up would require a sweep of all
primitives to explicitly approve or replace it.

**Trigger:** A visual regression is observed where `h-10` produces the wrong output, or
a strict custom Tailwind config is introduced that redefines the scale.

---

## Component Rendering Tests (deferred from Step 4.2, still open)

**What was skipped:** Vitest tests for React components (StepRenderer, field renderers,
ServiceSelector, ServiceCard, WizardShell).

**Why deferred:** The Vitest test environment is `node` (no jsdom). Adding jsdom
requires a separate ADR decision on the test architecture (environment split,
React Testing Library version, mock strategy for sessionStorage). The domain layer,
state machine, pricing engine, and HTTP port are fully unit-tested without jsdom.

**Trigger:** When a rendering bug ships to production that would have been caught by
a component test, or when the component tree becomes complex enough that visual
regression becomes a real risk. At that point, add a jsdom Vitest config and
RTL-based tests.

---

## Idempotency on SUBMIT_RETRY (deferred from Step 4.6)

**What was skipped:** A hash of `(clientTimestamp + wizardId + answers)` as an
idempotency key to prevent duplicate `wp_goqw_submissions` rows when the user retries.

**Why deferred:** Current volume makes accidental duplicates recoverable via Make.com
workflow de-duplication. The key computation and dedup logic add server-side complexity
that is not yet justified.

**Trigger:** When a client reports duplicate lead rows, or when submission volume
grows to the point where duplicates cause operational problems.

---

## Rate Limiting on qw/v1/submit (deferred from Step 4.6)

**What was skipped:** Per-IP throttling on the REST submission endpoint. Currently
protected only by WP REST nonce.

**Why deferred:** The WP nonce provides adequate protection for low-traffic single-client
deployments. Adding a rate limiter (WP transient-based or nginx-level) adds
deployment complexity.

**Trigger:** Before any high-traffic deployment, or as part of a security hardening
pass before Phase 5 goes to production.

---

## Multisite WordPress Support

**What was skipped:** The plugin Activator runs per-site. On a network activation,
it would run for each site in the network. Network-activation semantics (creating
one Site Root page per site vs a shared one) are not handled.

**Why deferred:** All current deployments are single-site. Multisite is not a stated
requirement.

**Trigger:** A client requires the plugin on a WordPress multisite network.
