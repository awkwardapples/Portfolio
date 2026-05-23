# ADR-0007: Operational and security discipline

**Status:** Accepted
**Date:** 2026-05-11

## Context

Six operational and security constraints were formally added to the architecture before Step 3D. They are not features; they are rules that constrain all subsequent implementation. This ADR captures them as architecture so future engineers don't relitigate them.

## Decision

The following constraints are now first-class architecture:

### 1. Environment-variable / secrets discipline

- All secrets, tokens, credentials, and webhook URLs are read at runtime from the configuration precedence chain: `wp-config.php` PHP constant → `wp_options` → compiled-in default.
- No secret is hardcoded in plugin source, committed to Git, included in the React bundle, or exposed in `wp_localize_script` data.
- The `Settings` class is the single point that resolves the chain. Code that needs a setting calls a typed method; the precedence is invisible.
- The React bundle receives only fields enumerated explicitly in `Settings::public_config()`. Adding a sensitive field accidentally requires a code change there, not a config change.

### 2. Input validation and sanitisation

- All user input is **validated client-side for UX** and **validated server-side for trust**. The React-side validation is convenience; the WordPress-side validation is canonical.
- The trust boundary is the REST endpoint. Anything that reaches it from the browser is assumed potentially hostile and must pass `Validator` before any further processing.
- Sanitisation runs after validation, never instead of it. `Validator` answers "is this acceptable?"; `Sanitiser` answers "make it safe to store and echo."
- Oversized, malformed, and shape-violating payloads are rejected with a clear error response.

### 3. Upload security

- MIME type allowlist enforced server-side via `finfo_file`, not the client-supplied `Content-Type`.
- Hard file size cap and per-submission file count cap.
- Filename sanitisation through `sanitize_file_name()` plus a UUID prefix to break collision attacks and prevent user filenames being echoed.
- Files routed through `wp_handle_sideload`, which performs WordPress's own MIME re-check and rejects executable types.
- Allowed types in v1: `image/jpeg`, `image/png`, `image/webp`. Anything else rejected.

### 4. Data flow discipline

- The React frontend **never** persists data directly to any third-party API.
- All persistence and integration flows through the WordPress REST endpoint, where validation, sanitisation, persistence, and forwarding are controlled in one place.
- This makes the plugin an architectural enforcement point, not just a courier. Future engineers must not "simplify" by adding a direct browser-to-Make.com path.

### 5. Failure resilience

- **No silent lead loss.** Every submission lands in `goqw_submissions` before any third party is contacted.
- Failures of Make.com, HubSpot, email, SMS, or any future integration are recoverable from the local store.
- Per ADR-0005, forwarder failures are surfaced to the user honestly (502 with a fallback message), not hidden behind a misleading success.

### 6. Future security audit

A structured security review is a planned phase before each production deployment. It covers:

- Composer + npm dependency vulnerabilities
- REST endpoint exposure (nonce, capability, rate limit, payload bounds)
- Upload pipeline review
- Secret management audit
- WordPress capability and nonce coverage
- Bundle inspection (no PII or secrets in shipped JS)
- OWASP attack-surface review

This is not implementation work now, but it is a named obligation tracked in the operations playbook and in `docs/05-risk-analysis.md`.

## Consequences

**Easier:**

- A future engineer reading any submission-handling code finds Validator-then-Sanitiser-then-persist in one shape every time.
- A new client deployment can pin secrets via `wp-config.php` constants without anyone with wp-admin access being able to change them.
- Lead durability is structural, not a feature — it would take a deliberate code change to lose a lead.
- The plugin's role as the enforcement point removes ambiguity about where validation lives.

**Harder:**

- More PHP code than a minimal courier plugin would need.
- Engineers must internalise that React-side validation is UX, not trust. Tempting to assume "we already checked it".
- Each new field added to the wizard requires updating both the React Zod schema and the PHP `Validator`. This is duplication; we accept it because the alternative (one schema source of truth crossing the language boundary) was considered and rejected in ADR-0004.

**To revisit:**

- If the duplication between Zod schemas and PHP validators becomes a maintenance burden, evaluate JSON Schema as a shared representation.
- If `wp-config.php` constant overrides go unused in practice across multiple deployments, simplify by going option-only.
