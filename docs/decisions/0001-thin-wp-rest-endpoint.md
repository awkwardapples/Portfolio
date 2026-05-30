# ADR-0001: Thin WordPress REST endpoint as the submission gateway

**Status:** Accepted
**Date:** 2026-05-11

## Context

The quote wizard runs entirely in the browser as a React island inside WordPress. On submission, it needs to:

1. Persist the lead so it cannot be lost.
2. Store uploaded photos somewhere durable.
3. Trigger downstream automation (HubSpot contact creation, owner email, customer confirmation, optional SMS) via Make.com.

Two paths were considered for how to do this.

**Path A.** The React app POSTs directly to a Make.com webhook with images base64-encoded into the payload. No custom backend code. Simplest possible architecture.

**Path B.** The React app POSTs to a WordPress REST endpoint registered by a custom plugin. The endpoint stores images in the WordPress media library, persists a record of the submission in a custom database table, and forwards a JSON payload to Make.com. The Make.com webhook URL is never exposed to the browser.

## Decision

We use **Path B**.

## Alternatives considered

**Path A — direct browser to Make.com.**

- Pros: zero custom backend, fastest to ship.
- Cons:
  - Make.com webhook payloads are capped at ~5MB and base64 inflates image data by ~33%. Multi-image submissions become unreliable.
  - The webhook URL, while not strictly a credential, is the single point of write access. Putting it in a public JS bundle invites abuse.
  - When Make.com fails or is throttled, the lead is irrecoverably lost. There is no durable copy.
  - Images stored only in Make.com (or wherever Make.com forwards them) — the client has no view of them in their own WordPress.
  - Debugging requires Make.com access; the client cannot self-serve any visibility.

**Path B — thin WP REST endpoint.**

- Pros:
  - Durable storage of every submission in WordPress, regardless of downstream success.
  - Images in WP media library — visible to the client in wp-admin, served from their own domain.
  - The Make.com webhook URL is server-side configuration, never exposed.
  - Rate limiting, nonce verification, and abuse mitigation can live in the plugin without redeploying the React bundle.
  - Replacing Make.com later (with Zapier, n8n, or anything else) means changing one PHP class.
- Cons:
  - Approximately 80 lines of PHP must be written, tested, and maintained.
  - One more moving part in the system.

## Consequences

**Easier:**

- Lead durability — the submission lands in WordPress before any third-party call is attempted.
- Recovering from a Make.com outage — submissions are queryable from wp-admin.
- Replacing the automation platform — the contract is a JSON POST to a configured URL.
- Client visibility — images and submissions are in their WordPress.

**Harder:**

- Initial implementation is longer. The plugin must implement REST routing, validation, image sideloading, rate limiting, and forwarding.
- One more language (PHP) for engineers to maintain alongside TypeScript.

**To revisit:**

- This decision presumes the WordPress site is reasonably available. If client hosting becomes unreliable in practice, we re-evaluate.
- See ADR-0005 for the related decision on how forwarder failures are surfaced to the user.

## Amendment — 2026-05-30: persist-before-forward formalised in Step 4.6

Step 4.6 implements this ADR's core principle with the strict controller ordering
documented in ADR-0015. The `wp_goqw_submissions` schema gains a `status` field
(`persisted → forwarded | forward_failed`) so rows where forwarding failed are
recoverable. `SubmissionController::handle()` persists in Step 2 and forwards in
Step 3; the persistence row is the durable record of submission regardless of
forward outcome. Admin tooling (Phase 6+) can replay `forward_failed` rows without
involving the user.
