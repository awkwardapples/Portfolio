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

## ServiceSelector at App Root (deferred to Phase 5)

**What was skipped:** The `ServiceSelector` currently mounts at `App.tsx`'s root
because the site shell (QuotePage) does not yet exist.

**Why deferred:** Phase 5 builds the full site template layer. Moving the selector
before the shell exists would require a premature layout decision.

**Trigger:** Phase 5 QuotePage implementation. The selector moves from `App.tsx` to
the `QuotePage` component with surrounding site context.

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
