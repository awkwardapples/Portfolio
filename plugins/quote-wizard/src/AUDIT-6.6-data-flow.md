# Audit C — Data Flow Paths (Step 6.6)

## Hop-by-hop trace

```
User input
  → Wizard client (React, apps/wizard)
      answers map built client-side; client-side Zod/answer-validation is
      UX only (not a trust boundary — D9/ADR-0029 established this for
      consent and it holds generally).
  → JSON payload (WizardStore.buildRequest(), contractVersion 3)
      Spreads the entire answers map unfiltered into the submission body.
      No per-field allowlist client-side.
  → REST endpoint POST /wp-json/qw/v1/submit
      SubmissionController::handle() — see AUDIT-6.6-auth-model.md for the
      permission_callback (nonce, not login-authentication).
      Order of operations (unchanged by this step):
        0. BotProtection::check() — honeypot/rate-limit/Turnstile.
        1. validate() — shape/type checks; sanitize_key(wizard_id),
           sanitize_text_field(clientTimestamp). answers itself: shape-
           checked (is_array) only, contents untouched.
        1a. ConsentValidator::is_given()
        1b. DuplicateDetector::check() — reads contact_email/contact_phone
            out of the still-unsanitized $answers.
        1c. MediaValidator::validate() — magic-byte/dimension checks on
            photo fields, still against raw $answers.
        1d. store_photos() — decodes dataBase64, writes to the media
            library via PhotoStorage (sanitize_file_name + WordPress's own
            wp_check_filetype_and_ext), replaces dataBase64 with a
            server-generated url + attachmentId in $answers. originalName/
            mimeType (user-supplied strings) are retained in $answers as-is.
      → answers_json = wp_json_encode($answers)   [RAW — this is what commit 3
        stores; see below]
  → SubmissionRepository::insert()  →  wp_goqw_submissions row (MySQL)
      wpdb->insert() with an explicit %s/%d format array — parameterized,
      not string-interpolated. Stores the RAW (unsanitized) answers_json.
      This is deliberate (D-decision, matches spec intent): the database is
      an internal system the business owner's own admin might query
      directly; storing the original value preserves fidelity for any
      future investigation. WordPress admin does not currently render this
      data as HTML anywhere (Audit A/E), so no stored-XSS risk exists today
      at this hop — the risk is only realized if/when an admin UI is added
      to display submissions, which is why display-time esc_html() is
      still called out as defense-in-depth in the ADR even though nothing
      calls it yet.
  → Forwarder::forward($submission_id, $payload)
      THIS STEP'S SANITIZATION BOUNDARY. SubmissionController builds a
      *separate* forward payload: same $validated array, but with
      answers_json/media_json replaced by the sanitized versions computed
      from InputSanitizer::sanitize_for_outbound($answers). Forwarder.php
      itself requires NO changes — see "Corrected assumption" below.
  → wp_remote_post() → Make.com (external, HTTPS, server-side URL only —
      ADR-0007)
  → Make.com scenario (outside this codebase) → Google Sheets + WhatsApp
      template. This is the boundary the sanitizer is protecting: once
      data leaves wp_remote_post(), this plugin has no further control.
      Google Sheets formula injection and WhatsApp template rendering are
      both mitigated by having sanitized string content by the time it
      reaches wp_remote_post().
```

## Corrected assumption: Forwarder does not need to change

The spec's Architecture Overview (4.3) proposed modifying
`Forwarder::forward()`'s parameter to explicitly accept a "sanitized
payload." Investigation of the real `Forwarder.php` shows this is
unnecessary: `forward()` already takes a single opaque
`array<string,mixed> $payload` and only ever reads `answers_json`/
`media_json`/etc. as pre-encoded strings/scalars — it has no knowledge of
"raw vs. sanitized," it just forwards whatever `answers_json` string it's
given. `SubmissionController` can therefore build a second, sanitized
`$forward_payload` array (cloned from `$validated`, with `answers_json`
and `media_json` recomputed from the sanitized answers) and pass that to
the existing, unmodified `Forwarder::forward()` signature. This keeps
`Forwarder.php` — and its existing test suite — completely untouched,
which is a smaller, safer diff than the spec assumed was required.

## Each hop's sanitization opportunity (summary)

| Hop                      | Opportunity                             | Decision                                                                                                          |
| ------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| React client             | Could sanitize client-side              | Not a trust boundary (D-decision, "no client-side sanitization"); skipped.                                        |
| REST validate()          | Shape check only                        | Unchanged — sanitization is a separate concern from shape validation.                                             |
| DB insert                | Could sanitize before storing           | Deliberately NOT sanitized — raw fidelity preserved for the internal system.                                      |
| Forwarder call           | **Chosen boundary**                     | `InputSanitizer::sanitize_for_outbound()` applied here, in `SubmissionController`, before `forward()` is invoked. |
| wp_remote_post           | N/A (already sanitized by previous hop) | —                                                                                                                 |
| Make.com/Sheets/WhatsApp | Outside codebase                        | Protected by sanitization applied at the Forwarder-call hop.                                                      |
