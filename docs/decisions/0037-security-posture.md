# ADR-0037: Security Posture and Hardening

**Status:** Accepted (Step 6.6, 2026-07-22)

## Context

The wizard collects user contact information and project details,
processes them through WordPress, and forwards them to external systems
(Google Sheets, WhatsApp, via Make.com). Each hop is potential attack
surface. Real-world attack vectors considered, per Phase 0 audits
(`AUDIT-6.6-input-fields.md`, `AUDIT-6.6-current-sanitization.md`,
`AUDIT-6.6-data-flow.md`, `AUDIT-6.6-sql-safety.md`,
`AUDIT-6.6-auth-model.md`):

- Formula injection (Google Sheets displaying a malicious formula)
- Stored XSS (a future WordPress admin view rendering user data)
- SQL injection
- Command/header injection
- Path traversal (photo uploads)
- CSRF/bot abuse
- PII exposure

Two of the spec's original assumptions did not survive the audits and are
recorded here rather than silently worked around:

1. **`Forwarder.php` needed no code changes.** It already accepts an
   opaque `array<string,mixed> $payload` and has no notion of "raw vs.
   sanitized" — it just JSON-encodes whatever `answers_json`/`media_json`
   strings it's given. `SubmissionController` builds a second, sanitized
   payload for the forward call instead, leaving `Forwarder` and its
   existing test suite untouched. See `AUDIT-6.6-data-flow.md`.
2. **ADR number 0036 was already taken** (Step 6.4's
   `0036-service-customization-guide.md`); this decision is 0037.

Two dead Step 3D stub classes (`Rest/Sanitiser.php`, `Rest/Validator.php`)
were also found during the audits — superseded by inline logic in
`SubmissionController` years ago and never removed. They're flagged in
`AUDIT-6.6-current-sanitization.md` as a naming hazard (don't confuse them
with the new `Security\InputSanitizer`) but left in place — removing dead
code unrelated to a security fix is out of scope for this step.

## Decision

Layered defense, sanitizing at the one boundary that actually needs it:

**Primary defense** — `Security\InputSanitizer`, applied in
`SubmissionController` to a copy of the answers immediately before
`Forwarder::forward()` is called. The database row inserted earlier in
the same request keeps the original, unsanitized values — the internal
system (WordPress's own database) is not the risk surface; the external
systems the data is forwarded to are.

**Secondary defense** — WordPress's own escaping functions
(`esc_html`/`esc_attr`/`esc_url`), already used wherever the plugin
renders its own markup. No admin UI currently displays submission data,
so this is forward-looking defense-in-depth rather than an active gap
being closed today — if a submissions-viewer screen is ever added, the
data it would render has already passed through sanitization once (at
the webhook boundary) even though that specific screen would still need
its own output escaping at render time regardless of source.

**SQL** — already exclusively parameterized (`wpdb->insert()`/`update()`
with explicit format arrays, or `wpdb->prepare()`); verified, not changed.

**Attack-specific mitigations:**

- _Formula injection:_ `InputSanitizer` force-quotes any string whose
  post-`sanitize_text_field()` leading character is `=`, `+`, `-`, or `@`
  — the OWASP CSV/Formula Injection Cheat Sheet's canonical set, minus
  the whitespace characters (tab/CR/LF) OWASP also lists. Those are
  intentionally omitted: `sanitize_text_field()` runs _before_ this
  check and collapses/trims all leading whitespace, so a value can never
  reach the check still bearing a leading tab/CR/LF — whatever character
  was hiding behind it becomes the new leading character, and the four
  checked characters still catch it there. Including the whitespace
  characters in the trigger list would be unreachable code.
- _XSS:_ `sanitize_text_field()` strips tags/scripts (including full
  `<script>`/`<style>` block removal) before the value is forwarded.
- _SQL injection:_ verified safe by audit (`AUDIT-6.6-sql-safety.md`);
  no code change.
- _Command/header injection:_ no shell execution or user data in HTTP
  headers found anywhere in the plugin; no code change.
- _Path traversal:_ photo filenames already run through
  `sanitize_file_name()` plus WordPress's own file-type verification
  (Step 5.13e); verified, not changed by this step.
- _CSRF/bot:_ the REST endpoint's nonce is a same-origin/CSRF check, not
  authentication (`AUDIT-6.6-auth-model.md`) — unchanged. Rate limiting,
  honeypot, and optional Turnstile (Step 5.13f) are the actual bound on
  abuse volume; unchanged.
- _PII:_ data flow fully documented (`AUDIT-6.6-data-flow.md`); no new
  access paths introduced.

**Sanitization is applied uniformly to every string value in the answers
map**, regardless of the field's nominal type (text, select, radio,
checkbox, etc.), rather than an allowlist keyed to specific field names.
The client-side schema is UX only — a crafted request can put any string
value against any answer key — so a type-aware allowlist would need to
assume the client's shape is trustworthy, which it isn't.

## Consequences

**Positive:**

- Formula injection in Google Sheets is neutralized without changing
  what the business owner sees (force-quoted values still display, just
  as text rather than being evaluated).
- A future WordPress admin submissions-viewer inherits a lower baseline
  XSS risk from data that's already passed through sanitization once.
- Sanitization lives at one boundary (`SubmissionController`, immediately
  before `Forwarder::forward()`), not scattered across every field
  definition or spread into `Forwarder` itself.
- Zero behavior change for the overwhelming majority of legitimate
  submissions — sanitizing an already-safe string (a name, a phone
  number, an option id) is a no-op.

**Negative:**

- A customer who legitimately types a value starting with `=`, `+`, `-`,
  or `@` (rare, but e.g. an email-like `@handle` in a notes field) sees
  it prefixed with a leading apostrophe in the Google Sheet. Cosmetic
  only — `security-notes.md` explains this to the business owner.
- Negligible performance overhead (one recursive pass over the answers
  map per submission).

**Accepted risks (unchanged by this step, documented for completeness):**

- Photos are publicly accessible URLs by design (existing behavior,
  documented in the privacy policy).
- No formal penetration testing or dynamic security scanning performed —
  this step is static audit + targeted sanitization, not a pentest.
- The two dead Step 3D stub classes (`Rest/Sanitiser.php`,
  `Rest/Validator.php`) remain in the codebase, unused; flagged, not
  removed (out of scope).
