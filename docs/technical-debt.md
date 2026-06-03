# Technical Debt Register

This file records conscious deferral decisions: things we knowingly skipped
and the trigger condition that should prompt revisiting them. It is not a
backlog; it is a record of trade-offs made deliberately.

## Media Uploads (deferred from Step 4.7)

**What was skipped:** A file/image upload field type for wizard steps (e.g. "upload
a photo of your existing fence"). The Step 4.7 spec explicitly deferred this.

**Why deferred:** No client has requested photo uploads yet. Implementing a file field
type requires: a new field type in the registry, a media upload REST endpoint, WP media
library integration, and browser-side file validation. The surface area is significant
and the payoff is zero until a real client needs it.

**Trigger:** The first client engagement that requires photo uploads as part of the
quote process. At that point, create a dedicated step (e.g. 4.8 — Media Upload field
type) rather than retrofitting.

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
