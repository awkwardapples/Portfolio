# Make.com Integration Guide

How to configure Make.com (or any compatible webhook target) to receive
quote submissions from a deployed Quote Wizard installation.

**Audience:** A developer (typically the project owner) who has already
adapted the template for a client per `docs/adaptation-runbook.md` and
deployed it to LocalWP or production hosting, and who now needs to wire
the submission flow through to the contractor.

**Scope:** Configuring an external webhook target (Make.com specifically,
though any webhook receiver could be substituted) to handle the quote
submission payload and forward leads to the contractor. Covers the technical
contract, the recommended baseline workflow, photo handling, error handling,
and security considerations.

**Out of scope:**

- Make.com account creation and platform onboarding. Refer to Make.com's
  official documentation for account setup, plan selection, and the
  platform tour.
- Detailed UI walkthroughs of Make.com modules. Module configuration is
  Make.com's responsibility to document; this guide describes intent and
  required behavior.
- Custom integrations beyond webhook delivery (CRM lookups, conditional
  routing, multi-step automation). The recommended baseline workflow handles
  the case most clients need.
- Admin UI for setting the webhook URL inside WordPress. Currently set via
  wp-cli or a `wp-config.php` constant only; a wp-admin settings page is
  recorded as a deferred capability with trigger in `docs/technical-debt.md`.

**Reading flow:** Top to bottom for a first-time setup. Once familiar, use
the reference section at the end as a quick lookup.

**Last updated:** June 6, 2026

---

## Prerequisites

Before starting:

- A working Make.com account with a free or paid tier sufficient for the
  expected submission volume. See Make.com's official documentation for
  account creation, plan selection, and platform onboarding.
- A Make.com scenario created and ready to receive a webhook trigger.
  See Make.com's documentation for creating scenarios.
- The client's quote wizard already adapted and deployed to a WordPress
  install (per `docs/onboarding.md` and `docs/adaptation-runbook.md`).
- The contractor's email address (or other destination for lead
  notifications).
- wp-cli access to the WordPress install, or the ability to define PHP
  constants in `wp-config.php`.

If any of these are missing, address them before proceeding.

---

## Section 1 — The technical webhook contract

This contract is independent of Make.com. Any webhook target that honors
it can substitute for Make.com without WordPress-side changes.

### What WordPress sends

When a quote wizard submission is successfully validated and persisted,
WordPress POSTs to the configured webhook URL with a JSON body containing:

| Field              | Type           | Description                                                                                                                                                            |
| ------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `submission_id`    | integer        | The WordPress-side submission row ID. Stable; useful for cross-referencing back to the `wp_goqw_submissions` table if a deployer needs to investigate or replay later. |
| `wizard_id`        | string         | The service vertical that produced this submission (e.g. `'fencing'`, `'decking'`, or a client-specific service ID such as `'boiler-installation'`).                   |
| `schema_version`   | integer        | The wizard schema version used to produce this payload.                                                                                                                |
| `answers`          | object         | The decoded answers payload. Keys are field IDs as defined in the wizard config; values are the user's responses.                                                      |
| `pricing`          | object \| null | The pricing summary if one was computed (price range, total in pence). Null if the wizard has no pricing config or pricing did not run.                                |
| `client_timestamp` | string         | ISO-8601 timestamp from the client at submission time.                                                                                                                 |
| `media`            | array \| null  | Photo entries, if any. See Section 4 for the full structure. Null if the wizard config had no photo step or the user uploaded nothing.                                 |

The POST is sent with `Content-Type: application/json` and a 10-second
timeout (see ADR-0005).

### What WordPress expects in response

| Response                                           | Meaning           | WordPress behavior                                                                                                                                                                     |
| -------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP 2xx                                           | Forward succeeded | Submission marked `status='forwarded'`; user sees the success screen.                                                                                                                  |
| HTTP non-2xx (including 4xx, 5xx)                  | Forward failed    | Submission marked `status='forward_failed'`; user sees the 502 message: "Your submission was saved. We could not notify our team automatically. Please try again or call us directly." |
| Transport error (timeout, DNS, connection refused) | Forward failed    | Same as non-2xx; the submission row is preserved with the failure message logged against the row.                                                                                      |

The HTTP response body is ignored. Only the status code matters for the
WordPress-side branching.

### Why "persist before forward"

WordPress persists the submission to `wp_goqw_submissions` BEFORE
attempting the forward (see ADR-0001). The user's data is durably saved
regardless of whether the forward succeeds. A failed forward leaves a row
in the database with `status='forward_failed'`; a developer with database
access can replay it manually if needed. This is the architectural reason
a 502 to the user is honest: their data is safe; only the downstream
notification failed.

### Example payload

A minimal submission from the fencing vertical looks like:

```json
{
  "submission_id": 42,
  "wizard_id": "fencing",
  "schema_version": 1,
  "answers": {
    "fence_type": "closeboard",
    "fence_length": 18,
    "contact_name": "Jane Smith",
    "contact_email": "jane@example.com",
    "contact_phone": "07700 900123"
  },
  "pricing": {
    "basePence": 270000,
    "totalPence": 324000,
    "rangeMinPence": 291600,
    "rangeMaxPence": 356400,
    "currency": "GBP"
  },
  "client_timestamp": "2026-06-06T14:23:11.000Z",
  "media": null
}
```

A submission with photos has a non-null `media` array. See Section 4 for
the photo payload structure.

---

## Section 2 — Configuring the webhook URL

WordPress reads the webhook URL from one of two sources, in priority order:

1. **PHP constant `GOQW_MAKE_WEBHOOK_URL`** defined in `wp-config.php`
   (takes precedence, suitable for infrastructure-managed configs).
2. **WordPress option `goqw_webhook_url`** stored in `wp_options`
   (suitable for per-install configuration via wp-cli).

For most deployments, the wp-cli approach is the right one. Use the constant
only if your hosting infrastructure manages `wp-config.php` and you need the
value out of the database.

### Setting the URL via wp-cli (recommended)

```bash
wp option update goqw_webhook_url "https://hook.eu1.make.com/abc123def456..."
```

To verify the option is set:

```bash
wp option get goqw_webhook_url
```

To remove the configured URL (e.g., when changing a client over to a new
webhook):

```bash
wp option delete goqw_webhook_url
```

### Setting the URL via wp-config.php constant

Add to `wp-config.php` before the `/* That's all, stop editing! */` line:

```php
define( 'GOQW_MAKE_WEBHOOK_URL', 'https://hook.eu1.make.com/abc123def456...' );
```

When the constant is defined and non-empty it takes precedence over the
database option. To switch back to option-based configuration, remove the
constant from `wp-config.php`.

### What happens when no URL is configured

When both sources are empty or absent, WordPress's Forwarder logs
`webhook_not_configured` and the request returns 502 to the user. This is
the expected behavior during the development phase, before Make.com is
configured. The submission row is still persisted with
`status='forward_failed'` — no data is lost.

### Note on configuration ergonomics

There is currently no wp-admin settings page for `goqw_webhook_url`. Setting
it requires wp-cli access or editing `wp-config.php`. This is intentional:
configuring Make.com is a developer activity, not a client-operator activity.
If this becomes a real bottleneck (e.g., a deployer who cannot use wp-cli),
an admin settings page is recorded as a deferred enhancement in
`docs/technical-debt.md`.

---

## Section 3 — Recommended baseline workflow

The most common deployment pattern: receive a submission, format it as a
readable email, send it to the contractor's email address. This handles
the case most clients need and can be extended later if requirements evolve.

### Workflow overview

```
Quote submission (from WordPress)
          ↓
Make.com webhook (trigger)
          ↓
Format the submission into a readable structure
          ↓
Send email to contractor with the formatted content
```

### Setup steps

**1. Create a webhook in your Make.com scenario.**

Make.com provides a webhook URL when you add a webhook trigger module.
Copy that URL. Refer to Make.com's documentation for the specific module
names and UI flow; they evolve over time and Make.com's documentation is
the authoritative source.

**2. Set the webhook URL in WordPress** via the wp-cli command from
Section 2. Confirm with `wp option get goqw_webhook_url`.

**3. Test that the webhook receives data.**

From the WordPress install, complete a quote wizard submission (a test
submission is fine). Check Make.com's scenario execution history: you
should see an incoming webhook event with the full JSON payload.

**4. Add a formatting step in your scenario.**

Take the incoming payload (`answers`, `pricing`, `wizard_id`, etc.) and
build a readable representation. Plain text or HTML email is appropriate
for most contractors. Include at minimum:

- The service type (`wizard_id`) — e.g. "Fencing quote"
- The customer's contact details — typically at `answers.contact_name`,
  `answers.contact_email`, `answers.contact_phone`. These field IDs come
  from the wizard config; verify against the wizard config for the specific
  client deployment.
- The customer's answers to each wizard question (iterate the `answers`
  object key-by-key).
- The pricing summary, if present. Amounts are in integer pence; divide
  by 100 for display in pounds (e.g., `totalPence / 100` → `£3,240.00`).
- The submission timestamp (`client_timestamp`).
- The submission ID (`submission_id`) — useful for the contractor to
  cross-reference back to the WordPress database if they need to discuss
  a specific quote.

**5. Add a send-email step.**

Configure it to send to the contractor's address. Use the formatted content
from the previous step as the email body. A clear subject line helps the
contractor at a glance — for example:

```
New fencing quote from Jane Smith — GOQW-42
```

(The reference number `GOQW-<submission_id>` matches what the customer sees
on the success screen.)

**6. Test end-to-end.**

Submit through the wizard, confirm the email arrives at the contractor's
inbox with the correct content and formatting. Verify `wp_goqw_submissions`
shows `status='forwarded'` for the test row:

```bash
wp db query "SELECT id, wizard_id, status FROM wp_goqw_submissions ORDER BY id DESC LIMIT 3;"
```

### Variations

The baseline workflow can be extended as client needs emerge:

- Send to multiple contractor addresses by adding multiple email steps
  or using a router module.
- CC the customer with a "we've received your enquiry" confirmation email.
- Log the lead to a Google Sheet or CRM in parallel with the email send.
- Route differently based on `wizard_id` (e.g., different email addresses
  for different service types).

These are the deployer's responsibility to configure per-client. They are
not part of the template.

---

## Section 4 — Photo handling

When the wizard's photo step is configured (per `docs/adaptation-runbook.md`
Step 5b), each submission's `media` field contains an array of photo entries.
The structure is:

```json
"media": [
  {
    "fieldKey": "site_photos",
    "files": [
      {
        "fileId": "1780691665873-ujukkdyhk",
        "originalName": "garden-fence.jpg",
        "mimeType": "image/jpeg",
        "sizeBytes": 331646,
        "width": 1404,
        "height": 935,
        "dataBase64": "/9j/4AAQSkZJ..."
      }
    ]
  }
]
```

The `dataBase64` field contains the full encoded image bytes. Photos are
compressed browser-side (JPEG at ~0.85 quality, max 2000px on the longest
edge, per Step 4.8) so file sizes are typically 200–800 KB even for
phone-camera originals.

### Sending photos as email attachments in Make.com

Do not embed base64 strings directly into the email body — the recipient's
email client will not render them. Instead:

**1. Decode the base64 to a file binary.** Make.com provides modules for
handling binary data. Consult Make.com's current documentation for the
specific module that converts base64 text into a file binary suitable for
email attachment.

**2. Attach the decoded file to the email step.** Most Make.com email
modules accept a file attachment parameter. Pass the decoded binary with
the `originalName` and `mimeType` from the payload entry.

**3. Handle multiple photos.** If the `files` array contains more than one
entry, iterate over it and attach each file, or bundle them into a single
email with multiple attachments. Make.com's array iteration tools handle
this; see Make.com's documentation.

### Important constraints

- **Total payload size:** The submission payload is capped at approximately
  10 MB encoded (per Step 4.8 spec, where the browser compression and
  per-wizard `maxCount` limit are the effective controls). Make.com's own
  per-execution data limits apply depending on your plan tier.
- **Photos are already compressed:** Do not re-compress or resize in
  Make.com.
- **No data-URI prefix:** The `dataBase64` value is raw base64 without a
  `data:image/jpeg;base64,` prefix. If a Make.com module requires the
  prefix, prepend it explicitly.

### What NOT to do

- Do not embed `dataBase64` strings directly in the email body. Recipients
  see raw text.
- Do not store the raw base64 payload indefinitely in Make.com's data
  stores. After attaching to the email, the bytes are no longer needed
  downstream.
- Do not attempt to read `media_json` directly from the WordPress database
  as an alternative to the webhook payload. The webhook contract is the
  integration surface; the database column format is internal to WordPress.

---

## Section 5 — Error handling and operational monitoring

Make.com scenarios can fail silently if not configured to surface errors.
At minimum, configure the following before a client deployment goes live.

### Scenario error notifications

In the Make.com scenario settings, enable error notifications to the admin's
email address. Make.com will send an email when a scenario execution errors
(e.g., the email step fails due to SMTP issues, or a module times out). This
is the baseline monitoring for a low-volume client deployment.

### Retry configuration

If the email step uses an SMTP module, enable retry on transient failures.
Make.com supports configurable retry policies; refer to Make.com's current
documentation for the per-module retry settings. A reasonable starting
point: 3 retries with exponential backoff.

### Monitoring for active deployments

For a client deployment that has gone live:

- Check Make.com's scenario execution history at least weekly (or more
  frequently at higher submission volumes) to catch silent failures.
- When the WordPress side records `status='forward_failed'`, the row
  includes a brief message indicating what went wrong (e.g.,
  `transport_error: ...`, `http_status_500`). Cross-reference both
  sides when diagnosing a problem.
- If a scenario starts failing systematically (plan quota exceeded,
  contractor email bouncing, Make.com service disruption), rows pile up
  with `status='forward_failed'` in `wp_goqw_submissions`. They can be
  manually replayed by re-issuing the webhook POST with the persisted
  payload. No admin UI exists for this today; see `docs/technical-debt.md`.

### Diagnosing a silent failure

If a customer submits a quote and no email arrives at the contractor:

1. Check `wp_goqw_submissions` for the submission row:

   ```bash
   wp db query "SELECT id, wizard_id, status, created_at FROM wp_goqw_submissions ORDER BY id DESC LIMIT 5;"
   ```

2. If `status='forward_failed'`, the row was persisted but the webhook
   call failed. Check Make.com's execution history for the relevant time.

3. If `status='forwarded'`, WordPress considers the forward a success.
   The failure is downstream of Make.com (e.g., the email step failed
   after the webhook returned 2xx). Check Make.com's scenario history.

4. If no row exists, the submission itself failed validation or persistence
   (a rarer failure path). Check the WordPress error log.

---

## Section 6 — Security considerations

The Make.com webhook URL is a moderate operational secret. It does not grant
access to the WordPress site directly, but it does allow an external party
to POST arbitrary payloads to your Make.com scenario, potentially triggering
email sends or other automated actions.

### Treatment

- **Do not commit the webhook URL to git.** Set it via wp-cli or
  `wp-config.php` only, never in tracked code.
- **Do not share the URL in public channels** (public Slack channels, email
  threads with non-stakeholders, open issue trackers, etc.).
- **If the URL is exposed, regenerate it.** Make.com allows regenerating
  webhook URLs in the scenario settings. After regeneration, update the
  WordPress option or `wp-config.php` constant with the new URL immediately.
- **Make.com may provide basic abuse protection** (rate limits,
  malformed-payload rejection). Verify Make.com's current offering in their
  documentation if you are relying on it.

### Data handling (GDPR context)

Lead data — including customer contact details and, if configured, photos of
the customer's property — passes through Make.com and is typically forwarded
to the contractor's email. This aligns with ADR-0007 (operational security,
no third-party data leakage beyond what the forwarding path requires). For
UK deployments:

- The deployer is responsible for ensuring Make.com's data-processing
  location (EU vs. US servers) is acceptable under the contractor's
  privacy policy.
- Confirm Make.com's data retention settings for webhook payloads. By
  default, Make.com may retain execution data (including the full payload)
  for a period; verify and adjust if GDPR compliance requires it.
- If photos are attached to the contractor email, they exist in the
  contractor's email system. Coordinate a retention policy with the client.

---

## Verification — confirming the integration works

Run through this checklist after completing the initial Make.com setup and
before treating the deployment as production-ready.

- [ ] `wp option get goqw_webhook_url` returns the expected URL (or
      `GOQW_MAKE_WEBHOOK_URL` constant is set in `wp-config.php`).
- [ ] Submit a test quote through the wizard on the WordPress install.
- [ ] In Make.com's scenario execution history, confirm an incoming webhook
      event appeared at the expected time with the expected payload structure
      (correct `wizard_id`, answers present, `submission_id` assigned).
- [ ] If the workflow includes an email step, confirm the contractor's
      inbox received the lead email with correct content.
- [ ] Confirm the pricing summary in the email shows pounds (not raw pence).
- [ ] In WordPress, confirm the test submission row shows `status='forwarded'`:
  ```bash
  wp db query "SELECT id, status FROM wp_goqw_submissions ORDER BY id DESC LIMIT 1;"
  ```
- [ ] If the wizard config includes a photo step, submit a test quote that
      includes at least one photo upload. Confirm the photo arrives in the
      contractor email as a proper attachment (not as embedded base64 text).
- [ ] Trigger an error condition: temporarily set the webhook URL to an
      invalid address (`wp option update goqw_webhook_url "https://invalid.example"`),
      submit a test quote, and confirm:
  - The WordPress side records the submission as `status='forward_failed'`.
  - The user sees the 502 fallback message.
  - Make.com does not process the (non-arriving) event.
- [ ] Restore the correct webhook URL, submit again, and confirm the system
      recovers normally.
- [ ] (If error notifications are configured in Make.com) Trigger a
      scenario-level error and confirm Make.com sends the admin notification
      email.

---

## Common pitfalls

**Submission silently goes nowhere.** The most common cause: `goqw_webhook_url`
is not set, or is set to a stale URL. Run `wp option get goqw_webhook_url`
and confirm. Also check whether `GOQW_MAKE_WEBHOOK_URL` in `wp-config.php`
is overriding the option with an outdated value.

**Webhook receives the payload but the Make.com scenario execution fails.**
Check Make.com's scenario execution history for the specific run and error.
Common causes: the email module lacks credentials, a base64-decode step
throws on unexpected input, or a required module parameter is unset.

**Photos arrive as raw text in the email body instead of attachments.**
The scenario is missing the base64-to-binary decode step before the email
attachment. Add it between the webhook trigger and the email module.

**Pricing amounts in the email are unreadably large integers.** The payload
contains pence (e.g., `324000`); divide by 100 in the formatting step to
display pounds (e.g., `£3,240.00`).

**The webhook URL was regenerated in Make.com but WordPress still has the
old one.** Run `wp option update goqw_webhook_url "new-url..."` after
regenerating. If using the constant approach, update `wp-config.php`.

**Make.com execution quota is exhausted mid-month.** Submissions queue up
but the scenario doesn't run. Upgrade the Make.com plan or reduce
non-submission automation on the same account. Rows accumulate as
`forward_failed` in `wp_goqw_submissions`; replay manually once quota
is restored.

**Local development testing fails because LocalWP cannot reach the
Make.com URL.** Confirm the LocalWP environment has outbound internet
access. LocalWP typically does, but some network configurations (VPN,
corporate firewall) block it. As a workaround during local testing, set
`goqw_webhook_url` to a public webhook inspector (e.g., webhook.site)
to confirm the payload shape, then switch to the real Make.com URL.

**The `GOQW_MAKE_WEBHOOK_URL` constant overrides the option without the
deployer realising.** If `wp option update` seems to have no effect, check
`wp-config.php` for a hardcoded constant definition. The constant always
wins.

**Make.com plan does not include the base64 decode module.** Module
availability varies by plan tier. If the required module is not available,
consult Make.com's plan comparison for the minimum tier that includes it,
or handle the decode step in a custom HTTP module or function module.

**Multiple photo files each trigger a separate email.** If the Make.com
scenario iterates the `files` array and triggers the email step inside the
iterator, each photo generates one email. Move the email step outside the
iterator and collect attachments in a list before sending.

---

## Reference — where the integration lives in code

| Concern                             | Location                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| WordPress-side forwarder            | `plugins/quote-wizard/src/Submissions/Forwarder.php`                                |
| Webhook URL option                  | WP option `goqw_webhook_url` (read by Forwarder)                                    |
| Webhook URL constant override       | `GOQW_MAKE_WEBHOOK_URL` in `wp-config.php` (takes precedence over option)           |
| Forward timeout (10 s)              | Hardcoded in `Forwarder::TIMEOUT_SECONDS`; not user-configurable                    |
| Persistence-before-forward ordering | `plugins/quote-wizard/src/Rest/SubmissionController.php`                            |
| Submission row schema               | `wp_goqw_submissions` table (see `plugins/quote-wizard/src/Database/Activator.php`) |
| Wire contract                       | This document, Section 1                                                            |

| Cross-reference                             | Where                        |
| ------------------------------------------- | ---------------------------- |
| Why persist before forward                  | ADR-0001                     |
| Why synchronous forwarder                   | ADR-0005                     |
| Wire contract architectural record          | ADR-0015                     |
| Operational security commitments            | ADR-0007                     |
| Adapting the template for a client          | `docs/adaptation-runbook.md` |
| Plugin deployment procedure                 | `docs/onboarding.md`         |
| Deferred admin UI for webhook configuration | `docs/technical-debt.md`     |
| Deferred replay UI for failed forwards      | `docs/technical-debt.md`     |
