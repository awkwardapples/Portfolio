# Technical Debt Register

This file records conscious deferral decisions: things we knowingly skipped
and the trigger condition that should prompt revisiting them. It is not a
backlog; it is a record of trade-offs made deliberately.

## Standing discipline: wire contract changes require operational verification (ADR-0018)

Per ADR-0018, any step that modifies the wire contract between PHP and TypeScript
is subject to two blocking requirements before completion:

1. **An integration test** asserting payload shape matches controller expectations
   must exist and run in CI. See
   `apps/wizard/src/runtime/__tests__/wire-contract-integration.test.ts`.
2. **Operational verification** must be performed and recorded in
   `phase-N-evidence.md` using the discipline language:
   _"Submitted a wizard end-to-end on [site] on [date]. Observed HTTP [status]
   response. Confirmed database row [id] with [fields]."_

The "wire contract" includes: PublicConfig shape (PHP emit or TS schema),
submission payload shape (TS construction or PHP validation), response shape,
`contractVersion` value, and any field name, type, or required-ness on the above.

This rule has teeth: a step that changes the wire contract without satisfying
both requirements is not complete, regardless of green code gates. The project
has paid the cost of skipping this discipline three times (OV-001-F5,
5.5a wire contract drift, first SCB clone deploy).

---

## OV-001 findings (from manual WordPress verification, June 2026)

### OV-001-F1 — Plugin deployment procedure (RESOLVED in 5.2)

**Status:** Documented in `docs/onboarding.md` as of Step 5.2.
**Trigger to revisit:** If deploy procedure becomes complex enough to warrant
automation, consider a `deploy-plugin` script.

---

### OV-001-F2 — FrontPagePolicy mistakes default Sample Page for deliberate config

**Status:** Documented; not yet fixed in code.
**Severity:** Medium. Affects first-deployment user experience.
**Trigger to revisit:** Before first real client deployment with a custom front
page configuration, OR if a deployer reports the manual `wp option update
page_on_front` step as friction. The fix is a heuristic refinement in
`FrontPagePolicy::apply_on_activation()` to recognize the WP default Sample Page
(slug = `sample-page` OR ID 2 in fresh installs) as overwriteable.

---

### OV-001-F3 — Plugin version not tracking releases (RESOLVED in 5.2)

**Status:** Bumped to 0.2.0 in Step 5.2.
**Trigger to revisit:** Establish a discipline that every release-significant
step bumps the plugin version. Recommended semver from this point forward:
patch for fixes, minor for new capabilities, major for breaking changes.

---

### OV-001-F4 — Corrupted URL symptom (transient, cause uncertain)

**Status:** Symptom not reproducible after clean redeploy. Suspected cause: stale
HTML cached during half-deployed rebuild state, since flushed.
**Severity:** Low (if non-recurring).
**Trigger to revisit:** If the corrupted-URL symptom recurs at any point,
investigate by capturing the live HTML the server is producing (not the browser
request URL) at the moment of failure.

---

### OV-001-F5 — Submission POST URL wrong (RESOLVED in 5.2, VERIFIED in OV-001 closure)

**Status:** Fixed in 5.2 (TS appends `/submit` to namespace base URL).
Verified June 5, 2026 in OV-001: three test submissions persisted to
`wp_goqw_submissions` with the expected shape and content.
See ADR-0015 amendment 2026-06-05 for the contract clarification.

---

### OV-001-F6 — Fencing reference wizard had no photo step (RESOLVED in 5.2, VERIFIED in OV-001 closure)

**Status:** Fixed in 5.2 (`site_photos` step added to `fencing.config.ts`).
Verified June 5, 2026 in OV-001: photo upload renders, thumbnails display,
remove works, photos land in `media_json` of the persisted submission row.

**Trigger to revisit:** None. Capability is exercised in the reference
deployment.

---

## Standing planning discipline addition (from OV-001)

Every step that affects the WordPress-deployed system must include verification
that the deployed artifact actually works end-to-end in WordPress, not just that
the codebase passes gates. The discipline applies to:

- Any code change in `apps/wizard/src/**` that affects the bundle.
- Any code change in `plugins/quote-wizard/src/**`.
- Any change to the wire contract between PHP and TypeScript.

The verification step is operational, not automated. It must include at minimum:
deploy the new artifact per the onboarding procedure, exercise the changed
surface in a real WordPress install (LocalWP is sufficient), and record results
in the step's evidence report.

---

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

## Admin Settings Page for `goqw_webhook_url` (deferred from Step 5.4)

**What was skipped:** A wp-admin settings page that allows a deployer to set
the Make.com webhook URL via the WordPress admin UI, rather than via wp-cli or
a `wp-config.php` constant.

**Why deferred:** Configuring Make.com is a developer activity, not a
client-operator activity. The wp-cli approach is adequate for the current
deployment model where the developer is also the deployer. Adding a settings
page introduces UI surface (form field, sanitization, capability check, nonce
handling) that is not yet justified by observed friction.

**Trigger to revisit:** First real deployment requiring non-CLI configuration —
specifically, a deployer (or a client's IT contact) who needs to configure or
change the webhook URL but does not have wp-cli access to the WordPress install.

**Cross-reference:** Documented during Step 5.4 planning. The current
configuration workflow is in `docs/make-com-integration.md` Section 2.

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

---

## Interactive Pricing Configuration Tool (deferred from pre-5.3 planning)

**What was skipped:** A possible future tool that would let a client (or deployer)
set pricing per service via an interactive interface, rather than editing TypeScript
config files directly. Considered during the 5.3 planning phase and deferred.

**Why deferred:** Direct config-file editing with TypeScript type-checking has not
yet been a bottleneck. Adding a pricing UI introduces significant scope: schema
design, admin UI, data sync, validation tooling. Not justified without observed pain.

**Alternative considered:** A pricing spreadsheet template the client fills out; the
developer copies values into the config file. Lower-effort alternative if direct
editing proves friction-heavy.

**Trigger:** Direct config-file editing becomes a real bottleneck after multiple
client adaptations have been completed.

---

## Visual Customization System (deferred to Step 5.6)

**What was skipped:** Navbar style variants, background color/image tinting,
layout variants on the landing page, and optional widgets (Google reviews badge,
call-now bar). The current site shell uses a single default visual treatment.

**Why deferred:** Visual variation requirements are client-specific. Building
generalized variation surfaces before seeing what the first client actually needs
would produce the wrong abstraction. Step 5.5 (first client adaptation) will surface
what real variation is needed; Step 5.6 builds exactly that.

**Trigger:** Step 5.6, after Step 5.5 (first client adaptation) has surfaced what
visual variations are actually needed. Scope of 5.6 is driven by real first-client
feedback, not anticipation. See `docs/product-vision.md` for the intended variation
surface.

---

## Per-Client Service Expansion (ongoing, driven by client engagements)

**What was skipped:** The handyman first client offers many services beyond the
two reference verticals (fencing, decking). Each new service requires its own
wizard config and pricing config in the registry.

**Why deferred:** Services are added as needed, not in bulk in anticipation.
The registry was designed for incremental addition (one PR per vertical per ADR-0013).

**Trigger:** Continuously, driven by each client engagement. Step 5.5 adds the
handyman's priority subset (2-3 services). Step 5.7 expands the handyman's
offerings based on which services are generating customer interest. Future clients
trigger their own service additions.
